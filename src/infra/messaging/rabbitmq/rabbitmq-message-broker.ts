import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as amqp from 'amqplib'
import { MessageBroker, SerializedEvent } from '@/core/events/message-broker'

interface RabbitMQConfig {
  url: string
  exchange: string
  queues: {
    [eventType: string]: {
      name: string
      routingKey: string
      durable?: boolean
      deadLetter?: {
        exchange: string
        routingKey: string
      }
    }
  }
}

@Injectable()
export class RabbitMQMessageBroker
  implements MessageBroker, OnModuleInit, OnModuleDestroy
{
  private connection: amqp.Connection | null = null
  private channel: amqp.Channel | null = null
  private readonly logger = new Logger(RabbitMQMessageBroker.name)
  private readonly config: RabbitMQConfig

  constructor(private configService: ConfigService) {
    this.config = {
      url: this.configService.get('RABBITMQ_URL', 'amqp://localhost:5672'),
      exchange: this.configService.get('RABBITMQ_EXCHANGE', 'domain_events'),
      queues: {
        // Configuração das filas por tipo de evento
        AnswerCreatedEvent: {
          name: 'answer_created_queue',
          routingKey: 'answer.created',
          durable: true,
          deadLetter: {
            exchange: 'domain_events_dlx',
            routingKey: 'answer.created.failed',
          },
        },
        QuestionBestAnswerChosenEvent: {
          name: 'question_best_answer_queue',
          routingKey: 'question.best_answer_chosen',
          durable: true,
          deadLetter: {
            exchange: 'domain_events_dlx',
            routingKey: 'question.best_answer_chosen.failed',
          },
        },
      },
    }
  }

  async onModuleInit() {
    await this.connect()
  }

  async onModuleDestroy() {
    await this.disconnect()
  }

  async connect(): Promise<void> {
    try {
      this.logger.log('Connecting to RabbitMQ...')

      this.connection = await amqp.connect(this.config.url)
      this.channel = await this.connection.createChannel()

      // Configurar exchange principal
      await this.channel.assertExchange(this.config.exchange, 'topic', {
        durable: true,
      })

      // Configurar dead letter exchange
      await this.channel.assertExchange('domain_events_dlx', 'topic', {
        durable: true,
      })

      // Configurar filas
      await this.setupQueues()

      this.logger.log('Connected to RabbitMQ successfully')
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close()
        this.channel = null
      }

      if (this.connection) {
        await this.connection.close()
        this.connection = null
      }

      this.logger.log('Disconnected from RabbitMQ')
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error)
    }
  }

  async publish(event: SerializedEvent): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available')
    }

    const queueConfig = this.config.queues[event.eventType]
    if (!queueConfig) {
      this.logger.warn(
        `No queue configuration found for event type: ${event.eventType}`,
      )
      return
    }

    try {
      const message = Buffer.from(JSON.stringify(event))

      const published = this.channel.publish(
        this.config.exchange,
        queueConfig.routingKey,
        message,
        {
          persistent: true, // Persist messages to disk
          messageId: event.eventId,
          timestamp: event.occurredAt.getTime(),
          type: event.eventType,
          headers: {
            aggregateId: event.aggregateId,
            aggregateType: event.aggregateType,
            eventVersion: event.eventVersion,
          },
        },
      )

      if (!published) {
        throw new Error('Failed to publish message to RabbitMQ')
      }

      this.logger.debug(
        `Published event ${event.eventType} with ID ${event.eventId}`,
      )
    } catch (error) {
      this.logger.error(`Failed to publish event ${event.eventType}`, error)
      throw error
    }
  }

  async publishBatch(events: SerializedEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event)
    }
  }

  async subscribe(
    eventType: string,
    handler: (event: SerializedEvent) => Promise<void>,
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available')
    }

    const queueConfig = this.config.queues[eventType]
    if (!queueConfig) {
      this.logger.warn(
        `No queue configuration found for event type: ${eventType}`,
      )
      return
    }

    try {
      await this.channel.consume(queueConfig.name, async (message) => {
        if (!message) return

        try {
          const event: SerializedEvent = JSON.parse(message.content.toString())
          await handler(event)

          // Acknowledge message only after successful processing
          this.channel!.ack(message)
          this.logger.debug(
            `Processed event ${event.eventType} with ID ${event.eventId}`,
          )
        } catch (error) {
          this.logger.error(`Failed to process message`, error)

          // Reject and send to dead letter queue
          this.channel!.nack(message, false, false)
        }
      })

      this.logger.log(`Subscribed to event type: ${eventType}`)
    } catch (error) {
      this.logger.error(
        `Failed to subscribe to event type: ${eventType}`,
        error,
      )
      throw error
    }
  }

  private async setupQueues(): Promise<void> {
    if (!this.channel) return

    for (const [eventType, queueConfig] of Object.entries(this.config.queues)) {
      // Configurar dead letter queue primeiro
      if (queueConfig.deadLetter) {
        await this.channel.assertQueue(`${queueConfig.name}_dlq`, {
          durable: true,
        })

        await this.channel.bindQueue(
          `${queueConfig.name}_dlq`,
          queueConfig.deadLetter.exchange,
          queueConfig.deadLetter.routingKey,
        )
      }

      // Configurar fila principal
      await this.channel.assertQueue(queueConfig.name, {
        durable: queueConfig.durable ?? true,
        arguments: queueConfig.deadLetter
          ? {
              'x-dead-letter-exchange': queueConfig.deadLetter.exchange,
              'x-dead-letter-routing-key': queueConfig.deadLetter.routingKey,
              'x-message-ttl': 86400000, // 24 hours
              'x-max-retries': 3,
            }
          : undefined,
      })

      // Bind queue to exchange
      await this.channel.bindQueue(
        queueConfig.name,
        this.config.exchange,
        queueConfig.routingKey,
      )

      this.logger.log(`Queue ${queueConfig.name} configured successfully`)
    }
  }
}

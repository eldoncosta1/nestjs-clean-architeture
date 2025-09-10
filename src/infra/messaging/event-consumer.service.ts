import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { MessageBroker, SerializedEvent } from '@/core/events/message-broker'
import { EventSerializer } from '@/core/events/event-serializer'
import { DomainEvents } from '@/core/events/domain-events'

@Injectable()
export class EventConsumerService implements OnModuleInit {
  private readonly logger = new Logger(EventConsumerService.name)

  constructor(
    private readonly messageBroker: MessageBroker,
    private readonly eventSerializer: EventSerializer,
  ) {}

  async onModuleInit() {
    await this.setupEventConsumers()
  }

  private async setupEventConsumers() {
    this.logger.log('Setting up event consumers...')

    // Consumir AnswerCreatedEvent
    await this.messageBroker.subscribe(
      'AnswerCreatedEvent',
      this.handleAnswerCreatedEvent.bind(this),
    )

    // Consumir QuestionBestAnswerChosenEvent
    await this.messageBroker.subscribe(
      'QuestionBestAnswerChosenEvent',
      this.handleQuestionBestAnswerChosenEvent.bind(this),
    )

    this.logger.log('Event consumers setup completed')
  }

  private async handleAnswerCreatedEvent(serializedEvent: SerializedEvent) {
    this.logger.debug(`Received AnswerCreatedEvent: ${serializedEvent.eventId}`)

    try {
      // Deserializar o evento
      const domainEvent = this.eventSerializer.deserialize(serializedEvent)

      // Disparar para os handlers locais (subscribers)
      this.dispatchToLocalHandlers(domainEvent)

      this.logger.debug(
        `Successfully processed AnswerCreatedEvent: ${serializedEvent.eventId}`,
      )
    } catch (error) {
      this.logger.error(
        `Failed to process AnswerCreatedEvent: ${serializedEvent.eventId}`,
        error,
      )
      throw error
    }
  }

  private async handleQuestionBestAnswerChosenEvent(
    serializedEvent: SerializedEvent,
  ) {
    this.logger.debug(
      `Received QuestionBestAnswerChosenEvent: ${serializedEvent.eventId}`,
    )

    try {
      // Deserializar o evento
      const domainEvent = this.eventSerializer.deserialize(serializedEvent)

      // Disparar para os handlers locais (subscribers)
      this.dispatchToLocalHandlers(domainEvent)

      this.logger.debug(
        `Successfully processed QuestionBestAnswerChosenEvent: ${serializedEvent.eventId}`,
      )
    } catch (error) {
      this.logger.error(
        `Failed to process QuestionBestAnswerChosenEvent: ${serializedEvent.eventId}`,
        error,
      )
      throw error
    }
  }

  /**
   * Método genérico para processar qualquer tipo de evento
   */
  async handleGenericEvent(serializedEvent: SerializedEvent) {
    this.logger.debug(
      `Received ${serializedEvent.eventType}: ${serializedEvent.eventId}`,
    )

    try {
      // Deserializar o evento
      const domainEvent = this.eventSerializer.deserialize(serializedEvent)

      // Disparar para os handlers locais (subscribers)
      this.dispatchToLocalHandlers(domainEvent)

      this.logger.debug(
        `Successfully processed ${serializedEvent.eventType}: ${serializedEvent.eventId}`,
      )
    } catch (error) {
      this.logger.error(
        `Failed to process ${serializedEvent.eventType}: ${serializedEvent.eventId}`,
        error,
      )
      throw error
    }
  }

  /**
   * Dispara o evento para os handlers locais registrados
   */
  private dispatchToLocalHandlers(domainEvent: any) {
    // Usar o sistema original de DomainEvents para disparar localmente
    // Isso permitirá que os subscribers existentes (OnAnswerCreated, etc.) continuem funcionando
    const eventClassName = domainEvent.constructor.name
    const handlers = (DomainEvents as any).handlersMap[eventClassName] || []

    for (const handler of handlers) {
      try {
        handler(domainEvent)
      } catch (error) {
        this.logger.error(`Handler failed for event ${eventClassName}`, error)
        // Não re-throw para não afetar outros handlers
      }
    }
  }
}

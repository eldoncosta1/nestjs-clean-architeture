import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { MessageBroker } from '@/core/events/message-broker'
import { DomainEventsWithOutbox } from '@/core/events/domain-events-with-outbox'

@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name)
  private isProcessing = false

  constructor(private readonly messageBroker: MessageBroker) {}

  /**
   * Processa eventos não publicados do outbox a cada 10 segundos
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async processUnpublishedEvents() {
    if (this.isProcessing) {
      this.logger.debug('Event processing already in progress, skipping...')
      return
    }

    this.isProcessing = true

    try {
      const events = await DomainEventsWithOutbox.getUnpublishedEvents(50)

      if (events.length === 0) {
        return
      }

      this.logger.log(`Processing ${events.length} unpublished events`)

      for (const outboxEvent of events) {
        try {
          const serializedEvent = outboxEvent.toSerializedEvent()

          await this.messageBroker.publish(serializedEvent)
          await DomainEventsWithOutbox.markEventAsPublished(outboxEvent.eventId)

          this.logger.debug(
            `Published event ${outboxEvent.eventType} with ID ${outboxEvent.eventId}`,
          )
        } catch (error) {
          this.logger.error(
            `Failed to publish event ${outboxEvent.eventType} with ID ${outboxEvent.eventId}`,
            error,
          )

          await DomainEventsWithOutbox.incrementEventAttempts(
            outboxEvent.eventId,
            error instanceof Error ? error.message : 'Unknown error',
          )
        }
      }

      this.logger.log(`Finished processing ${events.length} events`)
    } catch (error) {
      this.logger.error('Error processing unpublished events', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Método manual para processar eventos (útil para testes ou processamento sob demanda)
   */
  async processEventsManually(limit = 100) {
    this.logger.log(`Manual processing of up to ${limit} events`)

    const events = await DomainEventsWithOutbox.getUnpublishedEvents(limit)

    for (const outboxEvent of events) {
      try {
        const serializedEvent = outboxEvent.toSerializedEvent()

        await this.messageBroker.publish(serializedEvent)
        await DomainEventsWithOutbox.markEventAsPublished(outboxEvent.eventId)

        this.logger.log(`Manually published event ${outboxEvent.eventType}`)
      } catch (error) {
        this.logger.error(
          `Failed to manually publish event ${outboxEvent.eventType}`,
          error,
        )
        throw error
      }
    }

    return events.length
  }
}

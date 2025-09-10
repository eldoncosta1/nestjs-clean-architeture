import { OutboxEvent } from '@/core/events/outbox-event'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Prisma, OutboxEvent as PrismaOutboxEvent } from '@prisma/client'

export class PrismaOutboxMapper {
  static toDomain(raw: PrismaOutboxEvent): OutboxEvent {
    return new OutboxEvent(
      {
        eventId: raw.eventId,
        eventType: raw.eventType,
        aggregateId: raw.aggregateId,
        aggregateType: raw.aggregateType,
        eventVersion: raw.eventVersion,
        occurredAt: raw.occurredAt,
        payload: raw.payload as Record<string, any>,
        processedAt: raw.processedAt,
        published: raw.published,
        attempts: raw.attempts,
        lastAttemptAt: raw.lastAttemptAt,
        errorMessage: raw.errorMessage,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPersistence(
    outboxEvent: OutboxEvent,
  ): Prisma.OutboxEventCreateInput {
    return {
      id: outboxEvent.id.toString(),
      eventId: outboxEvent.eventId,
      eventType: outboxEvent.eventType,
      aggregateId: outboxEvent.aggregateId,
      aggregateType: outboxEvent.aggregateType,
      eventVersion: outboxEvent.eventVersion,
      occurredAt: outboxEvent.occurredAt,
      payload: outboxEvent.payload,
      processedAt: outboxEvent.processedAt,
      published: outboxEvent.published,
      attempts: outboxEvent.attempts,
      lastAttemptAt: outboxEvent.lastAttemptAt,
      errorMessage: outboxEvent.errorMessage,
    }
  }
}

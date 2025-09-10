import { DomainEvent } from './domain-event'
import { SerializedEvent } from './message-broker'
import { UniqueEntityID } from '../entities/unique-entity-id'
import { EventRegistry } from './event-registry'

export interface EventSerializer {
  serialize(event: DomainEvent): SerializedEvent
  deserialize(serializedEvent: SerializedEvent): DomainEvent
}

export class DefaultEventSerializer implements EventSerializer {
  serialize(event: DomainEvent): SerializedEvent {
    return {
      eventId: new UniqueEntityID().toString(),
      eventType: event.constructor.name,
      aggregateId: event.getAggregateId().toString(),
      aggregateType: this.extractAggregateType(event),
      eventVersion: 1,
      occurredAt: event.ocurredAt,
      payload: this.extractPayload(event),
    }
  }

  deserialize(serializedEvent: SerializedEvent): DomainEvent {
    // Esta implementação será específica para cada tipo de evento
    // Por enquanto, vamos criar uma estrutura básica
    const EventClass = this.getEventClass(serializedEvent.eventType)

    if (!EventClass) {
      throw new Error(`Event type ${serializedEvent.eventType} not found`)
    }

    return new EventClass(serializedEvent.payload)
  }

  private extractAggregateType(event: DomainEvent): string {
    // Extrair o tipo do agregado baseado no nome do evento
    // Ex: AnswerCreatedEvent -> Answer
    const eventName = event.constructor.name
    return eventName
      .replace(/Event$/, '')
      .replace(/Created|Updated|Deleted/, '')
  }

  private extractPayload(event: DomainEvent): Record<string, any> {
    // Converter o evento para um objeto serializable
    const payload: Record<string, any> = {}

    for (const key of Object.keys(event)) {
      if (key !== 'ocurredAt') {
        const value = (event as any)[key]
        payload[key] = this.serializeValue(value)
      }
    }

    return payload
  }

  private serializeValue(value: any): any {
    if (value === null || value === undefined) {
      return value
    }

    if (typeof value === 'object' && value.toString) {
      // Para UniqueEntityID e outros value objects
      return value.toString()
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.serializeValue(item))
    }

    if (typeof value === 'object') {
      const serialized: Record<string, any> = {}
      for (const [key, val] of Object.entries(value)) {
        serialized[key] = this.serializeValue(val)
      }
      return serialized
    }

    return value
  }

  private getEventClass(eventType: string): any {
    return EventRegistry.getEventClass(eventType)
  }
}

import { Entity } from '../entities/entity'
import { UniqueEntityID } from '../entities/unique-entity-id'
import { SerializedEvent } from './message-broker'

export interface OutboxEventProps {
  eventId: string
  eventType: string
  aggregateId: string
  aggregateType: string
  eventVersion: number
  occurredAt: Date
  payload: Record<string, any>
  processedAt?: Date | null
  published: boolean
  attempts: number
  lastAttemptAt?: Date | null
  errorMessage?: string | null
}

export class OutboxEvent extends Entity<OutboxEventProps> {
  get eventId() {
    return this.props.eventId
  }

  get eventType() {
    return this.props.eventType
  }

  get aggregateId() {
    return this.props.aggregateId
  }

  get aggregateType() {
    return this.props.aggregateType
  }

  get eventVersion() {
    return this.props.eventVersion
  }

  get occurredAt() {
    return this.props.occurredAt
  }

  get payload() {
    return this.props.payload
  }

  get processedAt() {
    return this.props.processedAt
  }

  get published() {
    return this.props.published
  }

  get attempts() {
    return this.props.attempts
  }

  get lastAttemptAt() {
    return this.props.lastAttemptAt
  }

  get errorMessage() {
    return this.props.errorMessage
  }

  public markAsPublished() {
    this.props.published = true
    this.props.processedAt = new Date()
  }

  public incrementAttempts(errorMessage?: string) {
    this.props.attempts += 1
    this.props.lastAttemptAt = new Date()
    this.props.errorMessage = errorMessage || null
  }

  public toSerializedEvent(): SerializedEvent {
    return {
      eventId: this.props.eventId,
      eventType: this.props.eventType,
      aggregateId: this.props.aggregateId,
      aggregateType: this.props.aggregateType,
      eventVersion: this.props.eventVersion,
      occurredAt: this.props.occurredAt,
      payload: this.props.payload,
    }
  }

  static create(serializedEvent: SerializedEvent, id?: UniqueEntityID) {
    return new OutboxEvent(
      {
        eventId: serializedEvent.eventId,
        eventType: serializedEvent.eventType,
        aggregateId: serializedEvent.aggregateId,
        aggregateType: serializedEvent.aggregateType,
        eventVersion: serializedEvent.eventVersion,
        occurredAt: serializedEvent.occurredAt,
        payload: serializedEvent.payload,
        published: false,
        attempts: 0,
      },
      id,
    )
  }

  static fromSerialized(serializedEvent: SerializedEvent) {
    return OutboxEvent.create(serializedEvent)
  }
}

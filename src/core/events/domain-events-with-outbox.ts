import { AggregateRoot } from '../entities/aggregate-root'
import { UniqueEntityID } from '../entities/unique-entity-id'
import { DomainEvent } from './domain-event'
import { EventSerializer } from './event-serializer'
import { OutboxEvent } from './outbox-event'
import { OutboxRepository } from './outbox-repository'

type DomainEventCallback = (event: unknown) => void

export interface DomainEventsConfig {
  eventSerializer?: EventSerializer
  outboxRepository?: OutboxRepository
  useOutbox?: boolean
}

export class DomainEventsWithOutbox {
  private static handlersMap: Record<string, DomainEventCallback[]> = {}
  private static markedAggregates: AggregateRoot<unknown>[] = []
  private static config: DomainEventsConfig = {
    useOutbox: false,
  }

  public static shouldRun = true

  public static configure(config: DomainEventsConfig) {
    this.config = { ...this.config, ...config }
  }

  public static markAggregateForDispatch(aggregate: AggregateRoot<unknown>) {
    const aggregateFound = !!this.findMarkedAggregateByID(aggregate.id)

    if (!aggregateFound) {
      this.markedAggregates.push(aggregate)
    }
  }

  private static async dispatchAggregateEvents(
    aggregate: AggregateRoot<unknown>,
  ) {
    const events = aggregate.domainEvents

    if (
      this.config.useOutbox &&
      this.config.outboxRepository &&
      this.config.eventSerializer
    ) {
      // Salvar eventos no outbox para processamento posterior
      await this.saveEventsToOutbox(events)
    }

    // Disparar eventos localmente (subscribers existentes)
    events.forEach((event: DomainEvent) => this.dispatchLocal(event))
  }

  private static async saveEventsToOutbox(events: DomainEvent[]) {
    if (!this.config.outboxRepository || !this.config.eventSerializer) {
      return
    }

    const outboxEvents = events.map((event) => {
      const serializedEvent = this.config.eventSerializer!.serialize(event)
      return OutboxEvent.create(serializedEvent)
    })

    await this.config.outboxRepository.saveMany(outboxEvents)
  }

  private static removeAggregateFromMarkedDispatchList(
    aggregate: AggregateRoot<unknown>,
  ) {
    const index = this.markedAggregates.findIndex((a) => a.equals(aggregate))
    this.markedAggregates.splice(index, 1)
  }

  private static findMarkedAggregateByID(
    id: UniqueEntityID,
  ): AggregateRoot<unknown> | undefined {
    return this.markedAggregates.find((aggregate) => aggregate.id.equals(id))
  }

  public static async dispatchEventsForAggregate(id: UniqueEntityID) {
    const aggregate = this.findMarkedAggregateByID(id)

    if (aggregate) {
      await this.dispatchAggregateEvents(aggregate)
      aggregate.clearEvents()
      this.removeAggregateFromMarkedDispatchList(aggregate)
    }
  }

  public static register(
    callback: DomainEventCallback,
    eventClassName: string,
  ) {
    const wasEventRegisteredBefore = eventClassName in this.handlersMap

    if (!wasEventRegisteredBefore) {
      this.handlersMap[eventClassName] = []
    }

    this.handlersMap[eventClassName].push(callback)
  }

  public static clearHandlers() {
    this.handlersMap = {}
  }

  public static clearMarkedAggregates() {
    this.markedAggregates = []
  }

  private static dispatchLocal(event: DomainEvent) {
    const eventClassName: string = event.constructor.name
    const isEventRegistered = eventClassName in this.handlersMap

    if (!this.shouldRun) return

    if (isEventRegistered) {
      const handlers = this.handlersMap[eventClassName]

      for (const handler of handlers) {
        handler(event)
      }
    }
  }

  /**
   * Método para processar eventos do outbox (usado pelo publisher)
   */
  public static async getUnpublishedEvents(
    limit = 100,
  ): Promise<OutboxEvent[]> {
    if (!this.config.outboxRepository) {
      return []
    }

    return this.config.outboxRepository.findUnpublished(limit)
  }

  /**
   * Marca um evento como publicado
   */
  public static async markEventAsPublished(eventId: string): Promise<void> {
    if (this.config.outboxRepository) {
      await this.config.outboxRepository.markAsPublished(eventId)
    }
  }

  /**
   * Incrementa tentativas de um evento que falhou
   */
  public static async incrementEventAttempts(
    eventId: string,
    errorMessage?: string,
  ): Promise<void> {
    if (this.config.outboxRepository) {
      await this.config.outboxRepository.incrementAttempts(
        eventId,
        errorMessage,
      )
    }
  }
}

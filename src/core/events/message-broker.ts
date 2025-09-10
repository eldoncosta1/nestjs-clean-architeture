export interface SerializedEvent {
  eventId: string
  eventType: string
  aggregateId: string
  aggregateType: string
  eventVersion: number
  occurredAt: Date
  payload: Record<string, any>
}

export interface MessageBroker {
  /**
   * Publica um evento no message broker
   */
  publish(event: SerializedEvent): Promise<void>

  /**
   * Publica múltiplos eventos em uma única operação
   */
  publishBatch(events: SerializedEvent[]): Promise<void>

  /**
   * Subscreve a um tipo de evento
   */
  subscribe(
    eventType: string,
    handler: (event: SerializedEvent) => Promise<void>,
  ): Promise<void>

  /**
   * Conecta ao message broker
   */
  connect(): Promise<void>

  /**
   * Desconecta do message broker
   */
  disconnect(): Promise<void>
}

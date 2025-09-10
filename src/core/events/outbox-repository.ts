import { OutboxEvent } from './outbox-event'

export interface OutboxRepository {
  /**
   * Salva um evento no outbox
   */
  save(event: OutboxEvent): Promise<void>

  /**
   * Salva múltiplos eventos no outbox em uma única transação
   */
  saveMany(events: OutboxEvent[]): Promise<void>

  /**
   * Busca eventos não publicados
   */
  findUnpublished(limit?: number): Promise<OutboxEvent[]>

  /**
   * Busca eventos que falharam e podem ser reprocessados
   */
  findFailedEvents(maxAttempts: number, limit?: number): Promise<OutboxEvent[]>

  /**
   * Marca um evento como publicado
   */
  markAsPublished(eventId: string): Promise<void>

  /**
   * Incrementa tentativas de um evento
   */
  incrementAttempts(eventId: string, errorMessage?: string): Promise<void>

  /**
   * Remove eventos publicados antigos (cleanup)
   */
  deletePublishedOlderThan(date: Date): Promise<void>
}

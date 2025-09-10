import { DomainEvent } from './domain-event'

type EventConstructor = new (...args: any[]) => DomainEvent

export class EventRegistry {
  private static events = new Map<string, EventConstructor>()

  /**
   * Registra um tipo de evento no registry
   */
  static register(eventName: string, eventClass: EventConstructor) {
    this.events.set(eventName, eventClass)
  }

  /**
   * Obtém a classe de um evento pelo nome
   */
  static getEventClass(eventName: string): EventConstructor | undefined {
    return this.events.get(eventName)
  }

  /**
   * Lista todos os eventos registrados
   */
  static getAllEvents(): Map<string, EventConstructor> {
    return new Map(this.events)
  }

  /**
   * Verifica se um evento está registrado
   */
  static isRegistered(eventName: string): boolean {
    return this.events.has(eventName)
  }

  /**
   * Remove um evento do registry
   */
  static unregister(eventName: string): boolean {
    return this.events.delete(eventName)
  }

  /**
   * Limpa todos os eventos registrados
   */
  static clear(): void {
    this.events.clear()
  }
}

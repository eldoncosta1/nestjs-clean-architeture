import { DomainEvent } from './domain-event'
import { UniqueEntityID } from '../entities/unique-entity-id'

// 🔄 Tipos para retry e dead letter
export interface RetryPolicy {
  maxRetries: number
  backoffMultiplier: number
  initialDelayMs: number
  maxDelayMs: number
}

export interface EventExecutionResult {
  success: boolean
  error?: Error
  executionTime: number
  retryCount: number
}

export interface FailedEvent {
  eventId: string
  eventType: string
  eventData: any
  handlerName: string
  error: Error
  retryCount: number
  failedAt: Date
  lastRetryAt?: Date
  nextRetryAt?: Date
}

// 📊 Interface para métricas
export interface EventMetrics {
  eventType: string
  handlerName: string
  totalExecutions: number
  successCount: number
  failureCount: number
  averageExecutionTime: number
  lastExecution: Date
}

// 🚨 Interface para observabilidade
export interface EventObserver {
  onEventStarted(
    eventType: string,
    handlerName: string,
    event: DomainEvent,
  ): void
  onEventCompleted(
    eventType: string,
    handlerName: string,
    result: EventExecutionResult,
  ): void
  onEventFailed(
    eventType: string,
    handlerName: string,
    error: Error,
    retryCount: number,
  ): void
  onEventRetrying(
    eventType: string,
    handlerName: string,
    retryCount: number,
    nextRetryAt: Date,
  ): void
  onEventMovedToDeadLetter(failedEvent: FailedEvent): void
}

// 🏭 Sistema principal de eventos com reliability
export class DomainEventsWithReliability {
  private static handlersMap: Record<
    string,
    Array<{
      handler: (event: any) => Promise<void> | void
      name: string
      retryPolicy?: RetryPolicy
    }>
  > = {}

  private static failedEvents: FailedEvent[] = []
  private static metrics: Map<string, EventMetrics> = new Map()
  private static observers: EventObserver[] = []
  private static isProcessingRetries = false

  // 📝 Política padrão de retry
  private static defaultRetryPolicy: RetryPolicy = {
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
  }

  // 🔧 Registrar handler com política de retry
  static register(
    handler: (event: any) => Promise<void> | void,
    eventClassName: string,
    handlerName: string,
    retryPolicy?: Partial<RetryPolicy>,
  ) {
    const fullRetryPolicy = { ...this.defaultRetryPolicy, ...retryPolicy }

    if (!this.handlersMap[eventClassName]) {
      this.handlersMap[eventClassName] = []
    }

    this.handlersMap[eventClassName].push({
      handler,
      name: handlerName,
      retryPolicy: fullRetryPolicy,
    })

    console.log(`📝 DomainEventsWithReliability: Handler registrado`, {
      eventType: eventClassName,
      handlerName,
      retryPolicy: fullRetryPolicy,
    })
  }

  // 🚀 Executar evento com tratamento de falhas
  static async dispatchEvent(event: DomainEvent): Promise<void> {
    const eventType = event.constructor.name
    const handlers = this.handlersMap[eventType] || []

    if (handlers.length === 0) {
      console.log(`⚠️ Nenhum handler registrado para ${eventType}`)
      return
    }

    // Executar cada handler com tratamento individual
    const promises = handlers.map(({ handler, name, retryPolicy }) =>
      this.executeHandlerWithReliability(
        event,
        eventType,
        handler,
        name,
        retryPolicy!,
      ),
    )

    await Promise.allSettled(promises)
  }

  // 🔄 Executar handler com retry automático
  private static async executeHandlerWithReliability(
    event: DomainEvent,
    eventType: string,
    handler: (event: any) => Promise<void> | void,
    handlerName: string,
    retryPolicy: RetryPolicy,
    retryCount = 0,
  ): Promise<EventExecutionResult> {
    const startTime = Date.now()

    // Notificar observers
    this.observers.forEach((observer) =>
      observer.onEventStarted(eventType, handlerName, event),
    )

    try {
      await handler(event)

      const result: EventExecutionResult = {
        success: true,
        executionTime: Date.now() - startTime,
        retryCount,
      }

      this.updateMetrics(eventType, handlerName, result)
      this.observers.forEach((observer) =>
        observer.onEventCompleted(eventType, handlerName, result),
      )

      return result
    } catch (error) {
      const executionTime = Date.now() - startTime
      const err = error as Error

      console.error(
        `❌ Falha ao executar handler ${handlerName} para evento ${eventType}:`,
        err,
      )

      this.observers.forEach((observer) =>
        observer.onEventFailed(eventType, handlerName, err, retryCount),
      )

      // Verificar se deve fazer retry
      if (retryCount < retryPolicy.maxRetries) {
        await this.scheduleRetry(
          event,
          eventType,
          handler,
          handlerName,
          retryPolicy,
          retryCount + 1,
        )
      } else {
        // Mover para dead letter
        await this.moveToDeadLetter(
          event,
          eventType,
          handlerName,
          err,
          retryCount,
        )
      }

      const result: EventExecutionResult = {
        success: false,
        error: err,
        executionTime,
        retryCount,
      }

      this.updateMetrics(eventType, handlerName, result)
      return result
    }
  }

  // ⏰ Agendar retry com backoff exponencial
  private static async scheduleRetry(
    event: DomainEvent,
    eventType: string,
    handler: (event: any) => Promise<void> | void,
    handlerName: string,
    retryPolicy: RetryPolicy,
    retryCount: number,
  ) {
    const delay = Math.min(
      retryPolicy.initialDelayMs *
        Math.pow(retryPolicy.backoffMultiplier, retryCount - 1),
      retryPolicy.maxDelayMs,
    )

    const nextRetryAt = new Date(Date.now() + delay)

    console.log(
      `🔄 Agendando retry ${retryCount}/${retryPolicy.maxRetries} para ${handlerName} em ${delay}ms`,
    )

    this.observers.forEach((observer) =>
      observer.onEventRetrying(eventType, handlerName, retryCount, nextRetryAt),
    )

    setTimeout(async () => {
      console.log(`🔄 Executando retry ${retryCount} para ${handlerName}`)
      await this.executeHandlerWithReliability(
        event,
        eventType,
        handler,
        handlerName,
        retryPolicy,
        retryCount,
      )
    }, delay)
  }

  // 💀 Mover evento falho para dead letter
  private static async moveToDeadLetter(
    event: DomainEvent,
    eventType: string,
    handlerName: string,
    error: Error,
    retryCount: number,
  ) {
    const failedEvent: FailedEvent = {
      eventId: (event as any).getAggregateId?.()?.toString() || 'unknown',
      eventType,
      eventData: event,
      handlerName,
      error,
      retryCount,
      failedAt: new Date(),
    }

    this.failedEvents.push(failedEvent)

    console.error(`💀 Evento movido para Dead Letter Queue:`, {
      eventType,
      handlerName,
      retryCount,
      error: error.message,
    })

    this.observers.forEach((observer) =>
      observer.onEventMovedToDeadLetter(failedEvent),
    )
  }

  // 📊 Atualizar métricas
  private static updateMetrics(
    eventType: string,
    handlerName: string,
    result: EventExecutionResult,
  ) {
    const key = `${eventType}:${handlerName}`
    const existing = this.metrics.get(key)

    if (existing) {
      existing.totalExecutions++
      if (result.success) existing.successCount++
      else existing.failureCount++
      existing.averageExecutionTime =
        (existing.averageExecutionTime + result.executionTime) / 2
      existing.lastExecution = new Date()
    } else {
      this.metrics.set(key, {
        eventType,
        handlerName,
        totalExecutions: 1,
        successCount: result.success ? 1 : 0,
        failureCount: result.success ? 0 : 1,
        averageExecutionTime: result.executionTime,
        lastExecution: new Date(),
      })
    }
  }

  // 🔍 Métodos de observabilidade
  static addObserver(observer: EventObserver) {
    this.observers.push(observer)
  }

  static removeObserver(observer: EventObserver) {
    const index = this.observers.indexOf(observer)
    if (index > -1) this.observers.splice(index, 1)
  }

  static getMetrics(): EventMetrics[] {
    return Array.from(this.metrics.values())
  }

  static getFailedEvents(): FailedEvent[] {
    return [...this.failedEvents]
  }

  static clearFailedEvents() {
    this.failedEvents = []
  }

  // 🔄 Reprocessar eventos falhados
  static async reprocessFailedEvents(eventIds?: string[]): Promise<void> {
    const eventsToReprocess = eventIds
      ? this.failedEvents.filter((e) => eventIds.includes(e.eventId))
      : this.failedEvents

    console.log(`🔄 Reprocessando ${eventsToReprocess.length} eventos falhados`)

    for (const failedEvent of eventsToReprocess) {
      try {
        await this.dispatchEvent(failedEvent.eventData)
        // Remove da lista de falhados se sucesso
        const index = this.failedEvents.indexOf(failedEvent)
        if (index > -1) this.failedEvents.splice(index, 1)
      } catch (error) {
        console.error(
          `❌ Falha ao reprocessar evento ${failedEvent.eventId}:`,
          error,
        )
      }
    }
  }
}

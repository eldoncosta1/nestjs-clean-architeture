import {
  EventObserver,
  EventMetrics,
  FailedEvent,
  EventExecutionResult,
} from './domain-events-reliability'
import { DomainEvent } from './domain-event'
import { CircuitBreakerManager } from './circuit-breaker'

// 📊 Sistema de monitoramento e alertas para eventos
export class EventMonitoringService implements EventObserver {
  private alerts: EventAlert[] = []
  private healthChecks: Map<string, HealthStatus> = new Map()

  onEventStarted(
    eventType: string,
    handlerName: string,
    event: DomainEvent,
  ): void {
    console.log(`🚀 Evento iniciado: ${eventType} -> ${handlerName}`, {
      timestamp: new Date().toISOString(),
      eventId: (event as any).getAggregateId?.()?.toString(),
    })
  }

  onEventCompleted(
    eventType: string,
    handlerName: string,
    result: EventExecutionResult,
  ): void {
    const key = `${eventType}:${handlerName}`

    // Atualizar health status
    this.updateHealthStatus(key, true, result.executionTime)

    // Alertas de performance
    if (result.executionTime > 5000) {
      // > 5 segundos
      this.createAlert({
        type: 'PERFORMANCE',
        severity: 'WARNING',
        message: `Handler ${handlerName} demorou ${result.executionTime}ms para processar ${eventType}`,
        eventType,
        handlerName,
        metadata: { executionTime: result.executionTime },
      })
    }

    console.log(`✅ Evento completado: ${eventType} -> ${handlerName}`, {
      executionTime: result.executionTime,
      retryCount: result.retryCount,
    })
  }

  onEventFailed(
    eventType: string,
    handlerName: string,
    error: Error,
    retryCount: number,
  ): void {
    const key = `${eventType}:${handlerName}`

    // Atualizar health status
    this.updateHealthStatus(key, false)

    // Criar alerta de falha
    this.createAlert({
      type: 'FAILURE',
      severity: retryCount > 2 ? 'CRITICAL' : 'ERROR',
      message: `Falha ao processar ${eventType} no handler ${handlerName}: ${error.message}`,
      eventType,
      handlerName,
      metadata: { error: error.message, retryCount },
    })

    console.error(`❌ Evento falhou: ${eventType} -> ${handlerName}`, {
      error: error.message,
      retryCount,
    })
  }

  onEventRetrying(
    eventType: string,
    handlerName: string,
    retryCount: number,
    nextRetryAt: Date,
  ): void {
    console.log(`🔄 Agendando retry: ${eventType} -> ${handlerName}`, {
      retryCount,
      nextRetryAt: nextRetryAt.toISOString(),
    })
  }

  onEventMovedToDeadLetter(failedEvent: FailedEvent): void {
    // Alerta crítico para dead letter
    this.createAlert({
      type: 'DEAD_LETTER',
      severity: 'CRITICAL',
      message: `Evento ${failedEvent.eventType} movido para Dead Letter após ${failedEvent.retryCount} tentativas`,
      eventType: failedEvent.eventType,
      handlerName: failedEvent.handlerName,
      metadata: {
        eventId: failedEvent.eventId,
        error: failedEvent.error.message,
        retryCount: failedEvent.retryCount,
      },
    })

    console.error(
      `💀 Evento movido para Dead Letter: ${failedEvent.eventType}`,
      {
        eventId: failedEvent.eventId,
        handler: failedEvent.handlerName,
        error: failedEvent.error.message,
      },
    )
  }

  private updateHealthStatus(
    key: string,
    success: boolean,
    executionTime?: number,
  ) {
    const existing = this.healthChecks.get(key) || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastCheck: new Date(),
      status: 'HEALTHY',
    }

    existing.totalRequests++
    existing.lastCheck = new Date()

    if (success) {
      existing.successfulRequests++
      if (executionTime) {
        existing.averageResponseTime =
          (existing.averageResponseTime + executionTime) / 2
      }
    } else {
      existing.failedRequests++
    }

    // Calcular status de saúde
    const errorRate = existing.failedRequests / existing.totalRequests
    if (errorRate > 0.5) {
      existing.status = 'UNHEALTHY'
    } else if (errorRate > 0.2) {
      existing.status = 'DEGRADED'
    } else {
      existing.status = 'HEALTHY'
    }

    this.healthChecks.set(key, existing)
  }

  private createAlert(alert: Omit<EventAlert, 'id' | 'createdAt'>) {
    const newAlert: EventAlert = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      ...alert,
    }

    this.alerts.push(newAlert)

    // Manter apenas os últimos 100 alertas
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100)
    }

    // Log do alerta baseado na severidade
    const logLevel = this.getLogLevel(alert.severity)
    console[logLevel](
      `🚨 ALERTA [${alert.severity}]: ${alert.message}`,
      alert.metadata,
    )
  }

  private getLogLevel(severity: AlertSeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'INFO':
        return 'log'
      case 'WARNING':
        return 'warn'
      case 'ERROR':
      case 'CRITICAL':
        return 'error'
      default:
        return 'log'
    }
  }

  // 📊 Métodos para obter dados de monitoramento
  getHealthStatus(): Record<string, HealthStatus> {
    return Object.fromEntries(this.healthChecks)
  }

  getAlerts(severity?: AlertSeverity): EventAlert[] {
    return severity
      ? this.alerts.filter((alert) => alert.severity === severity)
      : this.alerts
  }

  getCriticalAlerts(): EventAlert[] {
    return this.getAlerts('CRITICAL')
  }

  clearAlerts(olderThan?: Date) {
    if (olderThan) {
      this.alerts = this.alerts.filter((alert) => alert.createdAt > olderThan)
    } else {
      this.alerts = []
    }
  }

  // 🏥 Health check geral do sistema
  getSystemHealth(): SystemHealth {
    const allStatuses = Array.from(this.healthChecks.values())
    const unhealthyCount = allStatuses.filter(
      (status) => status.status === 'UNHEALTHY',
    ).length
    const degradedCount = allStatuses.filter(
      (status) => status.status === 'DEGRADED',
    ).length

    let overallStatus: HealthStatus['status'] = 'HEALTHY'

    if (unhealthyCount > 0) {
      overallStatus = 'UNHEALTHY'
    } else if (degradedCount > 0) {
      overallStatus = 'DEGRADED'
    }

    const criticalAlerts = this.getCriticalAlerts()

    return {
      status: overallStatus,
      totalHandlers: this.healthChecks.size,
      healthyHandlers: allStatuses.filter((s) => s.status === 'HEALTHY').length,
      degradedHandlers: degradedCount,
      unhealthyHandlers: unhealthyCount,
      criticalAlertsCount: criticalAlerts.length,
      lastUpdated: new Date(),
      circuitBreakers: CircuitBreakerManager.getAllStats(),
    }
  }
}

// 🏥 Tipos para health checking
export interface HealthStatus {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  lastCheck: Date
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'
}

export interface SystemHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'
  totalHandlers: number
  healthyHandlers: number
  degradedHandlers: number
  unhealthyHandlers: number
  criticalAlertsCount: number
  lastUpdated: Date
  circuitBreakers: Record<string, any>
}

// 🚨 Tipos para alertas
export type AlertType =
  | 'FAILURE'
  | 'PERFORMANCE'
  | 'DEAD_LETTER'
  | 'CIRCUIT_BREAKER'
export type AlertSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

export interface EventAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  message: string
  eventType: string
  handlerName: string
  metadata?: Record<string, any>
  createdAt: Date
}

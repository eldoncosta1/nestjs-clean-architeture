import { Controller, Get, Post, Body, Query } from '@nestjs/common'
import {
  DomainEventsWithReliability,
  EventMetrics,
} from '@/core/events/domain-events-reliability'
import { CircuitBreakerManager } from '@/core/events/circuit-breaker'
import { EventMonitoringService } from '@/core/events/event-monitoring'

@Controller('/admin/reliability')
export class ReliabilityDashboardController {
  constructor(private eventMonitoring: EventMonitoringService) {}

  // 📊 Dashboard principal
  @Get('/dashboard')
  async getDashboard() {
    return {
      systemHealth: this.eventMonitoring.getSystemHealth(),
      metrics: DomainEventsWithReliability.getMetrics(),
      circuitBreakers: CircuitBreakerManager.getAllStats(),
      recentAlerts: this.eventMonitoring.getAlerts().slice(-10),
      failedEvents: DomainEventsWithReliability.getFailedEvents().slice(-20),
    }
  }

  // 🏥 Health check endpoint
  @Get('/health')
  async getHealth() {
    const systemHealth = this.eventMonitoring.getSystemHealth()
    return {
      status: systemHealth.status,
      timestamp: new Date().toISOString(),
      details: systemHealth,
    }
  }

  // 📈 Métricas detalhadas
  @Get('/metrics')
  async getMetrics(@Query('eventType') eventType?: string) {
    const allMetrics = DomainEventsWithReliability.getMetrics()

    if (eventType) {
      return allMetrics.filter((metric) => metric.eventType === eventType)
    }

    return allMetrics
  }

  // 🚨 Alertas
  @Get('/alerts')
  async getAlerts(
    @Query('severity') severity?: string,
    @Query('limit') limit?: string,
  ) {
    const alerts = severity
      ? this.eventMonitoring.getAlerts(severity as any)
      : this.eventMonitoring.getAlerts()

    const limitNum = limit ? parseInt(limit) : 50
    return alerts.slice(-limitNum)
  }

  // 💀 Eventos falhados
  @Get('/failed-events')
  async getFailedEvents() {
    return {
      events: DomainEventsWithReliability.getFailedEvents(),
      summary: {
        total: DomainEventsWithReliability.getFailedEvents().length,
        byEventType: this.groupFailedEventsByType(),
        byHandler: this.groupFailedEventsByHandler(),
      },
    }
  }

  // 🔄 Reprocessar eventos falhados
  @Post('/reprocess-failed')
  async reprocessFailedEvents(@Body() body: { eventIds?: string[] }) {
    const { eventIds } = body

    try {
      await DomainEventsWithReliability.reprocessFailedEvents(eventIds)
      return {
        success: true,
        message: `Reprocessamento iniciado para ${eventIds?.length || 'todos os'} eventos`,
      }
    } catch (error) {
      return {
        success: false,
        message: `Erro ao reprocessar eventos: ${error.message}`,
      }
    }
  }

  // 🔌 Circuit breakers
  @Get('/circuit-breakers')
  async getCircuitBreakers() {
    return CircuitBreakerManager.getAllStats()
  }

  // 🔄 Reset circuit breakers
  @Post('/circuit-breakers/reset')
  async resetCircuitBreakers(@Body() body: { name?: string }) {
    const { name } = body

    if (name) {
      const circuitBreaker = CircuitBreakerManager.getOrCreate(name)
      circuitBreaker.forceReset()
      return { success: true, message: `Circuit breaker ${name} resetado` }
    } else {
      CircuitBreakerManager.resetAll()
      return { success: true, message: 'Todos os circuit breakers resetados' }
    }
  }

  // 🧹 Limpar dados
  @Post('/cleanup')
  async cleanup(
    @Body()
    body: {
      clearFailedEvents?: boolean
      clearAlerts?: boolean
      olderThanHours?: number
    },
  ) {
    const { clearFailedEvents, clearAlerts, olderThanHours } = body

    if (clearFailedEvents) {
      DomainEventsWithReliability.clearFailedEvents()
    }

    if (clearAlerts) {
      const cutoffDate = olderThanHours
        ? new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
        : undefined
      this.eventMonitoring.clearAlerts(cutoffDate)
    }

    return {
      success: true,
      message: 'Limpeza realizada com sucesso',
    }
  }

  // 📊 Estatísticas por período
  @Get('/stats')
  async getStats(@Query('hours') hours?: string) {
    const hoursNum = hours ? parseInt(hours) : 24
    const cutoffDate = new Date(Date.now() - hoursNum * 60 * 60 * 1000)

    const alerts = this.eventMonitoring.getAlerts()
    const recentAlerts = alerts.filter((alert) => alert.createdAt > cutoffDate)

    return {
      period: `${hoursNum} horas`,
      alerts: {
        total: recentAlerts.length,
        critical: recentAlerts.filter((a) => a.severity === 'CRITICAL').length,
        errors: recentAlerts.filter((a) => a.severity === 'ERROR').length,
        warnings: recentAlerts.filter((a) => a.severity === 'WARNING').length,
      },
      systemHealth: this.eventMonitoring.getSystemHealth(),
    }
  }

  // 🔍 Busca de eventos específicos
  @Get('/search')
  async searchEvents(
    @Query('eventType') eventType?: string,
    @Query('handlerName') handlerName?: string,
    @Query('status') status?: 'failed' | 'success',
  ) {
    const metrics = DomainEventsWithReliability.getMetrics()
    const failedEvents = DomainEventsWithReliability.getFailedEvents()

    let results: any[] = []

    if (status === 'failed') {
      results = failedEvents
    } else {
      results = metrics
    }

    if (eventType) {
      results = results.filter((item: any) => item.eventType === eventType)
    }

    if (handlerName) {
      results = results.filter((item: any) => item.handlerName === handlerName)
    }

    return results
  }

  // 🛠️ Métodos auxiliares
  private groupFailedEventsByType() {
    const failedEvents = DomainEventsWithReliability.getFailedEvents()
    const grouped: Record<string, number> = {}

    failedEvents.forEach((event) => {
      grouped[event.eventType] = (grouped[event.eventType] || 0) + 1
    })

    return grouped
  }

  private groupFailedEventsByHandler() {
    const failedEvents = DomainEventsWithReliability.getFailedEvents()
    const grouped: Record<string, number> = {}

    failedEvents.forEach((event) => {
      grouped[event.handlerName] = (grouped[event.handlerName] || 0) + 1
    })

    return grouped
  }
}

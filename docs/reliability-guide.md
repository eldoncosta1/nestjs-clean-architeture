# 🛡️ Guia de Confiabilidade - Comunicação Entre Domínios

## 📋 **Visão Geral**

Este guia apresenta um sistema completo para tratar falhas na comunicação entre domínios no seu projeto NestJS com Clean Architecture + DDD.

## 🏗️ **Arquitetura de Confiabilidade**

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE RELIABILITY                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 Event Monitoring Service                                   │
│  ├── Health Checks                                             │
│  ├── Alertas Automáticos                                       │
│  └── Métricas de Performance                                   │
│                                                                 │
│  🔄 Domain Events with Reliability                             │
│  ├── Retry Automático com Backoff                             │
│  ├── Dead Letter Queue                                         │
│  └── Políticas Customizáveis                                   │
│                                                                 │
│  🔌 Circuit Breaker                                            │
│  ├── Proteção contra Falhas em Cascata                        │
│  ├── Estados: CLOSED/OPEN/HALF_OPEN                           │
│  └── Auto-Recovery                                             │
│                                                                 │
│  🎯 Dashboard de Administração                                 │
│  ├── Visualização em Tempo Real                               │
│  ├── Reprocessamento Manual                                    │
│  └── Controles de Circuit Breaker                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 **Como Implementar**

### 1️⃣ **Atualizar o EventsModule**

```typescript
// src/infra/events/events.module.ts
import { Module, OnModuleInit } from '@nestjs/common'
import { EventMonitoringService } from '@/core/events/event-monitoring'
import { DomainEventsWithReliability } from '@/core/events/domain-events-reliability'
import { OnAnswerCreatedReliable } from '@/domain/notification/application/subscribers/on-answer-created-reliable'

@Module({
  imports: [DatabaseModule],
  providers: [
    OnAnswerCreatedReliable, // Substitui OnAnswerCreated
    EventMonitoringService,
    SendNotificationUseCase
  ],
})
export class EventsModule implements OnModuleInit {
  constructor(private eventMonitoring: EventMonitoringService) {}

  onModuleInit() {
    // Registrar o monitoring service como observer
    DomainEventsWithReliability.addObserver(this.eventMonitoring)
    console.log('🛡️ Sistema de reliability ativado!')
  }
}
```

### 2️⃣ **Atualizar Repositórios para Usar Reliability**

```typescript
// src/infra/database/prisma/repositories/prisma-answers-repository.ts
import { DomainEventsWithReliability } from '@/core/events/domain-events-reliability'

export class PrismaAnswersRepository implements IAnswersRepository {
  async create(answer: Answer): Promise<void> {
    // ... salvar no banco
    
    // Usar o sistema confiável em vez do sistema básico
    for (const event of answer.domainEvents) {
      await DomainEventsWithReliability.dispatchEvent(event)
    }
    
    answer.clearEvents()
  }
}
```

### 3️⃣ **Registrar o Dashboard Controller**

```typescript
// src/infra/http/http.module.ts
import { ReliabilityDashboardController } from './controllers/reliability-dashboard.controller'

@Module({
  controllers: [
    // ... outros controllers
    ReliabilityDashboardController,
  ],
  // ...
})
export class HttpModule {}
```

## 🎯 **Funcionalidades Principais**

### 📊 **1. Monitoramento Automático**

```typescript
// Exemplo de uso do monitoring
const monitoring = new EventMonitoringService()

// Verifica saúde do sistema
const health = monitoring.getSystemHealth()
console.log('Status do sistema:', health.status)

// Obtém alertas críticos
const criticalAlerts = monitoring.getCriticalAlerts()
console.log('Alertas críticos:', criticalAlerts.length)
```

### 🔄 **2. Retry Automático**

```typescript
// Configuração personalizada de retry
DomainEventsWithReliability.register(
  handler,
  'AnswerCreatedEvent',
  'MyHandler',
  {
    maxRetries: 5,           // 5 tentativas
    initialDelayMs: 2000,    // 2 segundos inicial
    backoffMultiplier: 1.5,  // Incremento suave
    maxDelayMs: 60000        // Máximo 1 minuto
  }
)
```

### 🔌 **3. Circuit Breaker**

```typescript
// Uso do circuit breaker
const circuitBreaker = CircuitBreakerManager.getOrCreate('notification-service')

await circuitBreaker.execute(async () => {
  // Operação que pode falhar
  await sendNotification(data)
})
```

### 💀 **4. Dead Letter Queue**

Eventos que falharam após todas as tentativas são automaticamente movidos para uma "Dead Letter Queue" onde podem ser:

- Analisados para identificar problemas
- Reprocessados manualmente
- Usados para métricas de confiabilidade

## 🎮 **Dashboard de Administração**

### **Endpoints Principais:**

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/admin/reliability/dashboard` | GET | Dashboard completo |
| `/admin/reliability/health` | GET | Status de saúde |
| `/admin/reliability/metrics` | GET | Métricas detalhadas |
| `/admin/reliability/alerts` | GET | Lista de alertas |
| `/admin/reliability/failed-events` | GET | Eventos falhados |
| `/admin/reliability/reprocess-failed` | POST | Reprocessar eventos |
| `/admin/reliability/circuit-breakers` | GET | Status dos circuit breakers |

### **Exemplo de Resposta do Dashboard:**

```json
{
  "systemHealth": {
    "status": "HEALTHY",
    "totalHandlers": 3,
    "healthyHandlers": 3,
    "degradedHandlers": 0,
    "unhealthyHandlers": 0,
    "criticalAlertsCount": 0
  },
  "metrics": [
    {
      "eventType": "AnswerCreatedEvent",
      "handlerName": "OnAnswerCreatedReliable",
      "totalExecutions": 150,
      "successCount": 148,
      "failureCount": 2,
      "averageExecutionTime": 245
    }
  ],
  "circuitBreakers": {
    "notification-service": {
      "state": "CLOSED",
      "failures": 0,
      "successes": 148
    }
  }
}
```

## 🛠️ **Configurações Recomendadas**

### **Para Notificações (Não Críticas):**
```typescript
{
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 30000
}
```

### **Para Operações Críticas:**
```typescript
{
  maxRetries: 5,
  initialDelayMs: 500,
  backoffMultiplier: 1.5,
  maxDelayMs: 60000
}
```

### **Para Operações Rápidas:**
```typescript
{
  maxRetries: 2,
  initialDelayMs: 200,
  backoffMultiplier: 3,
  maxDelayMs: 5000
}
```

## 🚨 **Tipos de Alertas**

### **Automáticos:**
- ❌ **FAILURE**: Falha na execução de um handler
- ⚡ **PERFORMANCE**: Handler demorou mais que o esperado
- 💀 **DEAD_LETTER**: Evento movido para dead letter queue
- 🔌 **CIRCUIT_BREAKER**: Circuit breaker mudou de estado

### **Severidades:**
- 🔵 **INFO**: Informativo
- 🟡 **WARNING**: Atenção necessária
- 🟠 **ERROR**: Erro que precisa investigação
- 🔴 **CRITICAL**: Falha crítica que requer ação imediata

## 📈 **Métricas Coletadas**

- **Taxa de Sucesso/Falha** por handler
- **Tempo Médio de Execução**
- **Número de Retries**
- **Status de Circuit Breakers**
- **Volume de Eventos** por tipo
- **Alertas por Severidade**

## 🎯 **Cenários de Uso**

### **1. Falha Temporária de Rede**
- Sistema executa retry automático com backoff
- Após recuperação, eventos são processados normalmente
- Alertas informativos são gerados

### **2. Serviço Indisponível**
- Circuit breaker detecta falhas em sequência
- Abre o circuito para evitar sobrecarga
- Tenta recovery automático após timeout
- Eventos são mantidos para reprocessamento

### **3. Falha na Lógica de Negócio**
- Handler falha após todas as tentativas
- Evento é movido para dead letter queue
- Alerta crítico é gerado
- Admin pode investigar e reprocessar

### **4. Sobrecarga do Sistema**
- Monitoramento detecta performance degradada
- Circuit breakers protegem serviços críticos
- Alertas de performance são gerados
- Sistema se auto-regula

## 🔧 **Manutenção e Troubleshooting**

### **Comandos Úteis:**

```bash
# Ver status geral
curl http://localhost:3000/admin/reliability/health

# Ver eventos falhados
curl http://localhost:3000/admin/reliability/failed-events

# Reprocessar eventos específicos
curl -X POST http://localhost:3000/admin/reliability/reprocess-failed \
  -H "Content-Type: application/json" \
  -d '{"eventIds": ["event-123", "event-456"]}'

# Reset circuit breakers
curl -X POST http://localhost:3000/admin/reliability/circuit-breakers/reset
```

### **Logs para Monitorar:**

```
🚀 Evento iniciado: AnswerCreatedEvent -> OnAnswerCreatedReliable
✅ Evento completado: AnswerCreatedEvent -> OnAnswerCreatedReliable
❌ Evento falhou: AnswerCreatedEvent -> OnAnswerCreatedReliable
🔄 Agendando retry: AnswerCreatedEvent -> OnAnswerCreatedReliable
💀 Evento movido para Dead Letter: AnswerCreatedEvent
🔌 Circuit Breaker notification-service: Abrindo circuito
🚨 ALERTA [CRITICAL]: Evento AnswerCreatedEvent movido para Dead Letter
```

## 🎉 **Benefícios**

✅ **Resiliência**: Sistema continua funcionando mesmo com falhas
✅ **Observabilidade**: Visibilidade completa do que está acontecendo
✅ **Auto-recovery**: Recuperação automática de falhas temporárias
✅ **Proteção**: Circuit breakers evitam falhas em cascata
✅ **Manutenibilidade**: Dashboard para administração e troubleshooting
✅ **Escalabilidade**: Sistema se adapta à carga e falhas

Este sistema garante que a comunicação entre seus domínios seja robusta e confiável! 🚀

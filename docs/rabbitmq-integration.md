# 🐰 Integração RabbitMQ + Domain Events

## 📋 Visão Geral

Este documento descreve a integração do RabbitMQ com o sistema de Domain Events, implementando o **Outbox Pattern** para garantir entrega confiável de eventos em uma arquitetura distribuída.

## 🎯 Objetivos da Integração

### ✅ Problemas Resolvidos

1. **Confiabilidade**: Eventos não são perdidos se o serviço falhar
2. **Escalabilidade**: Múltiplas instâncias podem processar eventos
3. **Desacoplamento**: Serviços externos podem consumir eventos
4. **Auditoria**: Histórico completo de eventos
5. **Transações Multi-Domínio**: Eventos são persistidos na mesma transação

### 🏗️ Arquitetura Implementada

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Domain        │    │   Outbox         │    │   RabbitMQ      │
│   Entity        │───▶│   Events         │───▶│   Exchange      │
│   (Answer)      │    │   Table          │    │   & Queues      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Event          │    │   Event         │
                       │   Publisher      │    │   Consumer      │
                       │   Service        │    │   Service       │
                       └──────────────────┘    └─────────────────┘
```

## 🔧 Componentes Implementados

### 1. **Message Broker Interface**
- `MessageBroker`: Interface abstrata para diferentes brokers
- `RabbitMQMessageBroker`: Implementação específica para RabbitMQ

### 2. **Outbox Pattern**
- `OutboxEvent`: Entidade para armazenar eventos
- `OutboxRepository`: Repositório para gerenciar eventos do outbox
- `PrismaOutboxRepository`: Implementação com Prisma

### 3. **Event Serialization**
- `EventSerializer`: Serialização/deserialização de eventos
- `EventRegistry`: Registry de tipos de eventos
- Suporte a versionamento de eventos

### 4. **Publisher & Consumer**
- `EventPublisherService`: Processa eventos do outbox
- `EventConsumerService`: Consome eventos do RabbitMQ
- Processamento automático via cron jobs

### 5. **Domain Events Aprimorado**
- `DomainEventsWithOutbox`: Versão que suporta outbox
- Compatibilidade com sistema existente
- Configuração flexível (local vs distribuído)

## 📦 Estrutura de Pastas

```
src/
├── core/
│   └── events/
│       ├── message-broker.ts           # Interface do broker
│       ├── event-serializer.ts         # Serialização
│       ├── event-registry.ts           # Registry de eventos
│       ├── outbox-event.ts             # Entidade outbox
│       ├── outbox-repository.ts        # Interface repositório
│       ├── domain-events-with-outbox.ts # Domain events aprimorado
│       └── register-domain-events.ts   # Registro de eventos
└── infra/
    ├── messaging/
    │   ├── rabbitmq/
    │   │   └── rabbitmq-message-broker.ts # Implementação RabbitMQ
    │   ├── event-publisher.service.ts     # Publisher service
    │   ├── event-consumer.service.ts      # Consumer service
    │   └── messaging.module.ts            # Módulo de mensageria
    └── database/
        └── prisma/
            ├── repositories/
            │   └── prisma-outbox-repository.ts # Repositório outbox
            └── mappers/
                └── prisma-outbox-mapper.ts     # Mapper outbox
```

## 🚀 Como Usar

### 1. **Instalação das Dependências**

```bash
pnpm add amqplib @nestjs/microservices @nestjs/schedule
pnpm add -D @types/amqplib
```

### 2. **Configuração do RabbitMQ**

```bash
# Docker Compose para RabbitMQ
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

### 3. **Variáveis de Ambiente**

```env
RABBITMQ_URL="amqp://localhost:5672"
RABBITMQ_EXCHANGE="domain_events"
```

### 4. **Executar Migrações**

```bash
pnpm prisma migrate dev
pnpm prisma generate
```

### 5. **Configuração da Aplicação**

```typescript
// app.module.ts
import { MessagingModule } from './infra/messaging/messaging.module'
import { registerDomainEvents } from './core/events/register-domain-events'

@Module({
  imports: [
    // ... outros módulos
    MessagingModule
  ]
})
export class AppModule implements OnModuleInit {
  onModuleInit() {
    registerDomainEvents()
  }
}
```

## 📊 Fluxo de Eventos

### 1. **Publicação de Eventos**

```
1. Agregado cria evento → addDomainEvent()
2. Repositório salva entidade → save()
3. DomainEventsWithOutbox → dispatchEventsForAggregate()
4. Eventos salvos no outbox → OutboxRepository.saveMany()
5. EventPublisherService (cron) → processa outbox
6. RabbitMQ recebe eventos → publish()
```

### 2. **Consumo de Eventos**

```
1. RabbitMQ entrega evento → EventConsumerService
2. Deserialização → EventSerializer.deserialize()
3. Dispatch local → DomainEvents handlers existentes
4. Acknowledgment → confirma processamento
```

## 🔍 Configuração de Filas

### Exchange e Routing Keys

```typescript
// Configuração automática no RabbitMQMessageBroker
const config = {
  exchange: 'domain_events',
  queues: {
    AnswerCreatedEvent: {
      name: 'answer_created_queue',
      routingKey: 'answer.created',
      durable: true
    },
    QuestionBestAnswerChosenEvent: {
      name: 'question_best_answer_queue', 
      routingKey: 'question.best_answer_chosen',
      durable: true
    }
  }
}
```

### Dead Letter Queues

- Configuração automática de DLQ para eventos que falham
- Retry automático com limite de tentativas
- Logs detalhados para debugging

## 🔄 Monitoramento e Observabilidade

### 1. **Logs Estruturados**

```typescript
// Exemplo de logs
[EventPublisherService] Processing 5 unpublished events
[EventPublisherService] Published event AnswerCreatedEvent with ID abc-123
[EventConsumerService] Received AnswerCreatedEvent: abc-123
[EventConsumerService] Successfully processed AnswerCreatedEvent: abc-123
```

### 2. **Métricas de Outbox**

```typescript
// Estatísticas disponíveis
const stats = await outboxRepository.getStats()
// { published: 150, unpublished: 5, failed: 2, total: 157 }
```

### 3. **RabbitMQ Management UI**

- Acesse `http://localhost:15672` (guest/guest)
- Monitore filas, exchanges e mensagens
- Visualize métricas de throughput

## 🛠️ Troubleshooting

### Problemas Comuns

1. **Eventos não sendo processados**
   - Verificar conexão com RabbitMQ
   - Verificar se EventPublisherService está rodando
   - Consultar logs de erro

2. **Mensagens em Dead Letter Queue**
   - Verificar logs de erro no consumer
   - Validar serialização/deserialização
   - Verificar se event types estão registrados

3. **Performance lenta**
   - Ajustar intervalo do cron job
   - Aumentar limite de eventos por batch
   - Otimizar queries do outbox

### Comandos Úteis

```bash
# Verificar eventos não publicados
SELECT COUNT(*) FROM outbox_events WHERE published = false;

# Verificar eventos que falharam
SELECT * FROM outbox_events WHERE attempts >= 5;

# Limpar eventos antigos já publicados
DELETE FROM outbox_events 
WHERE published = true 
AND processed_at < NOW() - INTERVAL '7 days';
```

## 🔮 Próximos Passos

### Melhorias Futuras

1. **Event Sourcing**: Store completo de eventos
2. **Snapshots**: Otimização para agregados grandes
3. **Sagas**: Coordenação de transações distribuídas
4. **Schema Registry**: Versionamento automático de eventos
5. **Kafka Integration**: Alternativa para alta throughput

### Escalabilidade

1. **Particionamento**: Distribuir eventos por tenant/tipo
2. **Load Balancing**: Múltiplas instâncias de consumer
3. **Batching**: Processar eventos em lotes maiores
4. **Compression**: Reduzir tamanho das mensagens

---

*Este sistema de mensageria resolve as limitações identificadas do Prisma em transações multi-domínio, fornecendo uma base sólida para arquiteturas event-driven escaláveis.*

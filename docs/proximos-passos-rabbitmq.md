# 🚀 Próximos Passos - Implementação RabbitMQ

## 📋 Checklist de Implementação

### ✅ **Fase 1: Preparação do Ambiente**

#### 1.1 Instalar Dependências
```bash
cd d:/workspace/nestjs-clean
pnpm add amqplib @nestjs/microservices @nestjs/schedule
pnpm add -D @types/amqplib
```

#### 1.2 Configurar RabbitMQ com Docker
```bash
# Opção 1: RabbitMQ simples
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management

# Opção 2: Adicionar ao docker-compose.yml existente
```

**Adicione ao `docker-compose.yml`:**
```yaml
services:
  # ... outros services existentes

  rabbitmq:
    image: rabbitmq:3-management
    container_name: nestjs-clean-rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin123
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - nestjs-clean-network

volumes:
  # ... outros volumes
  rabbitmq_data:
```

#### 1.3 Configurar Variáveis de Ambiente
Adicione ao seu arquivo `.env`:
```env
# RabbitMQ Configuration
RABBITMQ_URL="amqp://admin:admin123@localhost:5672"
RABBITMQ_EXCHANGE="domain_events"

# Opções adicionais
RABBITMQ_PUBLISHER_INTERVAL="10" # segundos
RABBITMQ_BATCH_SIZE="50"
RABBITMQ_MAX_RETRIES="5"
```

### ✅ **Fase 2: Configuração do Banco de Dados**

#### 2.1 Executar Migração do Outbox
```bash
# Gerar e aplicar migração
pnpm prisma migrate dev --name add-outbox-events
pnpm prisma generate
```

#### 2.2 Verificar Schema
Confirme que a tabela `outbox_events` foi criada:
```sql
-- Verificar estrutura da tabela
\d outbox_events

-- Verificar se está vazia (deve estar)
SELECT COUNT(*) FROM outbox_events;
```

### ✅ **Fase 3: Configuração da Aplicação**

#### 3.1 Atualizar App Module
Edite `src/app.module.ts`:
```typescript
import { Module, OnModuleInit } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './infra/auth/auth.module'
import { HttpModule } from './infra/http/http.module'
import { envSchema } from './infra/env/env'
import { EnvModule } from './infra/env/env.module'
import { EventsModule } from './infra/events/events.module'
import { MessagingModule } from './infra/messaging/messaging.module' // ← Adicionar
import { registerDomainEvents } from './core/events/register-domain-events' // ← Adicionar

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    AuthModule,
    HttpModule,
    EnvModule,
    EventsModule,
    MessagingModule, // ← Adicionar
  ],
})
export class AppModule implements OnModuleInit {
  onModuleInit() {
    registerDomainEvents() // ← Adicionar
  }
}
```

#### 3.2 Atualizar Database Module
Adicione o novo repositório em `src/infra/database/database.module.ts`:
```typescript
import { PrismaOutboxRepository } from './prisma/repositories/prisma-outbox-repository'

@Module({
  providers: [
    PrismaService,
    // ... outros repositórios existentes
    PrismaOutboxRepository, // ← Adicionar
  ],
  exports: [
    PrismaService,
    // ... outros repositórios existentes  
    PrismaOutboxRepository, // ← Adicionar
  ],
})
export class DatabaseModule {}
```

### ✅ **Fase 4: Testes Iniciais**

#### 4.1 Verificar Startup da Aplicação
```bash
# Iniciar aplicação em modo desenvolvimento
pnpm run start:dev
```

**Logs esperados:**
```
[MessagingModule] Connecting to RabbitMQ...
[MessagingModule] Connected to RabbitMQ successfully
[EventConsumerService] Setting up event consumers...
[EventConsumerService] Subscribed to event type: AnswerCreatedEvent
[EventConsumerService] Subscribed to event type: QuestionBestAnswerChosenEvent
[EventConsumerService] Event consumers setup completed
```

#### 4.2 Verificar RabbitMQ Management UI
1. Acesse: http://localhost:15672
2. Login: `admin` / `admin123`
3. Verificar se o exchange `domain_events` foi criado
4. Verificar se as filas foram criadas:
   - `answer_created_queue`
   - `question_best_answer_queue`

#### 4.3 Teste Básico - Criação de Answer
```bash
# Via API (assumindo que você tem endpoints configurados)
curl -X POST http://localhost:3000/questions/{questionId}/answers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "content": "Esta é uma resposta de teste para verificar o sistema de eventos"
  }'
```

**O que deve acontecer:**
1. Answer é criada no banco
2. `AnswerCreatedEvent` é salvo na tabela `outbox_events`
3. `EventPublisherService` processa o evento (em até 10 segundos)
4. Evento é publicado no RabbitMQ
5. `EventConsumerService` processa o evento
6. Notificação é criada

#### 4.4 Verificar Outbox Events
```sql
-- Verificar eventos no outbox
SELECT 
  event_type,
  aggregate_id,
  published,
  attempts,
  occurred_at,
  processed_at
FROM outbox_events 
ORDER BY occurred_at DESC 
LIMIT 10;

-- Verificar estatísticas
SELECT 
  published,
  COUNT(*) as total,
  AVG(attempts) as avg_attempts
FROM outbox_events 
GROUP BY published;
```

### ✅ **Fase 5: Testes Avançados**

#### 5.1 Teste de Resiliência
```bash
# 1. Parar RabbitMQ
docker stop rabbitmq

# 2. Criar algumas answers (eventos ficarão no outbox)
# 3. Verificar que eventos não são publicados
SELECT * FROM outbox_events WHERE published = false;

# 4. Reiniciar RabbitMQ
docker start rabbitmq

# 5. Aguardar processamento automático (até 10 segundos)
# 6. Verificar que eventos foram publicados
SELECT * FROM outbox_events WHERE published = true;
```

#### 5.2 Teste de Dead Letter Queue
```bash
# Simular erro no consumer (modificar temporariamente o código)
# Verificar se mensagens vão para DLQ após falhas
```

#### 5.3 Teste de Performance
```bash
# Criar múltiplas answers rapidamente
# Monitorar throughput no RabbitMQ Management UI
# Verificar logs de processamento
```

### ✅ **Fase 6: Monitoramento e Observabilidade**

#### 6.1 Configurar Logs Estruturados
Adicione ao `main.ts`:
```typescript
// Configurar logger para produção
app.useLogger(['error', 'warn', 'log', 'debug', 'verbose'])
```

#### 6.2 Criar Endpoint de Health Check
```typescript
// src/infra/http/controllers/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private messageBroker: MessageBroker,
    private outboxRepository: OutboxRepository
  ) {}

  @Get('messaging')
  async checkMessaging() {
    const stats = await this.outboxRepository.getStats()
    
    return {
      status: 'ok',
      messaging: {
        broker: 'rabbitmq',
        connected: true, // TODO: implementar check de conexão
        outbox: stats
      }
    }
  }
}
```

#### 6.3 Dashboard de Métricas
Criar queries úteis para monitoramento:
```sql
-- Eventos por hora (últimas 24h)
SELECT 
  DATE_TRUNC('hour', occurred_at) as hour,
  event_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE published = true) as published,
  COUNT(*) FILTER (WHERE published = false) as pending
FROM outbox_events 
WHERE occurred_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour, event_type
ORDER BY hour DESC;

-- Eventos com falha
SELECT 
  event_type,
  aggregate_id,
  attempts,
  error_message,
  last_attempt_at
FROM outbox_events 
WHERE attempts >= 3
ORDER BY last_attempt_at DESC;
```

### ✅ **Fase 7: Otimizações**

#### 7.1 Ajustar Configurações de Performance
```typescript
// src/infra/messaging/event-publisher.service.ts
// Alterar intervalo baseado na carga
@Cron('*/5 * * * * *') // A cada 5 segundos para alta carga
// @Cron(CronExpression.EVERY_30_SECONDS) // Para carga menor

// Aumentar batch size para alta throughput
const events = await DomainEventsWithOutbox.getUnpublishedEvents(100)
```

#### 7.2 Implementar Cleanup de Eventos Antigos
```typescript
// src/infra/messaging/outbox-cleanup.service.ts
@Injectable()
export class OutboxCleanupService {
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldEvents() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    await this.outboxRepository.deletePublishedOlderThan(sevenDaysAgo)
  }
}
```

#### 7.3 Configurar Particionamento (se necessário)
```sql
-- Para grandes volumes, considere particionamento por data
CREATE TABLE outbox_events_2024_01 PARTITION OF outbox_events
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### ✅ **Fase 8: Deployment**

#### 8.1 Configuração de Produção
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  rabbitmq:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASS}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
      - ./rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

#### 8.2 Monitoramento de Produção
```bash
# Configurar alertas
# - Eventos no outbox > threshold
# - RabbitMQ down
# - Dead letter queue com mensagens
# - Alta latência no processamento
```

### ✅ **Fase 9: Próximas Evoluções**

#### 9.1 Event Sourcing
- Implementar store completo de eventos
- Reconstruir estado a partir de eventos
- Snapshots para otimização

#### 9.2 Sagas Pattern
- Coordenação de transações distribuídas
- Compensação automática de falhas
- Workflow complexos entre domínios

#### 9.3 Schema Evolution
- Versionamento de eventos
- Migração de esquemas
- Backward compatibility

#### 9.4 Multi-tenant Support
- Isolamento por tenant
- Roteamento inteligente
- Métricas por tenant

---

## 🎯 **Cronograma Sugerido**

### Semana 1: Configuração Base
- ✅ Fases 1-3: Ambiente e configuração
- ✅ Testes básicos (Fase 4.1-4.3)

### Semana 2: Validação e Testes
- ✅ Testes avançados (Fase 5)
- ✅ Configuração de monitoramento (Fase 6)

### Semana 3: Otimização
- ✅ Performance tuning (Fase 7)
- ✅ Preparação para produção (Fase 8)

### Ongoing: Evolução
- ✅ Implementação de melhorias (Fase 9)

---

## 🆘 **Troubleshooting Quick Reference**

### Problema: Eventos não sendo processados
```bash
# 1. Verificar conexão RabbitMQ
docker logs rabbitmq

# 2. Verificar logs da aplicação
# Procurar por: "EventPublisherService", "EventConsumerService"

# 3. Verificar outbox
SELECT COUNT(*) FROM outbox_events WHERE published = false;
```

### Problema: Performance lenta
```bash
# 1. Verificar índices do banco
EXPLAIN ANALYZE SELECT * FROM outbox_events WHERE published = false;

# 2. Ajustar batch size
# 3. Reduzir intervalo do cron
# 4. Verificar recursos RabbitMQ
```

### Problema: Mensagens duplicadas
```bash
# Verificar idempotência dos handlers
# Implementar deduplicação se necessário
```

---

*Este documento deve ser seguido passo a passo para garantir uma implementação robusta e confiável do sistema de mensageria.*

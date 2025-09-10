import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'

import { MessageBroker } from '@/core/events/message-broker'
import { OutboxRepository } from '@/core/events/outbox-repository'
import {
  EventSerializer,
  DefaultEventSerializer,
} from '@/core/events/event-serializer'

import { RabbitMQMessageBroker } from './rabbitmq/rabbitmq-message-broker'
import { EventPublisherService } from './event-publisher.service'
import { EventConsumerService } from './event-consumer.service'
import { PrismaOutboxRepository } from '../database/prisma/repositories/prisma-outbox-repository'
import { DatabaseModule } from '../database/database.module'

@Global()
@Module({
  imports: [ConfigModule, ScheduleModule.forRoot(), DatabaseModule],
  providers: [
    {
      provide: MessageBroker,
      useClass: RabbitMQMessageBroker,
    },
    {
      provide: OutboxRepository,
      useClass: PrismaOutboxRepository,
    },
    {
      provide: EventSerializer,
      useClass: DefaultEventSerializer,
    },
    EventPublisherService,
    EventConsumerService,
  ],
  exports: [
    MessageBroker,
    OutboxRepository,
    EventSerializer,
    EventPublisherService,
    EventConsumerService,
  ],
})
export class MessagingModule {}

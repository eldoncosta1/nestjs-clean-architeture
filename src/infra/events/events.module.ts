import { OnAnswerCreated } from '@/domain/notification/application/subscribers/on-answer-created'
import { OnQuestionBestAnswer } from '@/domain/notification/application/subscribers/on-question-best-answer-chosen'
import { SendNotificationUseCase } from '@/domain/notification/application/use-cases/send-notification'
import { Module, OnModuleInit } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module'
import { MessagingModule } from '../messaging/messaging.module'

import { DomainEventsWithOutbox } from '@/core/events/domain-events-with-outbox'
import { EventSerializer } from '@/core/events/event-serializer'
import { OutboxRepository } from '@/core/events/outbox-repository'

@Module({
  imports: [DatabaseModule, MessagingModule],
  providers: [OnAnswerCreated, OnQuestionBestAnswer, SendNotificationUseCase],
})
export class EventsModule implements OnModuleInit {
  constructor(
    private eventSerializer: EventSerializer,
    private outboxRepository: OutboxRepository,
  ) {}

  onModuleInit() {
    // Configurar DomainEvents para usar Outbox Pattern
    DomainEventsWithOutbox.configure({
      eventSerializer: this.eventSerializer,
      outboxRepository: this.outboxRepository,
      useOutbox: true,
    })
  }
}

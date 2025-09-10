import { OnAnswerCreated } from '@/domain/notification/application/subscribers/on-answer-created'
import { OnQuestionBestAnswer } from '@/domain/notification/application/subscribers/on-question-best-answer-chosen'
import { SendNotificationUseCase } from '@/domain/notification/application/use-cases/send-notification'
import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module'

@Module({
  imports: [DatabaseModule],
  providers: [OnAnswerCreated, OnQuestionBestAnswer, SendNotificationUseCase],
})
export class EventsModule {}

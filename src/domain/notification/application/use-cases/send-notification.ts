import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Result } from '@/core/result'
import { Notification } from '../../enterprise/entities/notification'
import { INotificationsRepository } from '../repositories/notifications-repository'

export type SendNotificationUseCaseRequest = {
  recipientId: string
  title: string
  content: string
}

export type SendNotificationUseCaseResponse = Result<
  {
    notification: Notification
  },
  null
>

export class SendNotificationUseCase {
  constructor(private notificationsRepository: INotificationsRepository) {}

  async execute({
    recipientId,
    content,
    title,
  }: SendNotificationUseCaseRequest): Promise<SendNotificationUseCaseResponse> {
    const notification = Notification.create({
      recipientId: new UniqueEntityID(recipientId),
      title,
      content,
    })

    await this.notificationsRepository.create(notification)

    return {
      success: true,
      value: { notification },
    }
  }
}

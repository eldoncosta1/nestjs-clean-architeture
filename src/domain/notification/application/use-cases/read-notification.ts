import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resoure-not-found-error'
import { Result, ResultError } from '@/core/result'
import { Notification } from '../../enterprise/entities/notification'
import { INotificationsRepository } from '../repositories/notifications-repository'

type ReadNotificationUseCaseRequest = {
  recipientId: string
  notificationId: string
}

type ReadNotificationUseCaseResponse = Result<
  {
    notification: Notification
  },
  ResourceNotFoundError | NotAllowedError
>

export class ReadNotificationUseCase {
  constructor(private notificationsRepository: INotificationsRepository) {}

  async execute({
    recipientId,
    notificationId,
  }: ReadNotificationUseCaseRequest): Promise<ReadNotificationUseCaseResponse> {
    const notification =
      await this.notificationsRepository.findById(notificationId)

    if (!notification) {
      return ResultError(ResourceNotFoundError('Notification not found'))
    }

    if (recipientId !== notification.recipientId.toString()) {
      return ResultError(NotAllowedError('Not allowed'))
    }

    notification.read()

    await this.notificationsRepository.save(notification)

    return {
      success: true,
      value: { notification },
    }
  }
}

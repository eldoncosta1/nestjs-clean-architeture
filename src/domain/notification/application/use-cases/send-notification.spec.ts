import { ResultSuccess } from '@/core/result'
import { InMemoryNotificationsRepository } from 'test/repositories/in-memory-notifications-repository'
import { Notification } from '../../enterprise/entities/notification'
import { SendNotificationUseCase } from './send-notification'

let inMemoryNotificationsRepository: InMemoryNotificationsRepository
let sut: SendNotificationUseCase

describe('Send Notification Usecase', () => {
  beforeEach(() => {
    inMemoryNotificationsRepository = new InMemoryNotificationsRepository()
    sut = new SendNotificationUseCase(inMemoryNotificationsRepository)
  })

  it('should be able to send a notification', async () => {
    const result = (await sut.execute({
      recipientId: '1',
      title: 'Nova Notificação',
      content: 'Conteúdo da notificação',
    })) as ResultSuccess<{
      notification: Notification
    }>

    expect(result.value.notification.id).toBeTruthy()
    expect(inMemoryNotificationsRepository.items).toHaveLength(1)
    expect(inMemoryNotificationsRepository.items[0]).toEqual(
      result.value.notification,
    )
  })
})

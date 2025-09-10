import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Notification,
  NotificationProps,
} from '@/domain/notification/enterprise/entities/notification'
import { PrismaNotificationMapper } from '@/infra/database/prisma/mappers/prisma-notification-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'

export function makeNotification(
  override: Partial<NotificationProps> = {},
  id?: UniqueEntityID,
) {
  const notification = Notification.create(
    {
      title: faker.lorem.sentence(4),
      recipientId: new UniqueEntityID(),
      content: faker.lorem.sentence(1),
      ...override,
    },
    id,
  )

  return notification
}

@Injectable()
export class NotificationFactory {
  constructor(private readonly prisma: PrismaService) {}

  async makePrismaNotification(
    data: Partial<NotificationProps> = {},
  ): Promise<Notification> {
    const notification = makeNotification(data)

    await this.prisma.notification.create({
      data: PrismaNotificationMapper.toPersistence(notification),
    })

    return notification
  }
}

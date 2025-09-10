import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { INotificationsRepository } from '@/domain/notification/application/repositories/notifications-repository'
import type { Notification } from '@/domain/notification/enterprise/entities/notification'
import { PrismaNotificationMapper } from '../mappers/prisma-notification-mapper'

@Injectable()
export class PrismaNotificationsRepository implements INotificationsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Notification | null> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    })

    return notification ? PrismaNotificationMapper.toDomain(notification) : null
  }

  async create(notification: Notification): Promise<void> {
    const prismaNotification =
      PrismaNotificationMapper.toPersistence(notification)

    await this.prisma.notification.create({
      data: prismaNotification,
    })
  }

  async save(notification: Notification): Promise<Notification> {
    const data = PrismaNotificationMapper.toPersistence(notification)

    const updatedNotification = await this.prisma.notification.update({
      where: { id: data.id },
      data,
    })

    return PrismaNotificationMapper.toDomain(updatedNotification)
  }
}

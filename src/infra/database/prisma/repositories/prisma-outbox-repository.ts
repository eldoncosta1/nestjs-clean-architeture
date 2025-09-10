import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { OutboxRepository } from '@/core/events/outbox-repository'
import { OutboxEvent } from '@/core/events/outbox-event'
import { PrismaOutboxMapper } from '../mappers/prisma-outbox-mapper'

@Injectable()
export class PrismaOutboxRepository implements OutboxRepository {
  constructor(private prisma: PrismaService) {}

  async save(event: OutboxEvent): Promise<void> {
    const data = PrismaOutboxMapper.toPersistence(event)

    await this.prisma.outboxEvent.create({
      data,
    })
  }

  async saveMany(events: OutboxEvent[]): Promise<void> {
    if (events.length === 0) return

    const data = events.map((event) => PrismaOutboxMapper.toPersistence(event))

    await this.prisma.outboxEvent.createMany({
      data,
      skipDuplicates: true, // Evitar duplicatas por eventId
    })
  }

  async findUnpublished(limit = 100): Promise<OutboxEvent[]> {
    const events = await this.prisma.outboxEvent.findMany({
      where: {
        published: false,
        // Incluir eventos que falharam mas ainda não excederam o limite de tentativas
        attempts: {
          lt: 5, // Máximo 5 tentativas
        },
      },
      orderBy: {
        occurredAt: 'asc', // FIFO - primeiro que entrou, primeiro que sai
      },
      take: limit,
    })

    return events.map(PrismaOutboxMapper.toDomain)
  }

  async findFailedEvents(
    maxAttempts: number,
    limit = 100,
  ): Promise<OutboxEvent[]> {
    const events = await this.prisma.outboxEvent.findMany({
      where: {
        published: false,
        attempts: {
          gte: maxAttempts,
        },
        // Buscar eventos que falharam há mais de 5 minutos para retry
        lastAttemptAt: {
          lt: new Date(Date.now() - 5 * 60 * 1000),
        },
      },
      orderBy: {
        lastAttemptAt: 'asc',
      },
      take: limit,
    })

    return events.map(PrismaOutboxMapper.toDomain)
  }

  async markAsPublished(eventId: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { eventId },
      data: {
        published: true,
        processedAt: new Date(),
      },
    })
  }

  async incrementAttempts(
    eventId: string,
    errorMessage?: string,
  ): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { eventId },
      data: {
        attempts: {
          increment: 1,
        },
        lastAttemptAt: new Date(),
        errorMessage,
      },
    })
  }

  async deletePublishedOlderThan(date: Date): Promise<void> {
    await this.prisma.outboxEvent.deleteMany({
      where: {
        published: true,
        processedAt: {
          lt: date,
        },
      },
    })
  }

  /**
   * Método adicional para estatísticas
   */
  async getStats() {
    const [published, unpublished, failed] = await Promise.all([
      this.prisma.outboxEvent.count({
        where: { published: true },
      }),
      this.prisma.outboxEvent.count({
        where: { published: false, attempts: { lt: 5 } },
      }),
      this.prisma.outboxEvent.count({
        where: { published: false, attempts: { gte: 5 } },
      }),
    ])

    return {
      published,
      unpublished,
      failed,
      total: published + unpublished + failed,
    }
  }
}

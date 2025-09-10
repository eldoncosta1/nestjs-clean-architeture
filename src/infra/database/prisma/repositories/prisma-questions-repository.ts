import { Injectable } from '@nestjs/common'
import { IQuestionsRepository } from '@/domain/forum/application/repositories/questions-repository'
import { PrismaService } from '../prisma.service'
import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Question } from '@/domain/forum/enterprise/entities/question'
import { PrismaQuestionMapper } from '../mappers/prisma-question-mapper'
import { IQuestionAttachmentsRepository } from '@/domain/forum/application/repositories/question-attachments-repository'
import type { QuestionDetails } from '@/domain/forum/enterprise/entities/value-objects/question-details'
import { PrismaQuestionDetailsMapper } from '../mappers/prisma-question-details-mapper'
import { DomainEvents } from '@/core/events/domain-events'
import { CacheRepository } from '@/infra/cache/cache-respository'

@Injectable()
export class PrismaQuestionsRepository implements IQuestionsRepository {
  constructor(
    private prisma: PrismaService,
    private questionAttachmentsRepository: IQuestionAttachmentsRepository,
    private cache: CacheRepository,
  ) {}

  async findById(id: string): Promise<Question | null> {
    const question = await this.prisma.question.findUnique({
      where: {
        id,
      },
    })

    return question ? PrismaQuestionMapper.toDomain(question) : null
  }

  async findBySlug(slug: string): Promise<Question | null> {
    const question = await this.prisma.question.findUnique({
      where: {
        slug,
      },
    })
    return question ? PrismaQuestionMapper.toDomain(question) : null
  }

  async findDetailsBySlug(slug: string): Promise<QuestionDetails | null> {
    const cachedQuestion = await this.cache.get(`question:${slug}:details`)
    if (cachedQuestion) {
      const cachedData = JSON.parse(cachedQuestion)

      return PrismaQuestionDetailsMapper.toDomain(cachedData)
    }

    const question = await this.prisma.question.findUnique({
      where: {
        slug,
      },
      include: {
        author: true,
        attachments: true,
      },
    })

    if (!question) return null

    await this.cache.set(`question:${slug}:details`, JSON.stringify(question))

    const questionDetails = PrismaQuestionDetailsMapper.toDomain(question)

    return questionDetails
  }

  async findManyRecent({ page }: PaginationParams): Promise<Question[]> {
    const questions = await this.prisma.question.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      skip: (page - 1) * 20,
    })

    return questions.map(PrismaQuestionMapper.toDomain)
  }

  async save(question: Question): Promise<Question> {
    const prismaQuestion = PrismaQuestionMapper.toPersistence(question)

    const updatedQuestion = await this.prisma.question.update({
      where: { id: prismaQuestion.id },
      data: prismaQuestion,
    })

    await this.questionAttachmentsRepository.createMany(
      question.attachments.getNewItems(),
    )

    await this.questionAttachmentsRepository.deleteMany(
      question.attachments.getRemovedItems(),
    )

    await this.cache.delete(`question:${question.slug.value}:details`)

    DomainEvents.dispatchEventsForAggregate(question.id)

    return PrismaQuestionMapper.toDomain(updatedQuestion)
  }

  async create(question: Question): Promise<void> {
    const prismaQuestion = PrismaQuestionMapper.toPersistence(question)

    await this.prisma.question.create({
      data: prismaQuestion,
    })

    await this.questionAttachmentsRepository.createMany(
      question.attachments.getItems(),
    )

    DomainEvents.dispatchEventsForAggregate(question.id)
  }

  async delete(question: Question): Promise<void> {
    await this.prisma.question.delete({
      where: { id: question.id.toString() },
    })
  }
}

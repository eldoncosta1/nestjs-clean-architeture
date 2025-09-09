import { Injectable } from '@nestjs/common'
import { IAnswersRepository } from '@/domain/forum/application/repositories/answers-repository'
import type { Answer } from '@/domain/forum/enterprise/entities/answer'
import type { PaginationParams } from '@/core/repositories/pagination-params'
import { PrismaService } from '../prisma.service'
import { PrismaAnswerMapper } from '../mappers/prisma-answer-mapper'
import { IAnswerAttachmentsRepository } from '@/domain/forum/application/repositories/answer-attachments-repository'

@Injectable()
export class PrismaAnswersRepository implements IAnswersRepository {
  constructor(
    private prisma: PrismaService,
    private answerAttachmentsRepository: IAnswerAttachmentsRepository,
  ) {}

  async findById(id: string): Promise<Answer | null> {
    const answer = await this.prisma.answer.findUnique({
      where: {
        id,
      },
    })

    return answer ? PrismaAnswerMapper.toDomain(answer) : null
  }

  async findManyByQuestionId(
    questionId: string,
    { page }: PaginationParams,
  ): Promise<Answer[]> {
    const answers = await this.prisma.answer.findMany({
      where: {
        questionId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      skip: (page - 1) * 20,
    })

    return answers.map(PrismaAnswerMapper.toDomain)
  }
  async create(answer: Answer): Promise<void> {
    const prismaAnswer = PrismaAnswerMapper.toPersistence(answer)

    await this.prisma.answer.create({
      data: prismaAnswer,
    })

    await this.answerAttachmentsRepository.createMany(
      answer.attachments.getItems(),
    )
  }

  async save(answer: Answer): Promise<Answer> {
    const prismaAnswer = PrismaAnswerMapper.toPersistence(answer)

    const updatedAnswer = await this.prisma.answer.update({
      where: { id: prismaAnswer.id },
      data: prismaAnswer,
    })

    await this.answerAttachmentsRepository.createMany(
      answer.attachments.getNewItems(),
    )

    await this.answerAttachmentsRepository.deleteMany(
      answer.attachments.getRemovedItems(),
    )

    return PrismaAnswerMapper.toDomain(updatedAnswer)
  }

  async delete(answer: Answer): Promise<void> {
    await this.prisma.answer.delete({
      where: { id: answer.id.toString() },
    })
  }
}

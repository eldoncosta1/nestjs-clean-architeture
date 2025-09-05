import { Injectable } from '@nestjs/common'
import { IAnswerCommentsRepository } from '@/domain/forum/application/repositories/answer-comments-repository'
import type { AnswerComment } from '@/domain/forum/enterprise/entities/answer-comment'
import { PrismaService } from '../prisma.service'
import { PrismaAnswerCommentCommentMapper } from '../mappers/prisma-answer-comment-mapper'
import { PaginationParams } from '@/core/repositories/pagination-params'

@Injectable()
export class PrismaAnswerCommentsRepository
  implements IAnswerCommentsRepository
{
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<AnswerComment | null> {
    const answerComment = await this.prisma.comment.findUnique({
      where: {
        id,
      },
    })

    return answerComment
      ? PrismaAnswerCommentCommentMapper.toDomain(answerComment)
      : null
  }

  async findManyByAnswerId(
    answerId: string,
    { page }: PaginationParams,
  ): Promise<AnswerComment[]> {
    const answerComments = await this.prisma.comment.findMany({
      where: {
        answerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      skip: (page - 1) * 20,
    })

    return answerComments.map(PrismaAnswerCommentCommentMapper.toDomain)
  }

  async create(answerComment: AnswerComment): Promise<void> {
    const prismaAnswerComment =
      PrismaAnswerCommentCommentMapper.toPersistence(answerComment)

    await this.prisma.comment.create({
      data: prismaAnswerComment,
    })
  }

  async save(answerComment: AnswerComment): Promise<AnswerComment> {
    const prismaAnswerComment =
      PrismaAnswerCommentCommentMapper.toPersistence(answerComment)

    const updatedAnswerComment = await this.prisma.comment.update({
      where: { id: prismaAnswerComment.id },
      data: prismaAnswerComment,
    })

    return PrismaAnswerCommentCommentMapper.toDomain(updatedAnswerComment)
  }

  async delete(answerComment: AnswerComment): Promise<void> {
    await this.prisma.comment.delete({
      where: { id: answerComment.id.toString() },
    })
  }
}

import { Injectable } from '@nestjs/common'
import { IQuestionCommentsRepository } from '@/domain/forum/application/repositories/question-comments-repository'
import type { QuestionComment } from '@/domain/forum/enterprise/entities/question-comment'
import { PrismaService } from '../prisma.service'
import { PrismaQuestionCommentMapper } from '../mappers/prisma-question-comment-mapper'
import { PaginationParams } from '@/core/repositories/pagination-params'

@Injectable()
export class PrismaQuestionCommentsRepository
  implements IQuestionCommentsRepository
{
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<QuestionComment | null> {
    const questionComment = await this.prisma.comment.findUnique({
      where: {
        id,
      },
    })

    return questionComment
      ? PrismaQuestionCommentMapper.toDomain(questionComment)
      : null
  }

  async findManyByQuestionId(
    questionId: string,
    { page }: PaginationParams,
  ): Promise<QuestionComment[]> {
    const questionComments = await this.prisma.comment.findMany({
      where: {
        questionId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      skip: (page - 1) * 20,
    })

    return questionComments.map(PrismaQuestionCommentMapper.toDomain)
  }

  async create(questionComment: QuestionComment): Promise<void> {
    const prismaQuestionComment =
      PrismaQuestionCommentMapper.toPersistence(questionComment)

    await this.prisma.comment.create({
      data: prismaQuestionComment,
    })
  }

  async save(questionComment: QuestionComment): Promise<QuestionComment> {
    const prismaQuestionComment =
      PrismaQuestionCommentMapper.toPersistence(questionComment)

    const updatedQuestionComment = await this.prisma.comment.update({
      where: { id: prismaQuestionComment.id },
      data: prismaQuestionComment,
    })

    return PrismaQuestionCommentMapper.toDomain(updatedQuestionComment)
  }

  async delete(questionComment: QuestionComment): Promise<void> {
    await this.prisma.comment.delete({
      where: { id: questionComment.id.toString() },
    })
  }
}

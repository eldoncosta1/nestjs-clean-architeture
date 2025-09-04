import { Injectable } from '@nestjs/common'
import { IAnswerCommentsRepository } from '@/domain/forum/application/repositories/answer-comments-repository'
import type { AnswerComment } from '@/domain/forum/enterprise/entities/answer-comment'
import { PrismaService } from '../prisma.service'

@Injectable()
export class PrismaAnswerCommentsRepository
  implements IAnswerCommentsRepository
{
  constructor(private prisma: PrismaService) {}

  findById(id: string): Promise<AnswerComment | null> {
    throw new Error('Method not implemented.')
  }
  findManyByAnswerId(answerId: string): Promise<AnswerComment[]> {
    throw new Error('Method not implemented.')
  }
  create(answerComment: AnswerComment): Promise<void> {
    throw new Error('Method not implemented.')
  }
  save(answerComment: AnswerComment): Promise<AnswerComment> {
    throw new Error('Method not implemented.')
  }

  delete(answerComment: AnswerComment): Promise<void> {
    throw new Error('Method not implemented.')
  }
}

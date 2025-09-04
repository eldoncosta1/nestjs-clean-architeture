import { Injectable } from '@nestjs/common'
import { IQuestionCommentsRepository } from '@/domain/forum/application/repositories/question-comments-repository'
import type { QuestionComment } from '@/domain/forum/enterprise/entities/question-comment'
import { PrismaService } from '../prisma.service'

@Injectable()
export class PrismaQuestionCommentsRepository
  implements IQuestionCommentsRepository
{
  constructor(private prisma: PrismaService) {}

  findById(id: string): Promise<QuestionComment | null> {
    throw new Error('Method not implemented.')
  }

  findManyByQuestionId(questionId: string): Promise<QuestionComment[]> {
    throw new Error('Method not implemented.')
  }
  create(questionComment: QuestionComment): Promise<void> {
    throw new Error('Method not implemented.')
  }
  delete(questionComment: QuestionComment): Promise<void> {
    throw new Error('Method not implemented.')
  }
}

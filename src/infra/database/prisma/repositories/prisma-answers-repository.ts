import { Injectable } from '@nestjs/common'
import { IAnswersRepository } from '@/domain/forum/application/repositories/answers-repository'
import type { Answer } from '@/domain/forum/enterprise/entities/answer'
import type { PaginationParams } from '@/core/repositories/pagination-params'
import { PrismaService } from '../prisma.service'

@Injectable()
export class PrismaAnswersRepository implements IAnswersRepository {
  constructor(private prisma: PrismaService) {}

  findById(id: string): Promise<Answer | null> {
    throw new Error('Method not implemented.')
  }
  findManyByQuestionId(
    questionId: string,
    params: PaginationParams,
  ): Promise<Answer[]> {
    throw new Error('Method not implemented.')
  }
  create(answer: Answer): Promise<void> {
    throw new Error('Method not implemented.')
  }
  save(answer: Answer): Promise<Answer> {
    throw new Error('Method not implemented.')
  }

  delete(answer: Answer): Promise<void> {
    throw new Error('Method not implemented.')
  }
}

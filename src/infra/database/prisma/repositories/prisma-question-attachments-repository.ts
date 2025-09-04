import { Injectable } from '@nestjs/common'
import { IQuestionAttachmentsRepository } from '@/domain/forum/application/repositories/question-attachments-repository'
import type { QuestionAttachment } from '@/domain/forum/enterprise/entities/question-attachment'
import { PrismaService } from '../prisma.service'

@Injectable()
export class PrismaQuestionAttachmentsRepository
  implements IQuestionAttachmentsRepository
{
  constructor(private prisma: PrismaService) {}

  findManyByQuestionId(questionId: string): Promise<QuestionAttachment[]> {
    throw new Error('Method not implemented.')
  }
  deleteManyByQuestionId(questionId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
}

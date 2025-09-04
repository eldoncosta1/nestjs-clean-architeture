import { Injectable } from '@nestjs/common'
import { IAnswerAttachmentsRepository } from '@/domain/forum/application/repositories/answer-attachments-repository'
import type { AnswerAttachment } from '@/domain/forum/enterprise/entities/answer-attachment'

@Injectable()
export class PrismaAnswerAttachmentsRepository
  implements IAnswerAttachmentsRepository
{
  findManyByAnswerId(answerId: string): Promise<AnswerAttachment[]> {
    throw new Error('Method not implemented.')
  }
  deleteManyByAnswerId(answerId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
}

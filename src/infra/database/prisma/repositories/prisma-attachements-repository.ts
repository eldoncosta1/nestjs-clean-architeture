import { Injectable } from '@nestjs/common'
import { IAttachmentsRepository } from '@/domain/forum/application/repositories/attachments-repository'
import { PrismaService } from '../prisma.service'
import type { Attachment } from '@/domain/forum/enterprise/entities/attachment'
import { PrismaAttachmentMapper } from '../mappers/prisma-attachment-mapper'

@Injectable()
export class PrismaAttachmentsRepository implements IAttachmentsRepository {
  constructor(private prisma: PrismaService) {}

  async create(attachment: Attachment): Promise<void> {
    const prismaAttachment = PrismaAttachmentMapper.toPersistence(attachment)

    await this.prisma.attachment.create({
      data: prismaAttachment,
    })
  }
}

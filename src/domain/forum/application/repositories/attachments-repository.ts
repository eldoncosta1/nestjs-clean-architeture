import { Attachment } from '@/domain/forum/enterprise/entities/attachment'

export abstract class IAttachmentsRepository {
  abstract create(attachment: Attachment): Promise<void>
}

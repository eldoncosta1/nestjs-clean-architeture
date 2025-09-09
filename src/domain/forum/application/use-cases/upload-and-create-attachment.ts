import { Result, ResultError, ResultSuccess } from '@/core/result'
import { Attachment } from '../../enterprise/entities/attachment'
import { Injectable } from '@nestjs/common'
import { IAttachmentsRepository } from '../repositories'
import { InvalidAttachmentType } from './errors/invalid-attachment-type'
import { IUploader } from '../storage/uploader'

type UploadAndCreateAttachmentUseCaseRequest = {
  fileName: string
  fileType: string
  body: Buffer
}

type UploadAndCreateAttachmentUseCaseResponse = Result<
  {
    attachment: Attachment
  },
  InvalidAttachmentType
>

@Injectable()
export class UploadAndCreateAttachmentUseCase {
  constructor(
    private attachmentsRepository: IAttachmentsRepository,
    private uploader: IUploader,
  ) {}

  async execute({
    fileName,
    fileType,
    body,
  }: UploadAndCreateAttachmentUseCaseRequest): Promise<UploadAndCreateAttachmentUseCaseResponse> {
    const fileTypeRegex = new RegExp(
      /^(image|application)\/(png|jpg|jpeg|gif|pdf)$/,
    )

    if (!fileTypeRegex.test(fileType)) {
      return ResultError(
        InvalidAttachmentType(`Tipo de arquivo ${fileType} não permitido`),
      )
    }

    const { url } = await this.uploader.upload({
      fileName,
      fileType,
      body,
    })

    const attachment = Attachment.create({
      title: fileName,
      url,
    })

    await this.attachmentsRepository.create(attachment)

    return ResultSuccess({ attachment })
  }
}

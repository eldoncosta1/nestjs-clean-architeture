import { ResultSuccess, type ResultError } from '@/core/result'
import { UploadAndCreateAttachmentUseCase } from './upload-and-create-attachment'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { FakeUploader } from 'test/storage/faker-uploader'
import type { Attachment } from '../../enterprise/entities/attachment'
import type { InvalidAttachmentType } from './errors'

let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let sut: UploadAndCreateAttachmentUseCase
let fakeUploader: FakeUploader

describe('Upload and Create Attachment Usecase', () => {
  beforeEach(() => {
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    fakeUploader = new FakeUploader()
    sut = new UploadAndCreateAttachmentUseCase(
      inMemoryAttachmentsRepository,
      fakeUploader,
    )
  })

  it('should be able to load and create a new attachment', async () => {
    const result = (await sut.execute({
      fileName: 'attachment.pdf',
      fileType: 'application/pdf',
      body: Buffer.from('attachment'),
    })) as ResultSuccess<{
      attachment: Attachment
    }>

    expect(result.value.attachment.id).toBeTruthy()
    expect(result.value).toEqual({
      attachment: inMemoryAttachmentsRepository.items[0],
    })
    expect(fakeUploader.uploads[0]).toEqual(
      expect.objectContaining({
        fileName: 'attachment.pdf',
        url: 'http://localhost/uploads/attachment.pdf',
      }),
    )
  })

  it('should not be able to load and create a new attachment with invalid file type', async () => {
    const fileType = 'audio/mpeg'

    const result = (await sut.execute({
      fileName: 'attachment.mp3',
      fileType,
      body: Buffer.from('attachment'),
    })) as ResultError<InvalidAttachmentType>

    expect(result.success).toBe(false)
    expect(result.error.type).toEqual('INVALID_ATTACHMENT_TYPE')
    expect(result.error.message).toEqual(
      `Tipo de arquivo ${fileType} não permitido`,
    )
  })
})

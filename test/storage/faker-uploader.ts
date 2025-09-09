import type {
  IUploader,
  UploadParams,
} from '@/domain/forum/application/storage/uploader'

interface Upload {
  fileName: string
  url: string
}

export class FakeUploader implements IUploader {
  public uploads: Upload[] = []

  async upload({ fileName }: UploadParams): Promise<{ url: string }> {
    const upload = {
      fileName,
      url: `http://localhost/uploads/${fileName}`,
    }

    this.uploads.push(upload)

    return { url: upload.url }
  }
}

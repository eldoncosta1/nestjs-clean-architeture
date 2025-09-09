export interface UploadParams {
  fileName: string
  fileType: string
  body: Buffer
}

export abstract class IUploader {
  abstract upload(params: UploadParams): Promise<{ url: string }>
}

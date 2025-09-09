import type {
  IUploader,
  UploadParams,
} from '@/domain/forum/application/storage/uploader'

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { EnvService } from '../env/env.service'
import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'

@Injectable()
export class R2Storage implements IUploader {
  private client: S3Client
  constructor(private readonly envService: EnvService) {
    this.client = new S3Client({
      endpoint: `https://${this.envService.get('CLOUDFLARE_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      region: 'auto',
      credentials: {
        accessKeyId: this.envService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.envService.get('AWS_SECRET_ACCESS_KEY'),
      },
    })
  }

  async upload({
    fileName,
    fileType,
    body,
  }: UploadParams): Promise<{ url: string }> {
    const uploadId = randomUUID()
    const uniqueFileName = `${uploadId}-${fileName}`

    const command = new PutObjectCommand({
      Bucket: this.envService.get('AWS_BUCKET_NAME'),
      Key: uniqueFileName,
      ContentType: fileType,
      Body: body,
    })

    await this.client.send(command)

    return {
      url: uniqueFileName,
    }
  }
}

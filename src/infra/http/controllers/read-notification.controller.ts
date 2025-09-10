import {
  BadRequestException,
  Controller,
  HttpCode,
  Param,
  Patch,
} from '@nestjs/common'
import { ReadNotificationUseCase } from '@/domain/notification/application/use-cases/read-notification'
import { isError } from '@/core/result'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'

@Controller('/notifications/:notificationId/read')
export class ReadNotificationController {
  constructor(
    private readonly readNotificationUseCase: ReadNotificationUseCase,
  ) {}

  @Patch()
  @HttpCode(204)
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('notificationId') notificationId: string,
  ) {
    const result = await this.readNotificationUseCase.execute({
      notificationId,
      recipientId: user.sub,
    })

    if (isError(result)) {
      throw new BadRequestException()
    }
  }
}

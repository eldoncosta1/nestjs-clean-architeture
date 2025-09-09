import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Param,
  Put,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { EditQuestionUseCase } from '@/domain/forum/application/use-cases/edit-question'
import { isError } from '@/core/result'

const createQuestionBodySchema = z.object({
  title: z.string(),
  content: z.string(),
  attachments: z.array(z.uuid()).optional(),
})

type EditQuestionBodySchema = z.infer<typeof createQuestionBodySchema>

const bodyValidationPipe = new ZodValidationPipe(createQuestionBodySchema)

@Controller('/questions/:id')
export class EditQuestionController {
  constructor(private readonly editQuestionUseCase: EditQuestionUseCase) {}

  @Put()
  @HttpCode(204)
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(bodyValidationPipe)
    body: EditQuestionBodySchema,
    @Param('id') questionId: string,
  ) {
    const { title, content, attachments } = body
    const { sub: userId } = user

    const result = await this.editQuestionUseCase.execute({
      title,
      content,
      authorId: userId,
      attachmentsIds: attachments ?? [],
      questionId,
    })

    if (isError(result)) {
      throw new BadRequestException(result.error.message)
    }
  }
}

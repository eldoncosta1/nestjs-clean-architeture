import { Controller, Delete, HttpCode, Param } from '@nestjs/common'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { DeleteAnswerCommentsUseCase } from '@/domain/forum/application/use-cases/delete-answer-comment'

@Controller('/answers/comments/:id')
export class DeleteAnswerCommentController {
  constructor(
    private readonly deleteAnswerCommentUseCase: DeleteAnswerCommentsUseCase,
  ) {}

  @Delete()
  @HttpCode(204)
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('id') answerCommentId: string,
  ) {
    const { sub: userId } = user

    await this.deleteAnswerCommentUseCase.execute({
      authorId: userId,
      answerCommentId,
    })
  }
}

import { Controller, Delete, HttpCode, Param } from '@nestjs/common'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { DeleteQuestionCommentsUseCase } from '@/domain/forum/application/use-cases/delete-question-comment'

@Controller('/questions/comments/:id')
export class DeleteQuestionCommentController {
  constructor(
    private readonly deleteQuestionCommentUseCase: DeleteQuestionCommentsUseCase,
  ) {}

  @Delete()
  @HttpCode(204)
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('id') questionCommentId: string,
  ) {
    const { sub: userId } = user

    await this.deleteQuestionCommentUseCase.execute({
      authorId: userId,
      questionCommentId,
    })
  }
}

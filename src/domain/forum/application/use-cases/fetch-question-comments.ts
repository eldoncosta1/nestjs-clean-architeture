import { Result } from '@/core/result'
import { CommentWithAuthor } from '../../enterprise/entities/value-objects/comment-with-author'
import { IQuestionCommentsRepository } from '../repositories/question-comments-repository'
import { Injectable } from '@nestjs/common'

type FetchQuestionCommentsUseCaseRequest = {
  questionId: string
  page: number
}

type FetchQuestionCommentsUseCaseResponse = Result<
  {
    comments: CommentWithAuthor[]
  },
  null
>

@Injectable()
export class FetchQuestionCommentsUseCase {
  constructor(
    private questionCommentsRepository: IQuestionCommentsRepository,
  ) {}

  async execute({
    questionId,
    page,
  }: FetchQuestionCommentsUseCaseRequest): Promise<FetchQuestionCommentsUseCaseResponse> {
    const commentsWithAuthor =
      await this.questionCommentsRepository.findManyByQuestionIdWithAuthor(
        questionId,
        {
          page,
        },
      )

    return {
      success: true,
      value: { comments: commentsWithAuthor },
    }
  }
}

import { Result } from '@/core/result'
import { QuestionComment } from '../../enterprise/entities/question-comment'
import { IQuestionCommentsRepository } from '../repositories/question-comments-repository'

type FetchQuestionCommentsUseCaseRequest = {
  questionId: string
  page: number
}

type FetchQuestionCommentsUseCaseResponse = Result<
  {
    questionComments: QuestionComment[]
  },
  null
>

export class FetchQuestionCommentsUseCase {
  constructor(
    private questionCommentsRepository: IQuestionCommentsRepository,
  ) {}

  async execute({
    questionId,
    page,
  }: FetchQuestionCommentsUseCaseRequest): Promise<FetchQuestionCommentsUseCaseResponse> {
    const questionComments =
      await this.questionCommentsRepository.findManyByQuestionId(questionId, {
        page,
      })

    return {
      success: true,
      value: { questionComments },
    }
  }
}

import { Result } from '@/core/result'
import { AnswerComment } from '../../enterprise/entities/answer-comment'
import { IAnswerCommentsRepository } from '../repositories/answer-comments-repository'

type FetchAnswerCommentsUseCaseRequest = {
  answerId: string
  page: number
}

type FetchAnswerCommentsUseCaseResponse = Result<
  {
    answerComments: AnswerComment[]
  },
  null
>

export class FetchAnswerCommentsUseCase {
  constructor(private answerCommentsRepository: IAnswerCommentsRepository) {}

  async execute({
    answerId,
    page,
  }: FetchAnswerCommentsUseCaseRequest): Promise<FetchAnswerCommentsUseCaseResponse> {
    const answerComments =
      await this.answerCommentsRepository.findManyByAnswerId(answerId, {
        page,
      })

    return {
      success: true,
      value: { answerComments },
    }
  }
}

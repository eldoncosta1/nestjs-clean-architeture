import { Result, ResultError } from '@/core/result'
import { NotAllowedError } from '../../../../core/errors/not-allowed-error'
import { ResourceNotFoundError } from '../../../../core/errors/resoure-not-found-error'
import { IAnswersRepository } from '../repositories/answers-repository'

type DeleteAnswerUseCaseRequest = {
  answerId: string
  authorId: string
}

type DeleteAnswerUseCaseResponse = Result<
  null,
  ResourceNotFoundError | NotAllowedError
>

export class DeleteAnswerUseCase {
  constructor(private answersRepository: IAnswersRepository) {}

  async execute({
    answerId,
    authorId,
  }: DeleteAnswerUseCaseRequest): Promise<DeleteAnswerUseCaseResponse> {
    const answer = await this.answersRepository.findById(answerId)

    if (!answer) {
      return ResultError(ResourceNotFoundError('Answer not found'))
    }

    if (authorId !== answer.authorId.toString()) {
      return ResultError(NotAllowedError('Not allowed'))
    }

    await this.answersRepository.delete(answer)

    return {
      success: true,
      value: null,
    }
  }
}

import { Result, ResultError } from '@/core/result'
import { NotAllowedError } from '../../../../core/errors/not-allowed-error'
import { ResourceNotFoundError } from '../../../../core/errors/resoure-not-found-error'
import { IQuestionsRepository } from '../repositories/questions-repository'

type DeleteQuestionUseCaseRequest = {
  questionId: string
  authorId: string
}

type DeleteQuestionUseCaseResponse = Result<
  null,
  ResourceNotFoundError | NotAllowedError
>

export class DeleteQuestionUseCase {
  constructor(private questionsRepository: IQuestionsRepository) {}

  async execute({
    questionId,
    authorId,
  }: DeleteQuestionUseCaseRequest): Promise<DeleteQuestionUseCaseResponse> {
    const question = await this.questionsRepository.findById(questionId)

    if (!question) {
      return ResultError(ResourceNotFoundError('Question not found'))
    }

    if (authorId !== question.authorId.toString()) {
      return ResultError(NotAllowedError('Not allowed'))
    }

    await this.questionsRepository.delete(question)

    return {
      success: true,
      value: null,
    }
  }
}

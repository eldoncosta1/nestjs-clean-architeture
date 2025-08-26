import { Result, ResultError } from '@/core/result'
import { Question } from '@/domain/forum/enterprise/entities/question'
import { NotAllowedError } from '../../../../core/errors/not-allowed-error'
import { ResourceNotFoundError } from '../../../../core/errors/resoure-not-found-error'
import { IAnswersRepository } from '../repositories/answers-repository'
import { IQuestionsRepository } from '../repositories/questions-repository'

type ChooseQuestionBestAnswerUseCaseRequest = {
  answerId: string
  authorId: string
}

type ChooseQuestionBestAnswerResponse = Result<
  {
    question: Question
  },
  ResourceNotFoundError | NotAllowedError
>

export class ChooseQuestionBestAnswerUseCase {
  constructor(
    private questionsRepository: IQuestionsRepository,
    private answersRepository: IAnswersRepository,
  ) {}

  async execute({
    answerId,
    authorId,
  }: ChooseQuestionBestAnswerUseCaseRequest): Promise<ChooseQuestionBestAnswerResponse> {
    const answer = await this.answersRepository.findById(answerId)

    if (!answer) {
      return ResultError(ResourceNotFoundError('Answer not found'))
    }

    const question = await this.questionsRepository.findById(
      answer.questionId.toString(),
    )

    if (!question) {
      return ResultError(ResourceNotFoundError('Question not found'))
    }

    if (authorId !== question.authorId.toString()) {
      return ResultError(NotAllowedError('Not allowed'))
    }

    question.bestAnswerId = answer.id

    await this.questionsRepository.save(question)

    return {
      success: true,
      value: { question },
    }
  }
}

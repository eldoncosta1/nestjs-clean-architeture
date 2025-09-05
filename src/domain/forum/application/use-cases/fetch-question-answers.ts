import { Result } from '@/core/result'
import { Answer } from '@/domain/forum/enterprise/entities/answer'
import { IAnswersRepository } from '../repositories/answers-repository'
import { Injectable } from '@nestjs/common'

type FetchQuestionAnswersUseCaseRequest = {
  questionId: string
  page: number
}

type FetchQuestionAnswersUseCaseResponse = Result<
  {
    answers: Answer[]
  },
  null
>

@Injectable()
export class FetchQuestionAnswersUseCase {
  constructor(private answersRepository: IAnswersRepository) {}

  async execute({
    questionId,
    page,
  }: FetchQuestionAnswersUseCaseRequest): Promise<FetchQuestionAnswersUseCaseResponse> {
    const answers = await this.answersRepository.findManyByQuestionId(
      questionId,
      { page },
    )

    return {
      success: true,
      value: { answers },
    }
  }
}

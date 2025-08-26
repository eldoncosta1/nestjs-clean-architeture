import { Result } from '@/core/result'
import { Question } from '../../enterprise/entities/question'
import { IQuestionsRepository } from '../repositories/questions-repository'

type FetchRecentQuestionsUseCaseRequest = {
  page: number
}

type FetchRecentQuestionsUseCaseResponse = Result<
  {
    questions: Question[]
  },
  null
>

export class FetchRecentQuestionsUseCase {
  constructor(private questionsRepository: IQuestionsRepository) {}

  async execute({
    page,
  }: FetchRecentQuestionsUseCaseRequest): Promise<FetchRecentQuestionsUseCaseResponse> {
    const questions = await this.questionsRepository.findManyRecent({ page })

    return {
      success: true,
      value: { questions },
    }
  }
}

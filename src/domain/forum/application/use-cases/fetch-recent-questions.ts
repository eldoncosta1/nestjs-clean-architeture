import { Result } from '@/core/result'
import { Question } from '../../enterprise/entities/question'
import { IQuestionsRepository } from '../repositories/questions-repository'
import { Injectable, Inject } from '@nestjs/common'

type FetchRecentQuestionsUseCaseRequest = {
  page: number
}

type FetchRecentQuestionsUseCaseResponse = Result<
  {
    questions: Question[]
  },
  null
>

@Injectable()
export class FetchRecentQuestionsUseCase {
  constructor(
    @Inject(IQuestionsRepository)
    private questionsRepository: IQuestionsRepository,
  ) {}

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

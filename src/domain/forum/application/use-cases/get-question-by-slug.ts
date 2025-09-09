import { Result, ResultError } from '@/core/result'
import { ResourceNotFoundError } from '../../../../core/errors/resoure-not-found-error'
import { IQuestionsRepository } from '../repositories/questions-repository'
import { Injectable } from '@nestjs/common'
import type { QuestionDetails } from '../../enterprise/entities/value-objects/question-details'

type GetQuestionBySlugUseCaseRequest = {
  slug: string
}

type GetQuestionBySlugUseCaseResponse = Result<
  {
    question: QuestionDetails
  },
  ResourceNotFoundError
>

@Injectable()
export class GetQuestionBySlugUseCase {
  constructor(private questionsRepository: IQuestionsRepository) {}

  async execute({
    slug,
  }: GetQuestionBySlugUseCaseRequest): Promise<GetQuestionBySlugUseCaseResponse> {
    const question = await this.questionsRepository.findDetailsBySlug(slug)

    if (!question) {
      return ResultError(ResourceNotFoundError('Question not found'))
    }

    return {
      success: true,
      value: { question },
    }
  }
}

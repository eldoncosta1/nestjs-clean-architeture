import { BadRequestException, Controller, Get, Query } from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { FetchRecentQuestionsUseCase } from '@/domain/forum/application/use-cases/fetch-recent-questions'
import { isError } from '@/core/result'
import { QuestionPresenter } from '../presenters/question-presenter'

const pageQueryParamSchema = z.coerce.number().optional().default(1)

const queryValidationPipe = new ZodValidationPipe(pageQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>

@Controller('/questions')
export class FetchRecentQuestionsController {
  constructor(
    private readonly fetchRecentQuestionsUseCase: FetchRecentQuestionsUseCase,
  ) {}

  @Get()
  async handle(@Query('page', queryValidationPipe) page: PageQueryParamSchema) {
    const result = await this.fetchRecentQuestionsUseCase.execute({
      page,
    })

    if (isError(result)) {
      throw new BadRequestException()
    }

    const questions = result.value.questions

    return {
      questions: questions.map(QuestionPresenter.toHTTP),
    }
  }
}

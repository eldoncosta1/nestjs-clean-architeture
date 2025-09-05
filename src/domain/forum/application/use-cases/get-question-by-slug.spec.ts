import { ResultSuccess } from '@/core/result'
import { makeQuestion } from 'test/factories/make-question'
import { InMemoryQuestionAttachmentsRepository } from 'test/repositories/in-memory-question-attachments-repository'
import { InMemoryQuestionsRepository } from 'test/repositories/in-memory-questions-repository'
import { Question } from '../../enterprise/entities/question'
import { GetQuestionBySlugUseCase } from './get-question-by-slug'
import { Slug } from '../../enterprise/entities/value-objects/slug'

let inMemoryQuestionsRepository: InMemoryQuestionsRepository
let inMemoryQuestionAttachmentsRepository: InMemoryQuestionAttachmentsRepository
let sut: GetQuestionBySlugUseCase

describe('Get Question By Slug Usecase', () => {
  beforeEach(() => {
    inMemoryQuestionAttachmentsRepository =
      new InMemoryQuestionAttachmentsRepository()
    inMemoryQuestionsRepository = new InMemoryQuestionsRepository(
      inMemoryQuestionAttachmentsRepository,
    )
    sut = new GetQuestionBySlugUseCase(inMemoryQuestionsRepository)
  })

  it('should be able to get a question by slug', async () => {
    const slug = Slug.create('example-question')
    const newQuestion = makeQuestion({ slug })
    await inMemoryQuestionsRepository.create(newQuestion)

    const result = (await sut.execute({
      slug: slug.value,
    })) as ResultSuccess<{
      question: Question
    }>

    expect(result.value.question.id).toBeTruthy()
    expect(result.value.question.title).toEqual(newQuestion.title)
  })
})

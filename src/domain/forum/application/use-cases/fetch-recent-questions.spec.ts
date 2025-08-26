import { ResultSuccess } from '@/core/result'
import { makeQuestion } from 'test/factories/make-question'
import { InMemoryQuestionAttachmentsRepository } from 'test/repositories/in-memory-question-attachments-repository'
import { InMemoryQuestionsRepository } from 'test/repositories/in-memory-questions-repository'
import { Question } from '../../enterprise/entities/question'
import { FetchRecentQuestionsUseCase } from './fetch-recent-questions'

let inMemoryQuestionsRepository: InMemoryQuestionsRepository
let inMemoryQuestionAttachmentsRepository: InMemoryQuestionAttachmentsRepository
let sut: FetchRecentQuestionsUseCase

describe('Fetch Recent Questions Usecase', () => {
  beforeEach(() => {
    inMemoryQuestionAttachmentsRepository =
      new InMemoryQuestionAttachmentsRepository()
    inMemoryQuestionsRepository = new InMemoryQuestionsRepository(
      inMemoryQuestionAttachmentsRepository,
    )
    sut = new FetchRecentQuestionsUseCase(inMemoryQuestionsRepository)
  })

  it('should be able to fetch recent questions', async () => {
    await inMemoryQuestionsRepository.create(
      makeQuestion({ createdAt: new Date(2022, 0, 20).toUTCString() }),
    )
    await inMemoryQuestionsRepository.create(
      makeQuestion({ createdAt: new Date(2022, 0, 18).toUTCString() }),
    )
    await inMemoryQuestionsRepository.create(
      makeQuestion({ createdAt: new Date(2022, 0, 23).toUTCString() }),
    )

    const result = (await sut.execute({ page: 1 })) as ResultSuccess<{
      questions: Question[]
    }>

    expect(result.value.questions).toEqual([
      expect.objectContaining({
        createdAt: new Date(2022, 0, 23).toUTCString(),
      }),
      expect.objectContaining({
        createdAt: new Date(2022, 0, 20).toUTCString(),
      }),
      expect.objectContaining({
        createdAt: new Date(2022, 0, 18).toUTCString(),
      }),
    ])
  })

  it('should be able to fetch paginated recent questions', async () => {
    for (let i = 1; i <= 22; i++) {
      await inMemoryQuestionsRepository.create(makeQuestion())
    }

    const result = (await sut.execute({ page: 2 })) as ResultSuccess<{
      questions: Question[]
    }>

    expect(result.value.questions).toHaveLength(2)
  })
})

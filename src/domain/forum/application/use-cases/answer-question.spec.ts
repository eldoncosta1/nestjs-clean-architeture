import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResultSuccess } from '@/core/result'
import { Answer } from '@/domain/forum/enterprise/entities/answer'
import { InMemoryAnswerAttachmentsRepository } from 'test/repositories/in-memory-answer-attachments-repository'
import { InMemoryAnswersRepository } from 'test/repositories/in-memory-answers-repository'
import { AnswerQuestionUseCase } from './answer-question'

let inMemoryAnswersRepository: InMemoryAnswersRepository
let inMemoryAnswerAttachmentsRepository: InMemoryAnswerAttachmentsRepository
let sut: AnswerQuestionUseCase

describe('Answer Question Usecase', () => {
  beforeEach(() => {
    inMemoryAnswerAttachmentsRepository =
      new InMemoryAnswerAttachmentsRepository()
    inMemoryAnswersRepository = new InMemoryAnswersRepository(
      inMemoryAnswerAttachmentsRepository,
    )
    sut = new AnswerQuestionUseCase(inMemoryAnswersRepository)
  })

  it('should be able to create an answer', async () => {
    const result = (await sut.execute({
      questionId: '1',
      instructorId: '1',
      content: 'Conteúdo da pergunta',
      attachmentsIds: ['1', '2'],
    })) as ResultSuccess<{
      answer: Answer
    }>

    expect(result.success).toBe(true)
    expect(inMemoryAnswersRepository.items[0]).toEqual(result.value.answer)
    expect(inMemoryAnswersRepository.items[0].attachments.currentItems).toEqual(
      [
        expect.objectContaining({ attachmentId: new UniqueEntityID('1') }),
        expect.objectContaining({ attachmentId: new UniqueEntityID('2') }),
      ],
    )
  })
})

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Result } from '@/core/result'
import { Answer } from '@/domain/forum/enterprise/entities/answer'
import { AnswerAttachment } from '../../enterprise/entities/answer-attachment'
import { AnswerAttachmentList } from '../../enterprise/entities/answer-attachment-list'
import { IAnswersRepository } from '../repositories/answers-repository'

type AnswerQuestionUseCaseRequest = {
  instructorId: string
  questionId: string
  content: string
  attachmentsIds: string[]
}

export type AnswerQuestionResponse = Result<
  {
    answer: Answer
  },
  null
>

export class AnswerQuestionUseCase {
  constructor(private answersRepository: IAnswersRepository) {}

  async execute({
    instructorId,
    questionId,
    content,
    attachmentsIds,
  }: AnswerQuestionUseCaseRequest): Promise<AnswerQuestionResponse> {
    const answer = Answer.create({
      content,
      authorId: new UniqueEntityID(instructorId),
      questionId: new UniqueEntityID(questionId),
    })

    const answerAttachments = attachmentsIds.map((attachmentId) => {
      return AnswerAttachment.create({
        attachmentId: new UniqueEntityID(attachmentId),
        answerId: answer.id,
      })
    })

    answer.attachments = new AnswerAttachmentList(answerAttachments)

    await this.answersRepository.create(answer)

    return {
      success: true,
      value: { answer },
    }
  }
}

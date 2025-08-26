import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Result, ResultError } from '@/core/result'
import { Answer } from '@/domain/forum/enterprise/entities/answer'
import { NotAllowedError } from '../../../../core/errors/not-allowed-error'
import { ResourceNotFoundError } from '../../../../core/errors/resoure-not-found-error'
import { AnswerAttachment } from '../../enterprise/entities/answer-attachment'
import { AnswerAttachmentList } from '../../enterprise/entities/answer-attachment-list'
import { IAnswerAttachmentsRepository } from '../repositories/answer-attachments-repository'
import { IAnswersRepository } from '../repositories/answers-repository'

type EditAnswerUseCaseRequest = {
  authorId: string
  answerId: string
  content: string
  attachmentsIds: string[]
}

type EditAnswerUseCaseResponse = Result<
  {
    answer: Answer
  },
  ResourceNotFoundError | NotAllowedError
>

export class EditAnswerUseCase {
  constructor(
    private answersRepository: IAnswersRepository,
    private answerAttachmentsRepository: IAnswerAttachmentsRepository,
  ) {}

  async execute({
    authorId,
    answerId,
    content,
    attachmentsIds,
  }: EditAnswerUseCaseRequest): Promise<EditAnswerUseCaseResponse> {
    const answer = await this.answersRepository.findById(answerId)

    if (!answer) {
      return ResultError(ResourceNotFoundError('Answer not found'))
    }

    if (authorId !== answer.authorId.toString()) {
      return ResultError(NotAllowedError('Not allowed'))
    }

    const currentAnswerAttachments =
      await this.answerAttachmentsRepository.findManyByAnswerId(answerId)

    const answerAttachmentList = new AnswerAttachmentList(
      currentAnswerAttachments,
    )

    const answerAttachments = attachmentsIds.map((attachmentId) => {
      return AnswerAttachment.create({
        attachmentId: new UniqueEntityID(attachmentId),
        answerId: answer.id,
      })
    })

    answerAttachmentList.update(answerAttachments)

    answer.attachments = answerAttachmentList
    answer.content = content

    const answerEdited = await this.answersRepository.save(answer)

    return {
      success: true,
      value: { answer: answerEdited },
    }
  }
}

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Result, ResultError } from '@/core/result'
import { Question } from '@/domain/forum/enterprise/entities/question'
import { NotAllowedError } from '../../../../core/errors/not-allowed-error'
import { ResourceNotFoundError } from '../../../../core/errors/resoure-not-found-error'
import { QuestionAttachment } from '../../enterprise/entities/question-attachment'
import { QuestionAttachmentList } from '../../enterprise/entities/question-attachment-list'
import { IQuestionAttachmentsRepository } from '../repositories/question-attachments-repository'
import { IQuestionsRepository } from '../repositories/questions-repository'

type EditQuestionUseCaseRequest = {
  authorId: string
  questionId: string
  title: string
  content: string
  attachmentsIds: string[]
}

type EditQuestionUseCaseResponse = Result<
  {
    question: Question
  },
  ResourceNotFoundError | NotAllowedError
>

export class EditQuestionUseCase {
  constructor(
    private questionsRepository: IQuestionsRepository,
    private questionsAttachemtnsRepository: IQuestionAttachmentsRepository,
  ) {}

  async execute({
    authorId,
    questionId,
    content,
    title,
    attachmentsIds,
  }: EditQuestionUseCaseRequest): Promise<EditQuestionUseCaseResponse> {
    const question = await this.questionsRepository.findById(questionId)

    if (!question) {
      return ResultError(ResourceNotFoundError('Question not found'))
    }

    if (authorId !== question.authorId.toString()) {
      return ResultError(NotAllowedError('Not allowed'))
    }

    const currentQuestionAttachments =
      await this.questionsAttachemtnsRepository.findManyByQuestionId(questionId)

    const questionAttachmentList = new QuestionAttachmentList(
      currentQuestionAttachments,
    )

    const questionAttachments = attachmentsIds.map((attachmentId) => {
      return QuestionAttachment.create({
        attachmentId: new UniqueEntityID(attachmentId),
        questionId: question.id,
      })
    })

    questionAttachmentList.update(questionAttachments)

    question.title = title
    question.content = content
    question.attachments = questionAttachmentList

    const questionEdited = await this.questionsRepository.save(question)

    return {
      success: true,
      value: { question: questionEdited },
    }
  }
}

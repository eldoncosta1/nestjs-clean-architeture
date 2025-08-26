import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Result, ResultError } from '@/core/result'
import { ResourceNotFoundError } from '../../../../core/errors/resoure-not-found-error'
import { AnswerComment } from '../../enterprise/entities/answer-comment'
import { IAnswerCommentsRepository } from '../repositories/answer-comments-repository'
import { IAnswersRepository } from '../repositories/answers-repository'

type CommentOnAnswerUseCaseRequest = {
  authorId: string
  answerId: string
  content: string
}

type CommentOnAnswerUseCaseResponse = Result<
  {
    answerComment: AnswerComment
  },
  ResourceNotFoundError
>

export class CommentOnAnswerUseCase {
  constructor(
    private answersRepository: IAnswersRepository,
    private answerCommentsRepository: IAnswerCommentsRepository,
  ) {}

  async execute({
    authorId,
    answerId,
    content,
  }: CommentOnAnswerUseCaseRequest): Promise<CommentOnAnswerUseCaseResponse> {
    const answer = await this.answersRepository.findById(answerId)

    if (!answer) {
      return ResultError(ResourceNotFoundError('Answer not found'))
    }

    const answerComment = AnswerComment.create({
      authorId: new UniqueEntityID(authorId),
      answerId: new UniqueEntityID(authorId),
      content,
    })

    await this.answerCommentsRepository.create(answerComment)

    return {
      success: true,
      value: { answerComment },
    }
  }
}

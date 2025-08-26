import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Result, ResultError } from '@/core/result'
import { ResourceNotFoundError } from '../../../../core/errors/resoure-not-found-error'
import { QuestionComment } from '../../enterprise/entities/question-comment'
import { IQuestionCommentsRepository } from '../repositories/question-comments-repository'
import { IQuestionsRepository } from '../repositories/questions-repository'

type CommentOnQuestionUseCaseRequest = {
  authorId: string
  questionId: string
  content: string
}

type CommentOnQuestionUseCaseResponse = Result<
  {
    questionComment: QuestionComment
  },
  ResourceNotFoundError
>

export class CommentOnQuestionUseCase {
  constructor(
    private questionsRepository: IQuestionsRepository,
    private questionCommentsRepository: IQuestionCommentsRepository,
  ) {}

  async execute({
    authorId,
    questionId,
    content,
  }: CommentOnQuestionUseCaseRequest): Promise<CommentOnQuestionUseCaseResponse> {
    const question = await this.questionsRepository.findById(questionId)

    if (!question) {
      return ResultError(ResourceNotFoundError('Question not found'))
    }

    const questionComment = QuestionComment.create({
      authorId: new UniqueEntityID(authorId),
      questionId: new UniqueEntityID(authorId),
      content,
    })

    await this.questionCommentsRepository.create(questionComment)

    return {
      success: true,
      value: { questionComment },
    }
  }
}

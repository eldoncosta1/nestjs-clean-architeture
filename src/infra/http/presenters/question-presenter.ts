import type { Question } from '@/domain/forum/enterprise/entities/question'

export class QuestionPresenter {
  static toHTTP(question: Question) {
    return {
      id: question.id.toString(),
      title: question.title,
      slug: question.slug.value,
      bestAnswerId: question.bestAnswerId?.toString(),
      content: question.content,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    }
  }
}

import type {
  Comment,
  CommentProps,
} from '@/domain/forum/enterprise/entities/comment'

export class CommentPresenter {
  static toHTTP(comment: Comment<CommentProps>) {
    return {
      id: comment.id.toString(),
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }
  }
}

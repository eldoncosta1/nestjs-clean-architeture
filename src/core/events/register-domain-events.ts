import { EventRegistry } from './event-registry'

// Importar todos os eventos de domínio
import { AnswerCreatedEvent } from '@/domain/forum/events/answer-created-event'
import { QuestionBestAnswerChosenEvent } from '@/domain/forum/events/question-best-answer-chosen-event'

/**
 * Registra todos os eventos de domínio no registry
 * Este arquivo deve ser chamado na inicialização da aplicação
 */
export function registerDomainEvents() {
  // Forum Events
  EventRegistry.register('AnswerCreatedEvent', AnswerCreatedEvent)
  EventRegistry.register(
    'QuestionBestAnswerChosenEvent',
    QuestionBestAnswerChosenEvent,
  )

  // Adicionar outros eventos conforme necessário
  // EventRegistry.register('QuestionCreatedEvent', QuestionCreatedEvent)
  // EventRegistry.register('AnswerDeletedEvent', AnswerDeletedEvent)
  // etc...
}

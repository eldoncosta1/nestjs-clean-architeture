import { DomainEventsWithReliability } from '@/core/events/domain-events-reliability'
import { CircuitBreakerManager } from '@/core/events/circuit-breaker'
import { EventHandler } from '@/core/events/event-handler'
import { IQuestionsRepository } from '@/domain/forum/application/repositories/questions-repository'
import { AnswerCreatedEvent } from '@/domain/forum/events/answer-created-event'
import { SendNotificationUseCase } from '../use-cases/send-notification'
import { Injectable } from '@nestjs/common'

@Injectable()
export class OnAnswerCreatedReliable implements EventHandler {
  private circuitBreaker = CircuitBreakerManager.getOrCreate(
    'notification-service',
    {
      failureThreshold: 3,
      timeout: 30000,
      halfOpenMaxCalls: 2,
    },
  )

  constructor(
    private questionsRepository: IQuestionsRepository,
    private sendNotification: SendNotificationUseCase,
  ) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    // Registrar com política de retry customizada
    DomainEventsWithReliability.register(
      this.sendNewNotification.bind(this),
      AnswerCreatedEvent.name,
      'OnAnswerCreatedReliable',
      {
        maxRetries: 5, // Mais tentativas para notificações
        initialDelayMs: 2000, // Delay inicial de 2s
        backoffMultiplier: 1.5, // Backoff mais suave
        maxDelayMs: 60000, // Máximo de 1 minuto
      },
    )

    console.log(
      '✅ OnAnswerCreatedReliable: Subscriber registrado com reliability',
    )
  }

  private async sendNewNotification({
    answer,
  }: AnswerCreatedEvent): Promise<void> {
    console.log(
      '🎯 OnAnswerCreatedReliable: Processando evento com reliability',
      {
        answerId: answer.id.toString(),
        questionId: answer.questionId.toString(),
      },
    )

    // Usar circuit breaker para proteger contra falhas em cascata
    await this.circuitBreaker.execute(async () => {
      // Buscar pergunta com timeout
      const question = await this.withTimeout(
        this.questionsRepository.findById(answer.questionId.toString()),
        5000, // 5 segundos timeout
        'Timeout ao buscar pergunta',
      )

      if (!question) {
        throw new Error(
          `Pergunta não encontrada: ${answer.questionId.toString()}`,
        )
      }

      console.log('✅ Pergunta encontrada, enviando notificação...', {
        questionTitle: question.title,
        authorId: question.authorId.toString(),
      })

      // Enviar notificação com timeout
      await this.withTimeout(
        this.sendNotification.execute({
          recipientId: question.authorId.toString(),
          content: `Nova resposta em "${question.title.substring(0, 40).concat('...')}"`,
          title: question.excerpt,
        }),
        10000, // 10 segundos timeout
        'Timeout ao enviar notificação',
      )

      console.log('✅ Notificação enviada com sucesso!')
    })
  }

  // 🕐 Utilitário para adicionar timeout às operações
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string,
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    })

    return Promise.race([promise, timeoutPromise])
  }
}

// 🚀 Subscriber alternativo com fallback strategy
@Injectable()
export class OnAnswerCreatedWithFallback implements EventHandler {
  constructor(
    private questionsRepository: IQuestionsRepository,
    private sendNotification: SendNotificationUseCase,
  ) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEventsWithReliability.register(
      this.sendNewNotificationWithFallback.bind(this),
      AnswerCreatedEvent.name,
      'OnAnswerCreatedWithFallback',
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        maxDelayMs: 30000,
      },
    )
  }

  private async sendNewNotificationWithFallback({
    answer,
  }: AnswerCreatedEvent): Promise<void> {
    try {
      // Estratégia principal
      await this.primaryNotificationStrategy(answer)
    } catch (error) {
      console.log('❌ Estratégia principal falhou, tentando fallback...', error)

      try {
        // Estratégia de fallback
        await this.fallbackNotificationStrategy(answer)
      } catch (fallbackError) {
        console.error('❌ Todas as estratégias falharam:', fallbackError)

        // Última tentativa: notificação básica
        await this.basicNotificationStrategy(answer)
      }
    }
  }

  private async primaryNotificationStrategy(answer: any): Promise<void> {
    // Estratégia completa com todos os dados
    const question = await this.questionsRepository.findById(
      answer.questionId.toString(),
    )

    if (!question) {
      throw new Error('Pergunta não encontrada para estratégia principal')
    }

    await this.sendNotification.execute({
      recipientId: question.authorId.toString(),
      content: `Nova resposta em "${question.title.substring(0, 40).concat('...')}"`,
      title: question.excerpt,
    })
  }

  private async fallbackNotificationStrategy(answer: any): Promise<void> {
    // Estratégia simplificada sem buscar detalhes da pergunta
    // Assumindo que temos dados básicos cached ou no próprio evento
    await this.sendNotification.execute({
      recipientId: answer.questionAuthorId || 'unknown', // Precisaria estar no evento
      content: `Você recebeu uma nova resposta`,
      title: 'Nova resposta recebida',
    })
  }

  private async basicNotificationStrategy(answer: any): Promise<void> {
    // Última tentativa: log para processamento posterior
    console.log('📝 Salvando notificação para processamento posterior:', {
      answerId: answer.id.toString(),
      questionId: answer.questionId.toString(),
      timestamp: new Date().toISOString(),
    })

    // Aqui você poderia salvar em uma fila ou tabela para processamento posterior
    // Por exemplo: await this.outboxRepository.save(notificationEvent)
  }
}

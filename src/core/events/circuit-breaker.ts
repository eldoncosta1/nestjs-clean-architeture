// 🔌 Circuit Breaker para proteção contra falhas em cascata
export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing fast
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number // Número de falhas para abrir o circuito
  timeout: number // Tempo em ms para tentar fechar novamente
  monitoringPeriod: number // Período de monitoramento em ms
  halfOpenMaxCalls: number // Máximo de chamadas no estado HALF_OPEN
}

export interface CircuitBreakerStats {
  state: CircuitState
  failures: number
  successes: number
  lastFailureTime?: Date
  lastSuccessTime?: Date
  nextAttemptTime?: Date
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failures = 0
  private successes = 0
  private lastFailureTime?: Date
  private lastSuccessTime?: Date
  private nextAttemptTime?: Date
  private halfOpenCalls = 0

  constructor(
    private config: CircuitBreakerConfig,
    private name: string,
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN
        this.halfOpenCalls = 0
        console.log(`🔌 Circuit Breaker ${this.name}: Mudando para HALF_OPEN`)
      } else {
        throw new Error(
          `Circuit Breaker ${this.name} está OPEN. Próxima tentativa em: ${this.nextAttemptTime}`,
        )
      }
    }

    if (
      this.state === CircuitState.HALF_OPEN &&
      this.halfOpenCalls >= this.config.halfOpenMaxCalls
    ) {
      throw new Error(
        `Circuit Breaker ${this.name}: Máximo de tentativas HALF_OPEN atingido`,
      )
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.successes++
    this.lastSuccessTime = new Date()

    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenCalls++
      // Se conseguiu algumas chamadas bem-sucedidas, feche o circuito
      if (this.halfOpenCalls >= 3) {
        this.reset()
        console.log(
          `🔌 Circuit Breaker ${this.name}: Fechando circuito após recuperação`,
        )
      }
    } else {
      this.failures = 0 // Reset failures on success
    }
  }

  private onFailure() {
    this.failures++
    this.lastFailureTime = new Date()

    if (this.state === CircuitState.HALF_OPEN) {
      this.trip()
      console.log(
        `🔌 Circuit Breaker ${this.name}: Falha no HALF_OPEN, voltando para OPEN`,
      )
    } else if (this.failures >= this.config.failureThreshold) {
      this.trip()
      console.log(
        `🔌 Circuit Breaker ${this.name}: Abrindo circuito após ${this.failures} falhas`,
      )
    }
  }

  private trip() {
    this.state = CircuitState.OPEN
    this.nextAttemptTime = new Date(Date.now() + this.config.timeout)
  }

  private reset() {
    this.state = CircuitState.CLOSED
    this.failures = 0
    this.halfOpenCalls = 0
    this.nextAttemptTime = undefined
  }

  private shouldAttemptReset(): boolean {
    return this.nextAttemptTime
      ? Date.now() >= this.nextAttemptTime.getTime()
      : false
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime,
    }
  }

  // Força o reset do circuit breaker (para casos especiais)
  forceReset() {
    console.log(`🔌 Circuit Breaker ${this.name}: Reset forçado`)
    this.reset()
  }
}

// 🏭 Factory para gerenciar múltiplos circuit breakers
export class CircuitBreakerManager {
  private static circuitBreakers = new Map<string, CircuitBreaker>()

  private static defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    timeout: 30000, // 30 segundos
    monitoringPeriod: 60000, // 1 minuto
    halfOpenMaxCalls: 3,
  }

  static getOrCreate(
    name: string,
    config: Partial<CircuitBreakerConfig> = {},
  ): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      const fullConfig = { ...this.defaultConfig, ...config }
      this.circuitBreakers.set(name, new CircuitBreaker(fullConfig, name))
      console.log(`🔌 Circuit Breaker criado: ${name}`, fullConfig)
    }

    return this.circuitBreakers.get(name)!
  }

  static getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {}

    this.circuitBreakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats()
    })

    return stats
  }

  static resetAll() {
    this.circuitBreakers.forEach((breaker) => breaker.forceReset())
  }
}

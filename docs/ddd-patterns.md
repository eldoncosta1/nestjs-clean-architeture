# 📐 Padrões DDD Implementados

## 🎯 Introdução

Este documento detalha os padrões do Domain-Driven Design (DDD) implementados em nosso projeto, com exemplos práticos de código. Cada padrão é explicado de forma acessível para que todos os membros da equipe possam compreender sua importância e aplicação.

---

## 🏗️ 1. Entity (Entidade)

### 📝 O que é?
Uma **Entidade** representa um objeto do domínio que possui identidade única e ciclo de vida próprio. Duas entidades são consideradas iguais apenas se possuem o mesmo identificador, independentemente de seus outros atributos.

### 🎯 Por que usar?
- Garante identidade única para objetos importantes do negócio
- Facilita o rastreamento de objetos ao longo do tempo
- Torna o código mais expressivo e próximo ao domínio

### 💻 Implementação no Projeto

```typescript
// src/core/entities/entity.ts
export abstract class Entity<Props> {
  private _id: UniqueEntityID
  protected props: Props

  get id() {
    return this._id
  }

  protected constructor(props: Props, id?: UniqueEntityID) {
    this.props = props
    this._id = id ?? new UniqueEntityID(id)
  }

  public equals(entity: Entity<unknown>) {
    if (entity === this) return true
    if (entity.id === this._id) return true
    return false
  }
}
```

### 🏷️ Exemplo Prático - Entidade Student
```typescript
// src/domain/forum/enterprise/entities/student.ts
export class Student extends Entity<StudentProps> {
  get name() {
    return this.props.name
  }

  get email() {
    return this.props.email
  }

  // Dois estudantes são iguais se têm o mesmo ID,
  // mesmo que tenham nomes ou emails diferentes
  static create(props: StudentProps, id?: UniqueEntityID) {
    const student = new Student(props, id)
    return student
  }
}
```

---

## 🏛️ 2. Aggregate Root (Raiz do Agregado)

### 📝 O que é?
Um **Aggregate Root** é uma entidade especial que serve como ponto de entrada para um cluster de objetos relacionados (o agregado). Ele garante a consistência das regras de negócio e controla o acesso aos objetos internos do agregado.

### 🎯 Por que usar?
- Mantém a consistência das regras de negócio
- Controla quando e como os eventos de domínio são disparados
- Simplifica o design ao ter um único ponto de entrada

### 💻 Implementação no Projeto

```typescript
// src/core/entities/aggregate-root.ts
export abstract class AggregateRoot<Props> extends Entity<Props> {
  private _domainEvents: DomainEvent[] = []

  get domainEvents(): DomainEvent[] {
    return this._domainEvents
  }

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent)
    DomainEvents.markAggregateForDispatch(this)
  }

  public clearEvents() {
    this._domainEvents = []
  }
}
```

### 🏷️ Exemplo Prático - Question como Aggregate Root
```typescript
// src/domain/forum/enterprise/entities/question.ts
export class Question extends AggregateRoot<QuestionProps> {
  // Quando uma melhor resposta é escolhida, dispara um evento
  set bestAnswerId(bestAnswerId: UniqueEntityID | null | undefined) {
    if (bestAnswerId === undefined) return

    if (bestAnswerId && !this.props.bestAnswerId?.equals(bestAnswerId)) {
      // 🎯 Aqui o agregado dispara um evento de domínio
      this.addDomainEvent(new QuestionBestAnswerChosenEvent(this, bestAnswerId))
    }

    this.props.bestAnswerId = bestAnswerId
    this.touch()
  }

  static create(props: Optional<QuestionProps, 'createdAt' | 'slug' | 'attachments'>, id?: UniqueEntityID) {
    const question = new Question({
      ...props,
      slug: props.slug ?? Slug.createFromText(props.title),
      attachments: props.attachments ?? new QuestionAttachmentList(),
      createdAt: props.createdAt ?? new Date(),
    }, id)

    return question
  }
}
```

---

## 🏪 3. Repository Pattern (Padrão Repositório)

### 📝 O que é?
O **Repository** é um padrão que encapsula a lógica de acesso a dados, fornecendo uma interface orientada a objetos para acessar agregados. Ele atua como uma "coleção em memória" de objetos do domínio.

### 🎯 Por que usar?
- Separa a lógica de negócio da lógica de persistência
- Facilita testes com implementações em memória
- Permite trocar a tecnologia de banco de dados sem afetar o domínio

### 💻 Implementação no Projeto

#### Interface do Repositório (Domínio)
```typescript
// src/domain/forum/application/repositories/questions-repository.ts
export abstract class IQuestionsRepository {
  abstract findById(id: string): Promise<Question | null>
  abstract findBySlug(slug: string): Promise<Question | null>
  abstract findManyRecent(params: PaginationParams): Promise<Question[]>
  abstract save(question: Question): Promise<Question>
  abstract create(question: Question): Promise<void>
  abstract delete(question: Question): Promise<void>
}
```

#### Implementação Concreta (Infraestrutura)
```typescript
// src/infra/database/prisma/repositories/prisma-questions-repository.ts
@Injectable()
export class PrismaQuestionsRepository implements IQuestionsRepository {
  constructor(
    private prisma: PrismaService,
    private questionAttachmentsRepository: IQuestionAttachmentsRepository,
  ) {}

  async findById(id: string): Promise<Question | null> {
    const question = await this.prisma.question.findUnique({
      where: { id },
    })

    return question ? PrismaQuestionMapper.toDomain(question) : null
  }

  async create(question: Question): Promise<void> {
    const prismaQuestion = PrismaQuestionMapper.toPersistence(question)

    await this.prisma.question.create({
      data: prismaQuestion,
    })

    // Gerencia anexos relacionados
    await this.questionAttachmentsRepository.createMany(
      question.attachments.getItems(),
    )
  }
}
```

---

## 🎯 4. Use Case (Caso de Uso)

### 📝 O que é?
Um **Use Case** representa uma ação específica que um usuário pode realizar no sistema. Ele orquestra a interação entre entidades, repositórios e outros serviços para executar uma regra de negócio.

### 🎯 Por que usar?
- Expressa claramente as intenções do usuário
- Centraliza a lógica de uma operação específica
- Facilita testes e manutenção
- Torna o código autodocumentado

### 💻 Implementação no Projeto

```typescript
// src/domain/forum/application/use-cases/create-question.ts
@Injectable()
export class CreateQuestionUseCase {
  constructor(private questionsRepository: IQuestionsRepository) {}

  async execute({
    authorId,
    content,
    title,
    attachmentsIds,
  }: CreateQuestionUseCaseRequest): Promise<CreateQuestionUseCaseResponse> {
    // 1. Cria a entidade Question
    const question = Question.create({
      authorId: new UniqueEntityID(authorId),
      title,
      content,
    })

    // 2. Processa anexos se existirem
    const questionAttachments = attachmentsIds.map((attachmentId) => {
      return QuestionAttachment.create({
        attachmentId: new UniqueEntityID(attachmentId),
        questionId: question.id,
      })
    })

    question.attachments = new QuestionAttachmentList(questionAttachments)

    // 3. Persiste através do repositório
    await this.questionsRepository.create(question)

    // 4. Retorna resultado tipado
    return {
      success: true,
      value: { question },
    }
  }
}
```

---

## 🏷️ 5. Value Object (Objeto de Valor)

### 📝 O que é?
Um **Value Object** é um objeto que representa um valor ou conceito do domínio, mas não possui identidade própria. Dois value objects são iguais se todos os seus atributos são iguais.

### 🎯 Por que usar?
- Torna conceitos do domínio mais explícitos
- Garantem validação e formatação consistente
- São imutáveis por natureza
- Reduzem erros relacionados a tipos primitivos

### 💻 Implementação no Projeto

```typescript
// src/domain/forum/enterprise/entities/value-objects/slug.ts
export class Slug {
  public value: string

  private constructor(value: string) {
    this.value = value
  }

  static create(slug: string) {
    return new Slug(slug)
  }

  /**
   * Recebe uma string e normaliza como um slug
   * 
   * Exemplo: "Uma pergunta interessante" => "uma-pergunta-interessante"
   */
  static createFromText(text: string) {
    const slugText = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim()

    return new Slug(slugText)
  }
}
```

### 🏷️ Exemplo de Uso
```typescript
// Antes (usando string primitiva - propenso a erros)
const questionTitle = "Uma Pergunta Interessante!"
const questionSlug = "uma-pergunta-interessante" // 😰 Pode estar inconsistente

// Depois (usando Value Object - sempre consistente)
const questionTitle = "Uma Pergunta Interessante!"
const questionSlug = Slug.createFromText(questionTitle) // 😎 Sempre correto
console.log(questionSlug.value) // "uma-pergunta-interessante"
```

---

## 📊 6. Result Pattern (Padrão de Resultado)

### 📝 O que é?
O **Result Pattern** é uma forma de lidar com operações que podem falhar sem usar exceptions. Ele força o código cliente a lidar explicitamente com cenários de sucesso e erro.

### 🎯 Por que usar?
- Torna o tratamento de erros explícito
- Evita exceptions não capturadas
- Melhora a previsibilidade do código
- Facilita testes de cenários de erro

### 💻 Implementação no Projeto

```typescript
// src/core/result.ts
export type ResultError<E> = { success: false; error: E }
export type ResultSuccess<T> = { success: true; value: T }
export type Result<T, E> = ResultSuccess<T> | ResultError<E>

export const ResultError = <T, E>(error: E): Result<T, E> => {
  return {
    success: false,
    error,
  }
}

export const ResultSuccess = <T, E>(value: T): Result<T, E> => {
  return {
    success: true,
    value,
  }
}
```

### 🏷️ Exemplo de Uso em Use Case
```typescript
// Retorno tipado que força verificação de erro
type AuthenticateStudentResponse = Result<
  {
    accessToken: string
  },
  WrongCredentialsError
>

export class AuthenticateStudentUseCase {
  async execute({ email, password }: AuthenticateStudentRequest): Promise<AuthenticateStudentResponse> {
    const student = await this.studentsRepository.findByEmail(email)

    if (!student) {
      return ResultError(new WrongCredentialsError()) // 🚫 Erro explícito
    }

    const isPasswordValid = await this.hashComparer.compare(password, student.password)

    if (!isPasswordValid) {
      return ResultError(new WrongCredentialsError()) // 🚫 Erro explícito
    }

    const accessToken = await this.encrypter.encrypt({ sub: student.id.toString() })

    return ResultSuccess({ accessToken }) // ✅ Sucesso explícito
  }
}
```

---

## 🎭 7. Watched List Pattern

### 📝 O que é?
O **Watched List** é um padrão que monitora mudanças em listas de objetos, mantendo controle sobre itens adicionados, removidos e atuais.

### 🎯 Por que usar?
- Otimiza operações de persistência (apenas salva o que mudou)
- Mantém histórico de mudanças
- Facilita sincronização com banco de dados

### 💻 Implementação no Projeto

```typescript
// src/core/entities/watched-list.ts
export abstract class WatchedList<T> {
  public currentItems: T[]
  private initial: T[]
  private new: T[]
  private removed: T[]

  constructor(initialItems?: T[]) {
    this.currentItems = initialItems || []
    this.initial = initialItems || []
    this.new = []
    this.removed = []
  }

  public getItems(): T[] {
    return this.currentItems
  }

  public getNewItems(): T[] {
    return this.new
  }

  public getRemovedItems(): T[] {
    return this.removed
  }

  public add(item: T): void {
    if (this.isCurrentItem(item)) {
      return
    }

    if (this.isNewItem(item)) {
      return
    }

    if (this.isRemovedItem(item)) {
      this.removeFromRemoved(item)
    }

    this.new.push(item)
    this.currentItems.push(item)
  }

  public remove(item: T): void {
    this.removeFromCurrent(item)

    if (this.isNewItem(item)) {
      this.removeFromNew(item)
      return
    }

    this.removed.push(item)
  }
}
```

### 🏷️ Exemplo Prático - Lista de Anexos
```typescript
// src/domain/forum/enterprise/entities/question-attachment-list.ts
export class QuestionAttachmentList extends WatchedList<QuestionAttachment> {
  compareItems(a: QuestionAttachment, b: QuestionAttachment): boolean {
    return a.id.equals(b.id)
  }
}

// Uso no repositório
async save(question: Question): Promise<Question> {
  // Apenas cria anexos novos
  await this.questionAttachmentsRepository.createMany(
    question.attachments.getNewItems()
  )

  // Apenas remove anexos removidos
  await this.questionAttachmentsRepository.deleteMany(
    question.attachments.getRemovedItems()
  )
}
```

---

## 🏆 Benefícios dos Padrões DDD

### ✅ Para a Equipe de Desenvolvimento
1. **Código Expressivo**: O código reflete a linguagem do negócio
2. **Fácil Manutenção**: Cada padrão tem responsabilidade clara
3. **Testabilidade**: Padrões facilitam criação de testes
4. **Evolução**: Facilita adição de novas funcionalidades

### ✅ Para o Negócio
1. **Flexibilidade**: Regras podem evoluir sem afetar outras partes
2. **Confiabilidade**: Padrões reduzem bugs e inconsistências
3. **Velocidade de Entrega**: Estrutura clara acelera desenvolvimento
4. **Documentação Viva**: O código serve como documentação do negócio

---

## 📚 Próximos Passos

Para aprofundar seu conhecimento sobre os padrões implementados, consulte:

- [🎯 Princípios SOLID](./solid-principles.md)
- [⚡ Domain Events](./domain-events.md)
- [📖 Documentação Principal](./README.md)

---

*Esta documentação é atualizada conforme novos padrões são implementados no projeto.*

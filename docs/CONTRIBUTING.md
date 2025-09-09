# 🤝 Guia de Contribuição

## 🎯 Visão Geral

Este guia ajuda desenvolvedores e outros membros da equipe a contribuir efetivamente com o projeto, seguindo os padrões de Domain-Driven Design e Event-Driven Architecture implementados.

---

## 📋 Checklist para Novas Funcionalidades

### ✅ Antes de Começar
- [ ] Li e entendi os [padrões DDD](./ddd-patterns.md) do projeto
- [ ] Revisei os [princípios SOLID](./solid-principles.md) aplicados
- [ ] Compreendi como funcionam os [Domain Events](./domain-events.md)
- [ ] Identifiquei em qual **Bounded Context** a funcionalidade se encaixa

### ✅ Durante o Desenvolvimento

#### 🏗️ Estrutura e Organização
- [ ] Criei entidades na pasta correta (`src/domain/{context}/enterprise/entities/`)
- [ ] Implementei use cases em (`src/domain/{context}/application/use-cases/`)
- [ ] Defini interfaces de repositório no domínio
- [ ] Implementei repositórios na infraestrutura

#### 🎯 Padrões DDD
- [ ] Entidades herdam de `Entity` ou `AggregateRoot` conforme apropriado
- [ ] Use cases retornam `Result<T, E>` para tratamento explícito de erros
- [ ] Repositórios implementam interfaces definidas no domínio
- [ ] Value Objects são imutáveis e têm validação interna

#### ⚡ Domain Events
- [ ] Identifiquei eventos importantes do domínio
- [ ] Criei classes de evento que implementam `DomainEvent`
- [ ] Eventos são disparados nos aggregate roots apropriados
- [ ] Implementei subscribers quando necessário

#### 🧪 Testes
- [ ] Criei testes unitários para entidades e value objects
- [ ] Testei use cases com repositórios in-memory
- [ ] Verifiquei que events são disparados corretamente
- [ ] Testei cenários de erro e sucesso

---

## 🏗️ Criando uma Nova Funcionalidade

### 1️⃣ Definindo o Domínio

```typescript
// 1. Crie a entidade
// src/domain/forum/enterprise/entities/comment.ts
export class Comment extends Entity<CommentProps> {
  get content() {
    return this.props.content
  }

  get authorId() {
    return this.props.authorId
  }

  // Método factory
  static create(props: CommentProps, id?: UniqueEntityID) {
    const comment = new Comment(props, id)
    return comment
  }
}
```

### 2️⃣ Criando o Use Case

```typescript
// 2. Implemente o use case
// src/domain/forum/application/use-cases/create-comment.ts
@Injectable()
export class CreateCommentUseCase {
  constructor(private commentsRepository: ICommentsRepository) {}

  async execute(request: CreateCommentRequest): Promise<CreateCommentResponse> {
    const comment = Comment.create({
      content: request.content,
      authorId: new UniqueEntityID(request.authorId),
      postId: new UniqueEntityID(request.postId),
    })

    await this.commentsRepository.create(comment)

    return ResultSuccess({ comment })
  }
}
```

### 3️⃣ Definindo o Repositório

```typescript
// 3. Defina a interface do repositório (domínio)
// src/domain/forum/application/repositories/comments-repository.ts
export abstract class ICommentsRepository {
  abstract findById(id: string): Promise<Comment | null>
  abstract create(comment: Comment): Promise<void>
  abstract delete(comment: Comment): Promise<void>
}
```

### 4️⃣ Implementando a Infraestrutura

```typescript
// 4. Implemente o repositório (infraestrutura)
// src/infra/database/prisma/repositories/prisma-comments-repository.ts
@Injectable()
export class PrismaCommentsRepository implements ICommentsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Comment | null> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    })

    return comment ? PrismaCommentMapper.toDomain(comment) : null
  }

  async create(comment: Comment): Promise<void> {
    const prismaComment = PrismaCommentMapper.toPersistence(comment)
    await this.prisma.comment.create({ data: prismaComment })
  }

  async delete(comment: Comment): Promise<void> {
    await this.prisma.comment.delete({
      where: { id: comment.id.toString() },
    })
  }
}
```

### 5️⃣ Criando o Controller

```typescript
// 5. Crie o controller (infraestrutura)
// src/infra/http/controllers/create-comment.controller.ts
@Controller('/comments')
export class CreateCommentController {
  constructor(private createComment: CreateCommentUseCase) {}

  @Post()
  async handle(
    @Body(bodyValidationPipe) body: CreateCommentBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { content, postId } = body

    const result = await this.createComment.execute({
      content,
      postId,
      authorId: user.sub,
    })

    if (isError(result)) {
      throw new BadRequestException()
    }
  }
}
```

---

## ⚡ Adicionando Domain Events

### 1️⃣ Criando o Evento

```typescript
// src/domain/forum/events/comment-created-event.ts
export class CommentCreatedEvent implements DomainEvent {
  public ocurredAt: Date
  public comment: Comment

  constructor(comment: Comment) {
    this.comment = comment
    this.ocurredAt = new Date()
  }

  getAggregateId(): UniqueEntityID {
    return this.comment.id
  }
}
```

### 2️⃣ Disparando o Evento

```typescript
// Modifique a entidade para disparar o evento
export class Comment extends AggregateRoot<CommentProps> {
  static create(props: CommentProps, id?: UniqueEntityID) {
    const comment = new Comment(props, id)

    const isNewComment = !id
    if (isNewComment) {
      comment.addDomainEvent(new CommentCreatedEvent(comment))
    }

    return comment
  }
}
```

### 3️⃣ Criando o Subscriber

```typescript
// src/domain/notification/application/subscribers/on-comment-created.ts
export class OnCommentCreated implements EventHandler {
  constructor(
    private postsRepository: IPostsRepository,
    private sendNotification: SendNotificationUseCase,
  ) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.sendCommentNotification.bind(this),
      CommentCreatedEvent.name,
    )
  }

  private async sendCommentNotification({ comment }: CommentCreatedEvent) {
    const post = await this.postsRepository.findById(
      comment.postId.toString(),
    )

    if (post) {
      await this.sendNotification.execute({
        recipientId: post.authorId.toString(),
        title: 'Novo comentário',
        content: `Alguém comentou no seu post: "${post.title}"`,
      })
    }
  }
}
```

---

## 🧪 Padrões de Teste

### ✅ Teste de Entidade
```typescript
// comment.spec.ts
describe('Comment', () => {
  it('should create comment with correct properties', () => {
    const comment = Comment.create({
      content: 'Test comment',
      authorId: new UniqueEntityID('author-1'),
      postId: new UniqueEntityID('post-1'),
    })

    expect(comment.content).toEqual('Test comment')
    expect(comment.authorId.toString()).toEqual('author-1')
  })

  it('should trigger CommentCreatedEvent when created', () => {
    const comment = Comment.create({
      content: 'Test comment',
      authorId: new UniqueEntityID('author-1'),
      postId: new UniqueEntityID('post-1'),
    })

    expect(comment.domainEvents).toHaveLength(1)
    expect(comment.domainEvents[0]).toBeInstanceOf(CommentCreatedEvent)
  })
})
```

### ✅ Teste de Use Case
```typescript
// create-comment.spec.ts
describe('CreateCommentUseCase', () => {
  let useCase: CreateCommentUseCase
  let commentsRepository: InMemoryCommentsRepository

  beforeEach(() => {
    commentsRepository = new InMemoryCommentsRepository()
    useCase = new CreateCommentUseCase(commentsRepository)
  })

  it('should create a comment', async () => {
    const result = await useCase.execute({
      content: 'Test comment',
      authorId: 'author-1',
      postId: 'post-1',
    })

    expect(result.success).toBe(true)
    expect(commentsRepository.items).toHaveLength(1)
    expect(commentsRepository.items[0].content).toEqual('Test comment')
  })
})
```

### ✅ Teste de Event Subscriber
```typescript
// on-comment-created.spec.ts
describe('OnCommentCreated', () => {
  let sendNotificationUseCase: SendNotificationUseCase
  let postsRepository: InMemoryPostsRepository
  let notificationsRepository: InMemoryNotificationsRepository

  beforeEach(() => {
    postsRepository = new InMemoryPostsRepository()
    notificationsRepository = new InMemoryNotificationsRepository()
    sendNotificationUseCase = new SendNotificationUseCase(notificationsRepository)

    new OnCommentCreated(postsRepository, sendNotificationUseCase)
  })

  it('should send notification when comment is created', async () => {
    const post = makePost()
    const comment = makeComment({ postId: post.id })

    postsRepository.items.push(post)

    DomainEvents.dispatchEventsForAggregate(comment.id)

    await waitFor(() => {
      expect(notificationsRepository.items).toHaveLength(1)
    })
  })
})
```

---

## 🎯 Convenções de Nomenclatura

### 📁 Estrutura de Pastas
```
src/
├── core/                    # Elementos base reutilizáveis
├── domain/
│   ├── {context}/          # Bounded Context (ex: forum, notification)
│   │   ├── application/    # Casos de uso e contratos
│   │   ├── enterprise/     # Entidades e regras de negócio
│   │   └── events/         # Eventos do domínio
│   └── ...
└── infra/                  # Implementações e adaptadores
    ├── database/
    ├── http/
    └── ...
```

### 🏷️ Nomenclatura de Arquivos
- **Entidades**: `kebab-case.ts` (ex: `question-attachment.ts`)
- **Use Cases**: `kebab-case.ts` (ex: `create-question.ts`)
- **Events**: `kebab-case-event.ts` (ex: `answer-created-event.ts`)
- **Repositories**: `kebab-case-repository.ts` (ex: `questions-repository.ts`)
- **Controllers**: `kebab-case.controller.ts` (ex: `create-question.controller.ts`)

### 🎭 Nomenclatura de Classes
- **Entidades**: `PascalCase` (ex: `Question`, `Answer`)
- **Use Cases**: `PascalCaseUseCase` (ex: `CreateQuestionUseCase`)
- **Events**: `PascalCaseEvent` (ex: `AnswerCreatedEvent`)
- **Repositories Interface**: `IPascalCaseRepository` (ex: `IQuestionsRepository`)
- **Repositories Impl**: `ProviderPascalCaseRepository` (ex: `PrismaQuestionsRepository`)

---

## 🚫 Erros Comuns a Evitar

### ❌ Vazamento de Infraestrutura no Domínio
```typescript
// ❌ RUIM - Importando Prisma no domínio
import { PrismaService } from '@/infra/database/prisma.service'

export class CreateQuestionUseCase {
  constructor(private prisma: PrismaService) {} // ❌ Domínio não deve conhecer Prisma
}

// ✅ BOM - Usando abstração
export class CreateQuestionUseCase {
  constructor(private questionsRepository: IQuestionsRepository) {} // ✅ Interface do domínio
}
```

### ❌ Use Cases Muito Granulares
```typescript
// ❌ RUIM - Use cases muito específicos
export class SetQuestionTitleUseCase {}
export class SetQuestionContentUseCase {}
export class SetQuestionAttachmentsUseCase {}

// ✅ BOM - Use case que representa intenção do usuário
export class EditQuestionUseCase {}
```

### ❌ Eventos Técnicos em vez de Domínio
```typescript
// ❌ RUIM - Evento técnico
export class DatabaseRecordCreatedEvent {}

// ✅ BOM - Evento de domínio
export class QuestionCreatedEvent {}
```

---

## 📝 Template para Pull Requests

```markdown
## 🎯 Descrição
Breve descrição da funcionalidade ou correção implementada.

## 📋 Checklist DDD
- [ ] Entidades seguem padrões do domínio
- [ ] Use cases retornam Result<T, E>
- [ ] Interfaces de repositório estão no domínio
- [ ] Implementações estão na infraestrutura
- [ ] Events de domínio foram identificados e implementados
- [ ] Testes unitários foram criados

## 🧪 Como Testar
1. Execute os testes: `npm test`
2. Teste a funcionalidade: [descrever passos]

## 📸 Screenshots (se aplicável)
[Adicionar capturas de tela se houver interface]

## 🔗 Issues Relacionadas
Closes #[número da issue]
```

---

## 🆘 Precisa de Ajuda?

### 📚 Documentação
- [📖 Visão Geral do Projeto](./README.md)
- [📐 Padrões DDD](./ddd-patterns.md)
- [🎯 Princípios SOLID](./solid-principles.md)
- [⚡ Domain Events](./domain-events.md)

### 💬 Dúvidas Frequentes

**Q: Como sei se devo criar um novo Bounded Context?**
R: Se as entidades e regras não se relacionam diretamente com os contextos existentes (forum, notification), considere um novo contexto.

**Q: Quando usar Entity vs AggregateRoot?**
R: Use AggregateRoot quando a entidade puder disparar domain events ou controlar outras entidades.

**Q: Preciso sempre criar events?**
R: Crie events para ações importantes do domínio que outros contextos precisam saber.

---

*Este guia é atualizado conforme o projeto evolui. Contribuições são bem-vindas!*

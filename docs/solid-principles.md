# 🎯 Princípios SOLID no Projeto

## 🎯 Introdução

Os **Princípios SOLID** são cinco diretrizes fundamentais para escrever código limpo, mantível e extensível. Este documento mostra como cada princípio é aplicado em nosso projeto, com exemplos práticos que qualquer membro da equipe pode compreender.

**SOLID** é um acrônimo que representa:
- **S** - Single Responsibility Principle (Princípio da Responsabilidade Única)
- **O** - Open/Closed Principle (Princípio Aberto/Fechado)
- **L** - Liskov Substitution Principle (Princípio da Substituição de Liskov)
- **I** - Interface Segregation Principle (Princípio da Segregação de Interfaces)
- **D** - Dependency Inversion Principle (Princípio da Inversão de Dependências)

---

## 1️⃣ Single Responsibility Principle (SRP)
### *"Uma classe deve ter apenas um motivo para mudar"*

### 📝 O que significa?
Cada classe, função ou módulo deve ter **apenas uma responsabilidade**. Isso significa que cada parte do código deve cuidar de apenas uma coisa específica.

### 🎯 Por que é importante?
- **Facilita manutenção**: Mudanças em uma funcionalidade não afetam outras
- **Reduz bugs**: Menos responsabilidades = menos pontos de falha
- **Melhora legibilidade**: Código mais focado e fácil de entender
- **Facilita testes**: Cada responsabilidade pode ser testada isoladamente

### 💻 Implementação no Projeto

#### ✅ BOM - Use Cases com Responsabilidade Única
```typescript
// src/domain/forum/application/use-cases/create-question.ts
@Injectable()
export class CreateQuestionUseCase {
  constructor(private questionsRepository: IQuestionsRepository) {}

  // 🎯 RESPONSABILIDADE ÚNICA: Apenas criar uma pergunta
  async execute(request: CreateQuestionUseCaseRequest): Promise<CreateQuestionUseCaseResponse> {
    const question = Question.create({
      authorId: new UniqueEntityID(request.authorId),
      title: request.title,
      content: request.content,
    })

    const questionAttachments = request.attachmentsIds.map((attachmentId) => {
      return QuestionAttachment.create({
        attachmentId: new UniqueEntityID(attachmentId),
        questionId: question.id,
      })
    })

    question.attachments = new QuestionAttachmentList(questionAttachments)
    await this.questionsRepository.create(question)

    return ResultSuccess({ question })
  }
}
```

#### ✅ BOM - Serviços Especializados
```typescript
// src/infra/cryptography/bcrypt-hasher.ts
@Injectable()
export class BcryptHasher implements HashGenerator, HashComparer {
  private HASH_SALT_LENGTH = 8

  // 🎯 RESPONSABILIDADE ÚNICA: Apenas hash de senhas
  async hash(plain: string): Promise<string> {
    return hash(plain, this.HASH_SALT_LENGTH)
  }

  // 🎯 RESPONSABILIDADE ÚNICA: Apenas comparação de hashes
  async compare(plain: string, hash: string): Promise<boolean> {
    return compare(plain, hash)
  }
}
```

#### ❌ RUIM - Múltiplas Responsabilidades (Exemplo do que NÃO fazer)
```typescript
// ❌ Esta classe viola SRP - faz muitas coisas
class QuestionManagerBad {
  // Responsabilidade 1: Criar questões
  async createQuestion(data: any) { /* ... */ }
  
  // Responsabilidade 2: Validar dados
  validateQuestionData(data: any) { /* ... */ }
  
  // Responsabilidade 3: Enviar emails
  sendEmailNotification(question: any) { /* ... */ }
  
  // Responsabilidade 4: Gerar relatórios
  generateQuestionReport() { /* ... */ }
  
  // Responsabilidade 5: Gerenciar cache
  cacheQuestion(question: any) { /* ... */ }
}
```

---

## 2️⃣ Open/Closed Principle (OCP)
### *"Entidades devem estar abertas para extensão, mas fechadas para modificação"*

### 📝 O que significa?
Você deve poder **adicionar novas funcionalidades** ao código sem **modificar** o código existente. Isso é feito através de abstrações (interfaces) e herança.

### 🎯 Por que é importante?
- **Evita regressões**: Não quebra funcionalidades existentes
- **Facilita evolução**: Novas features são adicionadas sem risco
- **Promove reutilização**: Código base permanece estável
- **Reduz tempo de teste**: Apenas novas funcionalidades precisam ser testadas

### 💻 Implementação no Projeto

#### ✅ BOM - Extensão através de Interfaces
```typescript
// src/domain/forum/application/cryptography/hash-generator.ts
export abstract class HashGenerator {
  abstract hash(plain: string): Promise<string>
}

// src/domain/forum/application/cryptography/hash-comparer.ts  
export abstract class HashComparer {
  abstract compare(plain: string, hash: string): Promise<boolean>
}

// Implementação com BCrypt (FECHADA para modificação)
@Injectable()
export class BcryptHasher implements HashGenerator, HashComparer {
  async hash(plain: string): Promise<string> {
    return hash(plain, 8)
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return compare(plain, hash)
  }
}

// 🚀 NOVA implementação (ABERTA para extensão) - sem modificar código existente
@Injectable()
export class ArgonHasher implements HashGenerator, HashComparer {
  async hash(plain: string): Promise<string> {
    // Nova implementação com Argon2
    return argon2.hash(plain)
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, plain)
  }
}
```

#### ✅ BOM - Novos Repositórios sem Modificar Existentes
```typescript
// Interface base (FECHADA para modificação)
export abstract class IQuestionsRepository {
  abstract findById(id: string): Promise<Question | null>
  abstract create(question: Question): Promise<void>
  // ... outros métodos
}

// Implementação Prisma (FECHADA para modificação)
export class PrismaQuestionsRepository implements IQuestionsRepository {
  // Implementação específica do Prisma
}

// 🚀 NOVA implementação MongoDB (ABERTA para extensão)
export class MongoQuestionsRepository implements IQuestionsRepository {
  // Nova implementação sem afetar Prisma
  async findById(id: string): Promise<Question | null> {
    // Lógica específica do MongoDB
  }

  async create(question: Question): Promise<void> {
    // Lógica específica do MongoDB
  }
}
```

---

## 3️⃣ Liskov Substitution Principle (LSP)
### *"Objetos de uma superclasse devem ser substituíveis por objetos de suas subclasses"*

### 📝 O que significa?
Se você tem uma classe base, qualquer classe filha deve poder **substituir a classe pai** sem quebrar a funcionalidade do programa.

### 🎯 Por que é importante?
- **Garante confiabilidade**: Substituições não quebram o sistema
- **Facilita polimorfismo**: Diferentes implementações funcionam igualmente
- **Melhora design**: Força hierarquias bem projetadas
- **Reduz surpresas**: Comportamento consistente entre implementações

### 💻 Implementação no Projeto

#### ✅ BOM - Substituição Correta de Repositórios
```typescript
// Classe base define contrato claro
export abstract class IAnswersRepository {
  abstract findById(id: string): Promise<Answer | null>
  abstract create(answer: Answer): Promise<void>
  abstract delete(answer: Answer): Promise<void>
}

// Implementação 1 - Prisma
export class PrismaAnswersRepository implements IAnswersRepository {
  async findById(id: string): Promise<Answer | null> {
    const answer = await this.prisma.answer.findUnique({ where: { id } })
    return answer ? PrismaAnswerMapper.toDomain(answer) : null
  }

  async create(answer: Answer): Promise<void> {
    const prismaAnswer = PrismaAnswerMapper.toPersistence(answer)
    await this.prisma.answer.create({ data: prismaAnswer })
  }

  async delete(answer: Answer): Promise<void> {
    await this.prisma.answer.delete({ where: { id: answer.id.toString() } })
  }
}

// Implementação 2 - InMemory (para testes)
export class InMemoryAnswersRepository implements IAnswersRepository {
  public items: Answer[] = []

  async findById(id: string): Promise<Answer | null> {
    const answer = this.items.find(item => item.id.toString() === id)
    return answer || null
  }

  async create(answer: Answer): Promise<void> {
    this.items.push(answer)
  }

  async delete(answer: Answer): Promise<void> {
    const itemIndex = this.items.findIndex(item => item.id.equals(answer.id))
    this.items.splice(itemIndex, 1)
  }
}

// 🎯 USO - Ambas as implementações podem ser usadas igualmente
class SomeService {
  constructor(private answersRepository: IAnswersRepository) {}

  async someMethod() {
    // 🚀 Funciona com QUALQUER implementação de IAnswersRepository
    const answer = await this.answersRepository.findById('123')
    // ...
  }
}
```

#### ✅ BOM - Entidades com Comportamento Consistente
```typescript
// Classe base Entity
export abstract class Entity<Props> {
  private _id: UniqueEntityID
  protected props: Props

  public equals(entity: Entity<unknown>) {
    if (entity === this) return true
    if (entity.id === this._id) return true
    return false
  }
}

// Subclasse Question
export class Question extends AggregateRoot<QuestionProps> {
  // 🎯 Mantém o contrato da classe pai
  // equals() funciona corretamente para Question
}

// Subclasse Answer  
export class Answer extends AggregateRoot<AnswerProps> {
  // 🎯 Mantém o contrato da classe pai
  // equals() funciona corretamente para Answer
}

// 🚀 USO - Qualquer Entity pode ser comparada
function compareEntities(entity1: Entity<any>, entity2: Entity<any>): boolean {
  return entity1.equals(entity2) // Funciona para Question, Answer, etc.
}
```

---

## 4️⃣ Interface Segregation Principle (ISP)
### *"Clientes não devem ser forçados a depender de interfaces que não usam"*

### 📝 O que significa?
É melhor ter **várias interfaces pequenas e específicas** do que uma interface grande que força as classes a implementar métodos que não precisam.

### 🎯 Por que é importante?
- **Reduz acoplamento**: Classes dependem apenas do que realmente usam
- **Facilita manutenção**: Mudanças em uma interface não afetam outras
- **Melhora flexibilidade**: Implementações podem ser mais focadas
- **Evita métodos vazios**: Não força implementação de métodos desnecessários

### 💻 Implementação no Projeto

#### ✅ BOM - Interfaces Segregadas
```typescript
// Em vez de uma interface gigante, temos interfaces específicas

// Interface específica para autenticação
export abstract class Encrypter {
  abstract encrypt(payload: Record<string, unknown>): Promise<string>
}

// Interface específica para hash
export abstract class HashGenerator {
  abstract hash(plain: string): Promise<string>
}

// Interface específica para comparação de hash
export abstract class HashComparer {
  abstract compare(plain: string, hash: string): Promise<boolean>
}

// Interface específica para upload
export abstract class Uploader {
  abstract upload(params: UploadParams): Promise<{ url: string }>
}
```

#### ✅ BOM - Implementações Focadas
```typescript
// Classe JWT - implementa APENAS o que precisa
@Injectable()
export class JwtEncrypter implements Encrypter {
  constructor(private jwtService: JwtService) {}

  // 🎯 Implementa APENAS criptografia JWT
  async encrypt(payload: Record<string, unknown>): Promise<string> {
    return this.jwtService.signAsync(payload)
  }
}

// Classe BCrypt - implementa APENAS o que precisa  
@Injectable()
export class BcryptHasher implements HashGenerator, HashComparer {
  private HASH_SALT_LENGTH = 8

  // 🎯 Implementa APENAS hash e comparação
  async hash(plain: string): Promise<string> {
    return hash(plain, this.HASH_SALT_LENGTH)
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return compare(plain, hash)
  }
}

// Classe R2Storage - implementa APENAS o que precisa
@Injectable()
export class R2Storage implements Uploader {
  // 🎯 Implementa APENAS upload para R2
  async upload({ fileName, fileType, body }: UploadParams): Promise<{ url: string }> {
    // Lógica específica do R2
  }
}
```

#### ❌ RUIM - Interface Monolítica (Exemplo do que NÃO fazer)
```typescript
// ❌ Interface muito grande - viola ISP
interface CryptographyServiceBad {
  // Métodos de JWT
  encryptJWT(payload: any): Promise<string>
  decryptJWT(token: string): Promise<any>
  
  // Métodos de Hash
  hashPassword(password: string): Promise<string>
  comparePassword(password: string, hash: string): Promise<boolean>
  
  // Métodos de Upload
  uploadFile(file: any): Promise<string>
  deleteFile(url: string): Promise<void>
  
  // Métodos de Email
  sendEmail(to: string, subject: string): Promise<void>
  
  // Métodos de SMS
  sendSMS(phone: string, message: string): Promise<void>
}

// ❌ Classes são forçadas a implementar métodos que não usam
class JwtEncrypterBad implements CryptographyServiceBad {
  encryptJWT(payload: any): Promise<string> { /* implementa */ }
  decryptJWT(token: string): Promise<any> { /* implementa */ }
  
  // 😰 Forçado a implementar métodos que não usa
  hashPassword(): Promise<string> { throw new Error('Not implemented') }
  comparePassword(): Promise<boolean> { throw new Error('Not implemented') }
  uploadFile(): Promise<string> { throw new Error('Not implemented') }
  deleteFile(): Promise<void> { throw new Error('Not implemented') }
  sendEmail(): Promise<void> { throw new Error('Not implemented') }
  sendSMS(): Promise<void> { throw new Error('Not implemented') }
}
```

---

## 5️⃣ Dependency Inversion Principle (DIP)
### *"Módulos de alto nível não devem depender de módulos de baixo nível. Ambos devem depender de abstrações"*

### 📝 O que significa?
As classes não devem depender de implementações concretas, mas sim de **interfaces (abstrações)**. Isso permite trocar implementações sem afetar o código que as usa.

### 🎯 Por que é importante?
- **Facilita testes**: Pode usar implementações mock/fake
- **Permite flexibilidade**: Troca implementações facilmente
- **Reduz acoplamento**: Classes não dependem de detalhes específicos
- **Melhora arquitetura**: Camadas superiores não dependem das inferiores

### 💻 Implementação no Projeto

#### ✅ BOM - Inversão de Dependências com Use Cases
```typescript
// ✅ Use Case depende de ABSTRAÇÃO, não de implementação concreta
@Injectable()
export class CreateQuestionUseCase {
  constructor(
    // 🎯 Depende da INTERFACE, não da implementação
    private questionsRepository: IQuestionsRepository
  ) {}

  async execute(request: CreateQuestionUseCaseRequest) {
    const question = Question.create({
      authorId: new UniqueEntityID(request.authorId),
      title: request.title,
      content: request.content,
    })

    // 🚀 Não sabe nem se importa se é Prisma, MongoDB, etc.
    await this.questionsRepository.create(question)

    return ResultSuccess({ question })
  }
}
```

#### ✅ BOM - Configuração de Dependências com NestJS
```typescript
// src/infra/database/database.module.ts
@Module({
  providers: [
    PrismaService,
    // 🎯 Configuração da injeção de dependência
    {
      provide: IQuestionsRepository,
      useClass: PrismaQuestionsRepository, // Implementação concreta
    },
    {
      provide: IAnswersRepository,
      useClass: PrismaAnswersRepository,
    },
    {
      provide: IStudentsRepository,
      useClass: PrismaStudentsRepository,
    },
  ],
  exports: [
    PrismaService,
    IQuestionsRepository,
    IAnswersRepository,
    IStudentsRepository,
  ],
})
export class DatabaseModule {}
```

#### ✅ BOM - Controller Depende de Abstração
```typescript
// src/infra/http/controllers/create-question.controller.ts
@Controller('/questions')
export class CreateQuestionController {
  constructor(
    // 🎯 Depende do USE CASE (abstração), não de repositórios específicos
    private createQuestion: CreateQuestionUseCase
  ) {}

  @Post()
  async handle(@Body(bodyValidationPipe) body: CreateQuestionBodySchema) {
    const { title, content, attachments } = body

    // 🚀 Não sabe nem se importa sobre detalhes de persistência
    const result = await this.createQuestion.execute({
      title,
      content,
      authorId: userId,
      attachmentsIds: attachments ?? [],
    })

    if (isError(result)) {
      throw new BadRequestException()
    }
  }
}
```

#### ✅ BOM - Testes com Dependências Invertidas
```typescript
// create-question.spec.ts
describe('Create Question', () => {
  let useCase: CreateQuestionUseCase
  let questionsRepository: InMemoryQuestionsRepository // 🎯 Implementação fake para testes

  beforeEach(() => {
    questionsRepository = new InMemoryQuestionsRepository()
    useCase = new CreateQuestionUseCase(questionsRepository) // 🚀 Injeta dependência fake
  })

  it('should be able to create a question', async () => {
    const result = await useCase.execute({
      authorId: '1',
      title: 'Nova pergunta',
      content: 'Conteúdo da pergunta',
      attachmentsIds: [],
    })

    expect(result.success).toBe(true)
    expect(questionsRepository.items).toHaveLength(1)
    expect(questionsRepository.items[0]).toEqual(result.value?.question)
  })
})
```

#### ❌ RUIM - Dependência Direta (Exemplo do que NÃO fazer)
```typescript
// ❌ Viola DIP - depende de implementação concreta
class CreateQuestionUseCaseBad {
  private questionsRepository: PrismaQuestionsRepository // ❌ Implementação concreta

  constructor() {
    // ❌ Cria dependência diretamente
    this.questionsRepository = new PrismaQuestionsRepository(new PrismaService())
  }

  async execute(request: any) {
    // 😰 Acoplado ao Prisma - difícil de testar e trocar
    await this.questionsRepository.create(question)
  }
}
```

---

## 🏆 Benefícios dos Princípios SOLID no Projeto

### ✅ Para Desenvolvedores
1. **Código Limpo**: Princípios resultam em código mais organizado
2. **Facilidade de Teste**: Dependências podem ser facilmente mockadas
3. **Manutenibilidade**: Mudanças são localizadas e controladas
4. **Reutilização**: Componentes podem ser facilmente reutilizados
5. **Colaboração**: Código mais previsível facilita trabalho em equipe

### ✅ Para o Negócio
1. **Menor Custo de Manutenção**: Bugs são mais fáceis de corrigir
2. **Maior Velocidade de Entrega**: Novos recursos são implementados rapidamente
3. **Flexibilidade**: Sistema pode se adaptar a mudanças de requisitos
4. **Qualidade**: Menos bugs em produção
5. **Escalabilidade**: Sistema cresce sem perder qualidade

---

## 📊 Resumo Prático

| Princípio | O que é? | Como aplicamos? | Benefício |
|-----------|----------|-----------------|-----------|
| **SRP** | Uma responsabilidade por classe | Use Cases focados, serviços especializados | Código mais focado e testável |
| **OCP** | Aberto para extensão, fechado para modificação | Interfaces e implementações múltiplas | Novas funcionalidades sem quebrar existentes |
| **LSP** | Subclasses devem substituir classes pai | Repositórios intercambiáveis | Polimorfismo confiável |
| **ISP** | Interfaces pequenas e específicas | Contratos segregados por responsabilidade | Menos acoplamento |
| **DIP** | Depender de abstrações, não implementações | Injeção de dependências com interfaces | Código flexível e testável |

---

## 📚 Próximos Passos

Para complementar seu entendimento da arquitetura:

- [📐 Padrões DDD Implementados](./ddd-patterns.md)
- [⚡ Domain Events](./domain-events.md)
- [📖 Documentação Principal](./README.md)

---

*Este documento evolui junto com o projeto, refletindo sempre as melhores práticas implementadas.*

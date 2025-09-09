# 📖 Glossário de Termos

## 🎯 Introdução

Este glossário explica todos os termos técnicos usados no projeto de forma simples e acessível para todos os membros da equipe, independentemente do nível técnico.

---

## 🏗️ Termos de Arquitetura

### **Aggregate Root** (Raiz do Agregado)
**O que é**: Uma entidade especial que controla um grupo de objetos relacionados e pode disparar eventos.
**Por que usar**: Garante que as regras de negócio sejam respeitadas e controla quando eventos são disparados.
**Exemplo no projeto**: `Question` é um aggregate root que controla seus anexos e dispara eventos quando a melhor resposta é escolhida.

### **Bounded Context** (Contexto Delimitado)
**O que é**: Uma fronteira lógica que separa diferentes áreas do negócio no código.
**Por que usar**: Evita que conceitos de diferentes áreas se misturem e confundam o código.
**Exemplo no projeto**: 
- `Forum`: Cuida de perguntas, respostas e comentários
- `Notification`: Cuida apenas de notificações

### **Domain-Driven Design (DDD)**
**O que é**: Uma abordagem de desenvolvimento que foca em modelar o software de acordo com o negócio.
**Por que usar**: O código fica mais próximo da realidade do negócio e é mais fácil de entender e manter.
**Benefício**: Desenvolvedores e pessoas de negócio falam a mesma língua.

### **Event-Driven Architecture** (Arquitetura Orientada a Eventos)
**O que é**: Um estilo de arquitetura onde diferentes partes do sistema se comunicam através de eventos.
**Por que usar**: Permite que funcionalidades sejam adicionadas sem modificar código existente.
**Exemplo**: Quando uma resposta é criada, o sistema automaticamente envia uma notificação.

---

## 🧱 Componentes do Sistema

### **Controller**
**O que é**: Ponto de entrada da aplicação que recebe requisições HTTP.
**Responsabilidade**: Validar dados de entrada e chamar o use case apropriado.
**Localização**: `src/infra/http/controllers/`
**Exemplo**: `CreateQuestionController` recebe dados para criar uma pergunta.

### **Domain Event** (Evento de Domínio)
**O que é**: Uma notificação de que algo importante aconteceu no negócio.
**Características**: Sempre tem nome no passado (ex: `AnswerCreatedEvent`).
**Exemplo**: `QuestionBestAnswerChosenEvent` é disparado quando uma melhor resposta é escolhida.

### **Entity** (Entidade)
**O que é**: Um objeto importante do negócio que tem identidade única.
**Características**: Duas entidades são iguais se têm o mesmo ID, mesmo com outros dados diferentes.
**Exemplo**: `Student` - dois estudantes são diferentes mesmo que tenham o mesmo nome.

### **Event Handler** (Manipulador de Eventos)
**O que é**: Código que executa quando um evento específico acontece.
**Responsabilidade**: Reagir a eventos e executar ações relacionadas.
**Exemplo**: `OnAnswerCreated` envia notificação quando uma resposta é criada.

### **Repository** (Repositório)
**O que é**: Interface que define como salvar e buscar dados.
**Por que usar**: Permite trocar banco de dados sem afetar o resto do código.
**Estrutura**: Interface no domínio, implementação na infraestrutura.

### **Use Case** (Caso de Uso)
**O que é**: Uma ação específica que um usuário pode fazer no sistema.
**Características**: Representa uma intenção do usuário.
**Exemplo**: `CreateQuestionUseCase` permite que um usuário crie uma pergunta.

### **Value Object** (Objeto de Valor)
**O que é**: Um objeto que representa um valor ou conceito, mas não tem identidade própria.
**Características**: Dois value objects são iguais se todos os seus dados são iguais.
**Exemplo**: `Slug` - dois slugs são iguais se têm o mesmo texto.

---

## 🎯 Padrões de Design

### **Dependency Injection** (Injeção de Dependências)
**O que é**: Técnica onde objetos recebem suas dependências de fora, não as criam internamente.
**Benefício**: Facilita testes e permite trocar implementações.
**Exemplo**: Use case recebe repositório como parâmetro em vez de criar um novo.

### **Factory Pattern** (Padrão Fábrica)
**O que é**: Método especial para criar objetos de forma controlada.
**Por que usar**: Garante que objetos sejam criados corretamente e pode disparar eventos.
**Exemplo**: `Question.create()` cria uma pergunta e configura tudo que é necessário.

### **Repository Pattern** (Padrão Repositório)
**O que é**: Abstração que simula uma coleção de objetos na memória.
**Benefício**: Código de negócio não precisa saber sobre banco de dados.
**Estrutura**: Interface abstrata + implementação concreta.

### **Result Pattern** (Padrão de Resultado)
**O que é**: Forma de retornar sucesso ou erro sem usar exceptions.
**Benefício**: Força o código a tratar erros explicitamente.
**Exemplo**: `Result<Question, InvalidDataError>` pode ser sucesso com pergunta ou erro.

---

## 🏷️ Princípios SOLID

### **Single Responsibility** (Responsabilidade Única)
**O que é**: Cada classe deve ter apenas um motivo para mudar.
**Exemplo**: `CreateQuestionUseCase` só cria perguntas, não envia emails ou faz outras coisas.

### **Open/Closed** (Aberto/Fechado)
**O que é**: Código deve estar aberto para extensão, mas fechado para modificação.
**Exemplo**: Podemos adicionar novo tipo de repositório sem modificar use cases existentes.

### **Liskov Substitution** (Substituição de Liskov)
**O que é**: Objetos filhos devem poder substituir objetos pais sem quebrar o programa.
**Exemplo**: Qualquer implementação de `IQuestionsRepository` deve funcionar igual.

### **Interface Segregation** (Segregação de Interfaces)
**O que é**: Interfaces devem ser pequenas e específicas.
**Exemplo**: `HashGenerator` e `HashComparer` são separados em vez de uma interface gigante.

### **Dependency Inversion** (Inversão de Dependências)
**O que é**: Código deve depender de abstrações, não de implementações concretas.
**Exemplo**: Use case depende de `IQuestionsRepository`, não de `PrismaQuestionsRepository`.

---

## 💾 Termos de Persistência

### **Mapper**
**O que é**: Classe que converte dados entre formato do banco e formato do domínio.
**Responsabilidade**: Traduzir objetos do domínio para o banco e vice-versa.
**Localização**: `src/infra/database/prisma/mappers/`

### **Migration** (Migração)
**O que é**: Script que modifica a estrutura do banco de dados.
**Quando usar**: Sempre que precisar alterar tabelas, colunas ou índices.
**Ferramenta**: Prisma Migrate no nosso caso.

### **ORM (Object-Relational Mapping)**
**O que é**: Ferramenta que traduz entre objetos do código e tabelas do banco.
**Exemplo no projeto**: Prisma ORM.
**Benefício**: Escrever código em vez de SQL.

### **Persistence** (Persistência)
**O que é**: Ato de salvar dados de forma permanente (banco de dados).
**Camada**: Toda lógica de persistência fica na infraestrutura.

---

## 🧪 Termos de Teste

### **Integration Test** (Teste de Integração)
**O que é**: Teste que verifica se diferentes partes do sistema funcionam juntas.
**Exemplo**: Teste que verifica se controller + use case + repositório funcionam em conjunto.

### **Mock**
**O que é**: Objeto falso usado em testes para simular dependências.
**Por que usar**: Testa apenas a parte específica sem depender de banco ou serviços externos.

### **Unit Test** (Teste Unitário)
**O que é**: Teste que verifica uma pequena parte do código isoladamente.
**Exemplo**: Testar se `Question.create()` funciona corretamente.

### **Test Double** (Dublê de Teste)
**O que é**: Qualquer objeto falso usado para substituir dependências em testes.
**Tipos**: Mock, Stub, Fake, Spy.

---

## 🌐 Termos de API

### **DTO (Data Transfer Object)**
**O que é**: Objeto simples usado para transferir dados entre camadas.
**Características**: Só tem dados, sem lógica de negócio.
**Exemplo**: Dados que chegam na API antes de serem convertidos em entidades.

### **Middleware**
**O que é**: Código que executa antes ou depois de processar uma requisição.
**Exemplo**: Verificar se usuário está autenticado antes de permitir acesso.

### **Pipe**
**O que é**: Transformação ou validação aplicada aos dados de entrada.
**Exemplo**: `ZodValidationPipe` valida se dados estão no formato correto.

### **Presenter**
**O que é**: Classe que formata dados do domínio para resposta da API.
**Responsabilidade**: Converter entidades internas para formato JSON da API.

---

## 🔐 Termos de Segurança

### **Hash**
**O que é**: Transformação irreversível de dados (como senhas) em texto codificado.
**Por que usar**: Proteger senhas - mesmo se banco for comprometido, senhas estão seguras.

### **JWT (JSON Web Token)**
**O que é**: Formato de token para autenticação que contém informações do usuário.
**Benefício**: Servidor não precisa guardar sessões.

### **Salt**
**O que é**: Dado aleatório adicionado antes de fazer hash de senhas.
**Por que usar**: Mesmo senhas iguais geram hashes diferentes.

---

## 📊 Termos de Monitoramento

### **Logging**
**O que é**: Registro de eventos que acontecem no sistema.
**Importância**: Ajuda a debuggar problemas e entender o comportamento do sistema.

### **Metrics** (Métricas)
**O que é**: Números que mostram como o sistema está performando.
**Exemplos**: Quantidade de perguntas criadas por dia, tempo de resposta da API.

### **Tracing** (Rastreamento)
**O que é**: Acompanhar o caminho de uma requisição por todo o sistema.
**Benefício**: Identificar onde estão os gargalos de performance.

---

## 🎨 Termos de Clean Code

### **Abstraction** (Abstração)
**O que é**: Esconder detalhes complexos atrás de uma interface simples.
**Exemplo**: Use case não precisa saber se dados são salvos em PostgreSQL ou MongoDB.

### **Coupling** (Acoplamento)
**O que é**: O quanto uma parte do código depende de outras partes.
**Objetivo**: Baixo acoplamento = partes independentes = mais fácil de manter.

### **Refactoring** (Refatoração)
**O que é**: Melhorar a estrutura do código sem mudar seu comportamento.
**Quando fazer**: Quando código fica difícil de entender ou manter.

### **Separation of Concerns** (Separação de Responsabilidades)
**O que é**: Cada parte do código deve cuidar de apenas uma coisa.
**Benefício**: Mais fácil de entender, testar e modificar.

---

## 🔄 Fluxos Importantes

### **Event Flow** (Fluxo de Eventos)
1. Algo importante acontece no domínio
2. Aggregate root adiciona evento à sua lista
3. Sistema marca agregado para dispatch
4. Após salvar no banco, eventos são disparados
5. Subscribers reagem aos eventos
6. Ações relacionadas são executadas

### **Request Flow** (Fluxo de Requisição)
1. Cliente faz requisição HTTP
2. Controller valida dados
3. Controller chama Use Case
4. Use Case executa lógica de negócio
5. Use Case usa Repository para persistir
6. Repository salva no banco
7. Eventos são disparados (se houver)
8. Resposta é retornada ao cliente

---

## 📚 Recursos Adicionais

### 📖 Documentação do Projeto
- [Visão Geral](./README.md)
- [Padrões DDD](./ddd-patterns.md)
- [Princípios SOLID](./solid-principles.md)
- [Domain Events](./domain-events.md)
- [Guia de Contribuição](./CONTRIBUTING.md)

### 🎓 Para Aprender Mais
- **DDD**: "Domain-Driven Design" by Eric Evans
- **Clean Architecture**: "Clean Architecture" by Robert C. Martin
- **Event Sourcing**: "Versioning in an Event Sourced System" by Greg Young

---

*Este glossário é atualizado conforme novos conceitos são introduzidos no projeto.*

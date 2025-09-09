# 📚 Documentação - Sistema de Fórum com Arquitetura DDD

## 🎯 Visão Geral

Este projeto implementa um sistema de fórum de perguntas e respostas utilizando **Domain-Driven Design (DDD)** e **Domain Event Driven Architecture** com NestJS. O sistema permite que estudantes façam perguntas, respondam questões de outros usuários e recebam notificações sobre interações em suas postagens.

### 🏗️ Arquitetura do Sistema

Nossa arquitetura segue os princípios do DDD, organizando o código em camadas bem definidas que promovem a separação de responsabilidades e facilidade de manutenção.

```
📦 src/
├── 🏛️ core/           # Elementos fundamentais do domínio
├── 🎯 domain/         # Regras de negócio e entidades do domínio  
├── 🔧 infra/          # Infraestrutura e adaptadores externos
└── 📄 app.service.ts  # Serviço principal da aplicação
```

## 🎨 Conceitos Fundamentais

### O que é Domain-Driven Design (DDD)?

**Domain-Driven Design** é uma abordagem de desenvolvimento de software que se concentra em modelar o software de acordo com o domínio do negócio e suas regras. Em termos simples:

- **Domínio**: É a área de conhecimento ou atividade para a qual o software está sendo construído (no nosso caso, um fórum de perguntas e respostas)
- **Entidades**: Representam conceitos importantes do negócio que possuem identidade única (como Question, Answer, Student)
- **Agregados**: Agrupam entidades relacionadas e garantem a consistência das regras de negócio
- **Casos de Uso**: Representam as ações que os usuários podem realizar no sistema

### O que são Domain Events?

**Domain Events** são eventos que representam algo importante que aconteceu no domínio do negócio. Por exemplo:
- Quando uma resposta é criada (`AnswerCreatedEvent`)
- Quando uma melhor resposta é escolhida (`QuestionBestAnswerChosenEvent`)

Estes eventos permitem que diferentes partes do sistema reajam a mudanças sem estar diretamente acopladas.

## 🏗️ Estrutura Detalhada das Camadas

### 📦 Core (`src/core/`)
Contém os elementos fundamentais e reutilizáveis em todo o domínio:

- **Entities**: Classes base para entidades e agregados
- **Events**: Sistema de eventos de domínio
- **Errors**: Tratamento padronizado de erros
- **Result**: Padrão para retorno de operações

### 📦 Domain (`src/domain/`)
Contém as regras de negócio organizadas por bounded contexts:

#### 🎯 Forum Context
Gerencia perguntas, respostas e interações:
- **Enterprise**: Entidades do domínio (Question, Answer, Student)
- **Application**: Casos de uso e contratos de repositórios
- **Events**: Eventos específicos do contexto de fórum

#### 📢 Notification Context  
Gerencia o sistema de notificações:
- **Enterprise**: Entidade Notification
- **Application**: Casos de uso para envio e leitura de notificações
- **Subscribers**: Ouvintes de eventos que disparam notificações

### 📦 Infrastructure (`src/infra/`)
Implementa os adaptadores e integrações externas:

- **Database**: Implementação com Prisma e mappers
- **HTTP**: Controllers, pipes e presenters
- **Auth**: Autenticação e autorização
- **Storage**: Gerenciamento de arquivos

## 🚀 Benefícios da Arquitetura Escolhida

### ✅ Para Desenvolvedores
- **Código Organizado**: Cada camada tem responsabilidades claras
- **Facilidade de Teste**: Domínio isolado da infraestrutura
- **Manutenibilidade**: Mudanças em uma camada não afetam outras
- **Escalabilidade**: Fácil adição de novos recursos

### ✅ Para o Negócio
- **Flexibilidade**: Regras de negócio podem evoluir independentemente
- **Confiabilidade**: Eventos garantem que ações importantes não sejam perdidas
- **Auditoria**: Histórico completo de eventos do sistema
- **Integração**: Facilita conexão com outros sistemas

## 📋 Documentação Adicional

- [📐 Padrões DDD Implementados](./ddd-patterns.md)
- [🎯 Princípios SOLID](./solid-principles.md)  
- [⚡ Domain Events e Event-Driven Architecture](./domain-events.md)

## 🔧 Como Começar

1. **Instalação das dependências**:
   ```bash
   npm install
   ```

2. **Configuração do banco de dados**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Execução da aplicação**:
   ```bash
   npm run start:dev
   ```

## 🤝 Contribuindo

Ao contribuir para este projeto, certifique-se de:

1. Seguir os padrões DDD estabelecidos
2. Manter a separação de responsabilidades entre as camadas
3. Implementar testes para novos casos de uso
4. Documentar eventos de domínio quando necessário

---

*Esta documentação é um guia vivo e deve ser atualizada conforme o projeto evolui.*

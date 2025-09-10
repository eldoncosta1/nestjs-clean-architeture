import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { QuestionFactory } from 'test/factories/make-question'
import { StudentFactory } from 'test/factories/make-student'
import { DatabaseModule } from '@/infra/database/database.module'
import { AttachmentFactory } from 'test/factories/make-attachment'
import { QuestionAttachmentFactory } from 'test/factories/make-question-attachment'
import { CacheRepository } from '@/infra/cache/cache-respository'
import { CacheModule } from '@/infra/cache/cache.module'
import { IQuestionsRepository } from '@/domain/forum/application/repositories/questions-repository'

describe('Prisma Question Repository (E2E)', async () => {
  let app: INestApplication
  let prisma: PrismaService
  let studentFactory: StudentFactory
  let questionFactory: QuestionFactory
  let attachmentFactory: AttachmentFactory
  let questionAttachmentFactory: QuestionAttachmentFactory
  let questionsRepository: IQuestionsRepository
  let cacheRepository: CacheRepository

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule, CacheModule],
      providers: [
        StudentFactory,
        QuestionFactory,
        AttachmentFactory,
        QuestionAttachmentFactory,
      ],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    studentFactory = moduleRef.get(StudentFactory)
    questionFactory = moduleRef.get(QuestionFactory)
    attachmentFactory = moduleRef.get(AttachmentFactory)
    questionAttachmentFactory = moduleRef.get(QuestionAttachmentFactory)
    cacheRepository = moduleRef.get(CacheRepository)
    questionsRepository = moduleRef.get(IQuestionsRepository)

    await app.init()
  })

  afterAll(async () => {
    if (app) {
      await app.close()
    }
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it('should cache a question details', async () => {
    const user = await studentFactory.makePrismaStudent()

    const question = await questionFactory.makePrismaQuestion({
      authorId: user.id,
    })

    const attachment = await attachmentFactory.makePrismaAttachment()

    await questionAttachmentFactory.makePrismaQuestionAttachment({
      questionId: question.id,
      attachmentId: attachment.id,
    })

    const slug = question.slug.value

    const questionDetails = await questionsRepository.findDetailsBySlug(slug)

    const cachedQuestion = await cacheRepository.get(`question:${slug}:details`)

    if (!cachedQuestion) {
      throw new Error('Cached question not found')
    }

    expect(JSON.parse(cachedQuestion)).toEqual(
      expect.objectContaining({
        id: questionDetails?.questionId.toString(),
      }),
    )
  })

  it('should return cached question details on subsquent calls', async () => {
    const user = await studentFactory.makePrismaStudent()

    const question = await questionFactory.makePrismaQuestion({
      authorId: user.id,
    })

    const attachment = await attachmentFactory.makePrismaAttachment()

    await questionAttachmentFactory.makePrismaQuestionAttachment({
      questionId: question.id,
      attachmentId: attachment.id,
    })

    const slug = question.slug.value

    let cached = await cacheRepository.get(`question:${slug}:details`)

    expect(cached).toBeNull()

    await questionsRepository.findDetailsBySlug(slug)

    cached = await cacheRepository.get(`question:${slug}:details`)

    if (!cached) {
      throw new Error('Cached question not found')
    }

    expect(cached).not.toBeNull()
    expect(JSON.parse(cached)).toEqual(
      expect.objectContaining({
        id: question.id.toString(),
      }),
    )
  })

  it('should delete cached question details when question is updated', async () => {
    const user = await studentFactory.makePrismaStudent()

    const question = await questionFactory.makePrismaQuestion({
      authorId: user.id,
    })

    const attachment = await attachmentFactory.makePrismaAttachment()

    await questionAttachmentFactory.makePrismaQuestionAttachment({
      questionId: question.id,
      attachmentId: attachment.id,
    })

    const slug = question.slug.value

    await cacheRepository.set(
      `question:${slug}:details`,
      JSON.stringify({ empty: true }),
    )

    await questionsRepository.save(question)

    const cached = await cacheRepository.get(`question:${slug}:details`)

    expect(cached).toBeNull()
  })
})

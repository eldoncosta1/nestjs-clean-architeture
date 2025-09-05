import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'

describe('Create account (E2E)', async () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)

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

  test('[POST] /accounts', async () => {
    const email = faker.internet.email()

    const response = await request(app.getHttpServer()).post('/accounts').send({
      name: faker.person.fullName(),
      email,
      password: '123456',
    })

    expect(response.statusCode).toBe(201)

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    expect(user).toBeTruthy()
  })
})

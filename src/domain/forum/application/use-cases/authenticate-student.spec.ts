import { ResultSuccess } from '@/core/result'
import { AuthenticateStudentUseCase } from './authenticate-student'
import { InMemoryStudentsRepository } from 'test/repositories/in-memory-students-repository'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { FakeEncrypter } from 'test/cryptography/fake-encrypter'
import { makeStudent } from 'test/factories/make-student'

let inMemoryStudentsRepository: InMemoryStudentsRepository
let fakeHasher: FakeHasher
let sut: AuthenticateStudentUseCase
let fakeEncrypter: FakeEncrypter

describe('Authenticate Student Usecase', () => {
  beforeEach(() => {
    inMemoryStudentsRepository = new InMemoryStudentsRepository()
    fakeHasher = new FakeHasher()
    fakeEncrypter = new FakeEncrypter()
    sut = new AuthenticateStudentUseCase(
      inMemoryStudentsRepository,
      fakeHasher,
      fakeEncrypter,
    )
  })

  it('should be able to authenticate a student', async () => {
    const student = makeStudent({
      email: 'john.doe@example.com',
      password: await fakeHasher.hash('123456'),
    })

    inMemoryStudentsRepository.create(student)

    const result = (await sut.execute({
      email: 'john.doe@example.com',
      password: '123456',
    })) as ResultSuccess<{
      accessToken: string
    }>

    expect(result.success).toBe(true)
    expect(result.value).toEqual({
      accessToken: expect.any(String),
    })
  })
})

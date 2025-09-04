import { ResultSuccess } from '@/core/result'
import { RegisterStudentUseCase } from './register-student'
import { InMemoryStudentsRepository } from 'test/repositories/in-memory-students-repository'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import type { Student } from '../../enterprise/entities/student'

let inMemoryStudentsRepository: InMemoryStudentsRepository
let fakeHasher: FakeHasher
let sut: RegisterStudentUseCase

describe('Register Student Usecase', () => {
  beforeEach(() => {
    inMemoryStudentsRepository = new InMemoryStudentsRepository()
    fakeHasher = new FakeHasher()
    sut = new RegisterStudentUseCase(inMemoryStudentsRepository, fakeHasher)
  })

  it('should be able to register a new student', async () => {
    const result = (await sut.execute({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: '123456',
    })) as ResultSuccess<{
      student: Student
    }>

    expect(result.value.student.id).toBeTruthy()
    expect(result.value).toEqual({
      student: inMemoryStudentsRepository.items[0],
    })
  })

  it('should hash student password upon registration', async () => {
    const result = (await sut.execute({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: '123456',
    })) as ResultSuccess<{
      student: Student
    }>

    const hashedPassword = await fakeHasher.hash('123456')

    expect(result.value.student.id).toBeTruthy()
    expect(inMemoryStudentsRepository.items[0].password).toEqual(hashedPassword)
  })
})

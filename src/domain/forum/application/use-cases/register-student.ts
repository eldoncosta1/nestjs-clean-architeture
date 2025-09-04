import { Result, ResultError, ResultSuccess } from '@/core/result'
import { Student } from '../../enterprise/entities/student'
import { Injectable } from '@nestjs/common'
import { IStudentsRepository } from '../repositories'
import { HashGenerator } from '../cryptography'
import { StudentAlreadyExistsError } from './errors/student-already-exists-error'

type RegisterStudentUseCaseRequest = {
  name: string
  email: string
  password: string
}

type RegisterStudentUseCaseResponse = Result<
  {
    student: Student
  },
  StudentAlreadyExistsError
>

@Injectable()
export class RegisterStudentUseCase {
  constructor(
    private studentsRepository: IStudentsRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    name,
    email,
    password,
  }: RegisterStudentUseCaseRequest): Promise<RegisterStudentUseCaseResponse> {
    const studentWithSameEmail =
      await this.studentsRepository.findByEmail(email)

    if (studentWithSameEmail) {
      return ResultError(
        StudentAlreadyExistsError(`Aluno com email ${email} já existe`),
      )
    }

    const hashedPassword = await this.hashGenerator.hash(password)

    const student = Student.create({
      name,
      email,
      password: hashedPassword,
    })

    await this.studentsRepository.create(student)

    return ResultSuccess({ student })
  }
}

import { Result, ResultError, ResultSuccess } from '@/core/result'
import { Injectable } from '@nestjs/common'
import { IStudentsRepository } from '../repositories'
import { Encrypter, HashComparer } from '../cryptography'
import { WrongCredentialsError } from './errors'

type AuthenticateStudentUseCaseRequest = {
  email: string
  password: string
}

type AuthenticateStudentUseCaseResponse = Result<
  {
    accessToken: string
  },
  WrongCredentialsError
>
@Injectable()
export class AuthenticateStudentUseCase {
  constructor(
    private studentsRepository: IStudentsRepository,
    private hashComparer: HashComparer,
    private encrypter: Encrypter,
  ) {}

  async execute({
    email,
    password,
  }: AuthenticateStudentUseCaseRequest): Promise<AuthenticateStudentUseCaseResponse> {
    const student = await this.studentsRepository.findByEmail(email)

    if (!student) {
      return ResultError(WrongCredentialsError(`Credenciais inválidas`))
    }

    const isPasswordValid = await this.hashComparer.compare(
      password,
      student.password,
    )

    if (!isPasswordValid) {
      return ResultError(WrongCredentialsError(`Credenciais inválidas`))
    }

    const accessToken = await this.encrypter.encrypt({
      sub: student.id.toString(),
    })

    return ResultSuccess({ accessToken })
  }
}

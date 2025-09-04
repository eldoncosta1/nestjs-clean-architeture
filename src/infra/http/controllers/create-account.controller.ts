import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UsePipes,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'
import { RegisterStudentUseCase } from '@/domain/forum/application/use-cases/register-student'
import { isError } from '@/core/result'
const createAccountBodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
})

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

@Controller('/accounts')
export class CreateAccountController {
  constructor(
    private readonly registerStudentUseCase: RegisterStudentUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createAccountBodySchema))
  async handle(@Body() body: CreateAccountBodySchema) {
    const { name, email, password } = createAccountBodySchema.parse(body)

    const result = await this.registerStudentUseCase.execute({
      name,
      email,
      password,
    })

    if (isError(result)) {
      const error = result.error

      switch (error.type) {
        case 'STUDENT_ALREADY_EXISTS':
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}

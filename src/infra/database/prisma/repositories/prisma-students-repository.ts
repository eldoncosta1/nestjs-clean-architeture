import { Injectable } from '@nestjs/common'
import { IStudentsRepository } from '@/domain/forum/application/repositories/students-repository'
import { PrismaService } from '../prisma.service'
import type { Student } from '@/domain/forum/enterprise/entities/student'
import { PrismaStudentMapper } from '../mappers/prisma-student-mapper'

@Injectable()
export class PrismaStudentsRepository implements IStudentsRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<Student | null> {
    const student = await this.prisma.user.findUnique({
      where: { email },
    })
    return student ? PrismaStudentMapper.toDomain(student) : null
  }

  async create(student: Student): Promise<void> {
    const prismaStudent = PrismaStudentMapper.toPersistence(student)

    await this.prisma.user.create({
      data: prismaStudent,
    })
  }
}

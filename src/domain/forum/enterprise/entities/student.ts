import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

type StudentProps = {
  name: string
}

export class Student extends Entity<StudentProps> {
  get getName() {
    return this.props.name
  }

  static create(props: StudentProps, id?: UniqueEntityID) {
    const student = new Student(props, id)

    return student
  }
}

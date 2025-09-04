export function StudentAlreadyExistsError(message: string) {
  return {
    type: 'STUDENT_ALREADY_EXISTS',
    message,
  } as const
}

export type StudentAlreadyExistsError = ReturnType<
  typeof StudentAlreadyExistsError
>

export function WrongCredentialsError(message: string) {
  return {
    type: 'WRONG_CREDENTIALS',
    message,
  } as const
}

export type WrongCredentialsError = ReturnType<typeof WrongCredentialsError>

export function NotAllowedError(message: string) {
  return {
    type: 'NOT_ALLOWED',
    message,
  } as const
}

export type NotAllowedError = ReturnType<typeof NotAllowedError>

export function ResourceNotFoundError(message: string) {
  return {
    type: 'NOT_FOUND',
    message,
  } as const
}

export type ResourceNotFoundError = ReturnType<typeof ResourceNotFoundError>

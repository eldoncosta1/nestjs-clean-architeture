export function InvalidAttachmentType(message: string) {
  return {
    type: 'INVALID_ATTACHMENT_TYPE',
    message,
  } as const
}

export type InvalidAttachmentType = ReturnType<typeof InvalidAttachmentType>

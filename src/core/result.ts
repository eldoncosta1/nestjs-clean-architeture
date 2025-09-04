export type ResultError<E> = { success: false; error: E }
export type ResultSuccess<T> = { success: true; value: T }
export type Result<T, E> = ResultSuccess<T> | ResultError<E>

export const ResultError = <T, E>(error: E): Result<T, E> => {
  return {
    success: false,
    error,
  }
}

export const ResultSuccess = <T, E>(value: T): Result<T, E> => {
  return {
    success: true,
    value,
  }
}

export const isError = <T, E>(
  result: Result<T, E>,
): result is ResultError<E> => {
  return result.success === false
}

export const isSuccess = <T, E>(
  result: Result<T, E>,
): result is ResultSuccess<T> => {
  return result.success === true
}

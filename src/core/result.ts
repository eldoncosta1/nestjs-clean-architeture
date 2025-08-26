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

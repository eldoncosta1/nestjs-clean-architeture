import { Result, ResultError, ResultSuccess } from './result'

function doSomething(shouldSuccess: boolean): Result<string, string> {
  if (shouldSuccess) {
    return {
      success: true,
      value: 'success',
    }
  } else {
    return {
      success: false,
      error: 'error',
    }
  }
}

test('success result', () => {
  const result = doSomething(true) as ResultSuccess<string>

  expect(result.success).toBe(true)
  expect(result.value).toEqual('success')
})

test('error result', () => {
  const result = doSomething(false) as ResultError<string>

  expect(result.success).toBe(false)
  expect(result.error).toEqual('error')
})

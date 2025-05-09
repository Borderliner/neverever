// result.ts
import {
  Result as NeverthrowResult,
  ResultAsync as NeverthrowResultAsync,
  ok,
  err,
  Ok,
  Err,
  okAsync,
} from 'neverthrow'
import { Option, OptionAsync, some, none } from './option'
import { Unwrap, MaybePromise } from './types'

// Utility to check if a value is a Promise
function isPromise<T>(value: any): value is Promise<T> {
  return value instanceof Promise
}

// Extend Result with additional methods
interface Result<T, E> {
  toOption(): Option<T>
  filter(predicate: (value: T) => boolean, error: E): Result<T, E>
  zip<U, F>(other: NeverthrowResult<U, F>): Result<[T, U], E | F>
  flatten(): Result<Unwrap<T>, E>
  contains(value: T): boolean
  recover(fn: (error: E) => T): Result<T, E>
  sequence(): Result<T[], E>
  tap(fn: (value: T) => void): Result<T, E>
  unwrap(): NeverthrowResult<T, E>
}

// Extend ResultAsync with additional methods
interface ResultAsync<T, E> {
  toOption(): OptionAsync<T>
  filter(predicate: (value: T) => MaybePromise<boolean>, error: MaybePromise<E>): ResultAsync<T, E>
  zip<U, F>(other: NeverthrowResult<U, F> | NeverthrowResultAsync<U, F>): ResultAsync<[T, U], E | F>
  flatten(): ResultAsync<Unwrap<T>, E>
  contains(value: T): Promise<boolean>
  recover(fn: (error: E) => MaybePromise<T>): ResultAsync<T, E>
  sequence(): ResultAsync<T[], E>
  tap(fn: (value: T) => MaybePromise<void>): ResultAsync<T, E>
  unwrap(): NeverthrowResultAsync<T, E>
}

// Chainable Result wrapper
class ResultWrapper<T, E> implements Result<T, E> {
  constructor(private result: NeverthrowResult<T, E>) {}

  toOption(): Option<T> {
    return this.result.isOk() ? some(this.result.unwrapOr(undefined as T)) : none()
  }

  filter(predicate: (value: T) => boolean, error: E): Result<T, E> {
    return new ResultWrapper<T, E>(
      this.result.andThen((value: T) =>
        predicate(value) ? new Ok<T, E>(value) : new Err<T, E>(error)
      )
    )
  }

  zip<U, F>(other: NeverthrowResult<U, F>): Result<[T, U], E | F> {
    return new ResultWrapper<[T, U], E | F>(
      this.result.andThen((t: T) =>
        other.isOk()
          ? new Ok<[T, U], E | F>([t, other.unwrapOr(undefined as U)] as [T, U])
          : new Err<[T, U], E | F>(other.unwrapOr(undefined as F) as E | F)
      )
    )
  }

  flatten(): Result<Unwrap<T>, E> {
    return new ResultWrapper<Unwrap<T>, E>(
      this.result.andThen((value: T) =>
        isResult<Unwrap<T>, E>(value)
          ? (value as NeverthrowResult<Unwrap<T>, E>)
          : new Ok<Unwrap<T>, E>(value as Unwrap<T>)
      )
    )
  }

  contains(value: T): boolean {
    return this.result.isOk() && this.result.unwrapOr(undefined as T) === value
  }

  recover(fn: (error: E) => T): Result<T, E> {
    return new ResultWrapper<T, E>(this.result.orElse((e: E) => new Ok<T, E>(fn(e))))
  }

  sequence(): Result<T[], E> {
    return new ResultWrapper<T[], E>(
      this.result.andThen((value: T) => new Ok<T[], E>(value instanceof Array ? value : [value]))
    )
  }

  tap(fn: (value: T) => void): Result<T, E> {
    return new ResultWrapper<T, E>(
      this.result.map((value) => {
        fn(value)
        return value
      })
    )
  }

  unwrap(): NeverthrowResult<T, E> {
    return this.result
  }
}

// Chainable ResultAsync wrapper
class ResultAsyncWrapper<T, E> implements ResultAsync<T, E> {
  constructor(private resultAsync: NeverthrowResultAsync<T, E>) {}

  toOption(): OptionAsync<T> {
    return OptionAsync.from<T>(
      this.resultAsync.then((result: NeverthrowResult<T, E>) =>
        result.isOk() ? result.unwrapOr(undefined as T) : null
      ) as Promise<T | null | undefined>
    )
  }

  filter(
    predicate: (value: T) => MaybePromise<boolean>,
    error: MaybePromise<E>
  ): ResultAsync<T, E> {
    return new ResultAsyncWrapper<T, E>(
      this.resultAsync.andThen((value: T) =>
        NeverthrowResultAsync.fromPromise(
          Promise.all([predicate(value), error]),
          (e) => e as E // fallback error mapper, rarely used here
        ).andThen(([p, e]) => (p ? ok(value) : err(e)))
      )
    )
  }

  zip<U, F>(
    other: NeverthrowResult<U, F> | NeverthrowResultAsync<U, F>
  ): ResultAsync<[T, U], E | F> {
    if (other instanceof NeverthrowResultAsync) {
      return new ResultAsyncWrapper<[T, U], E | F>(
        this.resultAsync.andThen((value1: T) =>
          other.andThen((value2: U) => new Ok<[T, U], E | F>([value1, value2]))
        )
      )
    } else {
      return new ResultAsyncWrapper<[T, U], E | F>(
        this.resultAsync.andThen((value1: T) =>
          other.isOk()
            ? new Ok<[T, U], E | F>([value1, other.unwrapOr(undefined as U)])
            : new Err<[T, U], E | F>(other.unwrapOr(undefined as F) as F)
        )
      )
    }
  }

  flatten(): ResultAsync<Unwrap<T>, E> {
    return new ResultAsyncWrapper(
      this.resultAsync.andThen((value) =>
        isResultAsync<Unwrap<T>, E>(value)
          ? value
          : isResult<Unwrap<T>, E>(value)
          ? new NeverthrowResultAsync<Unwrap<T>, E>(Promise.resolve(value))
          : okAsync<Unwrap<T>, E>(value as Unwrap<T>)
      )
    )
  }

  async contains(value: T): Promise<boolean> {
    const result = await this.resultAsync
    return result.isOk() && result.unwrapOr(undefined as T) === value
  }

  recover(fn: (error: E) => MaybePromise<T>): ResultAsync<T, E> {
    return new ResultAsyncWrapper<T, E>(
      this.resultAsync.orElse(
        (e: E) =>
          new NeverthrowResultAsync<T, E>(Promise.resolve(fn(e)).then((v) => new Ok<T, E>(v)))
      )
    )
  }

  sequence(): ResultAsync<T[], E> {
    return new ResultAsyncWrapper<T[], E>(
      this.resultAsync.andThen(
        (value: T) => new Ok<T[], E>(value instanceof Array ? value : [value])
      )
    )
  }

  tap(fn: (value: T) => MaybePromise<void>): ResultAsync<T, E> {
    return new ResultAsyncWrapper(
      this.resultAsync.map((value) => Promise.resolve(fn(value)).then(() => value))
    )
  }

  unwrap(): NeverthrowResultAsync<T, E> {
    return this.resultAsync
  }
}

// Type guards
function isResult<T, E>(value: any): value is NeverthrowResult<T, E> {
  return value instanceof Ok || value instanceof Err
}

function isResultAsync<T, E>(value: any): value is NeverthrowResultAsync<T, E> {
  return value instanceof NeverthrowResultAsync
}

// Utility to wrap sync/async functions
export function tryCatch<T, E>(
  fn: () => MaybePromise<T>,
  onError: (e: unknown) => E
): Result<T, E> | ResultAsync<T, E> {
  try {
    const result = fn()
    if (isPromise(result)) {
      return new ResultAsyncWrapper<T, E>(
        new NeverthrowResultAsync<T, E>(
          result.then((value) => new Ok<T, E>(value)).catch((e) => new Err<T, E>(onError(e)))
        )
      )
    }
    return new ResultWrapper<T, E>(new Ok<T, E>(result))
  } catch (e) {
    return new ResultWrapper<T, E>(new Err<T, E>(onError(e)))
  }
}

// Re-export neverthrow with wrappers
export { NeverthrowResult as Result, NeverthrowResultAsync as ResultAsync, ok, err, Ok, Err }

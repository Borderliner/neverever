// result.ts
import { Option, OptionAsync, some, none } from './option'
import { Unwrap, MaybePromise } from './types'

interface Result<T, E> {
  isOk(): boolean
  isErr(): boolean
  map<U>(fn: (value: T) => U): Result<U, E>
  mapErr<F>(fn: (error: E) => F): Result<T, F>
  andThen<U, F>(fn: (value: T) => Result<U, F>): Result<U, E | F>
  orElse<F>(fn: (error: E) => Result<T, F>): Result<T, E | F>
  unwrapOr(defaultValue: T): T
  unwrapOrElse(fn: (error: E) => T): T
  match<U>(branches: { ok: (value: T) => U; err: (error: E) => U }): U
  toOption(): Option<T>
  filter(predicate: (value: T) => boolean, error: E): Result<T, E>
  zip<U, F>(other: Result<U, F>): Result<[T, U], E | F>
  flatten(): Result<Unwrap<T>, E>
  contains(value: T): boolean
  recover(fn: (error: E) => T): Result<T, E>
  sequence(): Result<T[], E>
  tap(fn: (value: T) => void): Result<T, E>
  tapErr(fn: (error: E) => void): Result<T, E>
  toAsync(): ResultAsync<T, E>
}

interface ResultAsync<T, E> {
  isOk(): Promise<boolean>
  isErr(): Promise<boolean>
  map<U>(fn: (value: T) => MaybePromise<U>): ResultAsync<U, E>
  mapErr<F>(fn: (error: E) => MaybePromise<F>): ResultAsync<T, F>
  andThen<U, F>(fn: (value: T) => Result<U, F> | ResultAsync<U, F>): ResultAsync<U, E | F>
  orElse<F>(fn: (error: E) => Result<T, F> | ResultAsync<T, F>): ResultAsync<T, E | F>
  unwrapOr(defaultValue: MaybePromise<T>): Promise<T>
  unwrapOrElse(fn: (error: E) => MaybePromise<T>): Promise<T>
  match<U>(branches: { ok: (value: T) => MaybePromise<U>; err: (error: E) => MaybePromise<U> }): Promise<U>
  toOption(): OptionAsync<T>
  filter(predicate: (value: T) => MaybePromise<boolean>, error: MaybePromise<E>): ResultAsync<T, E>
  zip<U, F>(other: Result<U, F> | ResultAsync<U, F>): ResultAsync<[T, U], E | F>
  flatten(): ResultAsync<Unwrap<T>, E>
  contains(value: T): Promise<boolean>
  recover(fn: (error: E) => MaybePromise<T>): ResultAsync<T, E>
  sequence(): ResultAsync<T[], E>
  tap(fn: (value: T) => MaybePromise<void>): ResultAsync<T, E>
  tapErr(fn: (error: E) => MaybePromise<void>): ResultAsync<T, E>
}

class Ok<T, E> implements Result<T, E> {
  constructor(private readonly value: T) {}

  isOk(): boolean {
    return true
  }

  isErr(): boolean {
    return false
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Ok<U, E>(fn(this.value))
  }

  mapErr<F>(_fn: (error: E) => F): Result<T, F> {
    return new Ok<T, F>(this.value)
  }

  andThen<U, F>(fn: (value: T) => Result<U, F>): Result<U, E | F> {
    return fn(this.value)
  }

  orElse<F>(_fn: (error: E) => Result<T, F>): Result<T, E | F> {
    return new Ok<T, E | F>(this.value)
  }

  unwrapOr(_defaultValue: T): T {
    return this.value
  }

  unwrapOrElse(_fn: (error: E) => T): T {
    return this.value
  }

  match<U>(branches: { ok: (value: T) => U; err: (error: E) => U }): U {
    return branches.ok(this.value)
  }

  toOption(): Option<T> {
    return some(this.value)
  }

  filter(predicate: (value: T) => boolean, error: E): Result<T, E> {
    return predicate(this.value) ? this : new Err(error)
  }

  zip<U, F>(other: Result<U, F>): Result<[T, U], E | F> {
    return other.match({
      ok: (value: U): Result<[T, U], E | F> => new Ok<[T, U], E | F>([this.value, value] as [T, U]),
      err: (error: F): Result<[T, U], E | F> => new Err<[T, U], E | F>(error),
    })
  }

  flatten(): Result<Unwrap<T>, E> {
    if (isResult<Unwrap<T>, E>(this.value)) {
      return this.value as Result<Unwrap<T>, E>
    }
    return new Ok<Unwrap<T>, E>(this.value as Unwrap<T>)
  }

  contains(value: T): boolean {
    return this.value === value
  }

  recover(_fn: (error: E) => T): Result<T, E> {
    return this
  }

  sequence(): Result<T[], E> {
    return new Ok<T[], E>(this.value instanceof Array ? this.value : [this.value])
  }

  tap(fn: (value: T) => void): Result<T, E> {
    fn(this.value)
    return this
  }

  tapErr(_fn: (error: E) => void): Result<T, E> {
    return this
  }

  toAsync(): ResultAsync<T, E> {
    return new ResultAsync(Promise.resolve(new Ok<T, E>(this.value)))
  }
}

class Err<T, E> implements Result<T, E> {
  constructor(private readonly error: E) {}

  isOk(): boolean {
    return false
  }

  isErr(): boolean {
    return true
  }

  map<U>(_fn: (value: T) => U): Result<U, E> {
    return new Err<U, E>(this.error)
  }

  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    return new Err<T, F>(fn(this.error))
  }

  andThen<U, F>(_fn: (value: T) => Result<U, F>): Result<U, E | F> {
    return new Err<U, E | F>(this.error as E | F)
  }

  orElse<F>(fn: (error: E) => Result<T, F>): Result<T, E | F> {
    return fn(this.error)
  }

  unwrapOr(defaultValue: T): T {
    return defaultValue
  }

  unwrapOrElse(fn: (error: E) => T): T {
    return fn(this.error)
  }

  match<U>(branches: { ok: (value: T) => U; err: (error: E) => U }): U {
    return branches.err(this.error)
  }

  toOption(): Option<T> {
    return none() as Option<T>
  }

  filter(_predicate: (value: T) => boolean, error: E): Result<T, E> {
    return new Err<T, E>(error)
  }

  zip<U, F>(_other: Result<U, F>): Result<[T, U], E | F> {
    return new Err<[T, U], E | F>(this.error as E | F)
  }

  flatten(): Result<Unwrap<T>, E> {
    return new Err<Unwrap<T>, E>(this.error)
  }

  contains(_value: T): boolean {
    return false
  }

  recover(fn: (error: E) => T): Result<T, E> {
    return new Ok<T, E>(fn(this.error))
  }

  sequence(): Result<T[], E> {
    return new Err<T[], E>(this.error)
  }

  tap(_fn: (value: T) => void): Result<T, E> {
    return this
  }

  tapErr(fn: (error: E) => void): Result<T, E> {
    fn(this.error)
    return this
  }

  toAsync(): ResultAsync<T, E> {
    return new ResultAsync(Promise.resolve(new Err<T, E>(this.error)))
  }
}

class ResultAsync<T, E> implements ResultAsync<T, E> {
  constructor(private readonly promise: Promise<Result<T, E>>) {}

  static fromPromise<T, E>(promise: Promise<T>, onError: (e: unknown) => E): ResultAsync<T, E> {
    return new ResultAsync(promise.then((value) => new Ok<T, E>(value)).catch((e) => new Err<T, E>(onError(e))))
  }

  static fromSafePromise<T>(promise: Promise<T>): ResultAsync<T, never> {
    return new ResultAsync(promise.then((value) => new Ok<T, never>(value)))
  }

  async isOk(): Promise<boolean> {
    return (await this.promise).isOk()
  }

  async isErr(): Promise<boolean> {
    return (await this.promise).isErr()
  }

  map<U>(fn: (value: T) => MaybePromise<U>): ResultAsync<U, E> {
    return new ResultAsync(
      this.promise.then((result) =>
        result.match({
          ok: (value) => Promise.resolve(fn(value)).then((mapped) => new Ok<U, E>(mapped)),
          err: (error) => Promise.resolve(new Err<U, E>(error)),
        })
      )
    )
  }

  mapErr<F>(fn: (error: E) => MaybePromise<F>): ResultAsync<T, F> {
    return new ResultAsync(
      this.promise.then((result) =>
        result.match({
          ok: (value) => Promise.resolve(new Ok<T, F>(value)),
          err: (error) => Promise.resolve(fn(error)).then((mapped) => new Err<T, F>(mapped)),
        })
      )
    )
  }

  andThen<U, F>(fn: (value: T) => Result<U, F> | ResultAsync<U, F>): ResultAsync<U, E | F> {
    return new ResultAsync(
      this.promise.then((result) =>
        result.match({
          ok: (value): Promise<Result<U, E | F>> => {
            const next = fn(value)
            return next instanceof ResultAsync ? next.promise : Promise.resolve(next)
          },
          err: (error): Promise<Result<U, E | F>> => Promise.resolve(new Err<U, E | F>(error)),
        })
      )
    )
  }

  orElse<F>(fn: (error: E) => Result<T, F> | ResultAsync<T, F>): ResultAsync<T, E | F> {
    return new ResultAsync(
      this.promise.then((result) =>
        result.match({
          ok: (value): Promise<Result<T, E | F>> => Promise.resolve(new Ok<T, E | F>(value)),
          err: (error): Promise<Result<T, E | F>> => {
            const next = fn(error)
            return next instanceof ResultAsync ? next.promise : Promise.resolve(next)
          },
        })
      )
    )
  }

  async unwrapOr(defaultValue: MaybePromise<T>): Promise<T> {
    return this.promise.then((result) =>
      result.match({
        ok: (value) => Promise.resolve(value),
        err: () => Promise.resolve(defaultValue),
      })
    )
  }

  async unwrapOrElse(fn: (error: E) => MaybePromise<T>): Promise<T> {
    return this.promise.then((result) =>
      result.match({
        ok: (value) => Promise.resolve(value),
        err: (error) => Promise.resolve(fn(error)),
      })
    )
  }

  async match<U>(branches: { ok: (value: T) => MaybePromise<U>; err: (error: E) => MaybePromise<U> }): Promise<U> {
    return this.promise.then((result) =>
      result.match({
        ok: (value) => Promise.resolve(branches.ok(value)),
        err: (error) => Promise.resolve(branches.err(error)),
      })
    )
  }

  toOption(): OptionAsync<T> {
    return OptionAsync.from(
      this.promise.then((result) =>
        result.match({
          ok: (value) => value,
          err: () => null,
        })
      )
    )
  }

  filter(predicate: (value: T) => MaybePromise<boolean>, error: MaybePromise<E>): ResultAsync<T, E> {
    return new ResultAsync(
      this.promise.then((result) =>
        result.match({
          ok: (value) =>
            Promise.resolve(predicate(value)).then((p) =>
              p ? new Ok<T, E>(value) : new Err<T, E>(Promise.resolve(error) as E)
            ),
          err: (error) => Promise.resolve(new Err<T, E>(error)),
        })
      )
    )
  }

  zip<U, F>(other: Result<U, F> | ResultAsync<U, F>): ResultAsync<[T, U], E | F> {
    return new ResultAsync<[T, U], E | F>(
      Promise.all([this.promise, other instanceof ResultAsync ? other.promise : Promise.resolve(other)]).then(
        ([result1, result2]) =>
          result1.match({
            ok: (value1) =>
              result2.match({
                ok: (value2) => new Ok<T, E | F>(value1).map((value1) => [value1, value2]),
                err: (error2) => new Err<[T, U], E | F>(error2),
              }),
            err: (error1) => new Err<[T, U], E | F>(error1),
          })
      )
    )
  }

  flatten(): ResultAsync<Unwrap<T>, E> {
    return new ResultAsync<Unwrap<T>, E>(
      this.promise.then((result) =>
        result.match({
          ok: (value) => {
            if (isResult<Unwrap<T>, any>(value)) {
              return value as Result<Unwrap<T>, E>
            }
            return new Ok<Unwrap<T>, E>(value as Unwrap<T>)
          },
          err: (error) => new Err<Unwrap<T>, E>(error),
        })
      )
    )
  }

  async contains(value: T): Promise<boolean> {
    const result = await this.promise
    return result.match({
      ok: (v) => v === value,
      err: () => false,
    })
  }

  recover(fn: (error: E) => MaybePromise<T>): ResultAsync<T, E> {
    return new ResultAsync(
      this.promise.then((result) =>
        result.match({
          ok: (value) => Promise.resolve(value).then((value) => new Ok<T, E>(value)),
          err: (error) => Promise.resolve(fn(error)).then((recovered) => new Ok<T, E>(recovered)),
        })
      )
    )
  }

  sequence(): ResultAsync<T[], E> {
    return new ResultAsync<T[], E>(
      this.promise.then((result) =>
        result.match<Result<T[], E>>({
          ok: (value) => new Ok<T[], E>(Array.isArray(value) ? value : [value]),
          err: (error) => new Err<T[], E>(error),
        })
      )
    )
  }

  tap(fn: (value: T) => MaybePromise<void>): ResultAsync<T, E> {
    return new ResultAsync(
      this.promise.then(async (result) => {
        if (result.isOk()) {
          await fn(result.unwrapOr(none() as T))
        }
        return result
      })
    )
  }

  tapErr(fn: (error: E) => MaybePromise<void>): ResultAsync<T, E> {
    return new ResultAsync(
      this.promise.then(async (result) => {
        if (result.isErr()) {
          await fn(result.match({ ok: () => undefined as never, err: (e) => e }))
        }
        return result
      })
    )
  }
}

function isResult<T, E>(value: any): value is Result<T, E> {
  return value instanceof Ok || value instanceof Err
}

function isResultAsync<T, E>(value: any): value is ResultAsync<T, E> {
  return value instanceof ResultAsync
}

function ok<T, E>(value: T): Result<T, E> {
  return new Ok<T, E>(value)
}

function err<T, E>(error: E): Result<T, E> {
  return new Err<T, E>(error)
}

function okAsync<T, E>(value: MaybePromise<T>): ResultAsync<T, E> {
  return new ResultAsync(Promise.resolve(value).then((v) => new Ok<T, E>(v)))
}

function errAsync<T, E>(error: MaybePromise<E>): ResultAsync<T, E> {
  return new ResultAsync(Promise.resolve(error).then((e) => new Err<T, E>(e)))
}

function fromPromise<T, E>(promise: Promise<T>, onError: (e: unknown) => E): ResultAsync<T, E> {
  return ResultAsync.fromPromise(promise, onError)
}

function fromSafePromise<T>(promise: Promise<T>): ResultAsync<T, never> {
  return ResultAsync.fromSafePromise(promise)
}

function fromThrowable<T, E>(fn: () => T, onError: (e: unknown) => E): Result<T, E> {
  try {
    return new Ok<T, E>(fn())
  } catch (e) {
    return new Err<T, E>(onError(e))
  }
}

function fromAsyncThrowable<T, E>(fn: () => Promise<T>, onError: (e: unknown) => E): ResultAsync<T, E> {
  return new ResultAsync(
    fn()
      .then((value) => new Ok<T, E>(value))
      .catch((e) => new Err<T, E>(onError(e)))
  )
}

function safeTry<T, E>(fn: () => MaybePromise<T>, onError: (e: unknown) => E): Result<T, E> | ResultAsync<T, E> {
  try {
    const result = fn()
    if (result instanceof Promise) {
      return new ResultAsync(result.then((value) => new Ok<T, E>(value)).catch((e) => new Err<T, E>(onError(e))))
    }
    return new Ok<T, E>(result)
  } catch (e) {
    return new Err<T, E>(onError(e))
  }
}

export { Result, ResultAsync, Ok, Err }
export { ok, err, okAsync, errAsync, isResult, isResultAsync }
export { safeTry, fromPromise, fromSafePromise, fromThrowable, fromAsyncThrowable }

import { Option, OptionAsync } from './option'
import { Unwrap, MaybePromise } from './types'

interface ResultAsync<T, E> {
  isOk(): Promise<boolean>
  isErr(): Promise<boolean>
  contains(value: T): Promise<boolean>
  map<U>(fn: (value: T) => MaybePromise<U>): ResultAsync<U, E>
  mapErr<F>(fn: (error: E) => MaybePromise<F>): ResultAsync<T, F>
  andThen<U, F>(fn: (value: T) => Result<U, F> | ResultAsync<U, F>): ResultAsync<U, E | F>
  orElse<F>(fn: (error: E) => Result<T, F> | ResultAsync<T, F>): ResultAsync<T, E | F>
  filter(predicate: (value: T) => MaybePromise<boolean>, error: MaybePromise<E>): ResultAsync<T, E>
  zip<U, F>(other: Result<U, F> | ResultAsync<U, F>): ResultAsync<[T, U], E | F>
  flatten(): ResultAsync<Unwrap<T>, E>
  unwrapOr(defaultValue: MaybePromise<T>): Promise<T>
  unwrapOrElse(fn: (error: E) => MaybePromise<T>): Promise<T>
  match<U>(branches: { ok: (value: T) => MaybePromise<U>; err: (error: E) => MaybePromise<U> }): Promise<U>
  toOption(): OptionAsync<T>
  sequence(): ResultAsync<T[], E>
  tap(fn: (value: T) => MaybePromise<void>): ResultAsync<T, E>
  tapErr(fn: (error: E) => MaybePromise<void>): ResultAsync<T, E>
}

class Result<T, E> {
  private constructor(private readonly isOkFlag: boolean, private readonly value?: T, private readonly error?: E) {}

  private static readonly ERR = new Result<never, never>(false, undefined, undefined)

  static ok<T, E>(value: T): Result<T, E> {
    return new Result(true, value, undefined as E)
  }

  static err<T, E>(error: E): Result<T, E> {
    return new Result(false, undefined as T, error)
  }

  static from<T, E>(value: T | null | undefined, error: E): Result<T, E> {
    return value == null ? new Result(false, undefined as T, error) : new Result(true, value, undefined as E)
  }

  static try<T, E>(fn: () => T, onError: (e: unknown) => E): Result<T, E>
  static try<T, E>(fn: () => Promise<T>, onError: (e: unknown) => E): ResultAsync<T, E>
  static try<T, E>(fn: () => MaybePromise<T>, onError: (e: unknown) => E): Result<T, E> | ResultAsync<T, E> {
    try {
      const result = fn()
      if (result instanceof Promise) {
        return ResultAsync.try(() => result, onError) // Treat as async
      }
      return new Result(true, result, undefined as E)
    } catch (e) {
      return new Result(false, undefined as T, onError(e))
    }
  }

  isOk(): boolean {
    return this.isOkFlag
  }

  isErr(): boolean {
    return !this.isOkFlag
  }

  contains(value: T): boolean {
    return this.isOkFlag && this.value === value
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return this.isOkFlag
      ? new Result(true, fn(this.value!), undefined as E)
      : new Result(false, undefined as U, this.error)
  }

  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    return this.isOkFlag
      ? new Result(true, this.value, undefined as F)
      : new Result(false, undefined as T, fn(this.error!))
  }

  andThen<U, F>(fn: (value: T) => Result<U, F>): Result<U, E | F> {
    return this.isOkFlag ? fn(this.value!) : new Result(false, undefined as U, this.error as E | F)
  }

  orElse<F>(fn: (error: E) => Result<T, F>): Result<T, E | F> {
    return this.isOkFlag ? new Result(true, this.value, undefined as E | F) : fn(this.error!)
  }

  filter(predicate: (value: T) => boolean, error: E): Result<T, E> {
    return this.isOkFlag && predicate(this.value!)
      ? this
      : this.isOkFlag
      ? new Result(false, undefined as T, error)
      : this
  }

  zip<U, F>(other: Result<U, F>): Result<[T, U], E | F> {
    return this.match({
      ok: (value1) =>
        other.match({
          ok: (value2) => Result.ok<[T, U], E | F>([value1, value2]),
          err: (error) => Result.err<[T, U], E | F>(error),
        }),
      err: (error) => Result.err<[T, U], E | F>(error),
    })
  }

  flatten(): Result<Unwrap<T>, E> {
    if (!this.isOkFlag) return new Result(false, undefined as Unwrap<T>, this.error)
    const inner = this.value
    return inner instanceof Result ? inner.flatten() : new Result(true, inner as Unwrap<T>, undefined as E)
  }

  unwrapOr(defaultValue: T): T {
    return this.isOkFlag ? this.value! : defaultValue
  }

  unwrapOrElse(fn: (error: E) => T): T {
    return this.isOkFlag ? this.value! : fn(this.error!)
  }

  match<U>(branches: { ok: (value: T) => U; err: (error: E) => U }): U {
    return this.isOkFlag ? branches.ok(this.value!) : branches.err(this.error!)
  }

  toOption(): Option<T> {
    return this.isOkFlag ? Option.some(this.value!) : Option.none()
  }

  recover(fn: (error: E) => T): Result<T, E> {
    return this.isOkFlag ? this : new Result(true, fn(this.error!), undefined as E)
  }

  sequence(): Result<T[], E> {
    if (this.isOkFlag) {
      return new Result(true, Array.isArray(this.value) ? (this.value as T[]) : [this.value!], undefined as E)
    }
    return new Result(false, [], this.error!)
  }

  tap(fn: (value: T) => void): Result<T, E> {
    if (this.isOkFlag) fn(this.value!)
    return this
  }

  tapErr(fn: (error: E) => void): Result<T, E> {
    if (!this.isOkFlag) fn(this.error!)
    return this
  }

  toAsync(): ResultAsync<T, E> {
    return new ResultAsync(Promise.resolve(this))
  }
}

function isResult<T, E>(value: any): value is Result<T, E> {
  return value instanceof Result
}

class ResultAsync<T, E> implements ResultAsync<T, E> {
  constructor(private readonly promise: Promise<Result<T, E>>) {}

  static ok<T, E>(value: MaybePromise<T>): ResultAsync<T, E> {
    return new ResultAsync(Promise.resolve(value).then((v) => Result.ok(v)))
  }

  static err<T, E>(error: MaybePromise<E>): ResultAsync<T, E> {
    return new ResultAsync(Promise.resolve(error).then((e) => Result.err(e)))
  }

  static from<T, E>(value: MaybePromise<T | null | undefined>, error: MaybePromise<E>): ResultAsync<T, E> {
    return new ResultAsync(Promise.all([value, error]).then(([v, e]) => Result.from(v, e)))
  }

  static try<T, E>(fn: () => Promise<T>, onError: (e: unknown) => E): ResultAsync<T, E> {
    return new ResultAsync(
      Promise.resolve()
        .then(() => fn())
        .then((value) => Result.ok<T, E>(value))
        .catch((e) => Result.err<T, E>(onError(e)))
    )
  }

  static fromPromise<T, E>(promise: Promise<T>, onError: (e: unknown) => E): ResultAsync<T, E> {
    return new ResultAsync(promise.then((value) => Result.ok<T, E>(value)).catch((e) => Result.err<T, E>(onError(e))))
  }

  static fromSafePromise<T, E = unknown>(promise: Promise<T>): ResultAsync<T, E> {
    return new ResultAsync(promise.then((value) => Result.ok<T, E>(value)).catch((e) => Result.err<T, E>(e)))
  }

  async isOk(): Promise<boolean> {
    return this.promise.then((res) => res.isOk())
  }

  async isErr(): Promise<boolean> {
    return this.promise.then((res) => res.isErr())
  }

  async contains(value: T): Promise<boolean> {
    return this.promise.then((res) => res.contains(value))
  }

  map<U>(fn: (value: T) => MaybePromise<U>): ResultAsync<U, E> {
    return new ResultAsync(
      this.promise.then((res) =>
        res.match({
          ok: async (value) => Result.ok<U, E>(await fn(value)),
          err: async (error) => Result.err<U, E>(error),
        })
      )
    )
  }

  mapErr<F>(fn: (error: E) => MaybePromise<F>): ResultAsync<T, F> {
    return new ResultAsync(
      this.promise.then((res) =>
        res.match({
          ok: async (value) => Result.ok<T, F>(value),
          err: async (error) => Result.err<T, F>(await fn(error)),
        })
      )
    )
  }

  andThen<U, F>(fn: (value: T) => Result<U, F> | ResultAsync<U, F>): ResultAsync<U, E | F> {
    return new ResultAsync(
      this.promise.then((res) =>
        res.match({
          ok: async (value) => {
            const next = fn(value)
            return next instanceof ResultAsync ? next.promise : next
          },
          err: async (error) => Result.err<U, E | F>(error as E | F),
        })
      )
    )
  }

  orElse<F>(fn: (error: E) => Result<T, F> | ResultAsync<T, F>): ResultAsync<T, E | F> {
    return new ResultAsync(
      this.promise.then((res) =>
        res.match({
          ok: async (value) => Result.ok<T, E | F>(value),
          err: async (error) => {
            const next = fn(error)
            return next instanceof ResultAsync ? next.promise : next
          },
        })
      )
    )
  }

  filter(predicate: (value: T) => MaybePromise<boolean>, error: MaybePromise<E>): ResultAsync<T, E> {
    return new ResultAsync(
      this.promise.then((res) =>
        res.match({
          ok: async (value) => {
            if (await predicate(value)) {
              return res // Result<T, E>
            }
            return Result.err<T, E>(await Promise.resolve(error)) // Explicitly Result<T, E>
          },
          err: async () => res, // Result<T, E>
        })
      )
    )
  }

  zip<U, F>(other: Result<U, F> | ResultAsync<U, F>): ResultAsync<[T, U], E | F> {
    return new ResultAsync<[T, U], E | F>(
      Promise.all([this.promise, other instanceof ResultAsync ? other.promise : other]).then(([res1, res2]) =>
        res1.match({
          ok: (value1) =>
            res2.match({
              ok: (value2) => Result.ok<[T, U], E | F>([value1, value2]),
              err: (error) => Result.err<[T, U], E | F>(error),
            }),
          err: (error) => Result.err<[T, U], E | F>(error),
        })
      )
    )
  }

  flatten(): ResultAsync<Unwrap<T>, E> {
    return new ResultAsync(
      this.promise.then((res) =>
        res.match({
          ok: async (value) => {
            if (value instanceof ResultAsync) return value.flatten().promise
            if (isResult(value)) return value.flatten()
            return Result.ok(value as Unwrap<T>)
          },
          err: async (error) => Result.err<Unwrap<T>, E>(error),
        })
      )
    )
  }

  unwrapOr(defaultValue: MaybePromise<T>): Promise<T> {
    return this.promise.then((res) => res.unwrapOr(Promise.resolve(defaultValue) as T))
  }

  unwrapOrElse(fn: (error: E) => MaybePromise<T>): Promise<T> {
    return this.promise.then((res) =>
      res.match({
        ok: (value) => Promise.resolve(value),
        err: (error) => Promise.resolve(fn(error)),
      })
    )
  }

  match<U>(branches: { ok: (value: T) => MaybePromise<U>; err: (error: E) => MaybePromise<U> }): Promise<U> {
    return this.promise.then((res) =>
      res.match({
        ok: (value) => Promise.resolve(branches.ok(value)),
        err: (error) => Promise.resolve(branches.err(error)),
      })
    )
  }

  toOption(): OptionAsync<T> {
    return OptionAsync.from(this.promise.then((res) => res.match({ ok: (value) => value, err: () => null })))
  }

  sequence(): ResultAsync<T[], E> {
    return new ResultAsync<T[], E>(
      this.promise.then((res) =>
        res.match({
          ok: (value) => Result.ok<T[], E>(Array.isArray(value) ? value : [value]),
          err: (error) => Result.err<T[], E>(error),
        })
      )
    )
  }

  tap(fn: (value: T) => MaybePromise<void>): ResultAsync<T, E> {
    return new ResultAsync(
      this.promise.then((res) =>
        res.match({
          ok: async (value) => {
            await fn(value)
            return res
          },
          err: async () => res,
        })
      )
    )
  }

  tapErr(fn: (error: E) => MaybePromise<void>): ResultAsync<T, E> {
    return new ResultAsync(
      this.promise.then((res) =>
        res.match({
          ok: async () => res,
          err: async (error) => {
            await fn(error)
            return res
          },
        })
      )
    )
  }
}

function isResultAsync<T, E>(value: any): value is ResultAsync<T, E> {
  return value instanceof ResultAsync
}

export { Result, ResultAsync, isResult, isResultAsync }

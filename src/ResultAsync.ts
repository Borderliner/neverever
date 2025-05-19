import { OptionAsync } from './OptionAsync'
import { isResult, Result } from './Result'
import { MaybePromise, Unwrap } from './types'

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

export { ResultAsync, isResultAsync }

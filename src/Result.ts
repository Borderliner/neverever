import { Option } from './Option'
import { ResultAsync } from './ResultAsync'
import { MaybePromise, Unwrap } from './types'

class Result<T, E> {
  private constructor(private readonly isOkFlag: boolean, private readonly value?: T, private readonly error?: E) {}

  private static readonly ERR = new Result<never, never>(false, undefined, undefined)

  static ok<T, E>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined)
  }

  static err<T, E>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error)
  }

  static from<T, E>(value: T | null | undefined, error: E): Result<T, E> {
    return value == null ? new Result<T, E>(false, undefined, error) : new Result<T, E>(true, value, undefined)
  }

  static try<T, E>(fn: () => T, onError: (e: unknown) => E): Result<T, E>
  static try<T, E>(fn: () => Promise<T>, onError: (e: unknown) => E): ResultAsync<T, E>
  static try<T, E>(fn: () => MaybePromise<T>, onError: (e: unknown) => E): Result<T, E> | ResultAsync<T, E> {
    try {
      const result = fn()
      if (result instanceof Promise) {
        return ResultAsync.try(() => result, onError) // Treat as async
      }
      return new Result<T, E>(true, result, undefined)
    } catch (e) {
      return new Result<T, E>(false, undefined, onError(e))
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
      ? new Result<U, E>(true, fn(this.value!), undefined)
      : new Result<U, E>(false, undefined, this.error)
  }

  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    return this.isOkFlag
      ? new Result<T, F>(true, this.value, undefined)
      : new Result<T, F>(false, undefined, fn(this.error!))
  }

  andThen<U, F>(fn: (value: T) => Result<U, F>): Result<U, E | F> {
    return this.isOkFlag ? fn(this.value!) : new Result<U, E | F>(false, undefined, this.error)
  }

  orElse<F>(fn: (error: E) => Result<T, F>): Result<T, E | F> {
    return this.isOkFlag ? new Result<T, E | F>(true, this.value!, undefined) : fn(this.error!)
  }

  filter(predicate: (value: T) => boolean, error: E): Result<T, E> {
    return this.isOkFlag && predicate(this.value!)
      ? this
      : this.isOkFlag
      ? new Result<T, E>(false, undefined, error)
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
    if (!this.isOkFlag) return new Result<Unwrap<T>, E>(false, undefined, this.error)
    const inner = this.value
    return inner instanceof Result
      ? inner.flatten()
      : new Result<Unwrap<T>, E>(true, inner as Unwrap<T>, undefined)
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
    return this.isOkFlag ? this : new Result<T, E>(true, fn(this.error!), undefined)
  }

  sequence(): Result<T[], E> {
    if (this.isOkFlag) {
      return new Result<T[], E>(true, Array.isArray(this.value) ? (this.value) : [this.value!], undefined)
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

export { Result, isResult }

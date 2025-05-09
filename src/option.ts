// option.ts
import { err, ok, Result, ResultAsync } from 'neverthrow'
import { Unwrap, MaybePromise, OptionLike, ResultLike, IsPromise } from './types'

// Interface for Option
export interface Option<T> {
  isSome(): boolean
  isNone(): boolean
  contains(value: T): boolean
  map<U>(fn: (value: T) => U): Option<U>
  andThen<U>(fn: (value: T) => Option<U>): Option<U>
  filter(predicate: (value: T) => boolean): Option<T>
  zip<U>(other: Option<U>): Option<[T, U]>
  flatten(): Option<Unwrap<T>>
  orElse(fn: () => Option<T>): Option<T>
  unwrapOr(defaultValue: T): T
  unwrapOrElse(fn: () => T): T
  match<U>(branches: { some: (value: T) => U; none: () => U }): U
  toResult<E>(error: E): Result<T, E>
  toAsync(): OptionAsync<T>
  sequence(): Option<T[]>
  tap(fn: (value: T) => void): Option<T>
}

// Interface for OptionAsync
export interface OptionAsync<T> {
  isSome(): Promise<boolean>
  isNone(): Promise<boolean>
  contains(value: T): Promise<boolean>
  map<U>(fn: (value: T) => MaybePromise<U>): Promise<Option<U>>
  andThen<U>(fn: (value: T) => OptionLike<U>): Promise<Option<U>>
  filter(predicate: (value: T) => MaybePromise<boolean>): Promise<Option<T>>
  zip<U>(other: OptionLike<U>): Promise<Option<[T, U]>>
  flatten(): Promise<Option<Unwrap<T>>>
  orElse(fn: () => OptionLike<T>): Promise<Option<T>>
  unwrapOr(defaultValue: MaybePromise<T>): Promise<T>
  unwrapOrElse(fn: () => MaybePromise<T>): Promise<T>
  match<U>(branches: {
    some: (value: T) => MaybePromise<U>
    none: () => MaybePromise<U>
  }): Promise<U>
  toResult<E>(error: MaybePromise<E>): Promise<ResultAsync<T, E>>
  sequence(): Promise<Option<T[]>>
  tap(fn: (value: T) => MaybePromise<void>): Promise<Option<T>>
}

// Singleton None instance
const NONE = new (class None implements Option<never> {
  isSome(): boolean {
    return false
  }

  isNone(): boolean {
    return true
  }

  contains(): boolean {
    return false
  }

  map<U>(): Option<U> {
    return NONE as Option<U>
  }

  andThen<U>(): Option<U> {
    return NONE as Option<U>
  }

  filter(): Option<never> {
    return this
  }

  zip<U>(): Option<[never, U]> {
    return NONE as Option<[never, U]>
  }

  flatten(): Option<never> {
    return this
  }

  orElse<T>(fn: () => Option<T>): Option<T> {
    return fn()
  }

  unwrapOr<T>(defaultValue: T): T {
    return defaultValue
  }

  unwrapOrElse<T>(fn: () => T): T {
    return fn()
  }

  match<U>(branches: { some: (value: never) => U; none: () => U }): U {
    return branches.none()
  }

  toResult<E>(error: E): Result<never, E> {
    return err(error)
  }

  toAsync(): OptionAsync<never> {
    return OptionAsync.none()
  }

  sequence(): Option<never[]> {
    return some([])
  }

  tap(): Option<never> {
    return this
  }
})()

// Type guard for Option
function isOption<T>(value: any): value is Option<T> {
  return value instanceof Some || value === NONE
}

// Concrete Some implementation
class Some<T> implements Option<T> {
  constructor(private readonly value: T) {}

  isSome(): boolean {
    return true
  }

  isNone(): boolean {
    return false
  }

  contains(value: T): boolean {
    return this.value === value
  }

  map<U>(fn: (value: T) => U): Option<U> {
    return some(fn(this.value))
  }

  andThen<U>(fn: (value: T) => Option<U>): Option<U> {
    return fn(this.value)
  }

  filter(predicate: (value: T) => boolean): Option<T> {
    return predicate(this.value) ? this : NONE
  }

  zip<U>(other: Option<U>): Option<[T, U]> {
    return other.match({
      some: (otherValue) => some([this.value, otherValue]),
      none: () => NONE,
    })
  }

  flatten(): Option<Unwrap<T>> {
    return isOption<Unwrap<T>>(this.value) ? this.value : some(this.value as Unwrap<T>)
  }

  orElse(): Option<T> {
    return this
  }

  unwrapOr(): T {
    return this.value
  }

  unwrapOrElse(): T {
    return this.value
  }

  match<U>(branches: { some: (value: T) => U; none: () => U }): U {
    return branches.some(this.value)
  }

  toResult<E>(error: E): Result<T, E> {
    return ok(this.value)
  }

  toAsync(): OptionAsync<T> {
    return OptionAsync.some(this.value)
  }

  sequence(): Option<T[]> {
    return some(this.value instanceof Array ? this.value : [this.value])
  }

  tap(fn: (value: T) => void): Option<T> {
    fn(this.value)
    return this
  }
}

// OptionAsync implementation
export class OptionAsync<T> implements OptionAsync<T> {
  private constructor(private readonly promise: Promise<Option<T>>) {}

  static some<T>(value: MaybePromise<T>): OptionAsync<T> {
    return new OptionAsync(Promise.resolve(value).then((v) => some(v)))
  }

  static none<T>(): OptionAsync<T> {
    return new OptionAsync(Promise.resolve(NONE as Option<T>))
  }

  static from<T>(value: MaybePromise<T | null | undefined>): OptionAsync<T> {
    return new OptionAsync(Promise.resolve(value).then((v) => (v == null ? NONE : some(v))))
  }

  static try<T>(fn: () => MaybePromise<T>): OptionAsync<T> {
    return new OptionAsync(
      Promise.resolve()
        .then(() => fn())
        .then((value) => some(value))
        .catch(() => NONE as Option<T>)
    )
  }

  async isSome(): Promise<boolean> {
    return (await this.promise).isSome()
  }

  async isNone(): Promise<boolean> {
    return (await this.promise).isNone()
  }

  async contains(value: T): Promise<boolean> {
    return (await this.promise).contains(value)
  }

  async map<U>(fn: (value: T) => MaybePromise<U>): Promise<Option<U>> {
    const opt = await this.promise
    return opt.map((value) => Promise.resolve(fn(value))) as Option<U>
  }

  async andThen<U>(fn: (value: T) => OptionLike<U>): Promise<Option<U>> {
    const opt = await this.promise
    if (opt.isNone()) return NONE
    const result = await fn(opt.unwrapOr(undefined as never))
    return result instanceof OptionAsync ? result.promise : result
  }

  async filter(predicate: (value: T) => MaybePromise<boolean>): Promise<Option<T>> {
    const opt = await this.promise
    if (opt.isNone()) return NONE
    return (await predicate(opt.unwrapOr(undefined as never))) ? opt : NONE
  }

  async zip<U>(other: OptionLike<U>): Promise<Option<[T, U]>> {
    const opt = await this.promise
    const otherOpt = await (other instanceof OptionAsync ? other.promise : other)
    return opt.zip(otherOpt)
  }

  async flatten(): Promise<Option<Unwrap<T>>> {
    const opt = await this.promise
    return opt.flatten()
  }

  async orElse(fn: () => OptionLike<T>): Promise<Option<T>> {
    const opt = await this.promise
    if (opt.isSome()) return opt
    const result = await fn()
    return result instanceof OptionAsync ? result.promise : result
  }

  async unwrapOr(defaultValue: MaybePromise<T>): Promise<T> {
    return (await this.promise).unwrapOr(await Promise.resolve(defaultValue))
  }

  async unwrapOrElse(fn: () => MaybePromise<T>): Promise<T> {
    return (await this.promise).unwrapOrElse(() => Promise.resolve(fn()) as T)
  }

  async match<U>(branches: {
    some: (value: T) => MaybePromise<U>
    none: () => MaybePromise<U>
  }): Promise<U> {
    const opt = await this.promise
    return opt.match({
      some: (value) => Promise.resolve(branches.some(value)) as U,
      none: () => Promise.resolve(branches.none()) as U,
    })
  }

  async toResult<E>(error: MaybePromise<E>): Promise<ResultAsync<T, E>> {
    const opt = await this.promise
    return new ResultAsync(Promise.resolve(opt.toResult(await error)))
  }

  async sequence(): Promise<Option<T[]>> {
    return (await this.promise).sequence()
  }

  async tap(fn: (value: T) => MaybePromise<void>): Promise<Option<T>> {
    const opt = await this.promise
    if (opt.isSome()) await fn(opt.unwrapOr(undefined as never))
    return opt
  }
}

// Constructors
export function some<T>(value: T): Option<T> {
  return new Some(value)
}

export function none<T>(): Option<T> {
  return NONE as Option<T>
}

export function from<T>(value: T | null | undefined): Option<T> {
  return value == null ? NONE : some(value)
}

export function tryOption<T, E>(fn: () => T, onError?: (e: unknown) => E): Option<T> {
  try {
    return some(fn())
  } catch (e) {
    if (onError) onError(e)
    return NONE
  }
}

import { Result, ResultAsync } from './result'
import { Unwrap, MaybePromise, OptionLike } from './types'

interface OptionAsync<T> {
  isSome(): Promise<boolean>
  isNone(): Promise<boolean>
  contains(value: T): Promise<boolean>
  map<U>(fn: (value: T) => MaybePromise<U>): OptionAsync<U>
  andThen<U>(fn: (value: T) => OptionLike<U>): OptionAsync<U>
  filter(predicate: (value: T) => MaybePromise<boolean>): OptionAsync<T>
  zip<U>(other: OptionLike<U>): OptionAsync<[T, U]>
  flatten(): OptionAsync<Unwrap<T>>
  orElse(fn: () => OptionLike<T>): OptionAsync<T>
  unwrapOr(defaultValue: MaybePromise<T>): Promise<T>
  unwrapOrElse(fn: () => MaybePromise<T>): Promise<T>
  match<U>(branches: { some: (value: T) => MaybePromise<U>; none: () => MaybePromise<U> }): Promise<U>
  toResult<E>(error: MaybePromise<E>): ResultAsync<T, E>
  sequence(): OptionAsync<T[]>
  tap(fn: (value: T) => MaybePromise<void>): OptionAsync<T>
  pipe<U>(...fns: Array<(arg: Option<T>) => MaybePromise<Option<U>>>): Promise<Option<U>>
}

class Option<T> {
  private constructor(private readonly isSomeFlag: boolean, private readonly value?: T) {}

  private static readonly NONE = new Option<never>(false)

  static some<T>(value: T): Option<T> {
    return new Option(true, value)
  }

  static none<T>(): Option<T> {
    return this.NONE as Option<T>
  }

  static from<T>(value: T | null | undefined): Option<T> {
    return value == null ? this.NONE : new Option(true, value)
  }

  static try<T>(fn: () => T): Option<T> {
    try {
      return new Option(true, fn())
    } catch {
      return this.NONE
    }
  }

  isSome(): boolean {
    return this.isSomeFlag
  }

  isNone(): boolean {
    return !this.isSomeFlag
  }

  contains(value: T): boolean {
    return this.isSomeFlag && this.value === value
  }

  map<U>(fn: (value: T) => U): Option<U> {
    return this.isSomeFlag ? new Option(true, fn(this.value!)) : Option.none()
  }

  andThen<U>(fn: (value: T) => Option<U>): Option<U> {
    return this.isSomeFlag ? fn(this.value!) : Option.none()
  }

  filter(predicate: (value: T) => boolean): Option<T> {
    return this.isSomeFlag && predicate(this.value!) ? this : Option.none()
  }

  zip<U>(other: Option<U>): Option<[T, U]> {
    return this.match({
      some: (value1) =>
        other.match({
          some: (value2) => Option.some([value1, value2]),
          none: () => Option.none(),
        }),
      none: () => Option.none(),
    })
  }

  flatten(): Option<Unwrap<T>> {
    if (!this.isSomeFlag) return Option.none()
    const inner = this.value
    return inner instanceof Option ? inner.flatten() : new Option(true, inner as Unwrap<T>)
  }

  orElse(fn: () => Option<T>): Option<T> {
    return this.isSomeFlag ? this : fn()
  }

  unwrapOr(defaultValue: T): T {
    return this.isSomeFlag ? this.value! : defaultValue
  }

  unwrapOrElse(fn: () => T): T {
    return this.isSomeFlag ? this.value! : fn()
  }

  match<U>(branches: { some: (value: T) => U; none: () => U }): U {
    return this.isSomeFlag ? branches.some(this.value!) : branches.none()
  }

  toResult<E>(error: E): Result<T, E> {
    return this.isSomeFlag ? Result.ok(this.value!) : Result.err(error)
  }

  toAsync(): OptionAsync<T> {
    return this.isSomeFlag ? OptionAsync.some(this.value!) : OptionAsync.none()
  }

  sequence(): Option<T[]> {
    return this.isSomeFlag
      ? new Option(true, Array.isArray(this.value) ? (this.value as T[]) : [this.value!])
      : new Option(true, [])
  }

  tap(fn: (value: T) => void): Option<T> {
    if (this.isSomeFlag) fn(this.value!)
    return this
  }

  pipe<U>(...fns: Array<(arg: Option<T>) => MaybePromise<Option<U>>>): MaybePromise<Option<U>> {
    let result: MaybePromise<Option<any>> = Promise.resolve(this)
    for (const fn of fns) {
      result = Promise.resolve(result).then((opt) => fn(opt as Option<T>))
    }
    return result as MaybePromise<Option<U>>
  }
}

function isOption<T>(value: any): value is Option<T> {
  return value instanceof Option
}

class OptionAsync<T> implements OptionAsync<T> {
  private constructor(private readonly promise: Promise<Option<T>>) {}

  static some<T>(value: MaybePromise<T>): OptionAsync<T> {
    return new OptionAsync(Promise.resolve(value).then((v) => Option.some(v)))
  }

  static none<T>(): OptionAsync<T> {
    return new OptionAsync(Promise.resolve(Option.none()))
  }

  static from<T>(value: MaybePromise<T | null | undefined>): OptionAsync<T> {
    return new OptionAsync(Promise.resolve(value).then((v) => Option.from(v)))
  }

  static try<T>(fn: () => MaybePromise<T>): OptionAsync<T> {
    return new OptionAsync(
      Promise.resolve()
        .then(() => fn())
        .then((value) => Option.some(value))
        .catch(() => Option.none())
    )
  }

  isSome(): Promise<boolean> {
    return this.promise.then((opt) => opt.isSome())
  }

  isNone(): Promise<boolean> {
    return this.promise.then((opt) => opt.isNone())
  }

  contains(value: T): Promise<boolean> {
    return this.promise.then((opt) => opt.contains(value))
  }

  map<U>(fn: (value: T) => MaybePromise<U>): OptionAsync<U> {
    return new OptionAsync(
      this.promise.then((opt) =>
        opt.match({
          some: (value) => Promise.resolve(fn(value)).then((result) => Option.some(result)),
          none: () => Promise.resolve(Option.none()),
        })
      )
    )
  }

  andThen<U>(fn: (value: T) => OptionLike<U>): OptionAsync<U> {
    return new OptionAsync(
      this.promise.then((opt) =>
        opt.match({
          some: (value) => {
            const result = fn(value)
            return result instanceof OptionAsync ? result.promise : Promise.resolve(result)
          },
          none: () => Promise.resolve(Option.none()),
        })
      )
    )
  }

  filter(predicate: (value: T) => MaybePromise<boolean>): OptionAsync<T> {
    return new OptionAsync(
      this.promise.then((opt) =>
        opt.match({
          some: (value) => Promise.resolve(predicate(value)).then((result) => (result ? opt : Option.none())),
          none: () => Promise.resolve(Option.none()),
        })
      )
    )
  }

  zip<U>(other: OptionLike<U>): OptionAsync<[T, U]> {
    return new OptionAsync<[T, U]>(
      Promise.all([this.promise, other instanceof OptionAsync ? other.promise : other]).then(([opt, otherOpt]) =>
        opt.match({
          some: (value1) =>
            otherOpt.match({
              some: (value2) => Option.some([value1, value2] as [T, U]),
              none: () => Option.none(),
            }),
          none: () => Option.none(),
        })
      )
    )
  }

  flatten(): OptionAsync<Unwrap<T>> {
    return new OptionAsync(
      this.promise.then((opt) =>
        opt.match({
          some: (value) => {
            if (value instanceof OptionAsync) return value.flatten().promise
            if (isOption(value)) return Promise.resolve(value.flatten())
            return Promise.resolve(Option.some(value as Unwrap<T>))
          },
          none: () => Promise.resolve(Option.none()),
        })
      )
    )
  }

  orElse(fn: () => OptionLike<T>): OptionAsync<T> {
    return new OptionAsync(
      this.promise.then((opt) =>
        opt.match({
          some: () => Promise.resolve(opt),
          none: () => {
            const result = fn()
            return result instanceof OptionAsync ? result.promise : Promise.resolve(result)
          },
        })
      )
    )
  }

  async unwrapOr(defaultValue: MaybePromise<T>): Promise<T> {
    return Promise.all([this.promise, Promise.resolve(defaultValue)]).then(([opt, def]) => opt.unwrapOr(def))
  }

  async unwrapOrElse(fn: () => MaybePromise<T>): Promise<T> {
    return this.promise.then((opt) =>
      opt.match({
        some: (value) => Promise.resolve(value),
        none: () => Promise.resolve(fn()),
      })
    )
  }

  async match<U>(branches: { some: (value: T) => MaybePromise<U>; none: () => MaybePromise<U> }): Promise<U> {
    return this.promise.then((opt) =>
      opt.match({
        some: (value) => Promise.resolve(branches.some(value)),
        none: () => Promise.resolve(branches.none()),
      })
    )
  }

  toResult<E>(error: MaybePromise<E>): ResultAsync<T, E> {
    return new ResultAsync(
      this.promise.then((opt) =>
        opt.match({
          some: (value) => Promise.resolve(Result.ok(value)),
          none: () => Promise.resolve(error).then((err) => Result.err(err)),
        })
      )
    )
  }

  sequence(): OptionAsync<T[]> {
    return new OptionAsync<T[]>(
      this.promise.then((opt) =>
        opt.match({
          some: (value) => Option.some(Array.isArray(value) ? value : ([value] as T[])),
          none: () => Option.some([] as T[]),
        })
      )
    )
  }

  tap(fn: (value: T) => MaybePromise<void>): OptionAsync<T> {
    return new OptionAsync(
      this.promise.then((opt) =>
        opt.match({
          some: (value) => Promise.resolve(fn(value)).then(() => opt),
          none: () => Promise.resolve(opt),
        })
      )
    )
  }

  pipe<U>(...fns: Array<(arg: Option<any>) => MaybePromise<Option<U>>>): Promise<Option<U>> {
    let result: Promise<Option<any>> = this.promise
    for (const fn of fns) {
      result = result.then((opt) => fn(opt))
    }
    return result as Promise<Option<U>>
  }
}

function isOptionAsync<T>(value: any): value is OptionAsync<T> {
  return value instanceof OptionAsync
}

export { Option, OptionAsync, isOption, isOptionAsync }

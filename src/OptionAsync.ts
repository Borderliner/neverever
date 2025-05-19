import { Result } from './Result'
import { ResultAsync } from './ResultAsync'
import { Option, isOption } from './Option'
import { MaybePromise, OptionLike, Unwrap } from './types'

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

export { OptionAsync, isOptionAsync }

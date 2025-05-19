import { OptionAsync } from './OptionAsync'
import { Result } from './Result'
import { MaybePromise, Unwrap } from './types'

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
    return inner instanceof Option ? inner.flatten() : new Option<Unwrap<T>>(true, inner as Unwrap<T>)
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
      ? new Option<T[]>(true, Array.isArray(this.value) ? (this.value as T[]) : [this.value!])
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

export { Option, isOption }

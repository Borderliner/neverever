// Option.ts

import { OptionAsync } from './OptionAsync'
import { Result } from './Result'
import { CombineSomes, CombineSomesObject, FlattenOption, MaybePromise, OptionLike } from './types'
import { display } from './utils'

/**
 * A class representing an optional value that may or may not be present.
 * It can either be `Some` (containing a value) or `None` (no value).
 * Useful for handling nullable or undefined values safely.
 *
 * @template T The type of the value contained in the Option.
 */
class Option<T> {
  private constructor(
    private readonly isSomeFlag: boolean,
    /**
     * The contained value. Present (`T`) when the Option is `Some`, `undefined` when `None`.
     * Prefer narrowing with {@link Option.isSome} (which refines this to `T`) or
     * {@link Option.match}/{@link Option.unwrapOr} over reading it directly.
     */
    readonly value?: T
  ) {}

  private static readonly NONE = new Option<never>(false)

  /**
   * Creates an Option containing a value (`Some`).
   *
   * @template T The type of the value.
   * @param value The value to wrap in an Option.
   * @returns An Option containing the provided value.
   *
   * @example
   * const someValue = Option.some(42);
   * console.log(someValue.isSome()); // true
   * console.log(someValue.unwrapOr(0)); // 42
   */
  static some<T>(value: T): Option<T> {
    return new Option(true, value)
  }

  /**
   * Creates an Option representing the absence of a value (`None`).
   *
   * @template T The type of the value that would be contained.
   * @returns An Option representing `None`.
   *
   * @example
   * const noneValue = Option.none<number>();
   * console.log(noneValue.isSome()); // false
   * console.log(noneValue.unwrapOr(0)); // 0
   */
  static none<T>(): Option<T> {
    return this.NONE as Option<T>
  }

  /**
   * Creates an Option from a potentially null or undefined value.
   * Returns `Some` if the value is neither null nor undefined, otherwise `None`.
   *
   * @template T The type of the value.
   * @param value The value to convert to an Option.
   * @returns An Option containing the value or `None` if the value is null/undefined.
   *
   * @example
   * const someValue = Option.from(42); // Some(42)
   * const noneValue = Option.from(null); // None
   * const undefinedValue = Option.from(undefined); // None
   */
  static from<T>(value: T | null | undefined): Option<T> {
    return value == null ? this.NONE : new Option(true, value)
  }

  /**
   * Creates an Option by executing a function and catching any errors.
   * Returns `Some` with the function's result if it succeeds, or `None` if it throws.
   *
   * @template T The type of the value returned by the function.
   * @param fn The function to execute.
   * @returns An Option containing the result or `None` if an error occurs.
   *
   * @example
   * const safeParse = Option.try(() => JSON.parse('{"key": "value"}')); // Some({ key: "value" })
   * const failedParse = Option.try(() => JSON.parse('invalid')); // None
   */
  static try<T>(fn: () => T): Option<T> {
    try {
      return new Option(true, fn())
    } catch {
      return this.NONE
    }
  }

  /**
   * Combines an array of `Option`s into a single `Option` of an array.
   * Returns `None` if any element is `None`, otherwise `Some` with every value in order.
   *
   * @template T The type of the values.
   * @param options The array of `Option`s to combine.
   * @returns `Some` with all values, or `None`.
   *
   * Accepts either a tuple/array of `Option`s (tuple element types are preserved) or a record
   * of `Option`s keyed by name.
   *
   * @example
   * Option.combine([Option.some(1), Option.some('a')]); // Option<[number, string]>
   * Option.combine({ id: Option.some(1), name: Option.some('a') }); // Option<{ id: number; name: string }>
   * Option.combine([Option.some(1), Option.none<number>()]); // None
   */
  static combine<T extends readonly Option<unknown>[] | []>(options: T): Option<CombineSomes<T>>
  static combine<T extends Record<string, Option<unknown>>>(options: T): Option<CombineSomesObject<T>>
  static combine(options: ReadonlyArray<Option<unknown>> | Record<string, Option<unknown>>): Option<unknown> {
    if (Array.isArray(options)) {
      const values: unknown[] = []
      for (const option of options) {
        if (option.isNone()) return Option.none()
        values.push(option.value)
      }
      return new Option(true, values)
    }
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(options)) {
      const option = (options as Record<string, Option<unknown>>)[key]
      if (option.isNone()) return Option.none()
      out[key] = option.value
    }
    return new Option(true, out)
  }

  /**
   * Checks if the Option is `Some` (contains a value).
   *
   * @returns `true` if the Option is `Some`, `false` if it is `None`.
   *
   * @example
   * const some = Option.some(42);
   * const none = Option.none<number>();
   * console.log(some.isSome()); // true
   * console.log(none.isSome()); // false
   */
  isSome(): this is Option<T> & { readonly value: T } {
    return this.isSomeFlag
  }

  /**
   * Checks if the Option is `None` (contains no value).
   *
   * @returns `true` if the Option is `None`, `false` if it is `Some`.
   *
   * @example
   * const some = Option.some(42);
   * const none = Option.none<number>();
   * console.log(some.isNone()); // false
   * console.log(none.isNone()); // true
   */
  isNone(): boolean {
    return !this.isSomeFlag
  }

  /**
   * Checks if the Option is `Some` and contains a specific value.
   *
   * @param value The value to compare against.
   * @returns `true` if the Option is `Some` and its value equals the provided value, `false` otherwise.
   *
   * @example
   * const some = Option.some(42);
   * console.log(some.contains(42)); // true
   * console.log(some.contains(43)); // false
   * console.log(Option.none<number>().contains(42)); // false
   */
  contains(value: T): boolean {
    return this.isSomeFlag && this.value === value
  }

  /**
   * Transforms the value in a `Some` Option using the provided function.
   * Returns `None` if the Option is `None`.
   *
   * @template U The type of the transformed value.
   * @param fn The function to transform the value.
   * @returns An Option containing the transformed value or `None`.
   *
   * @example
   * const some = Option.some(42);
   * const mapped = some.map(x => x * 2); // Some(84)
   * const none = Option.none<number>().map(x => x * 2); // None
   */
  map<U>(fn: (value: T) => Promise<U>): OptionAsync<U>
  map<U>(fn: (value: T) => U): Option<U>
  map<U>(fn: (value: T) => MaybePromise<U>): Option<U> | OptionAsync<U> {
    if (!this.isSomeFlag) return Option.none()
    const out = fn(this.value!)
    return out instanceof Promise
      ? OptionAsync._fromPromise(out.then((v) => Option.some(v)))
      : new Option(true, out)
  }

  /**
   * Chains an Option by applying a function that returns another Option.
   * Returns `None` if the Option is `None`.
   *
   * @template U The type of the value in the resulting Option.
   * @param fn The function that returns an Option.
   * @returns The resulting Option from the function or `None`.
   *
   * @example
   * const some = Option.some(42);
   * const none = Option.none<number>();
   * const toOption = (x: number) => x > 0 ? Option.some(x * 2) : Option.none();
   * console.log(some.andThen(toOption)); // Some(84)
   * console.log(none.andThen(toOption)); // None
   */
  andThen<U>(fn: (value: T) => Option<U>): Option<U>
  andThen<U>(fn: (value: T) => OptionAsync<U> | Promise<Option<U>>): OptionAsync<U>
  andThen<U>(fn: (value: T) => OptionLike<U>): Option<U> | OptionAsync<U> {
    if (!this.isSomeFlag) return Option.none()
    const next = fn(this.value!)
    if (next instanceof OptionAsync) return next
    if (next instanceof Promise) return OptionAsync._fromPromise(next)
    return next
  }

  /**
   * Filters the Option based on a predicate. Returns the original `Some` if the predicate is true, otherwise `None`.
   *
   * @param predicate The function to test the value.
   * @returns The original Option if the predicate passes, otherwise `None`.
   *
   * @example
   * const some = Option.some(42);
   * const none = Option.none<number>();
   * console.log(some.filter(x => x > 40)); // Some(42)
   * console.log(some.filter(x => x < 40)); // None
   * console.log(none.filter(x => x > 40)); // None
   */
  filter(predicate: (value: T) => Promise<boolean>): OptionAsync<T>
  filter(predicate: (value: T) => boolean): Option<T>
  filter(predicate: (value: T) => MaybePromise<boolean>): Option<T> | OptionAsync<T> {
    if (!this.isSomeFlag) return this
    const verdict = predicate(this.value!)
    if (verdict instanceof Promise) {
      return OptionAsync._fromPromise(verdict.then((ok) => (ok ? (this as Option<T>) : Option.none<T>())))
    }
    return verdict ? this : Option.none()
  }

  /**
   * Combines two Options into a single Option containing a tuple of their values.
   * Returns `None` if either Option is `None`.
   *
   * @template U The type of the value in the other Option.
   * @param other The other Option to combine with.
   * @returns An Option containing a tuple of values or `None`.
   *
   * @example
   * const some1 = Option.some(42);
   * const some2 = Option.some("hello");
   * const none = Option.none<string>();
   * console.log(some1.zip(some2)); // Some([42, "hello"])
   * console.log(some1.zip(none)); // None
   */
  zip<U>(other: Option<U>): Option<[T, U]>
  zip<U>(other: OptionAsync<U> | Promise<Option<U>>): OptionAsync<[T, U]>
  zip<U>(other: OptionLike<U>): Option<[T, U]> | OptionAsync<[T, U]> {
    if (other instanceof OptionAsync || other instanceof Promise) {
      return this.toAsync().zip(other)
    }
    return this.match({
      some: (value1) =>
        other.match({
          some: (value2) => Option.some([value1, value2] as [T, U]),
          none: () => Option.none<[T, U]>(),
        }),
      none: () => Option.none<[T, U]>(),
    })
  }

  /**
   * Flattens a nested Option into a single Option.
   * If the Option is `Some` and contains another Option, it recursively flattens it.
   *
   * @returns A flattened Option.
   *
   * @example
   * const nested = Option.some(Option.some(42));
   * console.log(nested.flatten()); // Some(42)
   * console.log(Option.some(42).flatten()); // Some(42)
   * console.log(Option.none().flatten()); // None
   */
  flatten(): FlattenOption<T> {
    if (!this.isSomeFlag) return Option.none() as FlattenOption<T>
    const inner = this.value
    return (inner instanceof Option ? inner.flatten() : new Option<unknown>(true, inner)) as FlattenOption<T>
  }

  /**
   * Returns the current Option if it is `Some`, otherwise returns the result of the provided function.
   *
   * @param fn The function to provide a fallback Option.
   * @returns The current Option or the fallback Option.
   *
   * @example
   * const some = Option.some(42);
   * const none = Option.none<number>();
   * console.log(some.orElse(() => Option.some(0))); // Some(42)
   * console.log(none.orElse(() => Option.some(0))); // Some(0)
   */
  orElse(fn: () => Option<T>): Option<T>
  orElse(fn: () => OptionAsync<T> | Promise<Option<T>>): OptionAsync<T>
  orElse(fn: () => OptionLike<T>): Option<T> | OptionAsync<T> {
    if (this.isSomeFlag) return this
    const next = fn()
    if (next instanceof OptionAsync) return next
    if (next instanceof Promise) return OptionAsync._fromPromise(next)
    return next
  }

  /**
   * Returns the value if the Option is `Some`, otherwise returns the provided default value.
   *
   * @param defaultValue The value to return if the Option is `None`.
   * @returns The value of `Some` or the default value.
   *
   * @example
   * const some = Option.some(42);
   * const none = Option.none<number>();
   * console.log(some.unwrapOr(0)); // 42
   * console.log(none.unwrapOr(0)); // 0
   */
  unwrapOr(defaultValue: T): T {
    return this.isSomeFlag ? this.value! : defaultValue
  }

  /**
   * Returns the value if the Option is `Some`, otherwise returns the result of the provided function.
   *
   * @param fn The function to compute the default value.
   * @returns The value of `Some` or the computed default value.
   *
   * @example
   * const some = Option.some(42);
   * const none = Option.none<number>();
   * console.log(some.unwrapOrElse(() => 0)); // 42
   * console.log(none.unwrapOrElse(() => 0)); // 0
   */
  unwrapOrElse(fn: () => T): T {
    return this.isSomeFlag ? this.value! : fn()
  }

  /**
   * Applies `fn` to the `Some` value, or returns `defaultValue` if `None` — in one step.
   *
   * @example
   * Option.some(2).mapOr(0, (x) => x * 10); // 20
   * Option.none<number>().mapOr(0, (x) => x * 10); // 0
   */
  mapOr<U>(defaultValue: U, fn: (value: T) => U): U {
    return this.isSomeFlag ? fn(this.value!) : defaultValue
  }

  /**
   * Applies `fn` to the `Some` value, or computes `onNone()` if `None` — in one step.
   *
   * @example
   * Option.none<number>().mapOrElse(() => -1, (x) => x * 10); // -1
   */
  mapOrElse<U>(onNone: () => U, fn: (value: T) => U): U {
    return this.isSomeFlag ? fn(this.value!) : onNone()
  }

  /**
   * Unsafe escape hatch: returns the `Some` value, or throws if the Option is `None`.
   * Prefer {@link Option.unwrapOr}/{@link Option.match} in production code.
   *
   * @returns The contained `Some` value.
   * @throws If the Option is `None`.
   *
   * @example
   * console.log(Option.some(42).unwrap()); // 42
   * Option.none().unwrap(); // throws
   */
  unwrap(): T {
    if (this.isSomeFlag) return this.value!
    throw new Error('Called unwrap() on a None value')
  }

  /**
   * Unsafe escape hatch: returns the `Some` value, or throws an `Error` with `message` if `None`.
   *
   * @param message The error message to throw with when the Option is `None`.
   * @returns The contained `Some` value.
   * @throws If the Option is `None`.
   *
   * @example
   * console.log(Option.some(42).expect('must be present')); // 42
   */
  expect(message: string): T {
    if (this.isSomeFlag) return this.value!
    throw new Error(message)
  }

  /**
   * Pattern-matches the Option, executing the appropriate branch based on whether it is `Some` or `None`.
   *
   * @template U The type of the result.
   * @param branches An object with `some` and `none` branches.
   * @returns The result of the executed branch.
   *
   * @example
   * const some = Option.some(42);
   * const none = Option.none<number>();
   * console.log(some.match({
   *   some: x => `Value: ${x}`,
   *   none: () => 'No value'
   * })); // "Value: 42"
   * console.log(none.match({
   *   some: x => `Value: ${x}`,
   *   none: () => 'No value'
   * })); // "No value"
   */
  match<U>(branches: { some: (value: T) => U; none: () => U }): U {
    return this.isSomeFlag ? branches.some(this.value!) : branches.none()
  }

  /**
   * Converts the Option to a Result, using the provided error value for `None`.
   *
   * @template E The type of the error.
   * @param error The error value to use if the Option is `None`.
   * @returns A Result containing the value or the error.
   *
   * @example
   * const some = Option.some(42);
   * const none = Option.none<number>();
   * console.log(some.toResult('No value')); // Ok(42)
   * console.log(none.toResult('No value')); // Err("No value")
   */
  toResult<E>(error: E): Result<T, E> {
    return this.isSomeFlag ? Result.ok(this.value!) : Result.err(error)
  }

  /**
   * Converts the Option to an OptionAsync, enabling asynchronous operations.
   *
   * @returns An OptionAsync containing the value or `None`.
   *
   * @example
   * const some = Option.some(42);
   * const asyncSome = some.toAsync();
   * asyncSome.mapAsync(x => Promise.resolve(x * 2)).then(console.log); // Some(84)
   */
  toAsync(): OptionAsync<T> {
    return this.isSomeFlag ? OptionAsync.some(this.value!) : OptionAsync.none()
  }

  /**
   * Converts the Option to an Option containing an array.
   * If `Some`, wraps the value in an array; if `None`, returns an empty array.
   *
   * @returns An Option containing an array of values.
   *
   * @example
   * const some = Option.some(42);
   * const none = Option.none<number>();
   * console.log(some.sequence()); // Some([42])
   * console.log(none.sequence()); // Some([])
   */
  sequence(): Option<T[]> {
    return this.isSomeFlag
      ? new Option<T[]>(true, Array.isArray(this.value) ? [...this.value] : [this.value!])
      : new Option<T[]>(true, [])
  }

  /**
   * Performs a side effect with the value if the Option is `Some`.
   * Returns the original Option unchanged.
   *
   * @param fn The function to execute with the value.
   * @returns The original Option.
   *
   * @example
   * const some = Option.some(42);
   * some.tap(x => console.log(`Value: ${x}`)); // Logs "Value: 42"
   * console.log(some); // Some(42)
   */
  tap(fn: (value: T) => Promise<void>): OptionAsync<T>
  tap(fn: (value: T) => void): Option<T>
  tap(fn: (value: T) => MaybePromise<void>): Option<T> | OptionAsync<T> {
    if (!this.isSomeFlag) return this
    const out = fn(this.value!)
    return out instanceof Promise ? OptionAsync._fromPromise(out.then(() => this as Option<T>)) : this
  }

  /**
   * Chains multiple Option-transforming functions, supporting asynchronous operations.
   * Each function is applied sequentially to the result of the previous one.
   *
   * @template U The type of the value in the resulting Option.
   * @param fns An array of functions that transform an Option.
   * @returns A Promise resolving to the final Option.
   *
   * @example
   * const some = Option.some(42);
   * const pipeline = some.pipe(
   *   opt => opt.map(x => x * 2),
   *   opt => Promise.resolve(opt.map(x => x + 1))
   * );
   * pipeline.then(console.log); // Some(85)
   */
  pipe<U>(...fns: Array<(arg: Option<T>) => MaybePromise<Option<U>>>): MaybePromise<Option<U>> {
    let result: MaybePromise<Option<any>> = Promise.resolve(this)
    for (const fn of fns) {
      result = Promise.resolve(result).then((opt) => fn(opt as Option<T>))
    }
    return result as MaybePromise<Option<U>>
  }

  /** Alias for {@link Option.tap} (Rust-style naming). */
  inspect(fn: (value: T) => Promise<void>): OptionAsync<T>
  inspect(fn: (value: T) => void): Option<T>
  inspect(fn: (value: T) => MaybePromise<void>): Option<T> | OptionAsync<T> {
    if (!this.isSomeFlag) return this
    const out = fn(this.value!)
    return out instanceof Promise ? OptionAsync._fromPromise(out.then(() => this as Option<T>)) : this
  }

  /** Returns a readable representation, e.g. `Some(42)` or `None`. */
  toString(): string {
    return this.isSomeFlag ? `Some(${display(this.value)})` : 'None'
  }

  /** Node's `util.inspect` hook, so `console.log` prints `Some(42)`/`None`. */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return this.toString()
  }

  /** JSON representation: `{ type: 'Some', value }` or `{ type: 'None' }`. */
  toJSON(): { type: 'Some'; value: T } | { type: 'None' } {
    return this.isSomeFlag ? { type: 'Some', value: this.value! } : { type: 'None' }
  }
}

/**
 * Type guard to check if a value is an instance of Option.
 *
 * @template T The type of the value in the Option.
 * @param value The value to check.
 * @returns `true` if the value is an Option, `false` otherwise.
 *
 * @example
 * const some = Option.some(42);
 * console.log(isOption(some)); // true
 * console.log(isOption(42)); // false
 */
function isOption<T>(value: any): value is Option<T> {
  return value instanceof Option
}

export { Option, isOption }

import { err, ok, Result, ResultAsync } from 'neverthrow'
import { Unwrap, MaybePromise, OptionLike, ResultLike, IsPromise } from './types'

/**
 * Represents an optional value that may contain a value (`Some`) or be empty (`None`).
 * The `Option<T>` type is used for safe handling of potentially missing values in a type-safe manner.
 * @template T The type of the value contained in the Option.
 */
export interface Option<T> {
  /**
   * Checks if the Option contains a value (`Some`).
   * @returns `true` if the Option is `Some`, `false` if it is `None`.
   * @example
   * ```typescript
   * import { some, none } from 'neverever';
   * const opt1 = some(42);
   * const opt2 = none<number>();
   * console.log(opt1.isSome()); // true
   * console.log(opt2.isSome()); // false
   * ```
   */
  isSome(): boolean

  /**
   * Checks if the Option is empty (`None`).
   * @returns `true` if the Option is `None`, `false` if it is `Some`.
   * @example
   * ```typescript
   * import { some, none } from 'neverever';
   * const opt1 = some('hello');
   * const opt2 = none<string>();
   * console.log(opt1.isNone()); // false
   * console.log(opt2.isNone()); // true
   * ```
   */
  isNone(): boolean

  /**
   * Checks if the Option contains a specific value.
   * @param value The value to compare against.
   * @returns `true` if the Option is `Some` and contains the given value, `false` otherwise.
   * @example
   * ```typescript
   * import { some, none } from 'neverever';
   * const opt = some('world');
   * console.log(opt.contains('world')); // true
   * console.log(opt.contains('hello')); // false
   * console.log(none<string>().contains('world')); // false
   * ```
   */
  contains(value: T): boolean

  /**
   * Transforms the contained value using a function, returning a new Option.
   * If the Option is `None`, returns `None`.
   * @template U The type of the transformed value.
   * @param fn A function to transform the contained value.
   * @returns A new `Option<U>` containing the transformed value or `None`.
   * @example
   * ```typescript
   * import { some, none } from 'neverever';
   * const opt = some(5);
   * const mapped = opt.map(n => n * 2);
   * console.log(mapped.unwrapOr(0)); // 10
   * console.log(none<number>().map(n => n * 2).unwrapOr(0)); // 0
   * ```
   */
  map<U>(fn: (value: T) => U): Option<U>

  /**
   * Chains the Option with a function that returns another Option.
   * If the Option is `None`, returns `None`.
   * @template U The type of the value in the returned Option.
   * @param fn A function that takes the contained value and returns an `Option<U>`.
   * @returns The Option returned by the function or `None`.
   * @example
   * ```typescript
   * import { some, none, from } from 'neverever';
   * const opt = some('hello');
   * const chained = opt.andThen(s => from(s.toUpperCase()));
   * console.log(chained.unwrapOr('')); // 'HELLO'
   * console.log(none<string>().andThen(s => some(s)).unwrapOr('')); // ''
   * ```
   */
  andThen<U>(fn: (value: T) => Option<U>): Option<U>

  /**
   * Filters the Option based on a predicate. If the predicate returns `false` or the Option is `None`, returns `None`.
   * @param predicate A function to test the contained value.
   * @returns The original Option if the predicate passes, `None` otherwise.
   * @example
   * ```typescript
   * import { some, none } from 'neverever';
   * const opt = some(10);
   * const filtered = opt.filter(n => n > 5);
   * console.log(filtered.unwrapOr(0)); // 10
   * console.log(opt.filter(n => n > 15).unwrapOr(0)); // 0
   * console.log(none<number>().filter(n => n > 5).unwrapOr(0)); // 0
   * ```
   */
  filter(predicate: (value: T) => boolean): Option<T>

  /**
   * Combines this Option with another, returning an Option containing a tuple of both values if both are `Some`.
   * If either Option is `None`, returns `None`.
   * @template U The type of the value in the other Option.
   * @param other The other Option to combine with.
   * @returns An `Option<[T, U]>` containing both values or `None`.
   * @example
   * ```typescript
   * import { some, none } from 'neverever';
   * const opt1 = some('hello');
   * const opt2 = some(42);
   * const zipped = opt1.zip(opt2);
   * console.log(zipped.unwrapOr(['', 0])); // ['hello', 42]
   * console.log(opt1.zip(none<number>()).unwrapOr(['', 0])); // ['', 0]
   * ```
   */
  zip<U>(other: Option<U>): Option<[T, U]>

  /**
   * Unwraps a nested Option, returning the inner Option if `Some`, or `None` if the value is not an Option.
   * @returns An `Option<Unwrap<T>>` containing the unwrapped value.
   * @example
   * ```typescript
   * import { some, none } from 'neverever';
   * const nested = some(some(42));
   * const flat = nested.flatten();
   * console.log(flat.unwrapOr(0)); // 42
   * console.log(some(42).flatten().unwrapOr(0)); // 42
   * console.log(none<number>().flatten().unwrapOr(0)); // 0
   * ```
   */
  flatten(): Option<Unwrap<T>>

  /**
   * Returns this Option if `Some`, otherwise evaluates the provided function to return an alternative Option.
   * @param fn A function that returns an alternative `Option<T>`.
   * @returns This Option if `Some`, or the result of `fn` if `None`.
   * @example
   * ```typescript
   * import { some, none } from 'neverever';
   * const opt = none<string>();
   * const alternative = opt.orElse(() => some('default'));
   * console.log(alternative.unwrapOr('')); // 'default'
   * console.log(some('value').orElse(() => some('default')).unwrapOr('')); // 'value'
   * ```
   */
  orElse(fn: () => Option<T>): Option<T>

  /**
   * Returns the contained value if `Some`, otherwise returns the provided default value.
   * @param defaultValue The value to return if the Option is `None`.
   * @returns The contained value or the default value.
   * @example
   * ```typescript
   * import { some, none } from 'neverever';
   * const opt = some('hello');
   * console.log(opt.unwrapOr('default')); // 'hello'
   * console.log(none<string>().unwrapOr('default')); // 'default'
   * ```
   */
  unwrapOr(defaultValue: T): T

  /**
   * Returns the contained value if `Some`, otherwise evaluates the provided function to return a default value.
   * @param fn A function that returns the default value.
   * @returns The contained value or the result of `fn`.
   * @example
   * ```typescript
   * import { some, none } from 'neverever';
   * const opt = none<string>();
   * console.log(opt.unwrapOrElse(() => 'default')); // 'default'
   * console.log(some('value').unwrapOrElse(() => 'default')); // 'value'
   * ```
   */
  unwrapOrElse(fn: () => T): T

  /**
   * Matches the Option to either a `some` or `none` branch, returning the result of the corresponding branch.
   * @template U The type of the result.
   * @param branches An object with `some` and `none` functions to handle each case.
   * @returns The result of the `some` or `none` branch.
   * @example
   * ```typescript
   * import { some, none } from 'neverever';
   * const opt = some(42);
   * const result = opt.match({
   *   some: (value) => `Value: ${value}`,
   *   none: () => 'No value'
   * });
   * console.log(result); // 'Value: 42'
   * console.log(none<number>().match({ some: v => v, none: () => 0 })); // 0
   * ```
   */
  match<U>(branches: { some: (value: T) => U; none: () => U }): U

  /**
   * Converts the Option to a Result, using the provided error value for `None`.
   * @template E The error type for the Result.
   * @param error The error value to use if the Option is `None`.
   * @returns A `Result<T, E>` containing the value if `Some`, or the error if `None`.
   * @example
   * ```typescript
   * import { some, none } from 'neverever';
   * const opt = some('success');
   * const result = opt.toResult('failed');
   * console.log(result.unwrapOr('')); // 'success'
   * console.log(none<string>().toResult('failed').unwrapOr('')); // ''
   * ```
   */
  toResult<E>(error: E): Result<T, E>

  /**
   * Converts the Option to an asynchronous OptionAsync.
   * @returns An `OptionAsync<T>` wrapping the same value or `None`.
   * @example
   * ```typescript
   * import { some, none } from 'neverever';
   * const opt = some('async');
   * const asyncOpt = opt.toAsync();
   * console.log(await asyncOpt.unwrapOr('')); // 'async'
   * console.log(await none<string>().toAsync().unwrapOr('')); // ''
   * ```
   */
  toAsync(): OptionAsync<T>

  /**
   * Converts the value to an array, wrapping it in an array if it’s not already one.
   * @returns An `Option<T[]>` containing the value as an array or an empty array for `None`.
   * @example
   * ```typescript
   * import { some, none } from 'neverever';
   * const opt = some(42);
   * console.log(opt.sequence().unwrapOr([])); // [42]
   * console.log(some([1, 2]).sequence().unwrapOr([])); // [1, 2]
   * console.log(none<number>().sequence().unwrapOr([])); // []
   * ```
   */
  sequence(): Option<T[]>

  /**
   * Executes a side-effect function on the contained value if `Some`, then returns the original Option.
   * @param fn A function to execute with the contained value.
   * @returns The original `Option<T>`.
   * @example
   * ```typescript
   * import { some, none } from 'neverever';
   * const opt = some('hello');
   * opt.tap(console.log); // Prints: 'hello'
   * console.log(opt.unwrapOr('')); // 'hello'
   * none<string>().tap(console.log); // No output
   * ```
   */
  tap(fn: (value: T) => void): Option<T>
}

/**
 * Represents an asynchronous optional value that may contain a value (`Some`) or be empty (`None`).
 * The `OptionAsync<T>` type is used for safe handling of potentially missing values in asynchronous contexts.
 * @template T The type of the value contained in the OptionAsync.
 */
export interface OptionAsync<T> {
  /**
   * Checks if the OptionAsync contains a value (`Some`).
   * @returns A `Promise<boolean>` resolving to `true` if `Some`, `false` if `None`.
   * @example
   * ```typescript
   * import { OptionAsync } from 'neverever';
   * const opt = OptionAsync.some('data');
   * console.log(await opt.isSome()); // true
   * console.log(await OptionAsync.none<string>().isSome()); // false
   * ```
   */
  isSome(): Promise<boolean>

  /**
   * Checks if the OptionAsync is empty (`None`).
   * @returns A `Promise<boolean>` resolving to `true` if `None`, `false` if `Some`.
   * @example
   * ```typescript
   * import { OptionAsync } from 'neverever';
   * const opt = OptionAsync.some(42);
   * console.log(await opt.isNone()); // false
   * console.log(await OptionAsync.none<number>().isNone()); // true
   * ```
   */
  isNone(): Promise<boolean>

  /**
   * Checks if the OptionAsync contains a specific value.
   * @param value The value to compare against.
   * @returns A `Promise<boolean>` resolving to `true` if `Some` and contains the value, `false` otherwise.
   * @example
   * ```typescript
   * import { OptionAsync } from 'neverever';
   * const opt = OptionAsync.some('test');
   * console.log(await opt.contains('test')); // true
   * console.log(await opt.contains('other')); // false
   * console.log(await OptionAsync.none<string>().contains('test')); // false
   * ```
   */
  contains(value: T): Promise<boolean>

  /**
   * Transforms the contained value using an asynchronous function, returning a new OptionAsync.
   * If the OptionAsync is `None`, returns `None`.
   * @template U The type of the transformed value.
   * @param fn A function to transform the contained value, which may return a Promise.
   * @returns A `Promise<Option<U>>` containing the transformed value or `None`.
   * @example
   * ```typescript
   * import { OptionAsync } from 'neverever';
   * const opt = OptionAsync.some(5);
   * const mapped = await opt.map(async n => n * 2);
   * console.log(mapped.unwrapOr(0)); // 10
   * console.log(await (await OptionAsync.none<number>().map(async n => n * 2)).unwrapOr(0)); // 0
   * ```
   */
  map<U>(fn: (value: T) => MaybePromise<U>): Promise<Option<U>>

  /**
   * Chains the OptionAsync with a function that returns another Option or OptionAsync.
   * If the OptionAsync is `None`, returns `None`.
   * @template U The type of the value in the returned Option.
   * @param fn A function that takes the contained value and returns an `OptionLike<U>`.
   * @returns A `Promise<Option<U>>` containing the result of the function or `None`.
   * @example
   * ```typescript
   * import { OptionAsync, some } from 'neverever';
   * const opt = OptionAsync.some('hello');
   * const chained = await opt.andThen(s => some(s.toUpperCase()));
   * console.log(chained.unwrapOr('')); // 'HELLO'
   * console.log(await (await OptionAsync.none<string>().andThen(s => some(s))).unwrapOr('')); // ''
   * ```
   */
  andThen<U>(fn: (value: T) => OptionLike<U>): Promise<Option<U>>

  /**
   * Filters the OptionAsync based on an asynchronous predicate. If the predicate returns `false` or the OptionAsync is `None`, returns `None`.
   * @param predicate A function to test the contained value, which may return a Promise.
   * @returns A `Promise<Option<T>>` containing the original value if the predicate passes, `None` otherwise.
   * @example
   * ```typescript
   * import { OptionAsync } from 'neverever';
   * const opt = OptionAsync.some(10);
   * const filtered = await opt.filter(async n => n > 5);
   * console.log(filtered.unwrapOr(0)); // 10
   * console.log((await opt.filter(async n => n > 15)).unwrapOr(0)); // 0
   * console.log((await OptionAsync.none<number>().filter(async n => n > 5)).unwrapOr(0)); // 0
   * ```
   */
  filter(predicate: (value: T) => MaybePromise<boolean>): Promise<Option<T>>

  /**
   * Combines this OptionAsync with another Option or OptionAsync, returning an Option containing a tuple of both values if both are `Some`.
   * If either is `None`, returns `None`.
   * @template U The type of the value in the other Option.
   * @param other The other Option or OptionAsync to combine with.
   * @returns A `Promise<Option<[T, U]>>` containing both values or `None`.
   * @example
   * ```typescript
   * import { OptionAsync, some } from 'neverever';
   * const opt1 = OptionAsync.some('hello');
   * const opt2 = some(42);
   * const zipped = await opt1.zip(opt2);
   * console.log(zipped.unwrapOr(['', 0])); // ['hello', 42]
   * console.log((await opt1.zip(OptionAsync.none<number>())).unwrapOr(['', 0])); // ['', 0]
   * ```
   */
  zip<U>(other: OptionLike<U>): Promise<Option<[T, U]>>

  /**
   * Unwraps a nested OptionAsync, returning the inner Option if `Some`, or `None` if the value is not an Option.
   * @returns A `Promise<Option<Unwrap<T>>>` containing the unwrapped value.
   * @example
   * ```typescript
   * import { OptionAsync, some } from 'neverever';
   * const nested = OptionAsync.some(some(42));
   * const flat = await nested.flatten();
   * console.log(flat.unwrapOr(0)); // 42
   * console.log((await OptionAsync.some(42).flatten()).unwrapOr(0)); // 42
   * console.log((await OptionAsync.none<number>().flatten()).unwrapOr(0)); // 0
   * ```
   */
  flatten(): Promise<Option<Unwrap<T>>>

  /**
   * Returns this OptionAsync if `Some`, otherwise evaluates the provided function to return an alternative Option or OptionAsync.
   * @param fn A function that returns an alternative `OptionLike<T>`.
   * @returns A `Promise<Option<T>>` containing this value if `Some`, or the result of `fn` if `None`.
   * @example
   * ```typescript
   * import { OptionAsync, some } from 'neverever';
   * const opt = OptionAsync.none<string>();
   * const alternative = await opt.orElse(() => some('default'));
   * console.log(alternative.unwrapOr('')); // 'default'
   * console.log((await OptionAsync.some('value').orElse(() => some('default'))).unwrapOr('')); // 'value'
   * ```
   */
  orElse(fn: () => OptionLike<T>): Promise<Option<T>>

  /**
   * Returns the contained value if `Some`, otherwise returns the provided default value.
   * @param defaultValue The value to return if the OptionAsync is `None`, which may be a Promise.
   * @returns A `Promise<T>` containing the value or the default value.
   * @example
   * ```typescript
   * import { OptionAsync } from 'neverever';
   * const opt = OptionAsync.some('hello');
   * console.log(await opt.unwrapOr('default')); // 'hello'
   * console.log(await OptionAsync.none<string>().unwrapOr('default')); // 'default'
   * ```
   */
  unwrapOr(defaultValue: MaybePromise<T>): Promise<T>

  /**
   * Returns the contained value if `Some`, otherwise evaluates the provided function to return a default value.
   * @param fn A function that returns the default value, which may be a Promise.
   * @returns A `Promise<T>` containing the value or the result of `fn`.
   * @example
   * ```typescript
   * import { OptionAsync } from 'neverever';
   * const opt = OptionAsync.none<string>();
   * console.log(await opt.unwrapOrElse(() => 'default')); // 'default'
   * console.log(await OptionAsync.some('value').unwrapOrElse(() => 'default')); // 'value'
   * ```
   */
  unwrapOrElse(fn: () => MaybePromise<T>): Promise<T>

  /**
   * Matches the OptionAsync to either a `some` or `none` branch, returning the result of the corresponding branch.
   * @template U The type of the result.
   * @param branches An object with `some` and `none` functions to handle each case, which may return Promises.
   * @returns A `Promise<U>` containing the result of the `some` or `none` branch.
   * @example
   * ```typescript
   * import { OptionAsync } from 'neverever';
   * const opt = OptionAsync.some(42);
   * const result = await opt.match({
   *   some: async (value) => `Value: ${value}`,
   *   none: async () => 'No value'
   * });
   * console.log(result); // 'Value: 42'
   * console.log(await OptionAsync.none<number>().match({ some: async v => v, none: async () => 0 })); // 0
   * ```
   */
  match<U>(branches: {
    some: (value: T) => MaybePromise<U>
    none: () => MaybePromise<U>
  }): Promise<U>

  /**
   * Converts the OptionAsync to a ResultAsync, using the provided error value for `None`.
   * @template E The error type for the ResultAsync.
   * @param error The error value to use if the OptionAsync is `None`, which may be a Promise.
   * @returns A `Promise<ResultAsync<T, E>>` containing the value if `Some`, or the error if `None`.
   * @example
   * ```typescript
   * import { OptionAsync } from 'neverever';
   * const opt = OptionAsync.some('success');
   * const result = await opt.toResult('failed');
   * console.log(await result.unwrapOr('')); // 'success'
   * console.log(await (await OptionAsync.none<string>().toResult('failed')).unwrapOr('')); // ''
   * ```
   */
  toResult<E>(error: MaybePromise<E>): Promise<ResultAsync<T, E>>

  /**
   * Converts the value to an array, wrapping it in an array if it’s not already one.
   * @returns A `Promise<Option<T[]>>` containing the value as an array or an empty array for `None`.
   * @example
   * ```typescript
   * import { OptionAsync } from 'neverever';
   * const opt = OptionAsync.some(42);
   * console.log((await opt.sequence()).unwrapOr([])); // [42]
   * console.log((await OptionAsync.some([1, 2]).sequence()).unwrapOr([])); // [1, 2]
   * console.log((await OptionAsync.none<number>().sequence()).unwrapOr([])); // []
   * ```
   */
  sequence(): Promise<Option<T[]>>

  /**
   * Executes an asynchronous side-effect function on the contained value if `Some`, then returns the original OptionAsync.
   * @param fn A function to execute with the contained value, which may return a Promise.
   * @returns A `Promise<Option<T>>` containing the original value.
   * @example
   * ```typescript
   * import { OptionAsync } from 'neverever';
   * const opt = OptionAsync.some('hello');
   * await opt.tap(async (value) => console.log(value)); // Prints: 'hello'
   * console.log((await opt).unwrapOr('')); // 'hello'
   * await OptionAsync.none<string>().tap(async (value) => console.log(value)); // No output
   * ```
   */
  tap(fn: (value: T) => MaybePromise<void>): Promise<Option<T>>
}

/**
 * Internal singleton representing an empty Option (`None`).
 * @internal
 * @remarks This class is not exported and used internally to implement the `None` case of `Option`.
 */
const NONE = new (class None implements Option<never> {
  /**
   * Indicates that this is not a `Some` Option.
   * @returns `false`.
   */
  isSome(): boolean {
    return false
  }

  /**
   * Indicates that this is a `None` Option.
   * @returns `true`.
   */
  isNone(): boolean {
    return true
  }

  /**
   * Checks if the Option contains a value (always `false` for `None`).
   * @returns `false`.
   */
  contains(): boolean {
    return false
  }

  /**
   * Returns `None` for mapping, as there is no value to transform.
   * @template U The target type.
   * @returns An `Option<U>` that is `None`.
   */
  map<U>(): Option<U> {
    return NONE as Option<U>
  }

  /**
   * Returns `None` for chaining, as there is no value to process.
   * @template U The target type.
   * @returns An `Option<U>` that is `None`.
   */
  andThen<U>(): Option<U> {
    return NONE as Option<U>
  }

  /**
   * Returns `None`, as filtering has no effect on an empty Option.
   * @returns This `None` Option.
   */
  filter(): Option<never> {
    return this
  }

  /**
   * Returns `None` for zipping, as there is no value to combine.
   * @template U The type of the other Option.
   * @returns An `Option<[never, U]>` that is `None`.
   */
  zip<U>(): Option<[never, U]> {
    return NONE as Option<[never, U]>
  }

  /**
   * Returns `None`, as there is no nested Option to flatten.
   * @returns This `None` Option.
   */
  flatten(): Option<never> {
    return this
  }

  /**
   * Evaluates the provided function to return an alternative Option, as this is `None`.
   * @param fn A function that returns an alternative `Option<T>`.
   * @returns The result of `fn`.
   */
  orElse<T>(fn: () => Option<T>): Option<T> {
    return fn()
  }

  /**
   * Returns the default value, as this is `None`.
   * @template T The type of the default value.
   * @param defaultValue The default value to return.
   * @returns The `defaultValue`.
   */
  unwrapOr<T>(defaultValue: T): T {
    return defaultValue
  }

  /**
   * Evaluates the provided function to return a default value, as this is `None`.
   * @template T The type of the default value.
   * @param fn A function that returns the default value.
   * @returns The result of `fn`.
   */
  unwrapOrElse<T>(fn: () => T): T {
    return fn()
  }

  /**
   * Executes the `none` branch, as this is `None`.
   * @template U The type of the result.
   * @param branches An object with `some` and `none` functions.
   * @returns The result of the `none` branch.
   */
  match<U>(branches: { some: (value: never) => U; none: () => U }): U {
    return branches.none()
  }

  /**
   * Converts to a Result with the provided error, as this is `None`.
   * @template E The error type.
   * @param error The error value.
   * @returns A `Result<never, E>` containing the error.
   */
  toResult<E>(error: E): Result<never, E> {
    return err(error)
  }

  /**
   * Converts to an asynchronous `None` OptionAsync.
   * @returns An `OptionAsync<never>` that is `None`.
   */
  toAsync(): OptionAsync<never> {
    return OptionAsync.none()
  }

  /**
   * Returns an Option containing an empty array, as this is `None`.
   * @returns An `Option<never[]>` containing `[]`.
   */
  sequence(): Option<never[]> {
    return some([])
  }

  /**
   * Does nothing and returns this `None` Option, as there is no value for the side-effect.
   * @returns This `None` Option.
   */
  tap(): Option<never> {
    return this
  }
})()

/**
 * Type guard to check if a value is an Option.
 * @template T The type of the value contained in the Option.
 * @param value The value to check.
 * @returns `true` if the value is an `Option<T>`, `false` otherwise.
 * @example
 * ```typescript
 * import { some, none } from 'neverever';
 * function processOption<T>(value: any): value is Option<T> {
 *   return value instanceof Object && ('isSome' in value && 'isNone' in value);
 * }
 * console.log(processOption(some(42))); // true
 * console.log(processOption(none<string>())); // true
 * console.log(processOption(42)); // false
 * ```
 * @internal
 */
function isOption<T>(value: any): value is Option<T> {
  return value instanceof Some || value === NONE
}

/**
 * Internal class representing an Option containing a value (`Some`).
 * @template T The type of the value contained.
 * @internal
 * @remarks This class is not exported and used internally to implement the `Some` case of `Option`.
 */
class Some<T> implements Option<T> {
  constructor(private readonly value: T) {}

  /**
   * Indicates that this is a `Some` Option.
   * @returns `true`.
   */
  isSome(): boolean {
    return true
  }

  /**
   * Indicates that this is not a `None` Option.
   * @returns `false`.
   */
  isNone(): boolean {
    return false
  }

  /**
   * Checks if the contained value matches the provided value.
   * @param value The value to compare against.
   * @returns `true` if the contained value matches, `false` otherwise.
   */
  contains(value: T): boolean {
    return this.value === value
  }

  /**
   * Transforms the contained value using a function.
   * @template U The type of the transformed value.
   * @param fn A function to transform the contained value.
   * @returns An `Option<U>` containing the transformed value.
   */
  map<U>(fn: (value: T) => U): Option<U> {
    return some(fn(this.value))
  }

  /**
   * Chains with a function that returns another Option.
   * @template U The type of the value in the returned Option.
   * @param fn A function that takes the contained value and returns an `Option<U>`.
   * @returns The Option returned by the function.
   */
  andThen<U>(fn: (value: T) => Option<U>): Option<U> {
    return fn(this.value)
  }

  /**
   * Filters the contained value based on a predicate.
   * @param predicate A function to test the contained value.
   * @returns This Option if the predicate passes, `None` otherwise.
   */
  filter(predicate: (value: T) => boolean): Option<T> {
    return predicate(this.value) ? this : NONE
  }

  /**
   * Combines this Option with another, returning a tuple of values if both are `Some`.
   * @template U The type of the value in the other Option.
   * @param other The other Option to combine with.
   * @returns An `Option<[T, U]>` containing both values or `None`.
   */
  zip<U>(other: Option<U>): Option<[T, U]> {
    return other.match({
      some: (otherValue) => some([this.value, otherValue]),
      none: () => NONE,
    })
  }

  /**
   * Unwraps a nested Option if the contained value is an Option, otherwise wraps the value in an Option.
   * @returns An `Option<Unwrap<T>>` containing the unwrapped value.
   */
  flatten(): Option<Unwrap<T>> {
    return isOption<Unwrap<T>>(this.value) ? this.value : some(this.value as Unwrap<T>)
  }

  /**
   * Returns this `Some` Option, as there is no need for an alternative.
   * @returns This `Some` Option.
   */
  orElse(): Option<T> {
    return this
  }

  /**
   * Returns the contained value.
   * @returns The contained value.
   */
  unwrapOr(): T {
    return this.value
  }

  /**
   * Returns the contained value, as there is no need for a default.
   * @returns The contained value.
   */
  unwrapOrElse(): T {
    return this.value
  }

  /**
   * Executes the `some` branch with the contained value.
   * @template U The type of the result.
   * @param branches An object with `some` and `none` functions.
   * @returns The result of the `some` branch.
   */
  match<U>(branches: { some: (value: T) => U; none: () => U }): U {
    return branches.some(this.value)
  }

  /**
   * Converts to a Result with the contained value.
   * @template E The error type.
   * @param error The error value (unused for `Some`).
   * @returns A `Result<T, E>` containing the value.
   */
  toResult<E>(error: E): Result<T, E> {
    return ok(this.value)
  }

  /**
   * Converts to an asynchronous OptionAsync with the contained value.
   * @returns An `OptionAsync<T>` containing the value.
   */
  toAsync(): OptionAsync<T> {
    return OptionAsync.some(this.value)
  }

  /**
   * Wraps the value in an array if it’s not already an array.
   * @returns An `Option<T[]>` containing the value as an array.
   */
  sequence(): Option<T[]> {
    return some(this.value instanceof Array ? this.value : [this.value])
  }

  /**
   * Executes a side-effect function with the contained value and returns this Option.
   * @param fn A function to execute with the contained value.
   * @returns This `Some` Option.
   */
  tap(fn: (value: T) => void): Option<T> {
    fn(this.value)
    return this
  }
}

/**
 * Represents an asynchronous optional value, wrapping a Promise that resolves to an Option.
 * Provides methods for safely handling asynchronous computations that may produce missing values.
 * @template T The type of the value contained in the OptionAsync.
 */
export class OptionAsync<T> implements OptionAsync<T> {
  /**
   * Constructs an OptionAsync from a Promise resolving to an Option.
   * @param promise A Promise resolving to an `Option<T>`.
   * @private
   */
  private constructor(private readonly promise: Promise<Option<T>>) {}

  /**
   * Creates an OptionAsync containing a value (`Some`).
   * @template T The type of the value.
   * @param value The value to wrap, which may be a Promise.
   * @returns An `OptionAsync<T>` containing the value.
   * @example
   * ```typescript
   * import { OptionAsync } from 'neverever';
   * const opt = OptionAsync.some('hello');
   * console.log(await opt.unwrapOr('')); // 'hello'
   * const asyncOpt = OptionAsync.some(Promise.resolve(42));
   * console.log(await asyncOpt.unwrapOr(0)); // 42
   * ```
   */
  static some<T>(value: MaybePromise<T>): OptionAsync<T> {
    return new OptionAsync(Promise.resolve(value).then((v) => some(v)))
  }

  /**
   * Creates an empty OptionAsync (`None`).
   * @template T The type of the value.
   * @returns An `OptionAsync<T>` that is `None`.
   * @example
   * ```typescript
   * import { OptionAsync } from 'neverever';
   * const opt = OptionAsync.none<string>();
   * console.log(await opt.unwrapOr('default')); // 'default'
   * ```
   */
  static none<T>(): OptionAsync<T> {
    return new OptionAsync(Promise.resolve(NONE as Option<T>))
  }

  /**
   * Creates an OptionAsync from a value that may be null, undefined, or a Promise.
   * @template T The type of the value.
   * @param value The value to wrap, which may be null, undefined, or a Promise.
   * @returns An `OptionAsync<T>` containing the value if present, `None` otherwise.
   * @example
   * ```typescript
   * import { OptionAsync } from 'neverever';
   * const opt1 = OptionAsync.from('value');
   * console.log(await opt1.unwrapOr('')); // 'value'
   * const opt2 = OptionAsync.from(null);
   * console.log(await opt2.unwrapOr('')); // ''
   * const opt3 = OptionAsync.from(Promise.resolve('async'));
   * console.log(await opt3.unwrapOr('')); // 'async'
   * ```
   */
  static from<T>(value: MaybePromise<T | null | undefined>): OptionAsync<T> {
    return new OptionAsync(Promise.resolve(value).then((v) => (v == null ? NONE : some(v))))
  }

  /**
   * Creates an OptionAsync by executing a function that may throw or return a Promise.
   * @template T The type of the value.
   * @param fn A function that produces a value or throws an error.
   * @returns An `OptionAsync<T>` containing the value if successful, `None` if an error occurs.
   * @example
   * ```typescript
   * import { OptionAsync } from 'neverever';
   * const opt = OptionAsync.try(() => 'success');
   * console.log(await opt.unwrapOr('')); // 'success'
   * const failed = OptionAsync.try(() => { throw new Error('fail'); });
   * console.log(await failed.unwrapOr('')); // ''
   * const asyncOpt = OptionAsync.try(async () => 'async');
   * console.log(await asyncOpt.unwrapOr('')); // 'async'
   * ```
   */
  static try<T>(fn: () => MaybePromise<T>): OptionAsync<T> {
    return new OptionAsync(
      Promise.resolve()
        .then(() => fn())
        .then((value) => some(value))
        .catch(() => NONE as Option<T>)
    )
  }

  /**
   * Checks if the OptionAsync contains a value (`Some`).
   * @returns A `Promise<boolean>` resolving to `true` if `Some`, `false` if `None`.
   */
  async isSome(): Promise<boolean> {
    return (await this.promise).isSome()
  }

  /**
   * Checks if the OptionAsync is empty (`None`).
   * @returns A `Promise<boolean>` resolving to `true` if `None`, `false` if `Some`.
   */
  async isNone(): Promise<boolean> {
    return (await this.promise).isNone()
  }

  /**
   * Checks if the OptionAsync contains a specific value.
   * @param value The value to compare against.
   * @returns A `Promise<boolean>` resolving to `true` if `Some` and contains the value, `false` otherwise.
   */
  async contains(value: T): Promise<boolean> {
    return (await this.promise).contains(value)
  }

  /**
   * Transforms the contained value using an asynchronous function.
   * @template U The type of the transformed value.
   * @param fn A function to transform the contained value, which may return a Promise.
   * @returns A `Promise<Option<U>>` containing the transformed value or `None`.
   */
  async map<U>(fn: (value: T) => MaybePromise<U>): Promise<Option<U>> {
    const opt = await this.promise
    return opt.map((value) => Promise.resolve(fn(value))) as Option<U>
  }

  /**
   * Chains with a function that returns another Option or OptionAsync.
   * @template U The type of the value in the returned Option.
   * @param fn A function that takes the contained value and returns an `OptionLike<U>`.
   * @returns A `Promise<Option<U>>` containing the result of the function or `None`.
   */
  async andThen<U>(fn: (value: T) => OptionLike<U>): Promise<Option<U>> {
    const opt = await this.promise
    if (opt.isNone()) return NONE
    const result = await fn(opt.unwrapOr(undefined as never))
    return result instanceof OptionAsync ? result.promise : result
  }

  /**
   * Filters based on an asynchronous predicate.
   * @param predicate A function to test the contained value, which may return a Promise.
   * @returns A `Promise<Option<T>>` containing the original value if the predicate passes, `None` otherwise.
   */
  async filter(predicate: (value: T) => MaybePromise<boolean>): Promise<Option<T>> {
    const opt = await this.promise
    if (opt.isNone()) return NONE
    return (await predicate(opt.unwrapOr(undefined as never))) ? opt : NONE
  }

  /**
   * Combines with another Option or OptionAsync, returning a tuple of values if both are `Some`.
   * @template U The type of the value in the other Option.
   * @param other The other Option or OptionAsync to combine with.
   * @returns A `Promise<Option<[T, U]>>` containing both values or `None`.
   */
  async zip<U>(other: OptionLike<U>): Promise<Option<[T, U]>> {
    const opt = await this.promise
    const otherOpt = await (other instanceof OptionAsync ? other.promise : other)
    return opt.zip(otherOpt)
  }

  /**
   * Unwraps a nested OptionAsync.
   * @returns A `Promise<Option<Unwrap<T>>>` containing the unwrapped value.
   */
  async flatten(): Promise<Option<Unwrap<T>>> {
    const opt = await this.promise
    return opt.flatten()
  }

  /**
   * Returns this OptionAsync if `Some`, otherwise evaluates an alternative Option or OptionAsync.
   * @param fn A function that returns an alternative `OptionLike<T>`.
   * @returns A `Promise<Option<T>>` containing this value if `Some`, or the result of `fn` if `None`.
   */
  async orElse(fn: () => OptionLike<T>): Promise<Option<T>> {
    const opt = await this.promise
    if (opt.isSome()) return opt
    const result = await fn()
    return result instanceof OptionAsync ? result.promise : result
  }

  /**
   * Returns the contained value or a default value.
   * @param defaultValue The default value, which may be a Promise.
   * @returns A `Promise<T>` containing the value or the default value.
   */
  async unwrapOr(defaultValue: MaybePromise<T>): Promise<T> {
    return (await this.promise).unwrapOr(await Promise.resolve(defaultValue))
  }

  /**
   * Returns the contained value or evaluates a default value.
   * @param fn A function that returns the default value, which may be a Promise.
   * @returns A `Promise<T>` containing the value or the result of `fn`.
   */
  async unwrapOrElse(fn: () => MaybePromise<T>): Promise<T> {
    return (await this.promise).unwrapOrElse(() => Promise.resolve(fn()) as T)
  }

  /**
   * Matches to either a `some` or `none` branch.
   * @template U The type of the result.
   * @param branches An object with `some` and `none` functions, which may return Promises.
   * @returns A `Promise<U>` containing the result of the `some` or `none` branch.
   */
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

  /**
   * Converts to a ResultAsync with the provided error for `None`.
   * @template E The error type.
   * @param error The error value, which may be a Promise.
   * @returns A `Promise<ResultAsync<T, E>>` containing the value or the error.
   */
  async toResult<E>(error: MaybePromise<E>): Promise<ResultAsync<T, E>> {
    const opt = await this.promise
    return new ResultAsync(Promise.resolve(opt.toResult(await error)))
  }

  /**
   * Converts the value to an array.
   * @returns A `Promise<Option<T[]>>` containing the value as an array or an empty array for `None`.
   */
  async sequence(): Promise<Option<T[]>> {
    return (await this.promise).sequence()
  }

  /**
   * Executes an asynchronous side-effect and returns the original OptionAsync.
   * @param fn A function to execute with the contained value, which may return a Promise.
   * @returns A `Promise<Option<T>>` containing the original value.
   */
  async tap(fn: (value: T) => MaybePromise<void>): Promise<Option<T>> {
    const opt = await this.promise
    if (opt.isSome()) await fn(opt.unwrapOr(undefined as never))
    return opt
  }
}

/**
 * Creates an Option containing a value (`Some`).
 * @template T The type of the value.
 * @param value The value to wrap.
 * @returns An `Option<T>` containing the value.
 * @example
 * ```typescript
 * import { some } from 'neverever';
 * const opt = some(42);
 * console.log(opt.unwrapOr(0)); // 42
 * console.log(opt.map(n => n * 2).unwrapOr(0)); // 84
 * ```
 */
export function some<T>(value: T): Option<T> {
  return new Some(value)
}

/**
 * Creates an empty Option (`None`).
 * @template T The type of the value.
 * @returns An `Option<T>` that is `None`.
 * @example
 * ```typescript
 * import { none } from 'neverever';
 * const opt = none<string>();
 * console.log(opt.unwrapOr('default')); // 'default'
 * console.log(opt.map(s => s.toUpperCase()).unwrapOr('')); // ''
 * ```
 */
export function none<T>(): Option<T> {
  return NONE as Option<T>
}

/**
 * Creates an Option from a value that may be null or undefined.
 * @template T The type of the value.
 * @param value The value to wrap, which may be null or undefined.
 * @returns An `Option<T>` containing the value if present, `None` otherwise.
 * @example
 * ```typescript
 * import { from } from 'neverever';
 * const opt1 = from('hello');
 * console.log(opt1.unwrapOr('')); // 'hello'
 * const opt2 = from(null);
 * console.log(opt2.unwrapOr('')); // ''
 * const opt3 = from(undefined);
 * console.log(opt3.unwrapOr('')); // ''
 * ```
 */
export function from<T>(value: T | null | undefined): Option<T> {
  return value == null ? NONE : some(value)
}

/**
 * Creates an Option by executing a function that may throw an error.
 * @template T The type of the value.
 * @template E The type of the error (optional).
 * @param fn A function that produces a value or throws an error.
 * @param onError An optional function to handle errors, called if an error is thrown.
 * @returns An `Option<T>` containing the value if successful, `None` if an error occurs.
 * @example
 * ```typescript
 * import { tryOption } from 'neverever';
 * const opt = tryOption(() => 'success');
 * console.log(opt.unwrapOr('')); // 'success'
 * const failed = tryOption(() => { throw new Error('fail'); }, (e) => console.log(e));
 * console.log(failed.unwrapOr('')); // ''
 * ```
 */
export function tryOption<T, E>(fn: () => T, onError?: (e: unknown) => E): Option<T> {
  try {
    return some(fn())
  } catch (e) {
    if (onError) onError(e)
    return NONE
  }
}

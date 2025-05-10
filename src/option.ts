import { Result, ResultAsync, ok, err, okAsync, errAsync } from './result'
import { Unwrap, MaybePromise, OptionLike } from './types'

/**
 * Represents an Option type that may or may not contain a value of type T.
 * @interface
 * @template T The type of the value contained in the Option.
 */
interface Option<T> {
  /**
   * Checks if the Option contains a value (is Some).
   * @returns {boolean} True if the Option is Some, false if it is None.
   * @example
   * ```typescript
   * const someValue = some(42);
   * console.log(someValue.isSome()); // true
   * const noneValue = none();
   * console.log(noneValue.isSome()); // false
   * ```
   */
  isSome(): boolean

  /**
   * Checks if the Option is empty (is None).
   * @returns {boolean} True if the Option is None, false if it is Some.
   * @example
   * ```typescript
   * const someValue = some(42);
   * console.log(someValue.isNone()); // false
   * const noneValue = none();
   * console.log(noneValue.isNone()); // true
   * ```
   */
  isNone(): boolean

  /**
   * Checks if the Option contains a specific value.
   * @param {T} value The value to compare against.
   * @returns {boolean} True if the Option is Some and contains the given value, false otherwise.
   * @example
   * ```typescript
   * const opt = some(42);
   * console.log(opt.contains(42)); // true
   * console.log(opt.contains(99)); // false
   * const noneOpt = none();
   * console.log(noneOpt.contains(42)); // false
   * ```
   */
  contains(value: T): boolean

  /**
   * Transforms the value inside the Option using a mapping function.
   * @template U The type of the new value after mapping.
   * @param {(value: T) => U} fn The function to apply to the value if the Option is Some.
   * @returns {Option<U>} A new Option containing the mapped value, or None if the Option is None.
   * @example
   * ```typescript
   * const opt = some(42);
   * const mapped = opt.map(x => x * 2);
   * console.log(mapped); // Some(84)
   * const noneOpt = none();
   * console.log(noneOpt.map(x => x * 2)); // None
   * ```
   */
  map<U>(fn: (value: T) => U): Option<U>

  /**
   * Chains the Option with another Option-returning function.
   * @template U The type of the value in the returned Option.
   * @param {(value: T) => Option<U>} fn The function to apply to the value if the Option is Some.
   * @returns {Option<U>} The Option returned by the function, or None if the Option is None.
   * @example
   * ```typescript
   * const opt = some(42);
   * const result = opt.and1800Then(x => x > 0 ? some(x * 2) : none());
   * console.log(result); // Some(84)
   * const noneOpt = none();
   * console.log(noneOpt.andThen(x => some(x * 2))); // None
   * ```
   */
  andThen<U>(fn: (value: T) => Option<U>): Option<U>

  /**
   * Filters the Option based on a predicate.
   * @param {(value: T) => boolean} predicate The function to test the value.
   * @returns {Option<T>} The same Option if the predicate is true, or None if false or the Option is None.
   * @example
   * ```typescript
   * const opt = some(42);
   * const filtered = opt.filter(x => x > 0);
   * console.log(filtered); // Some(42)
   * console.log(opt.filter(x => x < 0)); // None
   * const noneOpt = none();
   * console.log(noneOpt.filter(x => x > 0)); // None
   * ```
   */
  filter(predicate: (value: T) => boolean): Option<T>

  /**
   * Combines this Option with another Option into a tuple.
   * @template U The type of the value in the other Option.
   * @param {Option<U>} other The other Option to combine with.
   * @returns {Option<[T, U]>} An Option containing a tuple of both values if both are Some, otherwise None.
   * @example
   * ```typescript
   * const opt1 = some(42);
   * const opt2 = some("hello");
   * const zipped = opt1.zip(opt2);
   * console.log(zipped); // Some([42, "hello"])
   * console.log(opt1.zip(none())); // None
   * ```
   */
  zip<U>(other: Option<U>): Option<[T, U]>

  /**
   * Flattens a nested Option into a single Option.
   * @returns {Option<Unwrap<T>>} The inner Option if the value is an Option, otherwise the value wrapped in Some.
   * @example
   * ```typescript
   * const nested = some(some(42));
   * console.log(nested.flatten()); // Some(42)
   * const simple = some(42);
   * console.log(simple.flatten()); // Some(42)
   * const noneOpt = none();
   * console.log(noneOpt.flatten()); // None
   * ```
   */
  flatten(): Option<Unwrap<T>>

  /**
   * Provides a fallback Option if this Option is None.
   * @param {() => Option<T>} fn The function to provide the fallback Option.
   * @returns {Option<T>} This Option if it is Some, otherwise the Option returned by the function.
   * @example
   * ```typescript
   * const opt = none();
   * const fallback = opt.orElse(() => some(42));
   * console.log(fallback); // Some(42)
   * const someOpt = some(99);
   * console.log(someOpt.orElse(() => some(42))); // Some(99)
   * ```
   */
  orElse(fn: () => Option<T>): Option<T>

  /**
   * Returns the contained value or a default value.
   * @param {T} defaultValue The value to return if the Option is None.
   * @returns {T} The contained value if Some, otherwise the default value.
   * @example
   * ```typescript
   * const opt = some(42);
   * console.log(opt.unwrapOr(0)); // 42
   * const noneOpt = none();
   * console.log(noneOpt.unwrapOr(0)); // 0
   * ```
   */
  unwrapOr(defaultValue: T): T

  /**
   * Returns the contained value or computes a default value.
   * @param {() => T} fn The function to compute the default value.
   * @returns {T} The contained value if Some, otherwise the computed default value.
   * @example
   * ```typescript
   * const opt = some(42);
   * console.log(opt.unwrapOrElse(() => 0)); // 42
   * const noneOpt = none();
   * console.log(noneOpt.unwrapOrElse(() => 0)); // 0
   * ```
   */
  unwrapOrElse(fn: () => T): T

  /**
   * Matches the Option to execute different branches based on its state.
   * @template U The type of the result.
   * @param {{ some: (value: T) => U; none: () => U }} branches The functions to handle Some and None cases.
   * @returns {U} The result of the appropriate branch.
   * @example
   * ```typescript
   * const opt = some(42);
   * const result = opt.match({
   *   some: x => `Value: ${x}`,
   *   none: () => "No value"
   * });
   * console.log(result); // "Value: 42"
   * const noneOpt = none();
   * console.log(noneOpt.match({ some: x => `Value: ${x}`, none: () => "No value" })); // "No value"
   * ```
   */
  match<U>(branches: { some: (value: T) => U; none: () => U }): U

  /**
   * Converts the Option to a Result.
   * @template E The type of the error in the Result.
   * @param {E} error The error to use if the Option is None.
   * @returns {Result<T, E>} Ok with the value if Some, Err with the error if None.
   * @example
   * ```typescript
   * const opt = some(42);
   * console.log(opt.toResult("Error")); // Ok(42)
   * const noneOpt = none();
   * console.log(noneOpt.toResult("Error")); // Err("Error")
   * ```
   */
  toResult<E>(error: E): Result<T, E>

  /**
   * Converts the Option to an asynchronous OptionAsync.
   * @returns {OptionAsync<T>} An OptionAsync wrapping the same value or None.
   * @example
   * ```typescript
   * const opt = some(42);
   * const asyncOpt = opt.toAsync();
   * asyncOpt.then(opt => console.log(opt)); // Some(42)
   * const noneOpt = none();
   * noneOpt.toAsync().then(opt => console.log(opt)); // None
   * ```
   */
  toAsync(): OptionAsync<T>

  /**
   * Converts the value into an Option containing an array.
   * @returns {Option<T[]>} An Option containing an array with the value, or an empty array for None.
   * @example
   * ```typescript
   * const opt = some(42);
   * console.log(opt.sequence()); // Some([42])
   * const arrOpt = some([1, 2, 3]);
   * console.log(arrOpt.sequence()); // Some([1, 2, 3])
   * const noneOpt = none();
   * console.log(noneOpt.sequence()); // Some([])
   * ```
   */
  sequence(): Option<T[]>

  /**
   * Executes a side-effect function on the value if the Option is Some.
   * @param {(value: T) => void} fn The side-effect function to execute.
   * @returns {Option<T>} The original Option.
   * @example
   * ```typescript
   * const opt = some(42);
   * opt.tap(x => console.log(x)); // Logs: 42
   * console.log(opt); // Some(42)
   * const noneOpt = none();
   * noneOpt.tap(x => console.log(x)); // Does nothing
   * console.log(noneOpt); // None
   * ```
   */
  tap(fn: (value: T) => void): Option<T>

  /**
   * Chains multiple Option-transforming functions in sequence.
   * @template U The type of the final Option's value.
   * @param {...Array<(arg: Option<T>) => MaybePromise<Option<U>>>} fns The functions to apply.
   * @returns {MaybePromise<Option<U>>} The final Option after applying all functions.
   * @example
   * ```typescript
   * const opt = some(42);
   * const result = opt.pipe(
   *   opt => opt.map(x => x * 2),
   *   opt => opt.map(x => x + 1)
   * );
   * console.log(result); // Some(85)
   * const noneOpt = none();
   * console.log(noneOpt.pipe(opt => opt.map(x => x * 2))); // None
   * ```
   */
  pipe<U>(...fns: Array<(arg: Option<T>) => MaybePromise<Option<U>>>): MaybePromise<Option<U>>
}

/**
 * Represents an asynchronous Option type that may or may not contain a value of type T.
 * @interface
 * @template T The type of the value contained in the OptionAsync.
 */
interface OptionAsync<T> {
  /**
   * Asynchronously checks if the OptionAsync contains a value (is Some).
   * @returns {Promise<boolean>} A Promise resolving to true if the OptionAsync is Some, false if None.
   * @example
   * ```typescript
   * const asyncOpt = OptionAsync.some(42);
   * asyncOpt.isSome().then(console.log); // true
   * const noneOpt = OptionAsync.none();
   * noneOpt.isSome().then(console.log); // false
   * ```
   */
  isSome(): Promise<boolean>

  /**
   * Asynchronously checks if the OptionAsync is empty (is None).
   * @returns {Promise<boolean>} A Promise resolving to true if the OptionAsync is None, false if Some.
   * @example
   * ```typescript
   * const asyncOpt = OptionAsync.some(42);
   * asyncOpt.isNone().then(console.log); // false
   * const noneOpt = OptionAsync.none();
   * noneOpt.isNone().then(console.log); // true
   * ```
   */
  isNone(): Promise<boolean>

  /**
   * Asynchronously checks if the OptionAsync contains a specific value.
   * @param {T} value The value to compare against.
   * @returns {Promise<boolean>} A Promise resolving to true if the OptionAsync is Some and contains the value, false otherwise.
   * @example
   * ```typescript
   * const asyncOpt = OptionAsync.some(42);
   * asyncOpt.contains(42).then(console.log); // true
   * asyncOpt.contains(99).then(console.log); // false
   * const noneOpt = OptionAsync.none();
   * noneOpt.contains(42).then(console.log); // false
   * ```
   */
  contains(value: T): Promise<boolean>

  /**
   * Asynchronously transforms the value inside the OptionAsync using a mapping function.
   * @template U The type of the new value after mapping.
   * @param {(value: T) => MaybePromise<U>} fn The function to apply to the value if the OptionAsync is Some.
   * @returns {Promise<Option<U>>} A Promise resolving to a new Option containing the mapped value, or None if None.
   * @example
   * ```typescript
   * const asyncOpt = OptionAsync.some(42);
   * asyncOpt.map(x => x * 2).then(console.log); // Some(84)
   * const noneOpt = OptionAsync.none();
   * noneOpt.map(x => x * 2).then(console.log); // None
   * ```
   */
  map<U>(fn: (value: T) => MaybePromise<U>): Promise<Option<U>>

  /**
   * Asynchronously chains the OptionAsync with another Option-like value.
   * @template U The type of the value in the returned Option.
   * @param {(value: T) => OptionLike<U>} fn The function to apply to the value if the OptionAsync is Some.
   * @returns {Promise<Option<U>>} A Promise resolving to the Option returned by the function, or None if None.
   * @example
   * ```typescript
   * const asyncOpt = OptionAsync.some(42);
   * asyncOpt.andThen(x => x > 0 ? some(x * 2) : none()).then(console.log); // Some(84)
   * const noneOpt = OptionAsync.none();
   * noneOpt.andThen(x => some(x * 2)).then(console.log); // None
   * ```
   */
  andThen<U>(fn: (value: T) => OptionLike<U>): Promise<Option<U>>

  /**
   * Asynchronously filters the OptionAsync based on a predicate.
   * @param {(value: T) => MaybePromise<boolean>} predicate The function to test the value.
   * @returns {Promise<Option<T>>} A Promise resolving to the same Option if the predicate is true, or None if false or None.
   * @example
   * ```typescript
   * const asyncOpt = OptionAsync.some(42);
   * asyncOpt.filter(x => x > 0).then(console.log); // Some(42)
   * asyncOpt.filter(x => x < 0).then(console.log); // None
   * const noneOpt = OptionAsync.none();
   * noneOpt.filter(x => x > 0).then(console.log); // None
   * ```
   */
  filter(predicate: (value: T) => MaybePromise<boolean>): Promise<Option<T>>

  /**
   * Asynchronously combines this OptionAsync with another Option-like value into a tuple.
   * @template U The type of the value in the other Option.
   * @param {OptionLike<U>} other The other Option or OptionAsync to combine with.
   * @returns {Promise<Option<[T, U]>>} A Promise resolving to an Option containing a tuple if both are Some, otherwise None.
   * @example
   * ```typescript
   * const asyncOpt = OptionAsync.some(42);
   * const opt = some("hello");
   * asyncOpt.zip(opt).then(console.log); // Some([42, "hello"])
   * asyncOpt.zip(OptionAsync.none()).then(console.log); // None
   * ```
   */
  zip<U>(other: OptionLike<U>): Promise<Option<[T, U]>>

  /**
   * Asynchronously flattens a nested OptionAsync or Option into a single Option.
   * @returns {Promise<Option<Unwrap<T>>>} A Promise resolving to the inner Option or value wrapped in Some.
   * @example
   * ```typescript
   * const nested = OptionAsync.some(some(42));
   * nested.flatten().then(console.log); // Some(42)
   * const simple = OptionAsync.some(42);
   * simple.flatten().then(console.log); // Some(42)
   * const noneOpt = OptionAsync.none();
   * noneOpt.flatten().then(console.log); // None
   * ```
   */
  flatten(): Promise<Option<Unwrap<T>>>

  /**
   * Asynchronously provides a fallback Option-like value if this OptionAsync is None.
   * @param {() => OptionLike<T>} fn The function to provide the fallback Option or OptionAsync.
   * @returns {Promise<Option<T>>} A Promise resolving to this Option if Some, otherwise the fallback Option.
   * @example
   * ```typescript
   * const noneOpt = OptionAsync.none();
   * noneOpt.orElse(() => some(42)).then(console.log); // Some(42)
   * const asyncOpt = OptionAsync.some(99);
   * asyncOpt.orElse(() => some(42)).then(console.log); // Some(99)
   * ```
   */
  orElse(fn: () => OptionLike<T>): Promise<Option<T>>

  /**
   * Asynchronously returns the contained value or a default value.
   * @param {MaybePromise<T>} defaultValue The value or Promise to return if the OptionAsync is None.
   * @returns {Promise<T>} A Promise resolving to the contained value if Some, otherwise the default value.
   * @example
   * ```typescript
   * const asyncOpt = OptionAsync.some(42);
   * asyncOpt.unwrapOr(0).then(console.log); // 42
   * const noneOpt = OptionAsync.none();
   * noneOpt.unwrapOr(0).then(console.log); // 0
   * ```
   */
  unwrapOr(defaultValue: MaybePromise<T>): Promise<T>

  /**
   * Asynchronously returns the contained value or computes a default value.
   * @param {() => MaybePromise<T>} fn The function to compute the default value.
   * @returns {Promise<T>} A Promise resolving to the contained value if Some, otherwise the computed default.
   * @example
   * ```typescript
   * const asyncOpt = OptionAsync.some(42);
   * asyncOpt.unwrapOrElse(() => 0).then(console.log); // 42
   * const noneOpt = OptionAsync.none();
   * noneOpt.unwrapOrElse(() => 0).then(console.log); // 0
   * ```
   */
  unwrapOrElse(fn: () => MaybePromise<T>): Promise<T>

  /**
   * Asynchronously matches the OptionAsync to execute different branches based on its state.
   * @template U The type of the result.
   * @param {{ some: (value: T) => MaybePromise<U>; none: () => MaybePromise<U> }} branches The functions to handle Some and None cases.
   * @returns {Promise<U>} A Promise resolving to the result of the appropriate branch.
   * @example
   * ```typescript
   * const asyncOpt = OptionAsync.some(42);
   * asyncOpt.match({
   *   some: x => `Value: ${x}`,
   *   none: () => "No value"
   * }).then(console.log); // "Value: 42"
   * const noneOpt = OptionAsync.none();
   * noneOpt.match({ some: x => `Value: ${x}`, none: () => "No value" }).then(console.log); // "No value"
   * ```
   */
  match<U>(branches: { some: (value: T) => MaybePromise<U>; none: () => MaybePromise<U> }): Promise<U>

  /**
   * Asynchronously converts the OptionAsync to a ResultAsync.
   * @template E The type of the error in the ResultAsync.
   * @param {MaybePromise<E>} error The error or Promise to use if the OptionAsync is None.
   * @returns {Promise<ResultAsync<T, E>>} A Promise resolving to Ok with the value if Some, Err with the error if None.
   * @example
   * ```typescript
   * const asyncOpt = OptionAsync.some(42);
   * asyncOpt.toResult("Error").then(console.log); // Ok(42)
   * const noneOpt = OptionAsync.none();
   * noneOpt.toResult("Error").then(console.log); // Err("Error")
   * ```
   */
  toResult<E>(error: MaybePromise<E>): Promise<ResultAsync<T, E>>

  /**
   * Asynchronously converts the value into an Option containing an array.
   * @returns {Promise<Option<T[]>>} A Promise resolving to an Option containing an array with the value, or an empty array for None.
   * @example
   * ```typescript
   * const asyncOpt = OptionAsync.some(42);
   * asyncOpt.sequence().then(console.log); // Some([42])
   * const noneOpt = OptionAsync.none();
   * noneOpt.sequence().then(console.log); // Some([])
   * ```
   */
  sequence(): Promise<Option<T[]>>

  /**
   * Asynchronously executes a side-effect function on the value if the OptionAsync is Some.
   * @param {(value: T) => MaybePromise<void>} fn The side-effect function to execute.
   * @returns {Promise<Option<T>>} A Promise resolving to the original Option.
   * @example
   * ```typescript
   * const asyncOpt = OptionAsync.some(42);
   * asyncOpt.tap(x => console.log(x)).then(opt => console.log(opt)); // Logs: 42, Some(42)
   * const noneOpt = OptionAsync.none();
   * noneOpt.tap(x => console.log(x)).then(opt => console.log(opt)); // Logs: None
   * ```
   */
  tap(fn: (value: T) => MaybePromise<void>): Promise<Option<T>>

  /**
   * Asynchronously chains multiple Option-transforming functions in sequence.
   * @template U The type of the final Option's value.
   * @param {...Array<(arg: Option<T>) => MaybePromise<Option<U>>>} fns The functions to apply.
   * @returns {Promise<Option<U>>} A Promise resolving to the final Option after applying all functions.
   * @example
   * ```typescript
   * const asyncOpt = OptionAsync.some(42);
   * asyncOpt.pipe(
   *   opt => opt.map(x => x * 2),
   *   opt => opt.map(x => x + 1)
   * ).then(console.log); // Some(85)
   * const noneOpt = OptionAsync.none();
   * noneOpt.pipe(opt => opt.map(x => x * 2)).then(console.log); // None
   * ```
   */
  pipe<U>(...fns: Array<(arg: Option<T>) => MaybePromise<Option<U>>>): Promise<Option<U>>
}

const NONE = new (class None implements Option<never> {
  /**
   * Checks if the Option is Some (always false for None).
   * @returns {boolean} False.
   * @example
   * ```typescript
   * console.log(NONE.isSome()); // false
   * ```
   */
  isSome(): boolean {
    return false
  }

  /**
   * Checks if the Option is None (always true for None).
   * @returns {boolean} True.
   * @example
   * ```typescript
   * console.log(NONE.isNone()); // true
   * ```
   */
  isNone(): boolean {
    return true
  }

  /**
   * Checks if the Option contains a value (always false for None).
   * @returns {boolean} False.
   * @example
   * ```typescript
   * console.log(NONE.contains(undefined)); // false
   * ```
   */
  contains(): boolean {
    return false
  }

  /**
   * Maps the value (no-op for None).
   * @template U The type of the new value.
   * @returns {Option<U>} None.
   * @example
   * ```typescript
   * console.log(NONE.map(x => x * 2)); // None
   * ```
   */
  map<U>(): Option<U> {
    return NONE as Option<U>
  }

  /**
   * Chains with another Option (no-op for None).
   * @template U The type of the new value.
   * @returns {Option<U>} None.
   * @example
   * ```typescript
   * console.log(NONE.andThen(x => some(x * 2))); // None
   * ```
   */
  andThen<U>(): Option<U> {
    return NONE as Option<U>
  }

  /**
   * Filters the value (no-op for None).
   * @returns {Option<never>} None.
   * @example
   * ```typescript
   * console.log(NONE.filter(x => x > 0)); // None
   * ```
   */
  filter(): Option<never> {
    return this
  }

  /**
   * Combines with another Option (returns None).
   * @template U The type of the other value.
   * @returns {Option<[never, U]>} None.
   * @example
   * ```typescript
   * console.log(NONE.zip(some(42))); // None
   * ```
   */
  zip<U>(): Option<[never, U]> {
    return NONE as Option<[never, U]>
  }

  /**
   * Flattens the Option (no-op for None).
   * @returns {Option<never>} None.
   * @example
   * ```typescript
   * console.log(NONE.flatten()); // None
   * ```
   */
  flatten(): Option<never> {
    return this
  }

  /**
   * Provides a fallback Option for None.
   * @template T The type of the fallback value.
   * @param {() => Option<T>} fn The function to provide the fallback Option.
   * @returns {Option<T>} The Option returned by the function.
   * @example
   * ```typescript
   * console.log(NONE.orElse(() => some(42))); // Some(42)
   * ```
   */
  orElse<T>(fn: () => Option<T>): Option<T> {
    return fn()
  }

  /**
   * Returns the default value for None.
   * @template T The type of the default value.
   * @param {T} defaultValue The default value.
   * @returns {T} The default value.
   * @example
   * ```typescript
   * console.log(NONE.unwrapOr(42)); // 42
   * ```
   */
  unwrapOr<T>(defaultValue: T): T {
    return defaultValue
  }

  /**
   * Computes a default value for None.
   * @template T The type of the default value.
   * @param {() => T} fn The function to compute the default value.
   * @returns {T} The computed default value.
   * @example
   * ```typescript
   * console.log(NONE.unwrapOrElse(() => 42)); // 42
   * ```
   */
  unwrapOrElse<T>(fn: () => T): T {
    return fn()
  }

  /**
   * Matches the Option, executing the none branch.
   * @template U The type of the result.
   * @param {{ some: (value: never) => U; none: () => U }} branches The branches to execute.
   * @returns {U} The result of the none branch.
   * @example
   * ```typescript
   * console.log(NONE.match({ some: x => x, none: () => 42 })); // 42
   * ```
   */
  match<U>(branches: { some: (value: never) => U; none: () => U }): U {
    return branches.none()
  }

  /**
   * Converts None to a Result with an error.
   * @template E The type of the error.
   * @param {E} error The error value.
   * @returns {Result<never, E>} Err with the error.
   * @example
   * ```typescript
   * console.log(NONE.toResult("Error")); // Err("Error")
   * ```
   */
  toResult<E>(error: E): Result<never, E> {
    return err(error)
  }

  /**
   * Converts None to an OptionAsync.
   * @returns {OptionAsync<never>} An OptionAsync representing None.
   * @example
   * ```typescript
   * NONE.toAsync().then(console.log); // None
   * ```
   */
  toAsync(): OptionAsync<never> {
    return OptionAsync.none()
  }

  /**
   * Converts None to an Option containing an empty array.
   * @returns {Option<never[]>} Some with an empty array.
   * @example
   * ```typescript
   * console.log(NONE.sequence()); // Some([])
   * ```
   */
  sequence(): Option<never[]> {
    return some([])
  }

  /**
   * Executes a side-effect function (no-op for None).
   * @returns {Option<never>} None.
   * @example
   * ```typescript
   * NONE.tap(x => console.log(x)); // Does nothing
   * console.log(NONE); // None
   * ```
   */
  tap(): Option<never> {
    return this
  }

  /**
   * Chains multiple Option-transforming functions (starting with None).
   * @template U The type of the final Option's value.
   * @param {...Array<(arg: Option<never>) => MaybePromise<Option<U>>>} fns The functions to apply.
   * @returns {MaybePromise<Option<U>>} The final Option after applying all functions.
   * @example
   * ```typescript
   * NONE.pipe(opt => opt.map(x => x * 2)).then(console.log); // None
   * ```
   */
  pipe<U>(...fns: Array<(arg: Option<never>) => MaybePromise<Option<U>>>): MaybePromise<Option<U>> {
    let result: MaybePromise<Option<any>> = Promise.resolve(this)
    for (const fn of fns) {
      result = Promise.resolve(result).then((opt) => fn(opt as Option<never>))
    }
    return result as MaybePromise<Option<U>>
  }
})()

/**
 * Checks if a value is an Option (Some or None).
 * @template T The type of the Option's value.
 * @param {any} value The value to check.
 * @returns {value is Option<T>} True if the value is an Option, false otherwise.
 * @example
 * ```typescript
 * console.log(isOption(some(42))); // true
 * console.log(isOption(none())); // true
 * console.log(isOption(42)); // false
 * ```
 */
function isOption<T>(value: any): value is Option<T> {
  return value instanceof Some || value === NONE
}

/**
 * Represents an Option containing a value (Some).
 * @class
 * @template T The type of the value.
 * @implements {Option<T>}
 */
class Some<T> implements Option<T> {
  constructor(private readonly value: T) {}

  /**
   * Checks if the Option is Some (always true).
   * @returns {boolean} True.
   * @example
   * ```typescript
   * const opt = some(42);
   * console.log(opt.isSome()); // true
   * ```
   */
  isSome(): boolean {
    return true
  }

  /**
   * Checks if the Option is None (always false).
   * @returns {boolean} False.
   * @example
   * ```typescript
   * const opt = some(42);
   * console.log(opt.isNone()); // false
   * ```
   */
  isNone(): boolean {
    return false
  }

  /**
   * Checks if the Option contains a specific value.
   * @param {T} value The value to compare.
   * @returns {boolean} True if the value matches, false otherwise.
   * @example
   * ```typescript
   * const opt = some(42);
   * console.log(opt.contains(42)); // true
   * console.log(opt.contains(99)); // false
   * ```
   */
  contains(value: T): boolean {
    return this.value === value
  }

  /**
   * Maps the contained value using a function.
   * @template U The type of the new value.
   * @param {(value: T) => U} fn The mapping function.
   * @returns {Option<U>} A new Option with the mapped value.
   * @example
   * ```typescript
   * const opt = some(42);
   * console.log(opt.map(x => x * 2)); // Some(84)
   * ```
   */
  map<U>(fn: (value: T) => U): Option<U> {
    return some(fn(this.value))
  }

  /**
   * Chains with another Option using a function.
   * @template U The type of the new value.
   * @param {(value: T) => Option<U>} fn The function returning an Option.
   * @returns {Option<U>} The Option returned by the function.
   * @example
   * ```typescript
   * const opt = some(42);
   * console.log(opt.andThen(x => some(x * 2))); // Some(84)
   * console.log(opt.andThen(x => none())); // None
   * ```
   */
  andThen<U>(fn: (value: T) => Option<U>): Option<U> {
    return fn(this.value)
  }

  /**
   * Filters the value based on a predicate.
   * @param {(value: T) => boolean} predicate The predicate function.
   * @returns {Option<T>} The same Option if the predicate is true, otherwise None.
   * @example
   * ```typescript
   * const opt = some(42);
   * console.log(opt.filter(x => x > 0)); // Some(42)
   * console.log(opt.filter(x => x < 0)); // None
   * ```
   */
  filter(predicate: (value: T) => boolean): Option<T> {
    return predicate(this.value) ? this : NONE
  }

  /**
   * Combines this Option with another into a tuple.
   * @template U The type of the other value.
   * @param {Option<U>} other The other Option.
   * @returns {Option<[T, U]>} An Option containing a tuple if both are Some, otherwise None.
   * @example
   * ```typescript
   * const opt = some(42);
   * console.log(opt.zip(some("hello"))); // Some([42, "hello"])
   * console.log(opt.zip(none())); // None
   * ```
   */
  zip<U>(other: Option<U>): Option<[T, U]> {
    return other.match({
      some: (otherValue) => some([this.value, otherValue]),
      none: () => NONE,
    })
  }

  /**
   * Flattens a nested Option.
   * @returns {Option<Unwrap<T>>} The inner Option or value wrapped in Some.
   * @example
   * ```typescript
   * const nested = some(some(42));
   * console.log(nested.flatten()); // Some(42)
   * const simple = some(42);
   * console.log(simple.flatten()); // Some(42)
   * ```
   */
  flatten(): Option<Unwrap<T>> {
    return isOption<Unwrap<T>>(this.value) ? this.value : some(this.value as Unwrap<T>)
  }

  /**
   * Returns this Option (no-op for Some).
   * @returns {Option<T>} This Option.
   * @example
   * ```typescript
   * const opt = some(42);
   * console.log(opt.orElse(() => some(99))); // Some(42)
   * ```
   */
  orElse(): Option<T> {
    return this
  }

  /**
   * Returns the contained value.
   * @returns {T} The value.
   * @example
   * ```typescript
   * const opt = some(42);
   * console.log(opt.unwrapOr(0)); // 42
   * ```
   */
  unwrapOr(): T {
    return this.value
  }

  /**
   * Returns the contained value.
   * @returns {T} The value.
   * @example
   * ```typescript
   * const opt = some(42);
   * console.log(opt.unwrapOrElse(() => 0)); // 42
   * ```
   */
  unwrapOrElse(): T {
    return this.value
  }

  /**
   * Matches the Option, executing the some branch.
   * @template U The type of the result.
   * @param {{ some: (value: T) => U; none: () => U }} branches The branches to execute.
   * @returns {U} The result of the some branch.
   * @example
   * ```typescript
   * const opt = some(42);
   * console.log(opt.match({ some: x => x * 2, none: () => 0 })); // 84
   * ```
   */
  match<U>(branches: { some: (value: T) => U; none: () => U }): U {
    return branches.some(this.value)
  }

  /**
   * Converts Some to a Result with the value.
   * @template E The type of the error.
   * @param {E} error The error (unused for Some).
   * @returns {Result<T, E>} Ok with the value.
   * @example
   * ```typescript
   * const opt = some(42);
   * console.log(opt.toResult("Error")); // Ok(42)
   * ```
   */
  toResult<E>(error: E): Result<T, E> {
    return ok(this.value)
  }

  /**
   * Converts Some to an OptionAsync.
   * @returns {OptionAsync<T>} An OptionAsync with the value.
   * @example
   * ```typescript
   * const opt = some(42);
   * opt.toAsync().then(console.log); // Some(42)
   * ```
   */
  toAsync(): OptionAsync<T> {
    return OptionAsync.some(this.value)
  }

  /**
   * Converts the value to an Option containing an array.
   * @returns {Option<T[]>} An Option with the value as an array or the array itself.
   * @example
   * ```typescript
   * const opt = some(42);
   * console.log(opt.sequence()); // Some([42])
   * const arrOpt = some([1, 2, 3]);
   * console.log(arrOpt.sequence()); // Some([1, 2, 3])
   * ```
   */
  sequence(): Option<T[]> {
    return some(this.value instanceof Array ? this.value : [this.value])
  }

  /**
   * Executes a side-effect function on the value.
   * @param {(value: T) => void} fn The side-effect function.
   * @returns {Option<T>} This Option.
   * @example
   * ```typescript
   * const opt = some(42);
   * opt.tap(x => console.log(x)); // Logs: 42
   * console.log(opt); // Some(42)
   * ```
   */
  tap(fn: (value: T) => void): Option<T> {
    fn(this.value)
    return this
  }

  /**
   * Chains multiple Option-transforming functions.
   * @template U The type of the final Option's value.
   * @param {...Array<(arg: Option<T>) => MaybePromise<Option<U>>>} fns The functions to apply.
   * @returns {MaybePromise<Option<U>>} The final Option after applying all functions.
   * @example
   * ```typescript
   * const opt = some(42);
   * opt.pipe(
   *   opt => opt.map(x => x * 2),
   *   opt => opt.map(x => x + 1)
   * ).then(console.log); // Some(85)
   * ```
   */
  pipe<U>(...fns: Array<(arg: Option<T>) => MaybePromise<Option<U>>>): MaybePromise<Option<U>> {
    let result: MaybePromise<Option<any>> = Promise.resolve(this)
    for (const fn of fns) {
      result = Promise.resolve(result).then((opt) => fn(opt as Option<T>))
    }
    return result as MaybePromise<Option<U>>
  }
}

/**
 * Represents an asynchronous Option containing a value or None.
 * @class
 * @template T The type of the value.
 * @implements {OptionAsync<T>}
 */
class OptionAsync<T> implements OptionAsync<T> {
  private constructor(private readonly promise: Promise<Option<T>>) {}

  /**
   * Creates an OptionAsync containing a value (Some).
   * @template T The type of the value.
   * @param {MaybePromise<T>} value The value or Promise of the value.
   * @returns {OptionAsync<T>} An OptionAsync containing the value.
   * @example
   * ```typescript
   * OptionAsync.some(42).then(console.log); // Some(42)
   * OptionAsync.some(Promise.resolve(42)).then(console.log); // Some(42)
   * ```
   */
  static some<T>(value: MaybePromise<T>): OptionAsync<T> {
    return new OptionAsync(Promise.resolve(value).then((v) => some(v)))
  }

  /**
   * Creates an OptionAsync representing None.
   * @template T The type of the value.
   * @returns {OptionAsync<T>} An OptionAsync representing None.
   * @example
   * ```typescript
   * OptionAsync.none().then(console.log); // None
   * ```
   */
  static none<T>(): OptionAsync<T> {
    return new OptionAsync(Promise.resolve(NONE as Option<T>))
  }

  /**
   * Creates an OptionAsync from a nullable value.
   * @template T The type of the value.
   * @param {MaybePromise<T | null | undefined>} value The value or Promise of the value.
   * @returns {OptionAsync<T>} An OptionAsync containing the value if non-null, otherwise None.
   * @example
   * ```typescript
   * OptionAsync.from(42).then(console.log); // Some(42)
   * OptionAsync.from(null).then(console.log); // None
   * OptionAsync.from(Promise.resolve(undefined)).then(console.log); // None
   * ```
   */
  static from<T>(value: MaybePromise<T | null | undefined>): OptionAsync<T> {
    return new OptionAsync(Promise.resolve(value).then((v) => (v == null ? NONE : some(v))))
  }

  /**
   * Creates an OptionAsync by executing a potentially throwing function.
   * @template T The type of the value.
   * @param {() => MaybePromise<T>} fn The function to execute.
   * @returns {OptionAsync<T>} An OptionAsync containing the result if successful, otherwise None.
   * @example
   * ```typescript
   * OptionAsync.try(() => 42).then(console.log); // Some(42)
   * OptionAsync.try(() => { throw new Error("Fail"); }).then(console.log); // None
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
   * Asynchronously checks if the OptionAsync is Some.
   * @returns {Promise<boolean>} A Promise resolving to true if Some, false if None.
   * @example
   * ```typescript
   * OptionAsync.some(42).isSome().then(console.log); // true
   * OptionAsync.none().isSome().then(console.log); // false
   * ```
   */
  async isSome(): Promise<boolean> {
    return (await this.promise).isSome()
  }

  /**
   * Asynchronously checks if the OptionAsync is None.
   * @returns {Promise<boolean>} A Promise resolving to true if None, false if Some.
   * @example
   * ```typescript
   * OptionAsync.some(42).isNone().then(console.log); // false
   * OptionAsync.none().isNone().then(console.log); // true
   * ```
   */
  async isNone(): Promise<boolean> {
    return (await this.promise).isNone()
  }

  /**
   * Asynchronously checks if the OptionAsync contains a specific value.
   * @param {T} value The value to compare.
   * @returns {Promise<boolean>} A Promise resolving to true if the value matches, false otherwise.
   * @example
   * ```typescript
   * OptionAsync.some(42).contains(42).then(console.log); // true
   * OptionAsync.some(42).contains(99).then(console.log); // false
   * OptionAsync.none().contains(42).then(console.log); // false
   * ```
   */
  async contains(value: T): Promise<boolean> {
    return (await this.promise).contains(value)
  }

  /**
   * Asynchronously maps the contained value.
   * @template U The type of the new value.
   * @param {(value: T) => MaybePromise<U>} fn The mapping function.
   * @returns {Promise<Option<U>>} A Promise resolving to a new Option with the mapped value.
   * @example
   * ```typescript
   * OptionAsync.some(42).map(x => x * 2).then(console.log); // Some(84)
   * OptionAsync.none().map(x => x * 2).then(console.log); // None
   * ```
   */
  async map<U>(fn: (value: T) => MaybePromise<U>): Promise<Option<U>> {
    const opt = await this.promise
    if (opt.isNone()) return none() as Option<U>
    const mappedValue = await Promise.resolve(fn(opt.unwrapOr(undefined as never)))
    return some(mappedValue)
  }

  /**
   * Asynchronously chains with another Option-like value.
   * @template U The type of the new value.
   * @param {(value: T) => OptionLike<U>} fn The function returning an Option or OptionAsync.
   * @returns {Promise<Option<U>>} A Promise resolving to the resulting Option.
   * @example
   * ```typescript
   * OptionAsync.some(42).andThen(x => some(x * 2)).then(console.log); // Some(84)
   * OptionAsync.none().andThen(x => some(x * 2)).then(console.log); // None
   * ```
   */
  async andThen<U>(fn: (value: T) => OptionLike<U>): Promise<Option<U>> {
    const opt = await this.promise
    if (opt.isNone()) return none() as Option<U>
    const result = await fn(opt.unwrapOr(undefined as never))
    return result instanceof OptionAsync ? result.promise : result
  }

  /**
   * Asynchronously filters the value based on a predicate.
   * @param {(value: T) => MaybePromise<boolean>} predicate The predicate function.
   * @returns {Promise<Option<T>>} A Promise resolving to the same Option if the predicate is true, otherwise None.
   * @example
   * ```typescript
   * OptionAsync.some(42).filter(x => x > 0).then(console.log); // Some(42)
   * OptionAsync.some(42).filter(x => x < 0).then(console.log); // None
   * OptionAsync.none().filter(x => x > 0).then(console.log); // None
   * ```
   */
  async filter(predicate: (value: T) => MaybePromise<boolean>): Promise<Option<T>> {
    const opt = await this.promise
    if (opt.isNone()) return none() as Option<T>
    return (await predicate(opt.unwrapOr(undefined as never))) ? opt : (none() as Option<T>)
  }

  /**
   * Asynchronously combines with another Option-like value into a tuple.
   * @template U The type of the other value.
   * @param {OptionLike<U>} other The other Option or OptionAsync.
   * @returns {Promise<Option<[T, U]>>} A Promise resolving to an Option with a tuple if both are Some, otherwise None.
   * @example
   * ```typescript
   * OptionAsync.some(42).zip(some("hello")).then(console.log); // Some([42, "hello"])
   * OptionAsync.some(42).zip(OptionAsync.none()).then(console.log); // None
   * ```
   */
  async zip<U>(other: OptionLike<U>): Promise<Option<[T, U]>> {
    const opt = await this.promise
    const otherOpt = await (other instanceof OptionAsync ? other.promise : other)
    return opt.zip(otherOpt)
  }

  /**
   * Asynchronously flattens a nested Option or OptionAsync.
   * @returns {Promise<Option<Unwrap<T>>>} A Promise resolving to the inner Option or value wrapped in Some.
   * @example
   * ```typescript
   * OptionAsync.some(some(42)).flatten().then(console.log); // Some(42)
   * OptionAsync.some(42).flatten().then(console.log); // Some(42)
   * OptionAsync.none().flatten().then(console.log); // None
   * ```
   */
  async flatten(): Promise<Option<Unwrap<T>>> {
    const opt = await this.promise
    if (opt.isSome()) {
      const inner = opt.match({
        some: (value) => value,
        none: () => null as never,
      })
      if (inner instanceof OptionAsync) {
        return inner.flatten()
      }
      if (isOption(inner)) {
        return inner.flatten() as Option<Unwrap<T>>
      }
      return some(inner as Unwrap<T>)
    }
    return none() as Option<Unwrap<T>>
  }

  /**
   * Asynchronously provides a fallback Option-like value.
   * @param {() => OptionLike<T>} fn The function returning an Option or OptionAsync.
   * @returns {Promise<Option<T>>} A Promise resolving to this Option if Some, otherwise the fallback.
   * @example
   * ```typescript
   * OptionAsync.none().orElse(() => some(42)).then(console.log); // Some(42)
   * OptionAsync.some(99).orElse(() => some(42)).then(console.log); // Some(99)
   * ```
   */
  async orElse(fn: () => OptionLike<T>): Promise<Option<T>> {
    const opt = await this.promise
    if (opt.isSome()) return opt
    const result = await fn()
    return result instanceof OptionAsync ? result.promise : result
  }

  /**
   * Asynchronously returns the contained value or a default.
   * @param {MaybePromise<T>} defaultValue The default value or Promise.
   * @returns {Promise<T>} A Promise resolving to the value if Some, otherwise the default.
   * @example
   * ```typescript
   * OptionAsync.some(42).unwrapOr(0).then(console.log); // 42
   * OptionAsync.none().unwrapOr(0).then(console.log); // 0
   * ```
   */
  async unwrapOr(defaultValue: MaybePromise<T>): Promise<T> {
    return (await this.promise).unwrapOr(await Promise.resolve(defaultValue))
  }

  /**
   * Asynchronously returns the contained value or computes a default.
   * @param {() => MaybePromise<T>} fn The function to compute the default.
   * @returns {Promise<T>} A Promise resolving to the value if Some, otherwise the computed default.
   * @example
   * ```typescript
   * OptionAsync.some(42).unwrapOrElse(() => 0).then(console.log); // 42
   * OptionAsync.none().unwrapOrElse(() => 0).then(console.log); // 0
   * ```
   */
  async unwrapOrElse(fn: () => MaybePromise<T>): Promise<T> {
    return (await this.promise).unwrapOrElse(() => Promise.resolve(fn()) as T)
  }

  /**
   * Asynchronously matches the OptionAsync to execute different branches.
   * @template U The type of the result.
   * @param {{ some: (value: T) => MaybePromise<U>; none: () => MaybePromise<U> }} branches The branches to execute.
   * @returns {Promise<U>} A Promise resolving to the result of the appropriate branch.
   * @example
   * ```typescript
   * OptionAsync.some(42).match({
   *   some: x => x * 2,
   *   none: () => 0
   * }).then(console.log); // 84
   * OptionAsync.none().match({
   *   some: x => x * 2,
   *   none: () => 0
   * }).then(console.log); // 0
   * ```
   */
  async match<U>(branches: { some: (value: T) => MaybePromise<U>; none: () => MaybePromise<U> }): Promise<U> {
    const opt = await this.promise
    return opt.match({
      some: (value) => Promise.resolve(branches.some(value)) as U,
      none: () => Promise.resolve(branches.none()) as U,
    })
  }

  /**
   * Asynchronously converts to a ResultAsync.
   * @template E The type of the error.
   * @param {MaybePromise<E>} error The error or Promise for None.
   * @returns {Promise<ResultAsync<T, E>>} A Promise resolving to Ok with the value if Some, Err if None.
   * @example
   * ```typescript
   * OptionAsync.some(42).toResult("Error").then(console.log); // Ok(42)
   * OptionAsync.none().toResult("Error").then(console.log); // Err("Error")
   * ```
   */
  async toResult<E>(error: MaybePromise<E>): Promise<ResultAsync<T, E>> {
    const opt = await this.promise
    return opt.match({
      some: (value) => okAsync(value),
      none: () => errAsync(Promise.resolve(error)),
    })
  }

  /**
   * Asynchronously converts the value to an Option containing an array.
   * @returns {Promise<Option<T[]>>} A Promise resolving to an Option with the value as an array.
   * @example
   * ```typescript
   * OptionAsync.some(42).sequence().then(console.log); // Some([42])
   * OptionAsync.none().sequence().then(console.log); // Some([])
   * ```
   */
  async sequence(): Promise<Option<T[]>> {
    return (await this.promise).sequence()
  }

  /**
   * Asynchronously executes a side-effect function on the value.
   * @param {(value: T) => MaybePromise<void>} fn The side-effect function.
   * @returns {Promise<Option<T>>} A Promise resolving to the original Option.
   * @example
   * ```typescript
   * OptionAsync.some(42).tap(x => console.log(x)).then(console.log); // Logs: 42, Some(42)
   * OptionAsync.none().tap(x => console.log(x)).then(console.log); // Logs: None
   * ```
   */
  async tap(fn: (value: T) => MaybePromise<void>): Promise<Option<T>> {
    const opt = await this.promise
    if (opt.isSome()) await fn(opt.unwrapOr(undefined as never))
    return opt
  }

  /**
   * Asynchronously chains multiple Option-transforming functions.
   * @template U The type of the final Option's value.
   * @param {...Array<(arg: Option<T>) => MaybePromise<Option<U>>>} fns The functions to apply.
   * @returns {Promise<Option<U>>} A Promise resolving to the final Option.
   * @example
   * ```typescript
   * OptionAsync.some(42).pipe(
   *   opt => opt.map(x => x * 2),
   *   opt => opt.map(x => x + 1)
   * ).then(console.log); // Some(85)
   * OptionAsync.none().pipe(opt => opt.map(x => x * 2)).then(console.log); // None
   * ```
   */
  pipe<U>(...fns: Array<(arg: Option<T>) => MaybePromise<Option<U>>>): Promise<Option<U>> {
    let result: Promise<Option<any>> = this.promise
    for (const fn of fns) {
      result = result.then((opt) => fn(opt as Option<T>))
    }
    return result as Promise<Option<U>>
  }
}

/**
 * Creates an Option containing a value (Some).
 * @template T The type of the value.
 * @param {T} value The value to wrap.
 * @returns {Option<T>} An Option containing the value.
 * @example
 * ```typescript
 * console.log(some(42)); // Some(42)
 * console.log(some("hello")); // Some("hello")
 * ```
 */
function some<T>(value: T): Option<T> {
  return new Some(value)
}

/**
 * Creates an Option representing None.
 * @returns {Option<unknown>} An Option representing None.
 * @example
 * ```typescript
 * console.log(none()); // None
 * ```
 */
function none(): Option<unknown> {
  return NONE
}

/**
 * Creates an Option from a nullable value.
 * @template T The type of the value.
 * @param {T | null | undefined} value The value to wrap.
 * @returns {Option<T>} Some if the value is non-null, None otherwise.
 * @example
 * ```typescript
 * console.log(from(42)); // Some(42)
 * console.log(from(null)); // None
 * console.log(from(undefined)); // None
 * ```
 */
function from<T>(value: T | null | undefined): Option<T> {
  return value == null ? NONE : some(value)
}

/**
 * Creates an Option by executing a potentially throwing function.
 * @template T The type of the value.
 * @template E The type of the error.
 * @param {() => T} fn The function to execute.
 * @param {(e: unknown) => E} [onError] Optional error handler.
 * @returns {Option<T>} Some if the function succeeds, None if it throws.
 * @example
 * ```typescript
 * console.log(tryOption(() => 42)); // Some(42)
 * console.log(tryOption(() => { throw new Error("Fail"); })); // None
 * console.log(tryOption(() => { throw new Error("Fail"); }, e => console.log(e))); // None, logs error
 * ```
 */
function tryOption<T, E>(fn: () => T, onError?: (e: unknown) => E): Option<T> {
  try {
    return some(fn())
  } catch (e) {
    if (onError) onError(e)
    return NONE
  }
}

/**
 * Type guard to check if a value is an `OptionAsync`.
 * @template T The type of the value in the `OptionAsync`.
 * @param value The value to check.
 * @returns `true` if the value is an `OptionAsync`, `false` otherwise.
 * @example
 * ```typescript
 * import { some, isOptionAsync } from 'neverever';
 *
 * const syncOption = some(42); // Option<number>
 * const asyncOption = some(42).toAsync(); // OptionAsync<number>
 *
 * console.log(isOptionAsync(syncOption)); // false
 * console.log(isOptionAsync(asyncOption)); // true
 *
 * // Type narrowing example
 * function processOption(value: Option<number> | OptionAsync<number>) {
 *   if (isOptionAsync(value)) {
 *     // value is OptionAsync<number>
 *     value.map(async n => n * 2).then(opt => opt.unwrapOr(0)).then(console.log); // 84
 *   } else {
 *     // value is Option<number>
 *     console.log(value.unwrapOr(0)); // 42
 *   }
 * }
 * processOption(asyncOption);
 * processOption(syncOption);
 * ```
 */
function isOptionAsync<T>(value: any): value is OptionAsync<T> {
  return value instanceof OptionAsync
}

export { Option, OptionAsync, some, none, isOption, isOptionAsync, from, tryOption }

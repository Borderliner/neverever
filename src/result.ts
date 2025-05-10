// result.ts
import { Option, OptionAsync, some, none } from './option'
import { Unwrap, MaybePromise } from './types'

/**
 * Represents a result that is either a success (`Ok`) containing a value of type `T` or a failure (`Err`) containing an error of type `E`.
 * @template T The type of the value in case of success.
 * @template E The type of the error in case of failure.
 */
interface Result<T, E> {
  /**
   * Checks if the result is an `Ok` value.
   * @returns `true` if the result is `Ok`, `false` otherwise.
   * @example
   * const result = new Ok<number, string>(42);
   * console.log(result.isOk()); // true
   * const error = new Err<number, string>("error");
   * console.log(error.isOk()); // false
   */
  isOk(): boolean

  /**
   * Checks if the result is an `Err` value.
   * @returns `true` if the result is `Err`, `false` otherwise.
   * @example
   * const result = new Ok<number, string>(42);
   * console.log(result.isErr()); // false
   * const error = new Err<number, string>("error");
   * console.log(error.isErr()); // true
   */
  isErr(): boolean

  /**
   * Maps the `Ok` value to a new value using the provided function, leaving `Err` unchanged.
   * @template U The type of the new value.
   * @param fn A function to transform the `Ok` value.
   * @returns A new `Result` with the transformed value if `Ok`, or the same `Err`.
   * @example
   * const result = new Ok<number, string>(42);
   * const mapped = result.map(x => x.toString());
   * console.log(mapped); // Ok("42")
   * const error = new Err<number, string>("error");
   * console.log(error.map(x => x.toString())); // Err("error")
   */
  map<U>(fn: (value: T) => U): Result<U, E>

  /**
   * Maps the `Err` value to a new error using the provided function, leaving `Ok` unchanged.
   * @template F The type of the new error.
   * @param fn A function to transform the `Err` value.
   * @returns A new `Result` with the transformed error if `Err`, or the same `Ok`.
   * @example
   * const error = new Err<number, string>("error");
   * const mapped = error.mapErr(e => e.toUpperCase());
   * console.log(mapped); // Err("ERROR")
   * const result = new Ok<number, string>(42);
   * console.log(result.mapErr(e => e.toUpperCase())); // Ok(42)
   */
  mapErr<F>(fn: (error: E) => F): Result<T, F>

  /**
   * Chains a computation that produces another `Result` if the current result is `Ok`, otherwise returns the `Err`.
   * @template U The type of the new value.
   * @template F The type of the new error.
   * @param fn A function that takes the `Ok` value and returns a new `Result`.
   * @returns The result of the function if `Ok`, or the same `Err`.
   * @example
   * const result = new Ok<number, string>(42);
   * const chained = result.andThen(x => new Ok<string, string>(x.toString()));
   * console.log(chained); // Ok("42")
   * const error = new Err<number, string>("error");
   * console.log(error.andThen(x => new Ok<string, string>(x.toString()))); // Err("error")
   */
  andThen<U, F>(fn: (value: T) => Result<U, F>): Result<U, E | F>

  /**
   * Applies a function to the `Err` value to produce a new `Result`, leaving `Ok` unchanged.
   * @template F The type of the new error.
   * @param fn A function that takes the `Err` value and returns a new `Result`.
   * @returns The result of the function if `Err`, or the same `Ok`.
   * @example
   * const error = new Err<number, string>("error");
   * const recovered = error.orElse(e => new Ok<number, string>(0));
   * console.log(recovered); // Ok(0)
   * const result = new Ok<number, string>(42);
   * console.log(result.orElse(e => new Ok<number, string>(0))); // Ok(42)
   */
  orElse<F>(fn: (error: E) => Result<T, F>): Result<T, E | F>

  /**
   * Returns the `Ok` value or a provided default value if `Err`.
   * @param defaultValue The value to return if the result is `Err`.
   * @returns The `Ok` value or the default value.
   * @example
   * const result = new Ok<number, string>(42);
   * console.log(result.unwrapOr(0)); // 42
   * const error = new Err<number, string>("error");
   * console.log(error.unwrapOr(0)); // 0
   */
  unwrapOr(defaultValue: T): T

  /**
   * Returns the `Ok` value or computes a value from the `Err` using the provided function.
   * @param fn A function that takes the `Err` value and returns a fallback value.
   * @returns The `Ok` value or the computed fallback value.
   * @example
   * const error = new Err<number, string>("error");
   * console.log(error.unwrapOrElse(e => e.length)); // 5
   * const result = new Ok<number, string>(42);
   * console.log(result.unwrapOrElse(e => e.length)); // 42
   */
  unwrapOrElse(fn: (error: E) => T): T

  /**
   * Matches the result to either an `Ok` or `Err` branch and applies the corresponding function.
   * @template U The type of the returned value.
   * @param branches An object with `ok` and `err` functions to handle `Ok` and `Err` cases.
   * @returns The result of the appropriate branch function.
   * @example
   * const result = new Ok<number, string>(42);
   * console.log(result.match({
   *   ok: x => `Success: ${x}`,
   *   err: e => `Error: ${e}`
   * })); // "Success: 42"
   * const error = new Err<number, string>("error");
   * console.log(error.match({
   *   ok: x => `Success: ${x}`,
   *   err: e => `Error: ${e}`
   * })); // "Error: error"
   */
  match<U>(branches: { ok: (value: T) => U; err: (error: E) => U }): U

  /**
   * Converts the `Result` to an `Option`, returning `some(value)` for `Ok` or `none()` for `Err`.
   * @returns An `Option` containing the `Ok` value or `none`.
   * @example
   * const result = new Ok<number, string>(42);
   * console.log(result.toOption()); // some(42)
   * const error = new Err<number, string>("error");
   * console.log(error.toOption()); // none()
   */
  toOption(): Option<T>

  /**
   * Filters the `Ok` value based on a predicate, returning `Err` with the provided error if the predicate fails.
   * @param predicate A function to test the `Ok` value.
   * @param error The error to return if the predicate fails or the result is `Err`.
   * @returns The original `Result` if the predicate passes, or `Err` with the provided error.
   * @example
   * const result = new Ok<number, string>(42);
   * console.log(result.filter(x => x > 0, "negative")); // Ok(42)
   * console.log(result.filter(x => x < 0, "negative")); // Err("negative")
   * const error = new Err<number, string>("error");
   * console.log(error.filter(x => x > 0, "negative")); // Err("negative")
   */
  filter(predicate: (value: T) => boolean, error: E): Result<T, E>

  /**
   * Combines this `Result` with another, returning a `Result` containing a tuple of both values if both are `Ok`, or the first `Err` encountered.
   * @template U The type of the other `Result`'s value.
   * @template F The type of the other `Result`'s error.
   * @param other The other `Result` to combine with.
   * @returns A `Result` with a tuple of values if both are `Ok`, or the first `Err`.
   * @example
   * const result1 = new Ok<number, string>(42);
   * const result2 = new Ok<string, string>("hello");
   * console.log(result1.zip(result2)); // Ok([42, "hello"])
   * const error = new Err<number, string>("error");
   * console.log(result1.zip(error)); // Err("error")
   */
  zip<U, F>(other: Result<U, F>): Result<[T, U], E | F>

  /**
   * Flattens a nested `Result` by removing one level of nesting if the value is itself a `Result`.
   * @returns A `Result` with one level of nesting removed, or the same `Result` if not nested.
   * @example
   * const nested = new Ok<Result<number, string>, string>(new Ok<number, string>(42));
   * console.log(nested.flatten()); // Ok(42)
   * const simple = new Ok<number, string>(42);
   * console.log(simple.flatten()); // Ok(42)
   * const error = new Err<number, string>("error");
   * console.log(error.flatten()); // Err("error")
   */
  flatten(): Result<Unwrap<T>, E>

  /**
   * Checks if the `Ok` value equals the provided value.
   * @param value The value to compare against.
   * @returns `true` if the result is `Ok` and its value equals the provided value, `false` otherwise.
   * @example
   * const result = new Ok<number, string>(42);
   * console.log(result.contains(42)); // true
   * console.log(result.contains(0)); // false
   * const error = new Err<number, string>("error");
   * console.log(error.contains(42)); // false
   */
  contains(value: T): boolean

  /**
   * Recovers from an `Err` by transforming it into an `Ok` value using the provided function, leaving `Ok` unchanged.
   * @param fn A function to transform the `Err` value into an `Ok` value.
   * @returns A new `Result` with the recovered value if `Err`, or the same `Ok`.
   * @example
   * const error = new Err<number, string>("error");
   * console.log(error.recover(e => e.length)); // Ok(5)
   * const result = new Ok<number, string>(42);
   * console.log(result.recover(e => e.length)); // Ok(42)
   */
  recover(fn: (error: E) => T): Result<T, E>

  /**
   * Converts the `Ok` value into an array, wrapping it in an array if it is not already one, or propagates the `Err`.
   * @returns A `Result` with the `Ok` value as an array, or the same `Err`.
   * @example
   * const result = new Ok<number, string>(42);
   * console.log(result.sequence()); // Ok([42])
   * const array = new Ok<number[], string>([1, 2, 3]);
   * console.log(array.sequence()); // Ok([1, 2, 3])
   * const error = new Err<number, string>("error");
   * console.log(error.sequence()); // Err("error")
   */
  sequence(): Result<T[], E>

  /**
   * Performs a side-effect with the `Ok` value, leaving the `Result` unchanged.
   * @param fn A function to perform a side-effect with the `Ok` value.
   * @returns The original `Result`.
   * @example
   * const result = new Ok<number, string>(42);
   * result.tap(x => console.log(x)); // Logs: 42
   * console.log(result); // Ok(42)
   * const error = new Err<number, string>("error");
   * error.tap(x => console.log(x)); // No log
   * console.log(error); // Err("error")
   */
  tap(fn: (value: T) => void): Result<T, E>

  /**
   * Performs a side-effect with the `Err` value, leaving the `Result` unchanged.
   * @param fn A function to perform a side-effect with the `Err` value.
   * @returns The original `Result`.
   * @example
   * const error = new Err<number, string>("error");
   * error.tapErr(e => console.log(e)); // Logs: "error"
   * console.log(error); // Err("error")
   * const result = new Ok<number, string>(42);
   * result.tapErr(e => console.log(e)); // No log
   * console.log(result); // Ok(42)
   */
  tapErr(fn: (error: E) => void): Result<T, E>

  /**
   * Converts the `Result` to a `ResultAsync` for asynchronous operations.
   * @returns A `ResultAsync` wrapping the current `Result` in a resolved promise.
   * @example
   * const result = new Ok<number, string>(42);
   * const asyncResult = result.toAsync();
   * asyncResult.match({
   *   ok: x => console.log(x), // Logs: 42
   *   err: e => console.log(e)
   * });
   */
  toAsync(): ResultAsync<T, E>
}

/**
 * Represents an asynchronous result that resolves to either an `Ok` value of type `T` or an `Err` value of type `E`.
 * @template T The type of the value in case of success.
 * @template E The type of the error in case of failure.
 */
interface ResultAsync<T, E> {
  /**
   * Checks if the result resolves to an `Ok` value.
   * @returns A promise that resolves to `true` if the result is `Ok`, `false` otherwise.
   * @example
   * const result = ResultAsync.fromPromise(Promise.resolve(42), e => "error");
   * result.isOk().then(console.log); // true
   */
  isOk(): Promise<boolean>

  /**
   * Checks if the result resolves to an `Err` value.
   * @returns A promise that resolves to `true` if the result is `Err`, `false` otherwise.
   * @example
   * const result = ResultAsync.fromPromise(Promise.reject("fail"), e => "error");
   * result.isErr().then(console.log); // true
   */
  isErr(): Promise<boolean>

  /**
   * Maps the `Ok` value to a new value using the provided function, leaving `Err` unchanged.
   * @template U The type of the new value.
   * @param fn A function to transform the `Ok` value, which may return a promise.
   * @returns A new `ResultAsync` with the transformed value if `Ok`, or the same `Err`.
   * @example
   * const result = ResultAsync.fromPromise(Promise.resolve(42), e => "error");
   * const mapped = result.map(x => x.toString());
   * mapped.match({ ok: x => console.log(x), err: e => console.log(e) }); // "42"
   */
  map<U>(fn: (value: T) => MaybePromise<U>): ResultAsync<U, E>

  /**
   * Maps the `Err` value to a new error using the provided function, leaving `Ok` unchanged.
   * @template F The type of the new error.
   * @param fn A function to transform the `Err` value, which may return a promise.
   * @returns A new `ResultAsync` with the transformed error if `Err`, or the same `Ok`.
   * @example
   * const result = ResultAsync.fromPromise(Promise.reject("fail"), e => "error");
   * const mapped = result.mapErr(e => e.toUpperCase());
   * mapped.match({ ok: x => console.log(x), err: e => console.log(e) }); // "ERROR"
   */
  mapErr<F>(fn: (error: E) => MaybePromise<F>): ResultAsync<T, F>

  /**
   * Chains a computation that produces another `Result` or `ResultAsync` if the current result is `Ok`, otherwise returns the `Err`.
   * @template U The type of the new value.
   * @template F The type of the new error.
   * @param fn A function that takes the `Ok` value and returns a `Result` or `ResultAsync`.
   * @returns A `ResultAsync` with the result of the function if `Ok`, or the same `Err`.
   * @example
   * const result = ResultAsync.fromPromise(Promise.resolve(42), e => "error");
   * const chained = result.andThen(x => new Ok<string, string>(x.toString()));
   * chained.match({ ok: x => console.log(x), err: e => console.log(e) }); // "42"
   */
  andThen<U, F>(fn: (value: T) => Result<U, F> | ResultAsync<U, F>): ResultAsync<U, E | F>

  /**
   * Applies a function to the `Err` value to produce a new `Result` or `ResultAsync`, leaving `Ok` unchanged.
   * @template F The type of the new error.
   * @param fn A function that takes the `Err` value and returns a `Result` or `ResultAsync`.
   * @returns A `ResultAsync` with the result of the function if `Err`, or the same `Ok`.
   * @example
   * const result = ResultAsync.fromPromise(Promise.reject("fail"), e => "error");
   * const recovered = result.orElse(e => new Ok<number, string>(0));
   * recovered.match({ ok: x => console.log(x), err: e => console.log(e) }); // 0
   */
  orElse<F>(fn: (error: E) => Result<T, F> | ResultAsync<T, F>): ResultAsync<T, E | F>

  /**
   * Returns the `Ok` value or a provided default value if `Err`.
   * @param defaultValue The value to return if the result is `Err`, which may be a promise.
   * @returns A promise resolving to the `Ok` value or the default value.
   * @example
   * const result = ResultAsync.fromPromise(Promise.resolve(42), e => "error");
   * result.unwrapOr(0).then(console.log); // 42
   * const error = ResultAsync.fromPromise(Promise.reject("fail"), e => "error");
   * error.unwrapOr(0).then(console.log); // 0
   */
  unwrapOr(defaultValue: MaybePromise<T>): Promise<T>

  /**
   * Returns the `Ok` value or computes a value from the `Err` using the provided function.
   * @param fn A function that takes the `Err` value and returns a fallback value, which may be a promise.
   * @returns A promise resolving to the `Ok` value or the computed fallback value.
   * @example
   * const error = ResultAsync.fromPromise(Promise.reject("fail"), e => "error");
   * error.unwrapOrElse(e => e.length).then(console.log); // 5
   */
  unwrapOrElse(fn: (error: E) => MaybePromise<T>): Promise<T>

  /**
   * Matches the result to either an `Ok` or `Err` branch and applies the corresponding function.
   * @template U The type of the returned value.
   * @param branches An object with `ok` and `err` functions to handle `Ok` and `Err` cases, which may return promises.
   * @returns A promise resolving to the result of the appropriate branch function.
   * @example
   * const result = ResultAsync.fromPromise(Promise.resolve(42), e => "error");
   * result.match({
   *   ok: x => `Success: ${x}`,
   *   err: e => `Error: ${e}`
   * }).then(console.log); // "Success: 42"
   */
  match<U>(branches: { ok: (value: T) => MaybePromise<U>; err: (error: E) => MaybePromise<U> }): Promise<U>

  /**
   * Converts the `ResultAsync` to an `OptionAsync`, returning `some(value)` for `Ok` or `none()` for `Err`.
   * @returns An `OptionAsync` containing the `Ok` value or `none`.
   * @example
   * const result = ResultAsync.fromPromise(Promise.resolve(42), e => "error");
   * result.toOption().match({ some: x => console.log(x), none: () => console.log("none") }); // 42
   */
  toOption(): OptionAsync<T>

  /**
   * Filters the `Ok` value based on a predicate, returning `Err` with the provided error if the predicate fails.
   * @param predicate A function to test the `Ok` value, which may return a promise.
   * @param error The error to return if the predicate fails or the result is `Err`, which may be a promise.
   * @returns A `ResultAsync` with the original value if the predicate passes, or `Err` with the provided error.
   * @example
   * const result = ResultAsync.fromPromise(Promise.resolve(42), e => "error");
   * result.filter(x => x > 0, "negative").match({ ok: x => console.log(x), err: e => console.log(e) }); // 42
   * result.filter(x => x < 0, "negative").match({ ok: x => console.log(x), err: e => console.log(e) }); // "negative"
   */
  filter(predicate: (value: T) => MaybePromise<boolean>, error: MaybePromise<E>): ResultAsync<T, E>

  /**
   * Combines this `ResultAsync` with another `Result` or `ResultAsync`, returning a `ResultAsync` containing a tuple of both values if both are `Ok`, or the first `Err` encountered.
   * @template U The type of the other result's value.
   * @template F The type of the other result's error.
   * @param other The other `Result` or `ResultAsync` to combine with.
   * @returns A `ResultAsync` with a tuple of values if both are `Ok`, or the first `Err`.
   * @example
   * const result1 = ResultAsync.fromPromise(Promise.resolve(42), e => "error");
   * const result2 = new Ok<string, string>("hello");
   * result1.zip(result2).match({ ok: x => console.log(x), err: e => console.log(e) }); // [42, "hello"]
   */
  zip<U, F>(other: Result<U, F> | ResultAsync<U, F>): ResultAsync<[T, U], E | F>

  /**
   * Flattens a nested `ResultAsync` by removing one level of nesting if the value is itself a `Result`.
   * @returns A `ResultAsync` with one level of nesting removed, or the same `ResultAsync` if not nested.
   * @example
   * const nested = ResultAsync.fromPromise(Promise.resolve(new Ok<number, string>(42)), e => "error");
   * nested.flatten().match({ ok: x => console.log(x), err: e => console.log(e) }); // 42
   */
  flatten(): ResultAsync<Unwrap<T>, E>

  /**
   * Checks if the `Ok` value equals the provided value.
   * @param value The value to compare against.
   * @returns A promise resolving to `true` if the result is `Ok` and its value equals the provided value, `false` otherwise.
   * @example
   * const result = ResultAsync.fromPromise(Promise.resolve(42), e => "error");
   * result.contains(42).then(console.log); // true
   * result.contains(0).then(console.log); // false
   */
  contains(value: T): Promise<boolean>

  /**
   * Recovers from an `Err` by transforming it into an `Ok` value using the provided function, leaving `Ok` unchanged.
   * @param fn A function to transform the `Err` value into an `Ok` value, which may return a promise.
   * @returns A `ResultAsync` with the recovered value if `Err`, or the same `Ok`.
   * @example
   * const error = ResultAsync.fromPromise(Promise.reject("fail"), e => "error");
   * error.recover(e => e.length).match({ ok: x => console.log(x), err: e => console.log(e) }); // 5
   */
  recover(fn: (error: E) => MaybePromise<T>): ResultAsync<T, E>

  /**
   * Converts the `Ok` value into an array, wrapping it in an array if it is not already one, or propagates the `Err`.
   * @returns A `ResultAsync` with the `Ok` value as an array, or the same `Err`.
   * @example
   * const result = ResultAsync.fromPromise(Promise.resolve(42), e => "error");
   * result.sequence().match({ ok: x => console.log(x), err: e => console.log(e) }); // [42]
   */
  sequence(): ResultAsync<T[], E>

  /**
   * Performs a side-effect with the `Ok` value, leaving the `ResultAsync` unchanged.
   * @param fn A function to perform a side-effect with the `Ok` value, which may return a promise.
   * @returns The original `ResultAsync`.
   * @example
   * const result = ResultAsync.fromPromise(Promise.resolve(42), e => "error");
   * result.tap(x => console.log(x)).match({ ok: x => console.log(x), err: e => console.log(e) }); // Logs: 42, then 42
   */
  tap(fn: (value: T) => MaybePromise<void>): ResultAsync<T, E>

  /**
   * Performs a side-effect with the `Err` value, leaving the `ResultAsync` unchanged.
   * @param fn A function to perform a side-effect with the `Err` value, which may return a promise.
   * @returns The original `ResultAsync`.
   * @example
   * const error = ResultAsync.fromPromise(Promise.reject("fail"), e => "error");
   * error.tapErr(e => console.log(e)).match({ ok: x => console.log(x), err: e => console.log(e) }); // Logs: "error", then "error"
   */
  tapErr(fn: (error: E) => MaybePromise<void>): ResultAsync<T, E>
}

/**
 * Represents a successful result containing a value of type `T`.
 * @template T The type of the value.
 * @template E The type of the error (not used in `Ok` but required for interface compatibility).
 */
class Ok<T, E> implements Result<T, E> {
  /**
   * Creates a new `Ok` result with the given value.
   * @param value The value to wrap in the `Ok` result.
   * @example
   * const result = new Ok<number, string>(42);
   * console.log(result); // Ok(42)
   */
  constructor(private readonly value: T) {}

  isOk(): boolean {
    return true
  }

  isErr(): boolean {
    return false
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Ok<U, E>(fn(this.value))
  }

  mapErr<F>(_fn: (error: E) => F): Result<T, F> {
    return new Ok<T, F>(this.value)
  }

  andThen<U, F>(fn: (value: T) => Result<U, F>): Result<U, E | F> {
    return fn(this.value)
  }

  orElse<F>(_fn: (error: E) => Result<T, F>): Result<T, E | F> {
    return new Ok<T, E | F>(this.value)
  }

  unwrapOr(_defaultValue: T): T {
    return this.value
  }

  unwrapOrElse(_fn: (error: E) => T): T {
    return this.value
  }

  match<U>(branches: { ok: (value: T) => U; err: (error: E) => U }): U {
    return branches.ok(this.value)
  }

  toOption(): Option<T> {
    return some(this.value)
  }

  filter(predicate: (value: T) => boolean, error: E): Result<T, E> {
    return predicate(this.value) ? this : new Err(error)
  }

  zip<U, F>(other: Result<U, F>): Result<[T, U], E | F> {
    return other.match({
      ok: (value: U): Result<[T, U], E | F> => new Ok<[T, U], E | F>([this.value, value] as [T, U]),
      err: (error: F): Result<[T, U], E | F> => new Err<[T, U], E | F>(error),
    })
  }

  flatten(): Result<Unwrap<T>, E> {
    if (isResult<Unwrap<T>, E>(this.value)) {
      return this.value as Result<Unwrap<T>, E>
    }
    return new Ok<Unwrap<T>, E>(this.value as Unwrap<T>)
  }

  contains(value: T): boolean {
    return this.value === value
  }

  recover(_fn: (error: E) => T): Result<T, E> {
    return this
  }

  sequence(): Result<T[], E> {
    return new Ok<T[], E>(this.value instanceof Array ? this.value : [this.value])
  }

  tap(fn: (value: T) => void): Result<T, E> {
    fn(this.value)
    return this
  }

  tapErr(_fn: (error: E) => void): Result<T, E> {
    return this
  }

  toAsync(): ResultAsync<T, E> {
    return new ResultAsync(Promise.resolve(new Ok<T, E>(this.value)))
  }
}

/**
 * Represents a failed result containing an error of type `E`.
 * @template T The type of the value (not used in `Err` but required for interface compatibility).
 * @template E The type of the error.
 */
class Err<T, E> implements Result<T, E> {
  /**
   * Creates a new `Err` result with the given error.
   * @param error The error to wrap in the `Err` result.
   * @example
   * const error = new Err<number, string>("error");
   * console.log(error); // Err("error")
   */
  constructor(private readonly error: E) {}

  isOk(): boolean {
    return false
  }

  isErr(): boolean {
    return true
  }

  map<U>(_fn: (value: T) => U): Result<U, E> {
    return new Err<U, E>(this.error)
  }

  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    return new Err<T, F>(fn(this.error))
  }

  andThen<U, F>(_fn: (value: T) => Result<U, F>): Result<U, E | F> {
    return new Err<U, E | F>(this.error as E | F)
  }

  orElse<F>(fn: (error: E) => Result<T, F>): Result<T, E | F> {
    return fn(this.error)
  }

  unwrapOr(defaultValue: T): T {
    return defaultValue
  }

  unwrapOrElse(fn: (error: E) => T): T {
    return fn(this.error)
  }

  match<U>(branches: { ok: (value: T) => U; err: (error: E) => U }): U {
    return branches.err(this.error)
  }

  toOption(): Option<T> {
    return none() as Option<T>
  }

  filter(_predicate: (value: T) => boolean, error: E): Result<T, E> {
    return new Err<T, E>(error)
  }

  zip<U, F>(_other: Result<U, F>): Result<[T, U], E | F> {
    return new Err<[T, U], E | F>(this.error as E | F)
  }

  flatten(): Result<Unwrap<T>, E> {
    return new Err<Unwrap<T>, E>(this.error)
  }

  contains(_value: T): boolean {
    return false
  }

  recover(fn: (error: E) => T): Result<T, E> {
    return new Ok<T, E>(fn(this.error))
  }

  sequence(): Result<T[], E> {
    return new Err<T[], E>(this.error)
  }

  tap(_fn: (value: T) => void): Result<T, E> {
    return this
  }

  tapErr(fn: (error: E) => void): Result<T, E> {
    fn(this.error)
    return this
  }

  toAsync(): ResultAsync<T, E> {
    return new ResultAsync(Promise.resolve(new Err<T, E>(this.error)))
  }
}

/**
 * Represents an asynchronous result that resolves to either an `Ok` or `Err` value.
 * @template T The type of the value in case of success.
 * @template E The type of the error in case of failure.
 */
class ResultAsync<T, E> implements ResultAsync<T, E> {
  /**
   * Creates a new `ResultAsync` from a promise that resolves to a `Result`.
   * @param promise A promise that resolves to a `Result`.
   * @example
   * const result = new ResultAsync(Promise.resolve(new Ok<number, string>(42)));
   * result.match({ ok: x => console.log(x), err: e => console.log(e) }); // 42
   */
  constructor(private readonly promise: Promise<Result<T, E>>) {}

  /**
   * Creates a `ResultAsync` from a promise, catching errors and wrapping them in an `Err`.
   * @template T The type of the value.
   * @template E The type of the error.
   * @param promise The promise to wrap.
   * @param onError A function to transform caught errors into the error type `E`.
   * @returns A `ResultAsync` that resolves to `Ok` if the promise resolves, or `Err` if it rejects.
   * @example
   * const result = ResultAsync.fromPromise(Promise.resolve(42), e => `Error: ${e}`);
   * result.match({ ok: x => console.log(x), err: e => console.log(e) }); // 42
   * const error = ResultAsync.fromPromise(Promise.reject("fail"), e => `Error: ${e}`);
   * error.match({ ok: x => console.log(x), err: e => console.log(e) }); // "Error: fail"
   */
  static fromPromise<T, E>(promise: Promise<T>, onError: (e: unknown) => E): ResultAsync<T, E> {
    return new ResultAsync(promise.then((value) => new Ok<T, E>(value)).catch((e) => new Err<T, E>(onError(e))))
  }

  /**
   * Creates a `ResultAsync` from a promise that cannot fail, always resolving to an `Ok` value.
   * @template T The type of the value.
   * @param promise The promise to wrap.
   * @returns A `ResultAsync` that resolves to `Ok` with the promise's value.
   * @example
   * const result = ResultAsync.fromSafePromise(Promise.resolve(42));
   * result.match({ ok: x => console.log(x), err: e => console.log(e) }); // 42
   */
  static fromSafePromise<T>(promise: Promise<T>): ResultAsync<T, never> {
    return new ResultAsync(promise.then((value) => new Ok<T, never>(value)))
  }

  async isOk(): Promise<boolean> {
    return (await this.promise).isOk()
  }

  async isErr(): Promise<boolean> {
    return (await this.promise).isErr()
  }

  map<U>(fn: (value: T) => MaybePromise<U>): ResultAsync<U, E> {
    return new ResultAsync(
      this.promise.then((result) =>
        result.match({
          ok: (value) => Promise.resolve(fn(value)).then((mapped) => new Ok<U, E>(mapped)),
          err: (error) => Promise.resolve(new Err<U, E>(error)),
        })
      )
    )
  }

  mapErr<F>(fn: (error: E) => MaybePromise<F>): ResultAsync<T, F> {
    return new ResultAsync(
      this.promise.then((result) =>
        result.match({
          ok: (value) => Promise.resolve(new Ok<T, F>(value)),
          err: (error) => Promise.resolve(fn(error)).then((mapped) => new Err<T, F>(mapped)),
        })
      )
    )
  }

  andThen<U, F>(fn: (value: T) => Result<U, F> | ResultAsync<U, F>): ResultAsync<U, E | F> {
    return new ResultAsync(
      this.promise.then((result) =>
        result.match({
          ok: (value): Promise<Result<U, E | F>> => {
            const next = fn(value)
            return next instanceof ResultAsync ? next.promise : Promise.resolve(next)
          },
          err: (error): Promise<Result<U, E | F>> => Promise.resolve(new Err<U, E | F>(error)),
        })
      )
    )
  }

  orElse<F>(fn: (error: E) => Result<T, F> | ResultAsync<T, F>): ResultAsync<T, E | F> {
    return new ResultAsync(
      this.promise.then((result) =>
        result.match({
          ok: (value): Promise<Result<T, E | F>> => Promise.resolve(new Ok<T, E | F>(value)),
          err: (error): Promise<Result<T, E | F>> => {
            const next = fn(error)
            return next instanceof ResultAsync ? next.promise : Promise.resolve(next)
          },
        })
      )
    )
  }

  async unwrapOr(defaultValue: MaybePromise<T>): Promise<T> {
    return this.promise.then((result) =>
      result.match({
        ok: (value) => Promise.resolve(value),
        err: () => Promise.resolve(defaultValue),
      })
    )
  }

  async unwrapOrElse(fn: (error: E) => MaybePromise<T>): Promise<T> {
    return this.promise.then((result) =>
      result.match({
        ok: (value) => Promise.resolve(value),
        err: (error) => Promise.resolve(fn(error)),
      })
    )
  }

  async match<U>(branches: { ok: (value: T) => MaybePromise<U>; err: (error: E) => MaybePromise<U> }): Promise<U> {
    return this.promise.then((result) =>
      result.match({
        ok: (value) => Promise.resolve(branches.ok(value)),
        err: (error) => Promise.resolve(branches.err(error)),
      })
    )
  }

  toOption(): OptionAsync<T> {
    return OptionAsync.from(
      this.promise.then((result) =>
        result.match({
          ok: (value) => value,
          err: () => null,
        })
      )
    )
  }

  filter(predicate: (value: T) => MaybePromise<boolean>, error: MaybePromise<E>): ResultAsync<T, E> {
    return new ResultAsync(
      this.promise.then((result) =>
        result.match({
          ok: (value) =>
            Promise.resolve(predicate(value)).then((p) =>
              p ? new Ok<T, E>(value) : new Err<T, E>(Promise.resolve(error) as E)
            ),
          err: (error) => Promise.resolve(new Err<T, E>(error)),
        })
      )
    )
  }

  zip<U, F>(other: Result<U, F> | ResultAsync<U, F>): ResultAsync<[T, U], E | F> {
    return new ResultAsync<[T, U], E | F>(
      Promise.all([this.promise, other instanceof ResultAsync ? other.promise : Promise.resolve(other)]).then(
        ([result1, result2]) =>
          result1.match({
            ok: (value1) =>
              result2.match({
                ok: (value2) => new Ok<T, E | F>(value1).map((value1) => [value1, value2]),
                err: (error2) => new Err<[T, U], E | F>(error2),
              }),
            err: (error1) => new Err<[T, U], E | F>(error1),
          })
      )
    )
  }

  flatten(): ResultAsync<Unwrap<T>, E> {
    return new ResultAsync<Unwrap<T>, E>(
      this.promise.then((result) =>
        result.match({
          ok: (value) => {
            if (isResult<Unwrap<T>, any>(value)) {
              return value as Result<Unwrap<T>, E>
            }
            return new Ok<Unwrap<T>, E>(value as Unwrap<T>)
          },
          err: (error) => new Err<Unwrap<T>, E>(error),
        })
      )
    )
  }

  async contains(value: T): Promise<boolean> {
    const result = await this.promise
    return result.match({
      ok: (v) => v === value,
      err: () => false,
    })
  }

  recover(fn: (error: E) => MaybePromise<T>): ResultAsync<T, E> {
    return new ResultAsync(
      this.promise.then((result) =>
        result.match({
          ok: (value) => Promise.resolve(value).then((value) => new Ok<T, E>(value)),
          err: (error) => Promise.resolve(fn(error)).then((recovered) => new Ok<T, E>(recovered)),
        })
      )
    )
  }

  sequence(): ResultAsync<T[], E> {
    return new ResultAsync<T[], E>(
      this.promise.then((result) =>
        result.match<Result<T[], E>>({
          ok: (value) => new Ok<T[], E>(Array.isArray(value) ? value : [value]),
          err: (error) => new Err<T[], E>(error),
        })
      )
    )
  }

  tap(fn: (value: T) => MaybePromise<void>): ResultAsync<T, E> {
    return new ResultAsync(
      this.promise.then(async (result) => {
        if (result.isOk()) {
          await fn(result.unwrapOr(none() as T))
        }
        return result
      })
    )
  }

  tapErr(fn: (error: E) => MaybePromise<void>): ResultAsync<T, E> {
    return new ResultAsync(
      this.promise.then(async (result) => {
        if (result.isErr()) {
          await fn(result.match({ ok: () => undefined as never, err: (e) => e }))
        }
        return result
      })
    )
  }
}

/**
 * Type guard to check if a value is a ` *Result* (either `Ok` or `Err`).
 * @template T The type of the value in the *Result*.
 * @template E The type of the error in the *Result*.
 * @param value The value to check.
 * @returns `true` if the value is a *Result* (`Ok` or `Err`), `false` otherwise.
 * @example
 * const result = ok<number, string>(42);
 * console.log(isResult(result)); // true
 * console.log(isResult(42)); // false
 */
function isResult<T, E>(value: any): value is Result<T, E> {
  return value instanceof Ok || value instanceof Err
}

/**
 * Type guard to check if a value is a *ResultAsync*.
 * @template T The type of the value in the *ResultAsync*.
 * @template E The type of the error in the *ResultAsync*.
 * @param value The value to check.
 * @returns `true` if the value is a *ResultAsync*, `false` otherwise.
 * @example
 * const result = okAsync<number, string>(42);
 * console.log(isResultAsync(result)); // true
 * console.log(isResultAsync(42)); // false
 */
function isResultAsync<T, E>(value: any): value is ResultAsync<T, E> {
  return value instanceof ResultAsync
}

/**
 * Creates a new `Ok` result with the given value.
 * @template T The type of the value.
 * @template E The type of the error (not used in `Ok` but required for compatibility).
 * @param value The value to wrap in an `Ok` result.
 * @returns A new `Ok` result containing the value.
 * @example
 * const result = ok<number, string>(42);
 * console.log(result); // Ok(42)
 */
function ok<T, E>(value: T): Result<T, E> {
  return new Ok<T, E>(value)
}

/**
 * Creates a new `Err` result with the given error.
 * @template T The type of the value (not used in `Err` but required for compatibility).
 * @template E The type of the error.
 * @param error The error to wrap in an `Err` result.
 * @returns A new `Err` result containing the error.
 * @example
 * const error = err<number, string>("error");
 * console.log(error); // Err("error")
 */
function err<T, E>(error: E): Result<T, E> {
  return new Err<T, E>(error)
}

/**
 * Creates a new `ResultAsync` with an `Ok` value, supporting both synchronous and asynchronous values.
 * @template T The type of the value.
 * @template E The type of the error (not used in `Ok` but required for compatibility).
 * @param value The value to wrap in an `Ok` result, which may be a promise.
 * @returns A new `ResultAsync` containing an `Ok` result with the resolved value.
 * @example
 * const result = okAsync<number, string>(42);
 * result.match({ ok: x => console.log(x), err: e => console.log(e) }); // 42
 * const asyncResult = okAsync<number, string>(Promise.resolve(42));
 * asyncResult.match({ ok: x => console.log(x), err: e => console.log(e) }); // 42
 */
function okAsync<T, E>(value: MaybePromise<T>): ResultAsync<T, E> {
  return new ResultAsync(Promise.resolve(value).then((v) => new Ok<T, E>(v)))
}

/**
 * Creates a new `ResultAsync` with an `Err` value, supporting both synchronous and asynchronous errors.
 * @template T The type of the value (not used in `Err` but required for compatibility).
 * @template E The type of the error.
 * @param error The error to wrap in an `Err` result, which may be a promise.
 * @returns A new `ResultAsync` containing an `Err` result with the resolved error.
 * @example
 * const error = errAsync<number, string>("error");
 * error.match({ ok: x => console.log(x), err: e => console.log(e) }); // "error"
 * const asyncError = errAsync<number, string>(Promise.resolve("error"));
 * asyncError.match({ ok: x => console.log(x), err: e => console.log(e) }); // "error"
 */
function errAsync<T, E>(error: MaybePromise<E>): ResultAsync<T, E> {
  return new ResultAsync(Promise.resolve(error).then((e) => new Err<T, E>(e)))
}

/**
 * Creates a `ResultAsync` from a promise, catching errors and wrapping them in an `Err`.
 * @template T The type of the value.
 * @template E The type of the error.
 * @param promise The promise to wrap.
 * @param onError A function to transform caught errors into the error type `E`.
 * @returns A `ResultAsync` that resolves to `Ok` if the promise resolves, or `Err` if it rejects.
 * @example
 * const result = fromPromise(Promise.resolve(42), e => `Error: ${e}`);
 * result.match({ ok: x => console.log(x), err: e => console.log(e) }); // 42
 * const error = fromPromise(Promise.reject("fail"), e => `Error: ${e}`);
 * error.match({ ok: x => console.log(x), err: e => console.log(e) }); // "Error: fail"
 */
function fromPromise<T, E>(promise: Promise<T>, onError: (e: unknown) => E): ResultAsync<T, E> {
  return ResultAsync.fromPromise(promise, onError)
}

/**
 * Creates a `ResultAsync` from a promise that cannot fail, always resolving to an `Ok` value.
 * @template T The type of the value.
 * @param promise The promise to wrap.
 * @returns A `ResultAsync` that resolves to `Ok` with the promise's value.
 * @example
 * const result = fromSafePromise(Promise.resolve(42));
 * result.match({ ok: x => console.log(x), err: e => console.log(e) }); // 42
 */
function fromSafePromise<T>(promise: Promise<T>): ResultAsync<T, never> {
  return ResultAsync.fromSafePromise(promise)
}

/**
 * Wraps a synchronous function in a `Result`, catching any thrown errors and converting them to `Err`.
 * @template T The type of the value returned by the function.
 * @template E The type of the error.
 * @param fn The function to execute.
 * @param onError A function to transform caught errors into the error type `E`.
 * @returns A `Result` containing the function's return value as `Ok` or the transformed error as `Err`.
 * @example
 * const result = fromThrowable(() => 42, e => `Error: ${e}`);
 * console.log(result); // Ok(42)
 * const error = fromThrowable(() => { throw new Error("fail"); }, e => `Error: ${e}`);
 * console.log(error); // Err("Error: Error: fail")
 */
function fromThrowable<T, E>(fn: () => T, onError: (e: unknown) => E): Result<T, E> {
  try {
    return new Ok<T, E>(fn())
  } catch (e) {
    return new Err<T, E>(onError(e))
  }
}

/**
 * Wraps an asynchronous function in a `ResultAsync`, catching any thrown errors and converting them to `Err`.
 * @template T The type of the value returned by the function.
 * @template E The type of the error.
 * @param fn The asynchronous function to execute.
 * @param onError A function to transform caught errors into the error type `E`.
 * @returns A `ResultAsync` containing the function's resolved value as `Ok` or the transformed error as `Err`.
 * @example
 * const result = fromAsyncThrowable(async () => 42, e => `Error: ${e}`);
 * result.match({ ok: x => console.log(x), err: e => console.log(e) }); // 42
 * const error = fromAsyncThrowable(async () => { throw new Error("fail"); }, e => `Error: ${e}`);
 * error.match({ ok: x => console.log(x), err: e => console.log(e) }); // "Error: Error: fail"
 */
function fromAsyncThrowable<T, E>(fn: () => Promise<T>, onError: (e: unknown) => E): ResultAsync<T, E> {
  return new ResultAsync(
    fn()
      .then((value) => new Ok<T, E>(value))
      .catch((e) => new Err<T, E>(onError(e)))
  )
}

/**
 * Wraps a function that may return a synchronous or asynchronous value in a `Result` or `ResultAsync`, catching errors and converting them to `Err`.
 * @template T The type of the value returned by the function.
 * @template E The type of the error.
 * @param fn The function to execute, which may return a value or a promise.
 * @param onError A function to transform caught errors into the error type `E`.
 * @returns A `Result` if the function returns synchronously, or a `ResultAsync` if it returns a promise.
 * @example
 * const syncResult = safeTry(() => 42, e => `Error: ${e}`);
 * console.log(syncResult); // Ok(42)
 * const asyncResult = safeTry(async () => 42, e => `Error: ${e}`);
 * asyncResult.match({ ok: x => console.log(x), err: e => console.log(e) }); // 42
 * const error = safeTry(() => { throw new Error("fail"); }, e => `Error: ${e}`);
 * console.log(error); // Err("Error: Error: fail")
 */
function safeTry<T, E>(fn: () => MaybePromise<T>, onError: (e: unknown) => E): Result<T, E> | ResultAsync<T, E> {
  try {
    const result = fn()
    if (result instanceof Promise) {
      return new ResultAsync(result.then((value) => new Ok<T, E>(value)).catch((e) => new Err<T, E>(onError(e))))
    }
    return new Ok<T, E>(result)
  } catch (e) {
    return new Err<T, E>(onError(e))
  }
}

/**
 * Exports the core Result types and utility functions.
 */
export { Result, ResultAsync, Ok, Err }
export { ok, err, okAsync, errAsync, isResult, isResultAsync }
export { safeTry, fromPromise, fromSafePromise, fromThrowable, fromAsyncThrowable }

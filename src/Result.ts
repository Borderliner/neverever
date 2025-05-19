// Result.ts

import { Option } from './Option'
import { ResultAsync } from './ResultAsync'
import { MaybePromise, Unwrap } from './types'

/**
 * A class representing a value that is either a success (`Ok`) with a value of type `T` or a failure (`Err`) with an error of type `E`.
 * Useful for handling operations that may fail in a type-safe way.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 */
class Result<T, E> {
  private constructor(private readonly isOkFlag: boolean, private readonly value?: T, private readonly error?: E) {}

  private static readonly ERR = new Result<never, never>(false, undefined, undefined)

  /**
   * Creates a `Result` representing a successful outcome (`Ok`) with a value.
   *
   * @template T The type of the success value.
   * @template E The type of the potential error.
   * @param value The value to wrap in an `Ok` Result.
   * @returns A `Result` containing the provided value as `Ok`.
   *
   * @example
   * const ok = Result.ok<number, string>(42);
   * console.log(ok.isOk()); // true
   * console.log(ok.unwrapOr(0)); // 42
   */
  static ok<T, E>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined)
  }

  /**
   * Creates a `Result` representing a failed outcome (`Err`) with an error.
   *
   * @template T The type of the potential success value.
   * @template E The type of the error.
   * @param error The error to wrap in an `Err` Result.
   * @returns A `Result` containing the provided error as `Err`.
   *
   * @example
   * const err = Result.err<number, string>("Failed");
   * console.log(err.isErr()); // true
   * console.log(err.unwrapOr(0)); // 0
   */
  static err<T, E>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error)
  }

  /**
   * Creates a `Result` from a potentially null or undefined value.
   * Returns `Ok` if the value is neither null nor undefined, otherwise `Err` with the provided error.
   *
   * @template T The type of the success value.
   * @template E The type of the error.
   * @param value The value to convert to a `Result`.
   * @param error The error to use if the value is null or undefined.
   * @returns A `Result` containing the value as `Ok` or the error as `Err`.
   *
   * @example
   * const ok = Result.from(42, "Value missing"); // Ok(42)
   * const err = Result.from(null, "Value missing"); // Err("Value missing")
   * const undefinedErr = Result.from(undefined, "Value missing"); // Err("Value missing")
   */
  static from<T, E>(value: T | null | undefined, error: E): Result<T, E> {
    return value == null ? new Result<T, E>(false, undefined, error) : new Result<T, E>(true, value, undefined)
  }

  /**
   * Creates a `Result` or `ResultAsync` by executing a function and catching any errors.
   * Returns `Ok` with the result if the function succeeds, or `Err` with the mapped error if it throws.
   * Handles both synchronous and asynchronous functions.
   *
   * @template T The type of the success value.
   * @template E The type of the error.
   * @param fn The function to execute, which may return a value or Promise.
   * @param onError The function to map any caught error to the error type `E`.
   * @returns A `Result<T, E>` for synchronous functions or `ResultAsync<T, E>` for asynchronous functions.
   *
   * @example
   * // Synchronous function
   * const safeParse = Result.try(() => JSON.parse('{"key": "value"}'), e => `Parse error: ${e}`);
   * console.log(safeParse.unwrapOr({})); // { key: "value" }
   *
   * const failedParse = Result.try(() => JSON.parse('invalid'), e => `Parse error: ${e}`);
   * console.log(failedParse.unwrapOr({})); // {}
   *
   * // Asynchronous function
   * const asyncFetch = Result.try(
   *   () => fetch('https://api.example.com/data').then(res => res.json()),
   *   e => `Fetch error: ${e}`
   * );
   * const data = await asyncFetch.unwrapOr({ error: "Failed to fetch" });
   */
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

  /**
   * Checks if the `Result` is `Ok` (contains a value).
   *
   * @returns `true` if the `Result` is `Ok`, `false` if it is `Err`.
   *
   * @example
   * const ok = Result.ok<number, string>(42);
   * console.log(ok.isOk()); // true
   *
   * const err = Result.err<number, string>("Failed");
   * console.log(err.isOk()); // false
   */
  isOk(): boolean {
    return this.isOkFlag
  }

  /**
   * Checks if the `Result` is `Err` (contains an error).
   *
   * @returns `true` if the `Result` is `Err`, `false` if it is `Ok`.
   *
   * @example
   * const ok = Result.ok<number, string>(42);
   * console.log(ok.isErr()); // false
   *
   * const err = Result.err<number, string>("Failed");
   * console.log(err.isErr()); // true
   */
  isErr(): boolean {
    return !this.isOkFlag
  }

  /**
   * Checks if the `Result` is `Ok` and contains a specific value.
   *
   * @param value The value to compare against.
   * @returns `true` if the `Result` is `Ok` and its value equals the provided value, `false` otherwise.
   *
   * @example
   * const ok = Result.ok<number, string>(42);
   * console.log(ok.contains(42)); // true
   * console.log(ok.contains(43)); // false
   *
   * const err = Result.err<number, string>("Failed");
   * console.log(err.contains(42)); // false
   */
  contains(value: T): boolean {
    return this.isOkFlag && this.value === value
  }

  /**
   * Transforms the value in an `Ok` `Result` using the provided function.
   * Returns the original `Err` if the `Result` is `Err`.
   *
   * @template U The type of the transformed value.
   * @param fn The function to transform the value.
   * @returns A `Result` containing the transformed value or the original error.
   *
   * @example
   * const ok = Result.ok<number, string>(42);
   * const mapped = ok.map(x => x * 2);
   * console.log(mapped.unwrapOr(0)); // 84
   *
   * const err = Result.err<number, string>("Failed");
   * console.log(err.map(x => x * 2).unwrapOr(0)); // 0
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    return this.isOkFlag
      ? new Result<U, E>(true, fn(this.value!), undefined)
      : new Result<U, E>(false, undefined, this.error)
  }

  /**
   * Transforms the error in an `Err` `Result` using the provided function.
   * Returns the original `Ok` if the `Result` is `Ok`.
   *
   * @template F The type of the transformed error.
   * @param fn The function to transform the error.
   * @returns A `Result` containing the original value or the transformed error.
   *
   * @example
   * const err = Result.err<number, string>("Failed");
   * const mappedErr = err.mapErr(e => `Error: ${e}`);
   * console.log(mappedErr.unwrapOrElse(e => e)); // "Error: Failed"
   *
   * const ok = Result.ok<number, string>(42);
   * console.log(ok.mapErr(e => `Error: ${e}`).unwrapOr(0)); // 42
   */
  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    return this.isOkFlag
      ? new Result<T, F>(true, this.value, undefined)
      : new Result<T, F>(false, undefined, fn(this.error!))
  }

  /**
   * Chains a `Result` by applying a function that returns another `Result`.
   * Returns the original `Err` if the `Result` is `Err`.
   *
   * @template U The type of the value in the resulting `Result`.
   * @template F The type of the error in the resulting `Result`.
   * @param fn The function that returns a `Result`.
   * @returns A `Result` containing the result of the function or the original error.
   *
   * @example
   * const ok = Result.ok<number, string>(42);
   * const chained = ok.andThen(x => Result.ok<string, string>(`Value: ${x}`));
   * console.log(chained.unwrapOr("None")); // "Value: 42"
   *
   * const err = Result.err<number, string>("Failed");
   * console.log(err.andThen(x => Result.ok<string, string>(`Value: ${x}`)).unwrapOr("None")); // "None"
   */
  andThen<U, F>(fn: (value: T) => Result<U, F>): Result<U, E | F> {
    return this.isOkFlag ? fn(this.value!) : new Result<U, E | F>(false, undefined, this.error)
  }

  /**
   * Returns the current `Result` if it is `Ok`, otherwise returns the result of the provided function.
   *
   * @template F The type of the error in the fallback `Result`.
   * @param fn The function returning a `Result` as a fallback.
   * @returns A `Result` containing the original value or the fallback result.
   *
   * @example
   * const err = Result.err<number, string>("Failed");
   * const fallback = err.orElse(e => Result.ok<number, string>(0));
   * console.log(fallback.unwrapOr(-1)); // 0
   *
   * const ok = Result.ok<number, string>(42);
   * console.log(ok.orElse(e => Result.ok<number, string>(0)).unwrapOr(-1)); // 42
   */
  orElse<F>(fn: (error: E) => Result<T, F>): Result<T, E | F> {
    return this.isOkFlag ? new Result<T, E | F>(true, this.value!, undefined) : fn(this.error!)
  }

  /**
   * Filters the `Result` based on a predicate. Returns the original `Ok` if the predicate is true, otherwise `Err` with the provided error.
   *
   * @param predicate The function to test the value.
   * @param error The error to use if the predicate fails.
   * @returns The original `Result` if the predicate passes, otherwise `Err` with the provided error.
   *
   * @example
   * const ok = Result.ok<number, string>(42);
   * const filtered = ok.filter(x => x > 40, "Too small");
   * console.log(filtered.unwrapOr(0)); // 42
   *
   * const failedFilter = ok.filter(x => x < 40, "Too small");
   * console.log(failedFilter.unwrapOr(0)); // 0
   *
   * const err = Result.err<number, string>("Failed");
   * console.log(err.filter(x => x > 40, "Too small").unwrapOr(0)); // 0
   */
  filter(predicate: (value: T) => boolean, error: E): Result<T, E> {
    return this.isOkFlag && predicate(this.value!)
      ? this
      : this.isOkFlag
      ? new Result<T, E>(false, undefined, error)
      : this
  }

  /**
   * Combines two `Result`s into a single `Result` containing a tuple of their values.
   * Returns `Err` if either `Result` is `Err`.
   *
   * @template U The type of the value in the other `Result`.
   * @template F The type of the error in the other `Result`.
   * @param other The other `Result` to combine with.
   * @returns A `Result` containing a tuple of values or the first error encountered.
   *
   * @example
   * const ok1 = Result.ok<number, string>(42);
   * const ok2 = Result.ok<string, string>("hello");
   * const zipped = ok1.zip(ok2);
   * console.log(zipped.unwrapOr([0, ""])); // [42, "hello"]
   *
   * const err = Result.err<string, string>("Failed");
   * console.log(ok1.zip(err).unwrapOr([0, ""])); // [0, ""]
   */
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

  /**
   * Flattens a nested `Result` into a single `Result`.
   * If the `Result` is `Ok` and contains another `Result`, it recursively flattens it.
   *
   * @returns A flattened `Result`.
   *
   * @example
   * const nested = Result.ok<Result<number, string>, string>(Result.ok<number, string>(42));
   * console.log(nested.flatten().unwrapOr(0)); // 42
   *
   * const ok = Result.ok<number, string>(42);
   * console.log(ok.flatten().unwrapOr(0)); // 42
   *
   * const err = Result.err<number, string>("Failed");
   * console.log(err.flatten().unwrapOr(0)); // 0
   */
  flatten(): Result<Unwrap<T>, E> {
    if (!this.isOkFlag) return new Result<Unwrap<T>, E>(false, undefined, this.error)
    const inner = this.value
    return inner instanceof Result ? inner.flatten() : new Result<Unwrap<T>, E>(true, inner as Unwrap<T>, undefined)
  }

  /**
   * Returns the value if the `Result` is `Ok`, otherwise returns the provided default value.
   *
   * @param defaultValue The value to return if the `Result` is `Err`.
   * @returns The value of `Ok` or the default value.
   *
   * @example
   * const ok = Result.ok<number, string>(42);
   * console.log(ok.unwrapOr(0)); // 42
   *
   * const err = Result.err<number, string>("Failed");
   * console.log(err.unwrapOr(0)); // 0
   */
  unwrapOr(defaultValue: T): T {
    return this.isOkFlag ? this.value! : defaultValue
  }

  /**
   * Returns the value if the `Result` is `Ok`, otherwise returns the result of the provided function.
   *
   * @param fn The function to compute the default value based on the error.
   * @returns The value of `Ok` or the computed default value.
   *
   * @example
   * const ok = Result.ok<number, string>(42);
   * console.log(ok.unwrapOrElse(e => 0)); // 42
   *
   * const err = Result.err<number, string>("Failed");
   * console.log(err.unwrapOrElse(e => e.length)); // 6
   */
  unwrapOrElse(fn: (error: E) => T): T {
    return this.isOkFlag ? this.value! : fn(this.error!)
  }

  /**
   * Pattern-matches the `Result`, executing the appropriate branch based on whether it is `Ok` or `Err`.
   *
   * @template U The type of the result.
   * @param branches An object with `ok` and `err` branches.
   * @returns The result of the executed branch.
   *
   * @example
   * const ok = Result.ok<number, string>(42);
   * const result = ok.match({
   *   ok: x => `Value: ${x}`,
   *   err: e => `Error: ${e}`,
   * });
   * console.log(result); // "Value: 42"
   *
   * const err = Result.err<number, string>("Failed");
   * console.log(err.match({
   *   ok: x => `Value: ${x}`,
   *   err: e => `Error: ${e}`,
   * })); // "Error: Failed"
   */
  match<U>(branches: { ok: (value: T) => U; err: (error: E) => U }): U {
    return this.isOkFlag ? branches.ok(this.value!) : branches.err(this.error!)
  }

  /**
   * Converts the `Result` to an `Option`, discarding the error.
   * Returns `Some` if the `Result` is `Ok`, otherwise `None`.
   *
   * @returns An `Option` containing the value or `None`.
   *
   * @example
   * const ok = Result.ok<number, string>(42);
   * console.log(ok.toOption().unwrapOr(0)); // 42
   *
   * const err = Result.err<number, string>("Failed");
   * console.log(err.toOption().unwrapOr(0)); // 0
   */
  toOption(): Option<T> {
    return this.isOkFlag ? Option.some(this.value!) : Option.none()
  }

  /**
   * Recovers from an `Err` `Result` by providing a fallback value.
   * Returns the original `Ok` if the `Result` is `Ok`.
   *
   * @param fn The function to compute the recovery value based on the error.
   * @returns A `Result` containing the original value or the recovery value.
   *
   * @example
   * const err = Result.err<number, string>("Failed");
   * const recovered = err.recover(e => e.length);
   * console.log(recovered.unwrapOr(0)); // 6
   *
   * const ok = Result.ok<number, string>(42);
   * console.log(ok.recover(e => e.length).unwrapOr(0)); // 42
   */
  recover(fn: (error: E) => T): Result<T, E> {
    return this.isOkFlag ? this : new Result<T, E>(true, fn(this.error!), undefined)
  }

  /**
   * Converts the `Result` to a `Result` containing an array.
   * If `Ok`, wraps the value in an array (or keeps it if already an array); if `Err`, returns an empty array.
   *
   * @returns A `Result` containing an array of values or the original error.
   *
   * @example
   * const ok = Result.ok<number, string>(42);
   * const sequenced = ok.sequence();
   * console.log(sequenced.unwrapOr([])); // [42]
   *
   * const arrayOk = Result.ok<number[], string>([1, 2, 3]);
   * console.log(arrayOk.sequence().unwrapOr([])); // [1, 2, 3]
   *
   * const err = Result.err<number, string>("Failed");
   * console.log(err.sequence().unwrapOr([])); // []
   */
  sequence(): Result<T[], E> {
    if (this.isOkFlag) {
      return new Result<T[], E>(true, Array.isArray(this.value) ? this.value : [this.value!], undefined)
    }
    return new Result(false, [], this.error!)
  }

  /**
   * Performs a side effect with the value if the `Result` is `Ok`.
   * Returns the original `Result` unchanged.
   *
   * @param fn The function to execute with the value.
   * @returns The original `Result`.
   *
   * @example
   * const ok = Result.ok<number, string>(42);
   * const tapped = ok.tap(x => console.log(`Value: ${x}`));
   * console.log(tapped.unwrapOr(0)); // Logs "Value: 42", returns 42
   *
   * const err = Result.err<number, string>("Failed");
   * err.tap(x => console.log(`Value: ${x}`)); // No log
   */
  tap(fn: (value: T) => void): Result<T, E> {
    if (this.isOkFlag) fn(this.value!)
    return this
  }

  /**
   * Performs a side effect with the error if the `Result` is `Err`.
   * Returns the original `Result` unchanged.
   *
   * @param fn The function to execute with the error.
   * @returns The original `Result`.
   *
   * @example
   * const err = Result.err<number, string>("Failed");
   * const tapped = err.tapErr(e => console.log(`Error: ${e}`));
   * console.log(tapped.unwrapOr(0)); // Logs "Error: Failed", returns 0
   *
   * const ok = Result.ok<number, string>(42);
   * ok.tapErr(e => console.log(`Error: ${e}`)); // No log
   */
  tapErr(fn: (error: E) => void): Result<T, E> {
    if (!this.isOkFlag) fn(this.error!)
    return this
  }

  /**
   * Converts the `Result` to a `ResultAsync`, enabling asynchronous operations.
   *
   * @returns A `ResultAsync` containing the value or error.
   *
   * @example
   * const ok = Result.ok<number, string>(42);
   * const asyncOk = ok.toAsync();
   * console.log(await asyncOk.unwrapOr(0)); // 42
   *
   * const err = Result.err<number, string>("Failed");
   * const asyncErr = err.toAsync();
   * console.log(await asyncErr.unwrapOr(0)); // 0
   */
  toAsync(): ResultAsync<T, E> {
    return new ResultAsync(Promise.resolve(this))
  }
}

/**
 * Type guard to check if a value is an instance of `Result`.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 * @param value The value to check.
 * @returns `true` if the value is a `Result`, `false` otherwise.
 *
 * @example
 * const ok = Result.ok<number, string>(42);
 * console.log(isResult(ok)); // true
 * console.log(isResult(42)); // false
 * console.log(isResult(Option.some(42))); // false
 */
function isResult<T, E>(value: any): value is Result<T, E> {
  return value instanceof Result
}

export { Result, isResult }

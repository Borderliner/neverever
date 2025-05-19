// ResultAsync.ts

import { OptionAsync } from './OptionAsync'
import { isResult, Result } from './Result'
import { MaybePromise, Unwrap } from './types'

/**
 * A class representing an asynchronous result that is either a success (`Ok`) with a value of type `T` or a failure (`Err`) with an error of type `E`.
 * It wraps a `Promise` of a `Result<T, E>`, enabling safe handling of asynchronous operations that may fail.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 */
class ResultAsync<T, E> implements ResultAsync<T, E> {
  constructor(private readonly promise: Promise<Result<T, E>>) {}

  /**
   * Creates a `ResultAsync` representing a successful outcome (`Ok`) with a value.
   *
   * @template T The type of the success value.
   * @template E The type of the potential error.
   * @param value The value or Promise resolving to the value to wrap.
   * @returns A `ResultAsync` containing the resolved value as `Ok`.
   *
   * @example
   * const ok = ResultAsync.ok<number, string>(42);
   * console.log(await ok.unwrapOr(0)); // 42
   *
   * const asyncOk = ResultAsync.ok(Promise.resolve("hello"));
   * console.log(await asyncOk.unwrapOr("default")); // "hello"
   */
  static ok<T, E>(value: MaybePromise<T>): ResultAsync<T, E> {
    return new ResultAsync(Promise.resolve(value).then((v) => Result.ok(v)))
  }

  /**
   * Creates a `ResultAsync` representing a failed outcome (`Err`) with an error.
   *
   * @template T The type of the potential success value.
   * @template E The type of the error.
   * @param error The error or Promise resolving to the error to wrap.
   * @returns A `ResultAsync` containing the resolved error as `Err`.
   *
   * @example
   * const err = ResultAsync.err<number, string>("Failed");
   * console.log(await err.unwrapOr(0)); // 0
   *
   * const asyncErr = ResultAsync.err<number, string>(Promise.resolve("Async error"));
   * console.log(await asyncErr.unwrapOr(0)); // 0
   */
  static err<T, E>(error: MaybePromise<E>): ResultAsync<T, E> {
    return new ResultAsync(Promise.resolve(error).then((e) => Result.err(e)))
  }

  /**
   * Creates a `ResultAsync` from a potentially null or undefined value.
   * Returns `Ok` if the resolved value is neither null nor undefined, otherwise `Err` with the provided error.
   *
   * @template T The type of the success value.
   * @template E The type of the error.
   * @param value The value or Promise resolving to a value, which may be null or undefined.
   * @param error The error or Promise resolving to the error to use if the value is null or undefined.
   * @returns A `ResultAsync` containing the resolved value as `Ok` or the resolved error as `Err`.
   *
   * @example
   * const ok = ResultAsync.from(42, "Missing");
   * console.log(await ok.unwrapOr(0)); // 42
   *
   * const err = ResultAsync.from(null, "Missing");
   * console.log(await err.unwrapOr(0)); // 0
   *
   * const asyncFrom = ResultAsync.from(Promise.resolve(undefined), Promise.resolve("Async missing"));
   * console.log(await asyncFrom.unwrapOr(0)); // 0
   */
  static from<T, E>(value: MaybePromise<T | null | undefined>, error: MaybePromise<E>): ResultAsync<T, E> {
    return new ResultAsync(Promise.all([value, error]).then(([v, e]) => Result.from(v, e)))
  }

  /**
   * Creates a `ResultAsync` by executing an asynchronous function and catching any errors.
   * Returns `Ok` with the resolved result if the function succeeds, or `Err` with the mapped error if it throws.
   *
   * @template T The type of the success value.
   * @template E The type of the error.
   * @param fn The asynchronous function to execute, returning a Promise.
   * @param onError The function to map any caught error to the error type `E`.
   * @returns A `ResultAsync` containing the result as `Ok` or the mapped error as `Err`.
   *
   * @example
   * const fetchData = ResultAsync.try(
   *   () => fetch('https://api.example.com/data').then(res => res.json()),
   *   e => `Fetch error: ${e}`
   * );
   * console.log(await fetchData.unwrapOr({ error: "Failed" })); // { data: ... } or { error: "Failed" }
   *
   * const failedFetch = ResultAsync.try(
   *   () => Promise.reject(new Error("Network error")),
   *   e => `Error: ${e}`
   * );
   * console.log(await failedFetch.unwrapOr({ error: "Failed" })); // { error: "Failed" }
   */
  static try<T, E>(fn: () => Promise<T>, onError: (e: unknown) => E): ResultAsync<T, E> {
    return new ResultAsync(
      Promise.resolve()
        .then(() => fn())
        .then((value) => Result.ok<T, E>(value))
        .catch((e) => Result.err<T, E>(onError(e)))
    )
  }

  /**
   * Creates a `ResultAsync` from a Promise, catching any errors and mapping them to an error type.
   *
   * @template T The type of the success value.
   * @template E The type of the error.
   * @param promise The Promise to convert to a `ResultAsync`.
   * @param onError The function to map any caught error to the error type `E`.
   * @returns A `ResultAsync` containing the resolved value as `Ok` or the mapped error as `Err`.
   *
   * @example
   * const promise = fetch('https://api.example.com/data').then(res => res.json());
   * const result = ResultAsync.fromPromise(promise, e => `Error: ${e}`);
   * console.log(await result.unwrapOr({ error: "Failed" })); // { data: ... } or { error: "Failed" }
   */
  static fromPromise<T, E>(promise: Promise<T>, onError: (e: unknown) => E): ResultAsync<T, E> {
    return new ResultAsync(promise.then((value) => Result.ok<T, E>(value)).catch((e) => Result.err<T, E>(onError(e))))
  }

  /**
   * Creates a `ResultAsync` from a Promise, using the raw error as the `Err` value.
   *
   * @template T The type of the success value.
   * @template E The type of the error (defaults to `unknown`).
   * @param promise The Promise to convert to a `ResultAsync`.
   * @returns A `ResultAsync` containing the resolved value as `Ok` or the raw error as `Err`.
   *
   * @example
   * const promise = fetch('https://api.example.com/data').then(res => res.json());
   * const result = ResultAsync.fromSafePromise(promise);
   * console.log(await result.unwrapOr({ error: "Failed" })); // { data: ... } or { error: "Failed" }
   */
  static fromSafePromise<T, E = unknown>(promise: Promise<T>): ResultAsync<T, E> {
    return new ResultAsync(promise.then((value) => Result.ok<T, E>(value)).catch((e) => Result.err<T, E>(e)))
  }

  /**
   * Checks if the `ResultAsync` resolves to `Ok` (contains a value).
   *
   * @returns A Promise resolving to `true` if the `ResultAsync` is `Ok`, `false` if it is `Err`.
   *
   * @example
   * const ok = ResultAsync.ok<number, string>(42);
   * console.log(await ok.isOk()); // true
   *
   * const err = ResultAsync.err<number, string>("Failed");
   * console.log(await err.isOk()); // false
   */
  async isOk(): Promise<boolean> {
    return this.promise.then((res) => res.isOk())
  }

  /**
   * Checks if the `ResultAsync` resolves to `Err` (contains an error).
   *
   * @returns A Promise resolving to `true` if the `ResultAsync` is `Err`, `false` if it is `Ok`.
   *
   * @example
   * const ok = ResultAsync.ok<number, string>(42);
   * console.log(await ok.isErr()); // false
   *
   * const err = ResultAsync.err<number, string>("Failed");
   * console.log(await err.isErr()); // true
   */
  async isErr(): Promise<boolean> {
    return this.promise.then((res) => res.isErr())
  }

  /**
   * Checks if the `ResultAsync` resolves to `Ok` and contains a specific value.
   *
   * @param value The value to compare against.
   * @returns A Promise resolving to `true` if the `ResultAsync` is `Ok` and its value equals the provided value, `false` otherwise.
   *
   * @example
   * const ok = ResultAsync.ok<number, string>(42);
   * console.log(await ok.contains(42)); // true
   * console.log(await ok.contains(43)); // false
   *
   * const err = ResultAsync.err<number, string>("Failed");
   * console.log(await err.contains(42)); // false
   */
  async contains(value: T): Promise<boolean> {
    return this.promise.then((res) => res.contains(value))
  }

  /**
   * Transforms the value in an `Ok` `ResultAsync` using the provided function.
   * Returns the original `Err` if the `ResultAsync` resolves to `Err`.
   *
   * @template U The type of the transformed value.
   * @param fn The function to transform the value, which may return a value or Promise.
   * @returns A `ResultAsync` containing the transformed value or the original error.
   *
   * @example
   * const ok = ResultAsync.ok<number, string>(42);
   * const mapped = ok.map(x => x * 2);
   * console.log(await mapped.unwrapOr(0)); // 84
   *
   * const asyncMapped = ok.map(x => Promise.resolve(x + 1));
   * console.log(await asyncMapped.unwrapOr(0)); // 43
   *
   * const err = ResultAsync.err<number, string>("Failed");
   * console.log(await err.map(x => x * 2).unwrapOr(0)); // 0
   */
  map<U>(fn: (value: T) => MaybePromise<U>): ResultAsync<U, E> {
    return new ResultAsync(
      this.promise.then((res) =>
        res.match({
          ok: async (value) => Result.ok<U, E>(await fn(value)),
          err: async (error) => Result.err<U, E>(error),
        })
      )
    )
  }

  /**
   * Transforms the error in an `Err` `ResultAsync` using the provided function.
   * Returns the original `Ok` if the `ResultAsync` resolves to `Ok`.
   *
   * @template F The type of the transformed error.
   * @param fn The function to transform the error, which may return a value or Promise.
   * @returns A `ResultAsync` containing the original value or the transformed error.
   *
   * @example
   * const err = ResultAsync.err<number, string>("Failed");
   * const mappedErr = err.mapErr(e => `Error: ${e}`);
   * console.log(await mappedErr.unwrapOrElse(e => e)); // "Error: Failed"
   *
   * const asyncMappedErr = err.mapErr(e => Promise.resolve(`Async: ${e}`));
   * console.log(await asyncMappedErr.unwrapOrElse(e => e)); // "Async: Failed"
   *
   * const ok = ResultAsync.ok<number, string>(42);
   * console.log(await ok.mapErr(e => `Error: ${e}`).unwrapOr(0)); // 42
   */
  mapErr<F>(fn: (error: E) => MaybePromise<F>): ResultAsync<T, F> {
    return new ResultAsync(
      this.promise.then((res) =>
        res.match({
          ok: async (value) => Result.ok<T, F>(value),
          err: async (error) => Result.err<T, F>(await fn(error)),
        })
      )
    )
  }

  /**
   * Chains a `ResultAsync` by applying a function that returns a `Result` or `ResultAsync`.
   * Returns the original `Err` if the `ResultAsync` resolves to `Err`.
   *
   * @template U The type of the value in the resulting `ResultAsync`.
   * @template F The type of the error in the resulting `ResultAsync`.
   * @param fn The function that returns a `Result` or `ResultAsync`.
   * @returns A `ResultAsync` containing the result of the function or the original error.
   *
   * @example
   * const ok = ResultAsync.ok<number, string>(42);
   * const chained = ok.andThen(x => Result.ok<string, string>(`Value: ${x}`));
   * console.log(await chained.unwrapOr("None")); // "Value: 42"
   *
   * const asyncChained = ok.andThen(x => ResultAsync.ok<string, string>(Promise.resolve(`Async: ${x}`)));
   * console.log(await asyncChained.unwrapOr("None")); // "Async: 42"
   *
   * const err = ResultAsync.err<number, string>("Failed");
   * console.log(await err.andThen(x => Result.ok<string, string>(`Value: ${x}`)).unwrapOr("None")); // "None"
   */
  andThen<U, F>(fn: (value: T) => Result<U, F> | ResultAsync<U, F>): ResultAsync<U, E | F> {
    return new ResultAsync(
      this.promise.then((res) =>
        res.match({
          ok: async (value) => {
            const next = fn(value)
            return next instanceof ResultAsync ? next.promise : next
          },
          err: async (error) => Result.err<U, E | F>(error as E | F),
        })
      )
    )
  }

  /**
   * Returns the current `ResultAsync` if it resolves to `Ok`, otherwise returns the result of the provided function.
   *
   * @template F The type of the error in the fallback `Result` or `ResultAsync`.
   * @param fn The function returning a `Result` or `ResultAsync` as a fallback.
   * @returns A `ResultAsync` containing the original value or the fallback result.
   *
   * @example
   * const err = ResultAsync.err<number, string>("Failed");
   * const fallback = err.orElse(e => Result.ok<number, string>(0));
   * console.log(await fallback.unwrapOr(-1)); // 0
   *
   * const asyncFallback = err.orElse(e => ResultAsync.ok<number, string>(Promise.resolve(e.length)));
   * console.log(await asyncFallback.unwrapOr(-1)); // 6
   *
   * const ok = ResultAsync.ok<number, string>(42);
   * console.log(await ok.orElse(e => Result.ok<number, string>(0)).unwrapOr(-1)); // 42
   */
  orElse<F>(fn: (error: E) => Result<T, F> | ResultAsync<T, F>): ResultAsync<T, E | F> {
    return new ResultAsync(
      this.promise.then((res) =>
        res.match({
          ok: async (value) => Result.ok<T, E | F>(value),
          err: async (error) => {
            const next = fn(error)
            return next instanceof ResultAsync ? next.promise : next
          },
        })
      )
    )
  }

  /**
   * Filters the `ResultAsync` based on a predicate. Returns the original `Ok` if the predicate resolves to `true`, otherwise `Err` with the provided error.
   *
   * @param predicate The function to test the value, which may return a boolean or Promise<boolean>.
   * @param error The error or Promise resolving to the error to use if the predicate fails.
   * @returns A `ResultAsync` containing the original value if the predicate passes, otherwise `Err` with the provided error.
   *
   * @example
   * const ok = ResultAsync.ok<number, string>(42);
   * const filtered = ok.filter(x => x > 40, "Too small");
   * console.log(await filtered.unwrapOr(0)); // 42
   *
   * const asyncFiltered = ok.filter(x => Promise.resolve(x < 40), Promise.resolve("Too small"));
   * console.log(await asyncFiltered.unwrapOr(0)); // 0
   *
   * const err = ResultAsync.err<number, string>("Failed");
   * console.log(await err.filter(x => x > 40, "Too small").unwrapOr(0)); // 0
   */
  filter(predicate: (value: T) => MaybePromise<boolean>, error: MaybePromise<E>): ResultAsync<T, E> {
    return new ResultAsync(
      this.promise.then((res) =>
        res.match({
          ok: async (value) => {
            if (await predicate(value)) {
              return res // Result<T, E>
            }
            return Result.err<T, E>(await Promise.resolve(error)) // Explicitly Result<T, E>
          },
          err: async () => res, // Result<T, E>
        })
      )
    )
  }

  /**
   * Combines two `ResultAsync` or `Result` instances into a single `ResultAsync` containing a tuple of their values.
   * Returns `Err` if either resolves to `Err`.
   *
   * @template U The type of the value in the other `Result` or `ResultAsync`.
   * @template F The type of the error in the other `Result` or `ResultAsync`.
   * @param other The other `Result` or `ResultAsync` to combine with.
   * @returns A `ResultAsync` containing a tuple of values or the first error encountered.
   *
   * @example
   * const ok1 = ResultAsync.ok<number, string>(42);
   * const ok2 = ResultAsync.ok<string, string>("hello");
   * const zipped = ok1.zip(ok2);
   * console.log(await zipped.unwrapOr([0, ""])); // [42, "hello"]
   *
   * const err = ResultAsync.err<string, string>("Failed");
   * console.log(await ok1.zip(err).unwrapOr([0, ""])); // [0, ""]
   *
   * const syncResult = Result.ok<string, string>("world");
   * console.log(await ok1.zip(syncResult).unwrapOr([0, ""])); // [42, "world"]
   */
  zip<U, F>(other: Result<U, F> | ResultAsync<U, F>): ResultAsync<[T, U], E | F> {
    return new ResultAsync<[T, U], E | F>(
      Promise.all([this.promise, other instanceof ResultAsync ? other.promise : other]).then(([res1, res2]) =>
        res1.match({
          ok: (value1) =>
            res2.match({
              ok: (value2) => Result.ok<[T, U], E | F>([value1, value2]),
              err: (error) => Result.err<[T, U], E | F>(error),
            }),
          err: (error) => Result.err<[T, U], E | F>(error),
        })
      )
    )
  }

  /**
   * Flattens a nested `ResultAsync` or `Result` into a single `ResultAsync`.
   * Handles cases where the value is itself a `Result` or `ResultAsync`.
   *
   * @returns A flattened `ResultAsync`.
   *
   * @example
   * const nested = ResultAsync.ok<ResultAsync<number, string>, string>(ResultAsync.ok<number, string>(42));
   * const flattened = nested.flatten();
   * console.log(await flattened.unwrapOr(0)); // 42
   *
   * const syncNested = ResultAsync.ok<Result<number, string>, string>(Result.ok<number, string>(42));
   * console.log(await syncNested.flatten().unwrapOr(0)); // 42
   *
   * const err = ResultAsync.err<number, string>("Failed");
   * console.log(await err.flatten().unwrapOr(0)); // 0
   */
  flatten(): ResultAsync<Unwrap<T>, E> {
    return new ResultAsync(
      this.promise.then((res) =>
        res.match({
          ok: async (value) => {
            if (value instanceof ResultAsync) return value.flatten().promise
            if (isResult(value)) return value.flatten()
            return Result.ok(value as Unwrap<T>)
          },
          err: async (error) => Result.err<Unwrap<T>, E>(error),
        })
      )
    )
  }

  /**
   * Returns the value if the `ResultAsync` resolves to `Ok`, otherwise returns the provided default value.
   *
   * @param defaultValue The value or Promise to return if the `ResultAsync` is `Err`.
   * @returns A Promise resolving to the value of `Ok` or the default value.
   *
   * @example
   * const ok = ResultAsync.ok<number, string>(42);
   * console.log(await ok.unwrapOr(0)); // 42
   *
   * const err = ResultAsync.err<number, string>("Failed");
   * console.log(await err.unwrapOr(0)); // 0
   *
   * const asyncDefault = err.unwrapOr(Promise.resolve(100));
   * console.log(await asyncDefault); // 100
   */
  unwrapOr(defaultValue: MaybePromise<T>): Promise<T> {
    return this.promise.then((res) => res.unwrapOr(Promise.resolve(defaultValue) as T))
  }

  /**
   * Returns the value if the `ResultAsync` resolves to `Ok`, otherwise returns the result of the provided function.
   *
   * @param fn The function to compute the default value based on the error, which may return a value or Promise.
   * @returns A Promise resolving to the value of `Ok` or the computed default value.
   *
   * @example
   * const ok = ResultAsync.ok<number, string>(42);
   * console.log(await ok.unwrapOrElse(e => e.length)); // 42
   *
   * const err = ResultAsync.err<number, string>("Failed");
   * console.log(await err.unwrapOrElse(e => Promise.resolve(e.length))); // 6
   */
  unwrapOrElse(fn: (error: E) => MaybePromise<T>): Promise<T> {
    return this.promise.then((res) =>
      res.match({
        ok: (value) => Promise.resolve(value),
        err: (error) => Promise.resolve(fn(error)),
      })
    )
  }

  /**
   * Pattern-matches the `ResultAsync`, executing the appropriate branch based on whether it resolves to `Ok` or `Err`.
   *
   * @template U The type of the result.
   * @param branches An object with `ok` and `err` branches, which may return values or Promises.
   * @returns A Promise resolving to the result of the executed branch.
   *
   * @example
   * const ok = ResultAsync.ok<number, string>(42);
   * const result = await ok.match({
   *   ok: x => `Value: ${x}`,
   *   err: e => `Error: ${e}`,
   * });
   * console.log(result); // "Value: 42"
   *
   * const err = ResultAsync.err<number, string>("Failed");
   * const errResult = await err.match({
   *   ok: x => `Value: ${x}`,
   *   err: e => Promise.resolve(`Error: ${e}`),
   * });
   * console.log(errResult); // "Error: Failed"
   */
  match<U>(branches: { ok: (value: T) => MaybePromise<U>; err: (error: E) => MaybePromise<U> }): Promise<U> {
    return this.promise.then((res) =>
      res.match({
        ok: (value) => Promise.resolve(branches.ok(value)),
        err: (error) => Promise.resolve(branches.err(error)),
      })
    )
  }

  /**
   * Converts the `ResultAsync` to an `OptionAsync`, discarding the error.
   * Returns `Some` if the `ResultAsync` resolves to `Ok`, otherwise `None`.
   *
   * @returns An `OptionAsync` containing the value or `None`.
   *
   * @example
   * const ok = ResultAsync.ok<number, string>(42);
   * const option = ok.toOption();
   * console.log(await option.unwrapOr(0)); // 42
   *
   * const err = ResultAsync.err<number, string>("Failed");
   * const errOption = err.toOption();
   * console.log(await errOption.unwrapOr(0)); // 0
   */
  toOption(): OptionAsync<T> {
    return OptionAsync.from(this.promise.then((res) => res.match({ ok: (value) => value, err: () => null })))
  }

  /**
   * Converts the `ResultAsync` to a `ResultAsync` containing an array.
   * If `Ok`, wraps the value in an array (or keeps it if already an array); if `Err`, returns the original error.
   *
   * @returns A `ResultAsync` containing an array of values or the original error.
   *
   * @example
   * const ok = ResultAsync.ok<number, string>(42);
   * const sequenced = ok.sequence();
   * console.log(await sequenced.unwrapOr([])); // [42]
   *
   * const arrayOk = ResultAsync.ok<number[], string>([1, 2, 3]);
   * console.log(await arrayOk.sequence().unwrapOr([])); // [1, 2, 3]
   *
   * const err = ResultAsync.err<number, string>("Failed");
   * console.log(await err.sequence().unwrapOr([])); // []
   */
  sequence(): ResultAsync<T[], E> {
    return new ResultAsync<T[], E>(
      this.promise.then((res) =>
        res.match({
          ok: (value) => Result.ok<T[], E>(Array.isArray(value) ? value : [value]),
          err: (error) => Result.err<T[], E>(error),
        })
      )
    )
  }

  /**
   * Performs a side effect with the value if the `ResultAsync` resolves to `Ok`.
   * Returns the original `ResultAsync` unchanged.
   *
   * @param fn The function to execute with the value, which may return a Promise.
   * @returns The original `ResultAsync`.
   *
   * @example
   * const ok = ResultAsync.ok<number, string>(42);
   * const tapped = ok.tap(x => console.log(`Value: ${x}`));
   * console.log(await tapped.unwrapOr(0)); // Logs "Value: 42", returns 42
   *
   * const asyncTap = ok.tap(x => Promise.resolve(console.log(`Async: ${x}`)));
   * console.log(await asyncTap.unwrapOr(0)); // Logs "Async: 42", returns 42
   */
  tap(fn: (value: T) => MaybePromise<void>): ResultAsync<T, E> {
    return new ResultAsync(
      this.promise.then((res) =>
        res.match({
          ok: async (value) => {
            await fn(value)
            return res
          },
          err: async () => res,
        })
      )
    )
  }

  /**
   * Performs a side effect with the error if the `ResultAsync` resolves to `Err`.
   * Returns the original `ResultAsync` unchanged.
   *
   * @param fn The function to execute with the error, which may return a Promise.
   * @returns The original `ResultAsync`.
   *
   * @example
   * const err = ResultAsync.err<number, string>("Failed");
   * const tapped = err.tapErr(e => console.log(`Error: ${e}`));
   * console.log(await tapped.unwrapOr(0)); // Logs "Error: Failed", returns 0
   *
   * const asyncTap = err.tapErr(e => Promise.resolve(console.log(`Async: ${e}`)));
   * console.log(await asyncTap.unwrapOr(0)); // Logs "Async: Failed", returns 0
   */
  tapErr(fn: (error: E) => MaybePromise<void>): ResultAsync<T, E> {
    return new ResultAsync(
      this.promise.then((res) =>
        res.match({
          ok: async () => res,
          err: async (error) => {
            await fn(error)
            return res
          },
        })
      )
    )
  }
}

/**
 * Type guard to check if a value is an instance of `ResultAsync`.
 *
 * @template T The type of the success value.
 * @template E The type of the error value.
 * @param value The value to check.
 * @returns `true` if the value is a `ResultAsync`, `false` otherwise.
 *
 * @example
 * const ok = ResultAsync.ok<number, string>(42);
 * console.log(isResultAsync(ok)); // true
 * console.log(isResultAsync(Result.ok<number, string>(42))); // false
 * console.log(isResultAsync(42)); // false
 */
function isResultAsync<T, E>(value: any): value is ResultAsync<T, E> {
  return value instanceof ResultAsync
}

export { ResultAsync, isResultAsync }

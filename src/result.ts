import {
  Result as NeverthrowResult,
  ResultAsync as NeverthrowResultAsync,
  ok,
  err,
  Ok,
  Err,
  okAsync,
} from 'neverthrow'
import { Option, OptionAsync, some, none } from './option'
import { Unwrap, MaybePromise } from './types'

/**
 * Type guard to check if a value is a Promise.
 * @template T The type of the value contained in the Promise.
 * @param value The value to check.
 * @returns `true` if the value is a `Promise<T>`, `false` otherwise.
 * @example
 * ```typescript
 * import { tryCatch } from 'neverever';
 * function isAsync(value: any): boolean {
 *   return value instanceof Promise;
 * }
 * console.log(isAsync(Promise.resolve(42))); // true
 * console.log(isAsync(42)); // false
 * ```
 * @internal
 */
function isPromise<T>(value: any): value is Promise<T> {
  return value instanceof Promise
}

/**
 * Represents a synchronous result of a computation that may either succeed with a value (`Ok`) or fail with an error (`Err`).
 * Extends `neverthrow`'s `Result` with additional chainable methods for functional programming.
 * @template T The type of the value in case of success.
 * @template E The type of the error in case of failure.
 */
interface Result<T, E> {
  /**
   * Converts the Result to an Option, discarding the error if `Err`.
   * @returns An `Option<T>` containing the value if `Ok`, or `None` if `Err`.
   * @example
   * ```typescript
   * import { ok, err } from 'neverever';
   * const result = ok<string, string>('success');
   * const opt = result.toOption();
   * console.log(opt.unwrapOr('')); // 'success'
   * console.log(err<string, string>('failed').toOption().unwrapOr('')); // ''
   * ```
   */
  toOption(): Option<T>

  /**
   * Filters the Result based on a predicate. If the predicate returns `false` or the Result is `Err`, returns an `Err` with the provided error.
   * @param predicate A function to test the value.
   * @param error The error to return if the predicate fails.
   * @returns A `Result<T, E>` containing the value if the predicate passes, or the provided error.
   * @example
   * ```typescript
   * import { ok, err } from 'neverever';
   * const result = ok<number, string>(10);
   * const filtered = result.filter(n => n > 5, 'Too small');
   * console.log(filtered.unwrapOr(0)); // 10
   * console.log(result.filter(n => n > 15, 'Too small').unwrapOr(0)); // 0
   * console.log(err<number, string>('failed').filter(n => n > 5, 'Too small').unwrapOr(0)); // 0
   * ```
   */
  filter(predicate: (value: T) => boolean, error: E): Result<T, E>

  /**
   * Combines this Result with another synchronous Result, returning a Result containing a tuple of both values if both are `Ok`.
   * If either Result is `Err`, returns the first `Err` encountered.
   * @template U The type of the value in the other Result.
   * @template F The type of the error in the other Result.
   * @param other The other Result to combine with.
   * @returns A `Result<[T, U], E | F>` containing both values or the first error.
   * @example
   * ```typescript
   * import { ok, err } from 'neverever';
   * const result1 = ok<string, string>('hello');
   * const result2 = ok<number, string>(42);
   * const zipped = result1.zip(result2);
   * console.log(zipped.unwrapOr(['', 0])); // ['hello', 42]
   * console.log(result1.zip(err<number, string>('failed')).unwrapOr(['', 0])); // ['', 0]
   * ```
   */
  zip<U, F>(other: NeverthrowResult<U, F>): Result<[T, U], E | F>

  /**
   * Unwraps a nested Result, returning the inner Result if `Ok`, or the original error if `Err`.
   * @returns A `Result<Unwrap<T>, E>` containing the unwrapped value or the error.
   * @example
   * ```typescript
   * import { ok, err } from 'neverever';
   * const nested = ok<Result<number, string>, string>(ok(42));
   * const flat = nested.flatten();
   * console.log(flat.unwrapOr(0)); // 42
   * console.log(ok(42).flatten().unwrapOr(0)); // 42
   * console.log(err<number, string>('failed').flatten().unwrapOr(0)); // 0
   * ```
   */
  flatten(): Result<Unwrap<T>, E>

  /**
   * Checks if the Result contains a specific value.
   * @param value The value to compare against.
   * @returns `true` if the Result is `Ok` and contains the given value, `false` otherwise.
   * @example
   * ```typescript
   * import { ok, err } from 'neverever';
   * const result = ok('world');
   * console.log(result.contains('world')); // true
   * console.log(result.contains('hello')); // false
   * console.log(err<string, string>('failed').contains('world')); // false
   * ```
   */
  contains(value: T): boolean

  /**
   * Recovers from an error by providing a new value if the Result is `Err`.
   * @param fn A function that takes the error and returns a new value.
   * @returns A `Result<T, E>` containing the original value if `Ok`, or the recovered value if `Err`.
   * @example
   * ```typescript
   * import { ok, err } from 'neverever';
   * const result = err<string, string>('failed');
   * const recovered = result.recover(e => `recovered from ${e}`);
   * console.log(recovered.unwrapOr('')); // 'recovered from failed'
   * console.log(ok<string, string>('success').recover(e => 'recovered').unwrapOr('')); // 'success'
   * ```
   */
  recover(fn: (error: E) => T): Result<T, E>

  /**
   * Converts the value to an array, wrapping it in an array if it’s not already one.
   * @returns A `Result<T[], E>` containing the value as an array or the original error.
   * @example
   * ```typescript
   * import { ok, err } from 'neverever';
   * const result = ok(42);
   * console.log(result.sequence().unwrapOr([])); // [42]
   * console.log(ok([1, 2]).sequence().unwrapOr([])); // [1, 2]
   * console.log(err<number, string>('failed').sequence().unwrapOr([])); // []
   * ```
   */
  sequence(): Result<T[], E>

  /**
   * Executes a side-effect function on the value if `Ok`, then returns the original Result.
   * @param fn A function to execute with the value.
   * @returns The original `Result<T, E>`.
   * @example
   * ```typescript
   * import { ok, err } from 'neverever';
   * const result = ok('hello');
   * result.tap(console.log); // Prints: 'hello'
   * console.log(result.unwrapOr('')); // 'hello'
   * err<string, string>('failed').tap(console.log); // No output
   * ```
   */
  tap(fn: (value: T) => void): Result<T, E>

  /**
   * Returns the underlying `neverthrow` Result, allowing access to native `neverthrow` methods.
   * @returns The underlying `NeverthrowResult<T, E>`.
   * @example
   * ```typescript
   * import { ok } from 'neverever';
   * const result = ok<string, string>('hello');
   * const raw = result.unwrap();
   * console.log(raw.isOk()); // true
   * console.log(raw.value); // 'hello'
   * ```
   */
  unwrap(): NeverthrowResult<T, E>
}

/**
 * Represents an asynchronous result of a computation that may either succeed with a value (`Ok`) or fail with an error (`Err`).
 * Extends `neverthrow`'s `ResultAsync` with additional chainable methods for functional programming.
 * @template T The type of the value in case of success.
 * @template E The type of the error in case of failure.
 */
interface ResultAsync<T, E> {
  /**
   * Converts the ResultAsync to an OptionAsync, discarding the error if `Err`.
   * @returns An `OptionAsync<T>` containing the value if `Ok`, or `None` if `Err`.
   * @example
   * ```typescript
   * import { okAsync, errAsync } from 'neverever';
   * const result = okAsync<string, string>('success');
   * const opt = await result.toOption();
   * console.log(await opt.unwrapOr('')); // 'success'
   * console.log(await (await errAsync<string, string>('failed').toOption()).unwrapOr('')); // ''
   * ```
   */
  toOption(): OptionAsync<T>

  /**
   * Filters the ResultAsync based on an asynchronous predicate. If the predicate returns `false` or the ResultAsync is `Err`, returns an `Err` with the provided error.
   * @param predicate A function to test the value, which may return a Promise.
   * @param error The error to return if the predicate fails, which may be a Promise.
   * @returns A `ResultAsync<T, E>` containing the value if the predicate passes, or the provided error.
   * @example
   * ```typescript
   * import { okAsync, errAsync } from 'neverever';
   * const result = okAsync<number, string>(10);
   * const filtered = await result.filter(async n => n > 5, 'Too small');
   * console.log(await filtered.unwrapOr(0)); // 10
   * console.log(await (await result.filter(async n => n > 15, 'Too small')).unwrapOr(0)); // 0
   * console.log(await (await errAsync<number, string>('failed').filter(async n => n > 5, 'Too small')).unwrapOr(0)); // 0
   * ```
   */
  filter(predicate: (value: T) => MaybePromise<boolean>, error: MaybePromise<E>): ResultAsync<T, E>

  /**
   * Combines this ResultAsync with another Result or ResultAsync, returning a ResultAsync containing a tuple of both values if both are `Ok`.
   * If either is `Err`, returns the first `Err` encountered.
   * @template U The type of the value in the other Result or ResultAsync.
   * @template F The type of the error in the other Result or ResultAsync.
   * @param other The other Result or ResultAsync to combine with.
   * @returns A `ResultAsync<[T, U], E | F>` containing both values or the first error.
   * @example
   * ```typescript
   * import { okAsync, ok, errAsync } from 'neverever';
   * const result1 = okAsync<string, string>('hello');
   * const result2 = ok<number, string>(42);
   * const zipped = await result1.zip(result2);
   * console.log(await zipped.unwrapOr(['', 0])); // ['hello', 42]
   * console.log(await result1.zip(errAsync<number, string>('failed')).unwrapOr(['', 0])); // ['', 0]
   * ```
   */
  zip<U, F>(other: NeverthrowResult<U, F> | NeverthrowResultAsync<U, F>): ResultAsync<[T, U], E | F>

  /**
   * Unwraps a nested ResultAsync, returning the inner ResultAsync if `Ok`, or the original error if `Err`.
   * @returns A `ResultAsync<Unwrap<T>, E>` containing the unwrapped value or the error.
   * @example
   * ```typescript
   * import { okAsync, errAsync } from 'neverever';
   * const nested = okAsync<ResultAsync<number, string>, string>(okAsync(42));
   * const flat = await nested.flatten();
   * console.log(await flat.unwrapOr(0)); // 42
   * console.log(await okAsync(42).flatten().unwrapOr(0)); // 42
   * console.log(await errAsync<number, string>('failed').flatten().unwrapOr(0)); // 0
   * ```
   */
  flatten(): ResultAsync<Unwrap<T>, E>

  /**
   * Checks if the ResultAsync contains a specific value.
   * @param value The value to compare against.
   * @returns A `Promise<boolean>` resolving to `true` if `Ok` and contains the value, `false` otherwise.
   * @example
   * ```typescript
   * import { okAsync, errAsync } from 'neverever';
   * const result = okAsync('world');
   * console.log(await result.contains('world')); // true
   * console.log(await result.contains('hello')); // false
   * console.log(await errAsync<string, string>('failed').contains('world')); // false
   * ```
   */
  contains(value: T): Promise<boolean>

  /**
   * Recovers from an error by providing a new value if the ResultAsync is `Err`.
   * @param fn A function that takes the error and returns a new value, which may be a Promise.
   * @returns A `ResultAsync<T, E>` containing the original value if `Ok`, or the recovered value if `Err`.
   * @example
   * ```typescript
   * import { okAsync, errAsync } from 'neverever';
   * const result = errAsync<string, string>('failed');
   * const recovered = await result.recover(async e => `recovered from ${e}`);
   * console.log(await recovered.unwrapOr('')); // 'recovered from failed'
   * console.log(await okAsync<string, string>('success').recover(async e => 'recovered').unwrapOr('')); // 'success'
   * ```
   */
  recover(fn: (error: E) => MaybePromise<T>): ResultAsync<T, E>

  /**
   * Converts the value to an array, wrapping it in an array if it’s not already one.
   * @returns A `ResultAsync<T[], E>` containing the value as an array or the original error.
   * @example
   * ```typescript
   * import { okAsync, errAsync } from 'neverever';
   * const result = okAsync(42);
   * console.log(await (await result.sequence()).unwrapOr([])); // [42]
   * console.log(await (await okAsync([1, 2]).sequence()).unwrapOr([])); // [1, 2]
   * console.log(await (await errAsync<number, string>('failed').sequence()).unwrapOr([])); // []
   * ```
   */
  sequence(): ResultAsync<T[], E>

  /**
   * Executes an asynchronous side-effect function on the value if `Ok`, then returns the original ResultAsync.
   * @param fn A function to execute with the value, which may return a Promise.
   * @returns The original `ResultAsync<T, E>`.
   * @example
   * ```typescript
   * import { okAsync, errAsync } from 'neverever';
   * const result = okAsync('hello');
   * await result.tap(async (value) => console.log(value)); // Prints: 'hello'
   * console.log(await result.unwrapOr('')); // 'hello'
   * await errAsync<string, string>('failed').tap(async (value) => console.log(value)); // No output
   * ```
   */
  tap(fn: (value: T) => MaybePromise<void>): ResultAsync<T, E>

  /**
   * Returns the underlying `neverthrow` ResultAsync, allowing access to native `neverthrow` methods.
   * @returns The underlying `NeverthrowResultAsync<T, E>`.
   * @example
   * ```typescript
   * import { okAsync } from 'neverever';
   * const result = okAsync<string, string>('hello');
   * const raw = result.unwrap();
   * console.log(await raw.isOk()); // true
   * console.log(await raw.value); // 'hello'
   * ```
   */
  unwrap(): NeverthrowResultAsync<T, E>
}

/**
 * Internal class that wraps a `neverthrow` Result to provide additional chainable methods.
 * @template T The type of the value in case of success.
 * @template E The type of the error in case of failure.
 * @internal
 * @remarks This class is not exported and used internally to implement the enhanced `Result` interface.
 */
class ResultWrapper<T, E> implements Result<T, E> {
  constructor(private result: NeverthrowResult<T, E>) {}

  toOption(): Option<T> {
    return this.result.isOk() ? some(this.result.unwrapOr(undefined as T)) : none()
  }

  filter(predicate: (value: T) => boolean, error: E): Result<T, E> {
    return new ResultWrapper<T, E>(
      this.result.andThen((value: T) =>
        predicate(value) ? new Ok<T, E>(value) : new Err<T, E>(error)
      )
    )
  }

  zip<U, F>(other: NeverthrowResult<U, F>): Result<[T, U], E | F> {
    return new ResultWrapper<[T, U], E | F>(
      this.result.andThen((t: T) =>
        other.isOk()
          ? new Ok<[T, U], E | F>([t, other.unwrapOr(undefined as U)] as [T, U])
          : new Err<[T, U], E | F>(other.unwrapOr(undefined as F) as E | F)
      )
    )
  }

  flatten(): Result<Unwrap<T>, E> {
    return new ResultWrapper<Unwrap<T>, E>(
      this.result.andThen((value: T) =>
        isResult<Unwrap<T>, E>(value)
          ? (value as NeverthrowResult<Unwrap<T>, E>)
          : new Ok<Unwrap<T>, E>(value as Unwrap<T>)
      )
    )
  }

  contains(value: T): boolean {
    return this.result.isOk() && this.result.unwrapOr(undefined as T) === value
  }

  recover(fn: (error: E) => T): Result<T, E> {
    return new ResultWrapper<T, E>(this.result.orElse((e: E) => new Ok<T, E>(fn(e))))
  }

  sequence(): Result<T[], E> {
    return new ResultWrapper<T[], E>(
      this.result.andThen((value: T) => new Ok<T[], E>(value instanceof Array ? value : [value]))
    )
  }

  tap(fn: (value: T) => void): Result<T, E> {
    return new ResultWrapper<T, E>(
      this.result.map((value) => {
        fn(value)
        return value
      })
    )
  }

  unwrap(): NeverthrowResult<T, E> {
    return this.result
  }
}

/**
 * Internal class that wraps a `neverthrow` ResultAsync to provide additional chainable methods.
 * @template T The type of the value in case of success.
 * @template E The type of the error in case of failure.
 * @internal
 * @remarks This class is not exported and used internally to implement the enhanced `ResultAsync` interface.
 */
class ResultAsyncWrapper<T, E> implements ResultAsync<T, E> {
  constructor(private resultAsync: NeverthrowResultAsync<T, E>) {}

  toOption(): OptionAsync<T> {
    return OptionAsync.from<T>(
      this.resultAsync.then((result: NeverthrowResult<T, E>) =>
        result.isOk() ? result.unwrapOr(undefined as T) : null
      ) as Promise<T | null | undefined>
    )
  }

  filter(
    predicate: (value: T) => MaybePromise<boolean>,
    error: MaybePromise<E>
  ): ResultAsync<T, E> {
    return new ResultAsyncWrapper<T, E>(
      this.resultAsync.andThen((value: T) =>
        NeverthrowResultAsync.fromPromise(
          Promise.all([predicate(value), error]),
          (e) => e as E // fallback error mapper, rarely used here
        ).andThen(([p, e]) => (p ? ok(value) : err(e)))
      )
    )
  }

  zip<U, F>(
    other: NeverthrowResult<U, F> | NeverthrowResultAsync<U, F>
  ): ResultAsync<[T, U], E | F> {
    if (other instanceof NeverthrowResultAsync) {
      return new ResultAsyncWrapper<[T, U], E | F>(
        this.resultAsync.andThen((value1: T) =>
          other.andThen((value2: U) => new Ok<[T, U], E | F>([value1, value2]))
        )
      )
    } else {
      return new ResultAsyncWrapper<[T, U], E | F>(
        this.resultAsync.andThen((value1: T) =>
          other.isOk()
            ? new Ok<[T, U], E | F>([value1, other.unwrapOr(undefined as U)])
            : new Err<[T, U], E | F>(other.unwrapOr(undefined as F) as F)
        )
      )
    }
  }

  flatten(): ResultAsync<Unwrap<T>, E> {
    return new ResultAsyncWrapper(
      this.resultAsync.andThen((value) =>
        isResultAsync<Unwrap<T>, E>(value)
          ? value
          : isResult<Unwrap<T>, E>(value)
          ? new NeverthrowResultAsync<Unwrap<T>, E>(Promise.resolve(value))
          : okAsync<Unwrap<T>, E>(value as Unwrap<T>)
      )
    )
  }

  async contains(value: T): Promise<boolean> {
    const result = await this.resultAsync
    return result.isOk() && result.unwrapOr(undefined as T) === value
  }

  recover(fn: (error: E) => MaybePromise<T>): ResultAsync<T, E> {
    return new ResultAsyncWrapper<T, E>(
      this.resultAsync.orElse(
        (e: E) =>
          new NeverthrowResultAsync<T, E>(Promise.resolve(fn(e)).then((v) => new Ok<T, E>(v)))
      )
    )
  }

  sequence(): ResultAsync<T[], E> {
    return new ResultAsyncWrapper<T[], E>(
      this.resultAsync.andThen(
        (value: T) => new Ok<T[], E>(value instanceof Array ? value : [value])
      )
    )
  }

  tap(fn: (value: T) => MaybePromise<void>): ResultAsync<T, E> {
    return new ResultAsyncWrapper(
      this.resultAsync.map((value) => Promise.resolve(fn(value)).then(() => value))
    )
  }

  unwrap(): NeverthrowResultAsync<T, E> {
    return this.resultAsync
  }
}

/**
 * Type guard to check if a value is a `neverthrow` Result.
 * @template T The type of the value contained in the Result.
 * @template E The type of the error contained in the Result.
 * @param value The value to check.
 * @returns `true` if the value is a `NeverthrowResult<T, E>`, `false` otherwise.
 * @example
 * ```typescript
 * import { ok, err } from 'neverever';
 * function processResult<T, E>(value: any): value is Result<T, E> {
 *   return value instanceof Object && ('isOk' in value && 'isErr' in value);
 * }
 * console.log(processResult(ok(42))); // true
 * console.log(processResult(err('failed'))); // true
 * console.log(processResult(42)); // false
 * ```
 * @internal
 */
function isResult<T, E>(value: any): value is NeverthrowResult<T, E> {
  return value instanceof Ok || value instanceof Err
}

/**
 * Type guard to check if a value is a `neverthrow` ResultAsync.
 * @template T The type of the value contained in the ResultAsync.
 * @template E The type of the error contained in the ResultAsync.
 * @param value The value to check.
 * @returns `true` if the value is a `NeverthrowResultAsync<T, E>`, `false` otherwise.
 * @example
 * ```typescript
 * import { okAsync, errAsync } from 'neverever';
 * function processResultAsync<T, E>(value: any): value is ResultAsync<T, E> {
 *   return value instanceof Object && ('map' in value && 'andThen' in value);
 * }
 * console.log(processResultAsync(okAsync(42))); // true
 * console.log(processResultAsync(errAsync('failed'))); // true
 * console.log(processResultAsync(42)); // false
 * ```
 * @internal
 */
function isResultAsync<T, E>(value: any): value is NeverthrowResultAsync<T, E> {
  return value instanceof NeverthrowResultAsync
}

/**
 * Safely executes a synchronous or asynchronous function, wrapping the result in a `Result` or `ResultAsync`.
 * @template T The type of the value produced by the function.
 * @template E The type of the error produced by the error handler.
 * @param fn A function that produces a value or throws an error, which may return a Promise.
 * @param onError A function to handle errors, converting them to the error type `E`.
 * @returns A `Result<T, E>` for synchronous functions or `ResultAsync<T, E>` for asynchronous functions.
 * @example
 * ```typescript
 * import { tryCatch } from 'neverever';
 * const syncResult = tryCatch(
 *   () => {
 *     if (Math.random() > 0.5) throw new Error('Failed');
 *     return 'success';
 *   },
 *   (e) => (e instanceof Error ? e.message : 'Unknown error')
 * );
 * console.log(syncResult.unwrapOr('')); // 'success' or ''
 *
 * const asyncResult = tryCatch(
 *   async () => {
 *     await new Promise(resolve => setTimeout(resolve, 100));
 *     return 'async';
 *   },
 *   (e) => 'Async error'
 * );
 * console.log(await asyncResult.unwrapOr('')); // 'async' or ''
 * ```
 */
export function tryCatch<T, E>(
  fn: () => MaybePromise<T>,
  onError: (e: unknown) => E
): Result<T, E> | ResultAsync<T, E> {
  try {
    const result = fn()
    if (isPromise(result)) {
      return new ResultAsyncWrapper<T, E>(
        new NeverthrowResultAsync<T, E>(
          result.then((value) => new Ok<T, E>(value)).catch((e) => new Err<T, E>(onError(e)))
        )
      )
    }
    return new ResultWrapper<T, E>(new Ok<T, E>(result))
  } catch (e) {
    return new ResultWrapper<T, E>(new Err<T, E>(onError(e)))
  }
}

/**
 * Re-exports `neverthrow`'s `Result` type with additional chainable methods.
 * @template T The type of the value in case of success.
 * @template E The type of the error in case of failure.
 */
export { NeverthrowResult as Result }

/**
 * Re-exports `neverthrow`'s `ResultAsync` type with additional chainable methods.
 * @template T The type of the value in case of success.
 * @template E The type of the error in case of failure.
 */
export { NeverthrowResultAsync as ResultAsync }

/**
 * Creates a successful Result containing a value (`Ok`).
 * @template T The type of the value.
 * @template E The type of the error (not used in `Ok`).
 * @param value The value to wrap.
 * @returns A `Result<T, E>` containing the value.
 * @example
 * ```typescript
 * import { ok } from 'neverever';
 * const result = ok<string, string>('success');
 * console.log(result.unwrapOr('')); // 'success'
 * console.log(result.isOk()); // true
 * ```
 */
export { ok }

/**
 * Creates a failed Result containing an error (`Err`).
 * @template T The type of the value (not used in `Err`).
 * @template E The type of the error.
 * @param error The error to wrap.
 * @returns A `Result<T, E>` containing the error.
 * @example
 * ```typescript
 * import { err } from 'neverever';
 * const result = err<string, string>('failed');
 * console.log(result.unwrapOr('default')); // 'default'
 * console.log(result.isErr()); // true
 * ```
 */
export { err }

/**
 * Represents a successful Result (`Ok`) containing a value.
 * @template T The type of the value.
 * @template E The type of the error (not used in `Ok`).
 */
export { Ok }

/**
 * Represents a failed Result (`Err`) containing an error.
 * @template T The type of the value (not used in `Err`).
 * @template E The type of the error.
 */
export { Err }

// OptionAsync.ts

import { Result } from './Result'
import { ResultAsync } from './ResultAsync'
import { Option, isOption } from './Option'
import { MaybePromise, OptionLike, Unwrap } from './types'

/**
 * A class representing an asynchronous optional value that may or may not be present.
 * It wraps a `Promise` of an `Option<T>`, enabling safe handling of nullable or undefined values in asynchronous contexts.
 *
 * @template T The type of the value contained in the OptionAsync.
 */
class OptionAsync<T> implements OptionAsync<T> {
  private constructor(private readonly promise: Promise<Option<T>>) {}

  /**
   * Creates an `OptionAsync` containing a value (`Some`).
   *
   * @template T The type of the value.
   * @param value The value or Promise resolving to the value to wrap.
   * @returns An `OptionAsync` containing the resolved value as `Some`.
   *
   * @example
   * const some = OptionAsync.some(42);
   * const value = await some.unwrapOr(0); // 42
   *
   * const asyncSome = OptionAsync.some(Promise.resolve("hello"));
   * const asyncValue = await asyncSome.unwrapOr("default"); // "hello"
   */
  static some<T>(value: MaybePromise<T>): OptionAsync<T> {
    return new OptionAsync(Promise.resolve(value).then((v) => Option.some(v)))
  }

  /**
   * Creates an `OptionAsync` representing the absence of a value (`None`).
   *
   * @template T The type of the value that would be contained.
   * @returns An `OptionAsync` representing `None`.
   *
   * @example
   * const none = OptionAsync.none<number>();
   * const value = await none.unwrapOr(0); // 0
   * console.log(await none.isNone()); // true
   */
  static none<T>(): OptionAsync<T> {
    return new OptionAsync(Promise.resolve(Option.none()))
  }

  /**
   * Creates an `OptionAsync` from a potentially null or undefined value.
   * Returns `Some` if the resolved value is neither null nor undefined, otherwise `None`.
   *
   * @template T The type of the value.
   * @param value The value or Promise resolving to a value, which may be null or undefined.
   * @returns An `OptionAsync` containing the resolved value or `None`.
   *
   * @example
   * const some = OptionAsync.from("hello");
   * console.log(await some.unwrapOr("default")); // "hello"
   *
   * const none = OptionAsync.from(null);
   * console.log(await none.unwrapOr("default")); // "default"
   *
   * const asyncNone = OptionAsync.from(Promise.resolve(undefined));
   * console.log(await asyncNone.unwrapOr("default")); // "default"
   */
  static from<T>(value: MaybePromise<T | null | undefined>): OptionAsync<T> {
    return new OptionAsync(Promise.resolve(value).then((v) => Option.from(v)))
  }

  /**
   * Creates an `OptionAsync` by executing a function and catching any errors.
   * Returns `Some` with the resolved result if the function succeeds, or `None` if it throws.
   *
   * @template T The type of the value returned by the function.
   * @param fn The function to execute, which may return a value or Promise.
   * @returns An `OptionAsync` containing the result or `None` if an error occurs.
   *
   * @example
   * const safeParse = OptionAsync.try(() => JSON.parse('{"key": "value"}'));
   * console.log(await safeParse.unwrapOr({})); // { key: "value" }
   *
   * const failedParse = OptionAsync.try(() => JSON.parse('invalid'));
   * console.log(await failedParse.unwrapOr({})); // {}
   *
   * const asyncFetch = OptionAsync.try(() => fetch('https://api.example.com/data').then(res => res.json()));
   * const data = await asyncFetch.unwrapOr({ error: "Failed to fetch" });
   */
  static try<T>(fn: () => MaybePromise<T>): OptionAsync<T> {
    return new OptionAsync(
      Promise.resolve()
        .then(() => fn())
        .then((value) => Option.some(value))
        .catch(() => Option.none())
    )
  }

  /**
   * Checks if the `OptionAsync` resolves to `Some` (contains a value).
   *
   * @returns A Promise resolving to `true` if the `OptionAsync` is `Some`, `false` if it is `None`.
   *
   * @example
   * const some = OptionAsync.some(42);
   * console.log(await some.isSome()); // true
   *
   * const none = OptionAsync.none<number>();
   * console.log(await none.isSome()); // false
   */
  isSome(): Promise<boolean> {
    return this.promise.then((opt) => opt.isSome())
  }

  /**
   * Checks if the `OptionAsync` resolves to `None` (contains no value).
   *
   * @returns A Promise resolving to `true` if the `OptionAsync` is `None`, `false` if it is `Some`.
   *
   * @example
   * const some = OptionAsync.some(42);
   * console.log(await some.isNone()); // false
   *
   * const none = OptionAsync.none<number>();
   * console.log(await none.isNone()); // true
   */
  isNone(): Promise<boolean> {
    return this.promise.then((opt) => opt.isNone())
  }

  /**
   * Checks if the `OptionAsync` resolves to `Some` and contains a specific value.
   *
   * @param value The value to compare against.
   * @returns A Promise resolving to `true` if the `OptionAsync` is `Some` and its value equals the provided value, `false` otherwise.
   *
   * @example
   * const some = OptionAsync.some(42);
   * console.log(await some.contains(42)); // true
   * console.log(await some.contains(43)); // false
   *
   * const none = OptionAsync.none<number>();
   * console.log(await none.contains(42)); // false
   */
  contains(value: T): Promise<boolean> {
    return this.promise.then((opt) => opt.contains(value))
  }

  /**
   * Transforms the value in a `Some` `OptionAsync` using the provided function.
   * Returns `None` if the `OptionAsync` resolves to `None`.
   *
   * @template U The type of the transformed value.
   * @param fn The function to transform the value, which may return a value or Promise.
   * @returns An `OptionAsync` containing the transformed value or `None`.
   *
   * @example
   * const some = OptionAsync.some(42);
   * const mapped = some.map(x => x * 2);
   * console.log(await mapped.unwrapOr(0)); // 84
   *
   * const asyncMapped = some.map(x => Promise.resolve(x + 1));
   * console.log(await asyncMapped.unwrapOr(0)); // 43
   *
   * const none = OptionAsync.none<number>();
   * console.log(await none.map(x => x * 2).unwrapOr(0)); // 0
   */
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

  /**
   * Chains an `OptionAsync` by applying a function that returns an `Option` or `OptionAsync`.
   * Returns `None` if the `OptionAsync` resolves to `None`.
   *
   * @template U The type of the value in the resulting `OptionAsync`.
   * @param fn The function that returns an `Option` or `OptionAsync`.
   * @returns An `OptionAsync` containing the result or `None`.
   *
   * @example
   * const some = OptionAsync.some(42);
   * const chained = some.andThen(x => Option.some(x * 2));
   * console.log(await chained.unwrapOr(0)); // 84
   *
   * const asyncChained = some.andThen(x => OptionAsync.some(Promise.resolve(x + 1)));
   * console.log(await asyncChained.unwrapOr(0)); // 43
   *
   * const none = OptionAsync.none<number>();
   * console.log(await none.andThen(x => Option.some(x * 2)).unwrapOr(0)); // 0
   */
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

  /**
   * Filters the `OptionAsync` based on a predicate. Returns the original `Some` if the predicate resolves to `true`, otherwise `None`.
   *
   * @param predicate The function to test the value, which may return a boolean or Promise<boolean>.
   * @returns An `OptionAsync` containing the original value if the predicate passes, otherwise `None`.
   *
   * @example
   * const some = OptionAsync.some(42);
   * const filtered = some.filter(x => x > 40);
   * console.log(await filtered.unwrapOr(0)); // 42
   *
   * const asyncFiltered = some.filter(x => Promise.resolve(x < 40));
   * console.log(await asyncFiltered.unwrapOr(0)); // 0
   *
   * const none = OptionAsync.none<number>();
   * console.log(await none.filter(x => x > 40).unwrapOr(0)); // 0
   */
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

  /**
   * Combines two `OptionAsync` or `Option` instances into a single `OptionAsync` containing a tuple of their values.
   * Returns `None` if either resolves to `None`.
   *
   * @template U The type of the value in the other Option.
   * @param other The other `Option` or `OptionAsync` to combine with.
   * @returns An `OptionAsync` containing a tuple of values or `None`.
   *
   * @example
   * const some1 = OptionAsync.some(42);
   * const some2 = OptionAsync.some("hello");
   * const zipped = some1.zip(some2);
   * console.log(await zipped.unwrapOr([0, ""])); // [42, "hello"]
   *
   * const none = OptionAsync.none<string>();
   * console.log(await some1.zip(none).unwrapOr([0, ""])); // [0, ""]
   *
   * const syncOption = Option.some("world");
   * console.log(await some1.zip(syncOption).unwrapOr([0, ""])); // [42, "world"]
   */
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

  /**
   * Flattens a nested `OptionAsync` or `Option` into a single `OptionAsync`.
   * Handles cases where the value is itself an `Option` or `OptionAsync`.
   *
   * @returns A flattened `OptionAsync`.
   *
   * @example
   * const nested = OptionAsync.some(OptionAsync.some(42));
   * const flattened = nested.flatten();
   * console.log(await flattened.unwrapOr(0)); // 42
   *
   * const syncNested = OptionAsync.some(Option.some(42));
   * console.log(await syncNested.flatten().unwrapOr(0)); // 42
   *
   * const none = OptionAsync.none();
   * console.log(await none.flatten().unwrapOr(0)); // 0
   */
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

  /**
   * Returns the current `OptionAsync` if it resolves to `Some`, otherwise returns the result of the provided function.
   *
   * @param fn The function returning an `Option` or `OptionAsync` as a fallback.
   * @returns An `OptionAsync` containing the original value or the fallback.
   *
   * @example
   * const some = OptionAsync.some(42);
   * const result = some.orElse(() => Option.some(0));
   * console.log(await result.unwrapOr(-1)); // 42
   *
   * const none = OptionAsync.none<number>();
   * const fallback = none.orElse(() => OptionAsync.some(Promise.resolve(0)));
   * console.log(await fallback.unwrapOr(-1)); // 0
   */
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

  /**
   * Returns the value if the `OptionAsync` resolves to `Some`, otherwise returns the provided default value.
   *
   * @param defaultValue The value or Promise to return if the `OptionAsync` is `None`.
   * @returns A Promise resolving to the value of `Some` or the default value.
   *
   * @example
   * const some = OptionAsync.some(42);
   * console.log(await some.unwrapOr(0)); // 42
   *
   * const none = OptionAsync.none<number>();
   * console.log(await none.unwrapOr(0)); // 0
   *
   * const asyncDefault = none.unwrapOr(Promise.resolve(100));
   * console.log(await asyncDefault); // 100
   */
  async unwrapOr(defaultValue: MaybePromise<T>): Promise<T> {
    return Promise.all([this.promise, Promise.resolve(defaultValue)]).then(([opt, def]) => opt.unwrapOr(def))
  }

  /**
   * Returns the value if the `OptionAsync` resolves to `Some`, otherwise returns the result of the provided function.
   *
   * @param fn The function to compute the default value, which may return a value or Promise.
   * @returns A Promise resolving to the value of `Some` or the computed default value.
   *
   * @example
   * const some = OptionAsync.some(42);
   * console.log(await some.unwrapOrElse(() => 0)); // 42
   *
   * const none = OptionAsync.none<number>();
   * console.log(await none.unwrapOrElse(() => Promise.resolve(0))); // 0
   */
  async unwrapOrElse(fn: () => MaybePromise<T>): Promise<T> {
    return this.promise.then((opt) =>
      opt.match({
        some: (value) => Promise.resolve(value),
        none: () => Promise.resolve(fn()),
      })
    )
  }

  /**
   * Pattern-matches the `OptionAsync`, executing the appropriate branch based on whether it resolves to `Some` or `None`.
   *
   * @template U The type of the result.
   * @param branches An object with `some` and `none` branches, which may return values or Promises.
   * @returns A Promise resolving to the result of the executed branch.
   *
   * @example
   * const some = OptionAsync.some(42);
   * const result = await some.match({
   *   some: x => `Value: ${x}`,
   *   none: () => "No value",
   * });
   * console.log(result); // "Value: 42"
   *
   * const none = OptionAsync.none<number>();
   * const noneResult = await none.match({
   *   some: x => `Value: ${x}`,
   *   none: () => Promise.resolve("No value"),
   * });
   * console.log(noneResult); // "No value"
   */
  async match<U>(branches: { some: (value: T) => MaybePromise<U>; none: () => MaybePromise<U> }): Promise<U> {
    return this.promise.then((opt) =>
      opt.match({
        some: (value) => Promise.resolve(branches.some(value)),
        none: () => Promise.resolve(branches.none()),
      })
    )
  }

  /**
   * Converts the `OptionAsync` to a `ResultAsync`, using the provided error value for `None`.
   *
   * @template E The type of the error.
   * @param error The error value or Promise to use if the `OptionAsync` is `None`.
   * @returns A `ResultAsync` containing the value or the error.
   *
   * @example
   * const some = OptionAsync.some(42);
   * const result = some.toResult("No value");
   * console.log(await result.unwrapOr(-1)); // 42
   *
   * const none = OptionAsync.none<number>();
   * const errResult = none.toResult(Promise.resolve("No value"));
   * console.log(await errResult.unwrapErr()); // "No value"
   */
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

  /**
   * Converts the `OptionAsync` to an `OptionAsync` containing an array.
   * If `Some`, wraps the value in an array; if `None`, returns an empty array.
   *
   * @returns An `OptionAsync` containing an array of values.
   *
   * @example
   * const some = OptionAsync.some(42);
   * const sequenced = some.sequence();
   * console.log(await sequenced.unwrapOr([])); // [42]
   *
   * const none = OptionAsync.none<number>();
   * console.log(await none.sequence().unwrapOr([])); // []
   *
   * const arraySome = OptionAsync.some([1, 2, 3]);
   * console.log(await arraySome.sequence().unwrapOr([])); // [1, 2, 3]
   */
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

  /**
   * Performs a side effect with the value if the `OptionAsync` resolves to `Some`.
   * Returns the original `OptionAsync` unchanged.
   *
   * @param fn The function to execute with the value, which may return a Promise.
   * @returns The original `OptionAsync`.
   *
   * @example
   * const some = OptionAsync.some(42);
   * const tapped = some.tap(x => console.log(`Value: ${x}`));
   * console.log(await tapped.unwrapOr(0)); // Logs "Value: 42", returns 42
   *
   * const asyncTap = some.tap(x => Promise.resolve(console.log(`Async: ${x}`)));
   * console.log(await asyncTap.unwrapOr(0)); // Logs "Async: 42", returns 42
   */
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

  /**
   * Chains multiple Option-transforming functions, supporting asynchronous operations.
   * Each function is applied sequentially to the result of the previous one.
   *
   * @template U The type of the value in the resulting Option.
   * @param fns An array of functions that transform an Option.
   * @returns A Promise resolving to the final Option.
   *
   * @example
   * const some = OptionAsync.some(42);
   * const pipeline = some.pipe(
   *   opt => opt.map(x => x * 2),
   *   opt => Promise.resolve(opt.map(x => x + 1))
   * );
   * const result = await pipeline;
   * console.log(result.unwrapOr(0)); // 85
   *
   * const none = OptionAsync.none<number>();
   * const nonePipeline = none.pipe(
   *   opt => opt.map(x => x * 2)
   * );
   * console.log((await nonePipeline).unwrapOr(0)); // 0
   */
  pipe<U>(...fns: Array<(arg: Option<any>) => MaybePromise<Option<U>>>): Promise<Option<U>> {
    let result: Promise<Option<any>> = this.promise
    for (const fn of fns) {
      result = result.then((opt) => fn(opt))
    }
    return result as Promise<Option<U>>
  }
}

/**
 * Type guard to check if a value is an instance of `OptionAsync`.
 *
 * @template T The type of the value in the `OptionAsync`.
 * @param value The value to check.
 * @returns `true` if the value is an `OptionAsync`, `false` otherwise.
 *
 * @example
 * const some = OptionAsync.some(42);
 * console.log(isOptionAsync(some)); // true
 * console.log(isOptionAsync(Option.some(42))); // false
 * console.log(isOptionAsync(42)); // false
 */
function isOptionAsync<T>(value: any): value is OptionAsync<T> {
  return value instanceof OptionAsync
}

export { OptionAsync, isOptionAsync }

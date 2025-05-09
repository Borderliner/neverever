import { Result, ResultAsync } from 'neverthrow'
import { OptionAsync, Option } from './option'

/**
 * Utility type to extract the inner type of a Promise, Option, or Result.
 * Unwraps the type `T` to its inner value, handling nested Promises, Options, or Results.
 * If `T` is not a Promise, Option, or Result, returns `T` unchanged.
 * @template T The type to unwrap.
 * @example
 * ```typescript
 * import { Unwrap, ok, some } from 'neverever';
 * type PromiseType = Unwrap<Promise<string>>; // string
 * type OptionType = Unwrap<Option<number>>; // number
 * type ResultType = Unwrap<Result<boolean, string>>; // boolean
 * type PlainType = Unwrap<string>; // string
 *
 * const value: OptionType = some(42).unwrapOr(0); // 42
 * console.log(value); // 42
 * ```
 */
export type Unwrap<T> = T extends Promise<infer U>
  ? U
  : T extends Option<infer U>
  ? U
  : T extends Result<infer U, any>
  ? U
  : T

/**
 * Utility type to represent a value that may be synchronous or asynchronous (Promise).
 * Allows a type `T` to be either the value itself or a Promise resolving to that value.
 * @template T The type of the value.
 * @example
 * ```typescript
 * import { MaybePromise, OptionAsync } from 'neverever';
 * function processValue(value: MaybePromise<string>): OptionAsync<string> {
 *   return OptionAsync.from(value);
 * }
 * const syncResult = processValue('hello');
 * console.log(await syncResult.unwrapOr('')); // 'hello'
 * const asyncResult = processValue(Promise.resolve('world'));
 * console.log(await asyncResult.unwrapOr('')); // 'world'
 * ```
 */
export type MaybePromise<T> = T | Promise<T>

/**
 * Utility type to check if a type is a Promise.
 * Resolves to `true` if the type `T` is a Promise, `false` otherwise.
 * @template T The type to check.
 * @example
 * ```typescript
 * import { IsPromise } from 'neverever';
 * type IsAsyncString = IsPromise<Promise<string>>; // true
 * type IsSyncString = IsPromise<string>; // false
 * function logType<T>(value: T): void {
 *   console.log((value instanceof Promise) as IsPromise<T>);
 * }
 * logType(Promise.resolve('test')); // true
 * logType('test'); // false
 * ```
 */
export type IsPromise<T> = T extends Promise<any> ? true : false

/**
 * Utility type to represent a value that is either an Option, OptionAsync, or a Promise resolving to an Option.
 * Ensures a function or value can work with synchronous or asynchronous Option types.
 * @template T The type of the value contained in the Option.
 * @example
 * ```typescript
 * import { OptionLike, some, OptionAsync } from 'neverever';
 * async function processOption<T>(opt: OptionLike<T>): Promise<T> {
 *   const option = await (opt instanceof OptionAsync ? opt : opt);
 *   return option.unwrapOr(undefined as T);
 * }
 * const syncOption = some('hello');
 * console.log(await processOption(syncOption)); // 'hello'
 * const asyncOption = OptionAsync.some('world');
 * console.log(await processOption(asyncOption)); // 'world'
 * const promiseOption = Promise.resolve(some('test'));
 * console.log(await processOption(promiseOption)); // 'test'
 * ```
 */
export type OptionLike<T> = Option<T> | OptionAsync<T> | Promise<Option<T>>

/**
 * Utility type to represent a value that is either a Result, ResultAsync, or a Promise resolving to a Result.
 * Ensures a function or value can work with synchronous or asynchronous Result types.
 * @template T The type of the value contained in the Result.
 * @template E The type of the error contained in the Result.
 * @example
 * ```typescript
 * import { ResultLike, ok, okAsync } from 'neverever';
 * async function processResult<T, E>(result: ResultLike<T, E>): Promise<T> {
 *   const res = await (result instanceof Promise ? result : result);
 *   return res.unwrapOr(undefined as T);
 * }
 * const syncResult = ok<string, string>('hello');
 * console.log(await processResult(syncResult)); // 'hello'
 * const asyncResult = okAsync<string, string>('world');
 * console.log(await processResult(asyncResult)); // 'world'
 * const promiseResult = Promise.resolve(ok<string, string>('test'));
 * console.log(await processResult(promiseResult)); // 'test'
 * ```
 */
export type ResultLike<T, E> = Result<T, E> | ResultAsync<T, E> | Promise<Result<T, E>>

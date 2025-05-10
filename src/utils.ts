// utils.ts
import { MaybePromise, OptionLike, ResultLike } from './types'

/**
 * Composes functions in a pipeline, handling both synchronous and asynchronous operations.
 * Applies a series of functions to an initial value, passing the result of each function to the next.
 * Supports functions that return synchronous values or Promises, and the final result is wrapped in a `MaybePromise`.
 * @template T The type of the initial value.
 * @template U The type of the final result after applying all functions.
 * @param value The initial value to start the pipeline.
 * @param fns An array of functions to apply in sequence. Each function takes the previous result and returns a new value or Promise.
 * @returns A `MaybePromise<U>` containing the final result of the pipeline, which is a Promise if any function returns a Promise, or a synchronous value otherwise.
 * @example
 * ```typescript
 * import { pipe } from 'neverever';
 *
 * // Synchronous pipeline
 * const syncResult = pipe(
 *   5,
 *   (n: number) => n * 2,
 *   (n: number) => n + 10
 * );
 * console.log(syncResult); // 20
 *
 * // Asynchronous pipeline
 * const asyncResult = pipe(
 *   'hello',
 *   async (s: string) => s.toUpperCase(),
 *   (s: string) => s + '!'
 * );
 * console.log(await asyncResult); // 'HELLO!'
 *
 * // Mixed sync and async with Option
 * import { some } from 'neverever';
 * const mixedResult = pipe(
 *   some(42),
 *   (opt: OptionLike<number>) => opt.map(n => n * 2),
 *   async (opt: OptionLike<number>) => opt.map(n => n + 10)
 * );
 * console.log(await (await mixedResult).unwrapOr(0)); // 94
 *
 * // Pipeline with Result
 * import { ok } from 'neverever';
 * const resultPipeline = pipe(
 *   ok<string, string>('data'),
 *   (res: ResultLike<string, string>) => res.map(s => s.toUpperCase()),
 *   async (res: ResultLike<string, string>) => res.map(s => s + '!')
 * );
 * console.log(await (await resultPipeline).unwrapOr('')); // 'DATA!'
 * ```
 */
export function pipe<T, U>(value: T, ...fns: Array<(arg: any) => any>): MaybePromise<U> {
  return fns.reduce((result, fn) => Promise.resolve(result).then(fn), value as MaybePromise<any>) as MaybePromise<U>
}

/**
 * Unwraps a MaybePromise to its inner value.
 * @template T The inner type.
 * @param value A MaybePromise value.
 * @returns The unwrapped value, synchronously or asynchronously.
 */
export function unwrapMaybePromise<T>(value: MaybePromise<T>): Promise<T> {
  return Promise.resolve(value)
}

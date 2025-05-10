// utils.ts
import { MaybePromise } from './types'

/**
 * Helper type to compute the output type of a pipeline of functions.
 * Recursively determines the type of the result after applying each function in sequence.
 * @template T The current input type.
 * @template Fs The array of functions in the pipeline.
 * @internal
 */
type PipeChain<T, Fs extends Array<(arg: any) => MaybePromise<any>>> = Fs extends [infer First, ...infer Rest]
  ? First extends (arg: T) => MaybePromise<infer U>
    ? Rest extends Array<(arg: any) => MaybePromise<any>>
      ? PipeChain<U, Rest>
      : U
    : never
  : T

/**
 * Helper type to determine if any function in the pipeline returns a Promise.
 * Checks each function's return type to identify asynchronous operations.
 * @template Fs The array of functions.
 * @internal
 */
type HasPromise<Fs extends Array<(arg: any) => any>> = Fs extends [infer First, ...infer Rest]
  ? First extends (arg: any) => infer U
    ? U extends Promise<any>
      ? true
      : Rest extends Array<(arg: any) => any>
      ? HasPromise<Rest>
      : false
    : false
  : false

/**
 * Helper type to determine the return type of the pipe function.
 * Returns a Promise if any function is asynchronous, otherwise returns the synchronous type.
 * @template T The initial value type.
 * @template Fs The array of functions.
 * @internal
 */
type PipeReturn<T, Fs extends Array<(arg: any) => any>> = HasPromise<Fs> extends true
  ? Promise<PipeChain<T, Fs>>
  : PipeChain<T, Fs>

/**
 * Composes functions in a pipeline, handling both synchronous and asynchronous operations.
 * Applies a series of functions to an initial value, passing the result of each function to the next.
 * Returns a synchronous value if all functions are synchronous, or a Promise if any function returns a Promise.
 * @template T The type of the initial value.
 * @template Fs The tuple of functions to apply in sequence.
 * @param value The initial value to start the pipeline.
 * @param fns A tuple of functions to apply in sequence. Each function takes the previous result and returns a new value or Promise.
 * @returns The final result of the pipeline, typed as a synchronous value or Promise based on the functions.
 * @example
 * ```typescript
 * import { pipe } from 'neverever';
 *
 * // Example 1: Synchronous pipeline with numbers
 * const syncResult = pipe(
 *   5,
 *   (n: number) => n * 2,
 *   (n: number) => n + 10
 * );
 * console.log(syncResult); // 20
 *
 * // Example 2: Asynchronous pipeline with strings
 * const asyncResult = pipe(
 *   'hello',
 *   async (s: string) => s.toUpperCase(),
 *   (s: string) => s + '!'
 * );
 * console.log(await asyncResult); // 'HELLO!'
 *
 * // Example 3: Mixed synchronous and asynchronous pipeline
 * const mixedResult = pipe(
 *   42,
 *   (n: number) => n * 2,
 *   async (n: number) => n + 10
 * );
 * console.log(await mixedResult); // 94
 *
 * // Example 4: Pipeline with Option
 * import { some, none } from 'neverever';
 * const optionResult = pipe(
 *   some(42),
 *   (opt: Option<number>) => opt.map(n => n * 2),
 *   (opt: Option<number>) => opt.map(n => n + 10)
 * );
 * console.log(optionResult.unwrapOr(0)); // 94
 *
 * // Example 5: Pipeline with Option returning none
 * const noneResult = pipe(
 *   none() as Option<number>,
 *   (opt: Option<number>) => opt.map(n => n * 2),
 *   (opt: Option<number>) => opt.map(n => n + 10)
 * );
 * console.log(noneResult.unwrapOr(0)); // 0
 *
 * // Example 6: Pipeline with Result
 * import { ok, err } from 'neverever';
 * const resultPipeline = pipe(
 *   ok<string, string>('data'),
 *   (res: Result<string, string>) => res.map(s => s.toUpperCase()),
 *   (res: Result<string, string>) => res.map(s => s + '!')
 * );
 * console.log(resultPipeline.unwrapOr('')); // 'DATA!'
 *
 * // Example 7: Pipeline with ResultAsync
 * const resultAsyncPipeline = pipe(
 *   ok<string, string>('data').toAsync(),
 *   async (res: ResultLike<string, string>) => {
 *     const resolved = res instanceof Promise ? await res : res;
 *     return resolved.map(s => s.toUpperCase());
 *   },
 *   async (res: ResultLike<string, string>) => {
 *     const resolved = res instanceof Promise ? await res : res;
 *     return resolved.map(s => s + '!');
 *   }
 * );
 * console.log(await (await resultAsyncPipeline).unwrapOr('')); // 'DATA!'
 *
 * // Example 8: Pipeline with Promise<Result>
 * const promiseResultPipeline = pipe(
 *   Promise.resolve(ok<string, string>('data')),
 *   async (res: ResultLike<string, string>) => {
 *     const resolved = res instanceof Promise ? await res : res;
 *     return resolved.map(s => s.toUpperCase());
 *   },
 *   async (res: ResultLike<string, string>) => {
 *     const resolved = res instanceof Promise ? await res : res;
 *     return resolved.map(s => s + '!');
 *   }
 * );
 * console.log(await (await promiseResultPipeline).unwrapOr('')); // 'DATA!'
 *
 * // Example 9: Pipeline with OptionAsync
 * const optionAsyncResult = pipe(
 *   some(42).toAsync(),
 *   async (opt: OptionLike<number>) => {
 *     const resolved = opt instanceof Promise ? await opt : opt;
 *     const asyncOpt = 'toAsync' in resolved ? resolved.toAsync() : resolved;
 *     return asyncOpt.map(n => n * 2);
 *   },
 *   async (opt: OptionLike<number>) => {
 *     const resolved = opt instanceof Promise ? await opt : opt;
 *     const asyncOpt = 'toAsync' in resolved ? resolved.toAsync() : resolved;
 *     return asyncOpt.map(n => n + 10);
 *   }
 * );
 * console.log(await (await optionAsyncResult).unwrapOr(0)); // 94
 *
 * // Example 10: Empty pipeline
 * const emptyResult = pipe(42);
 * console.log(emptyResult); // 42
 *
 * // Example 11: Error propagation in asynchronous pipeline
 * const errorResult = pipe(
 *   'test',
 *   async (s: string) => { throw new Error('fail'); },
 *   (s: string) => s + '!'
 * );
 * await errorResult.catch(e => console.log(e.message)); // 'fail'
 *
 * // Example 12: Complex pipeline with multiple transformations
 * const complexResult = pipe(
 *   { value: 10 },
 *   (obj: { value: number }) => ({ value: obj.value * 2 }),
 *   async (obj: { value: number }) => ({ value: obj.value + 5 }),
 *   (obj: { value: number }) => obj.value.toString()
 * );
 * console.log(await complexResult); // '25'
 * ```
 */
function pipe<T, Fs extends Array<(arg: any) => any>>(value: T, ...fns: Fs): PipeReturn<T, Fs> {
  let result: any = value
  let isAsync = false

  for (const fn of fns) {
    if (isAsync) {
      result = Promise.resolve(result).then(fn)
    } else {
      result = fn(result)
      if (result instanceof Promise) {
        isAsync = true
      }
    }
  }

  return result as PipeReturn<T, Fs>
}

/**
 * Unwraps a MaybePromise to its inner value, ensuring a Promise is returned for consistent handling.
 * If the input is a synchronous value, it is wrapped in a resolved Promise.
 * If the input is already a Promise, it is returned as-is.
 * @template T The inner type of the MaybePromise.
 * @param value A MaybePromise value, which can be a synchronous value or a Promise.
 * @returns A Promise resolving to the inner value of the MaybePromise.
 * @example
 * ```typescript
 * import { unwrapMaybePromise } from 'neverever';
 * import { some } from 'neverever';
 *
 * // Example 1: Unwrapping a synchronous value
 * const syncValue: number = 42;
 * const syncResult = unwrapMaybePromise(syncValue);
 * console.log(await syncResult); // 42
 *
 * // Example 2: Unwrapping a Promise
 * const asyncValue: Promise<string> = Promise.resolve('hello');
 * const asyncResult = unwrapMaybePromise(asyncValue);
 * console.log(await asyncResult); // 'hello'
 *
 * // Example 3: Unwrapping a MaybePromise containing an Option
 * const optionValue: MaybePromise<Option<number>> = some(42);
 * const optionResult = unwrapMaybePromise(optionValue);
 * console.log((await optionResult).unwrapOr(0)); // 42
 *
 * // Example 4: Handling null or undefined
 * const nullValue: MaybePromise<null> = null;
 * console.log(await unwrapMaybePromise(nullValue)); // null
 *
 * // Example 5: Handling a rejected Promise
 * const rejectedValue: MaybePromise<string> = Promise.reject(new Error('fail'));
 * unwrapMaybePromise(rejectedValue).catch(e => console.log(e.message)); // 'fail'
 * ```
 */
function unwrapMaybePromise<T>(value: MaybePromise<T>): Promise<T> {
  return Promise.resolve(value)
}

export { pipe, unwrapMaybePromise }

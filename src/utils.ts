// utils.ts
import { MaybePromise, OptionLike, ResultLike } from './types'

/**
 * Composes functions in a pipeline, handling sync and async operations.
 */
export function pipe<T, U>(value: T, ...fns: Array<(arg: any) => any>): MaybePromise<U> {
  return fns.reduce(
    (result, fn) => Promise.resolve(result).then(fn),
    value as MaybePromise<any>
  ) as MaybePromise<U>
}

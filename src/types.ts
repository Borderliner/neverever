// types.ts
import { Option, OptionAsync } from './option'
import { Result, ResultAsync } from './result'

/**
 * Utility type to extract the inner type of a Promise, Option, or Result.
 */
export type Unwrap<T> = T extends Promise<infer U>
  ? U
  : T extends Option<infer U>
  ? U
  : T extends OptionAsync<infer U>
  ? U
  : T extends Result<infer U, any>
  ? U
  : T extends ResultAsync<infer U, any>
  ? U
  : T

/**
 * Utility type to represent a value that may be synchronous or asynchronous (Promise).
 */
export type MaybePromise<T> = T | Promise<T>

/**
 * Utility type to check if a type is a Promise.
 */
export type IsPromise<T> = T extends Promise<any> ? true : false

/**
 * Utility type to represent a value that is either an Option, OptionAsync, or a Promise resolving to an Option.
 */
export type OptionLike<T> = Option<T> | OptionAsync<T> | Promise<Option<T>>

/**
 * Utility type to represent a value that is either a Result, ResultAsync, or a Promise resolving to a Result.
 */
export type ResultLike<T, E> = Result<T, E> | ResultAsync<T, E> | Promise<Result<T, E>>

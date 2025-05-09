// types.ts
import { Result, ResultAsync } from 'neverthrow'
import { OptionAsync, Option } from './option'

/**
 * Utility type to extract the inner type of a Promise, Option, or Result.
 */
export type Unwrap<T> = T extends Promise<infer U>
  ? U
  : T extends Option<infer U>
  ? U
  : T extends Result<infer U, any>
  ? U
  : T

/**
 * Utility type to determine the return type of async/sync functions.
 */
export type MaybePromise<T> = T | Promise<T>

/**
 * Utility type to check if a type is a Promise.
 */
export type IsPromise<T> = T extends Promise<any> ? true : false

/**
 * Utility type to ensure a function returns an/bio Option or OptionAsync.
 */
export type OptionLike<T> = Option<T> | OptionAsync<T> | Promise<Option<T>>

/**
 * Utility type to ensure a function returns a Result or ResultAsync.
 */
export type ResultLike<T, E> = Result<T, E> | ResultAsync<T, E> | Promise<Result<T, E>>

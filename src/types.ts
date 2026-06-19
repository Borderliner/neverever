// types.ts
import { Option } from './Option'
import { OptionAsync } from './OptionAsync'
import { Result } from './Result'
import { ResultAsync } from './ResultAsync'

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
 * Utility type to normalize MaybePromise<T> to Promise<T> (unused in `neverever`)
 */
export type EnsurePromise<T> = T extends Promise<infer U> ? Promise<U> : Promise<T>

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

/**
 * Recursively computes the result of flattening a (possibly deeply) nested `Result`.
 * Each nested layer's error type is unioned into the resulting error type, mirroring the
 * recursive runtime behaviour of `Result.flatten`.
 */
export type FlattenResult<T, E> = T extends Result<infer U, infer F> ? FlattenResult<U, E | F> : Result<T, E>

/**
 * Recursively computes the result of flattening a (possibly deeply) nested `ResultAsync`.
 * Nested `ResultAsync` and `Result` layers are unwrapped and their error types unioned,
 * mirroring the recursive runtime behaviour of `ResultAsync.flatten`.
 */
export type FlattenResultAsync<T, E> = T extends ResultAsync<infer U, infer F>
  ? FlattenResultAsync<U, E | F>
  : T extends Result<infer U, infer F>
  ? FlattenResultAsync<U, E | F>
  : ResultAsync<T, E>

/**
 * Recursively computes the result of flattening a (possibly deeply) nested `Option`,
 * mirroring the recursive runtime behaviour of `Option.flatten`.
 */
export type FlattenOption<T> = T extends Option<infer U> ? FlattenOption<U> : Option<T>

/**
 * Recursively computes the result of flattening a (possibly deeply) nested `OptionAsync`.
 * Nested `OptionAsync` and `Option` layers are unwrapped, mirroring the recursive runtime
 * behaviour of `OptionAsync.flatten`.
 */
export type FlattenOptionAsync<T> = T extends OptionAsync<infer U>
  ? FlattenOptionAsync<U>
  : T extends Option<infer U>
  ? FlattenOptionAsync<U>
  : OptionAsync<T>

// constructors.ts
//
// Free-standing, Rust-style constructors for the four core types. These are thin wrappers
// around the static factories that let inference do the work, so you rarely write generics:
//
//   Ok(42)        // Result<number, never>
//   Err('boom')   // Result<never, string>
//   Some(42)      // Option<number>
//   None()        // Option<never>

import { Option } from './Option'
import { OptionAsync } from './OptionAsync'
import { Result } from './Result'
import { ResultAsync } from './ResultAsync'
import { MaybePromise } from './types'

/**
 * Creates an `Ok` `Result`. The error type defaults to `never` and is widened by later
 * combinators (e.g. `andThen`/`orElse`).
 *
 * @example
 * Ok(42)                       // Result<number, never>
 * Ok<number, string>(42)       // Result<number, string>
 */
export const Ok = <T, E = never>(value: T): Result<T, E> => Result.ok<T, E>(value)

/**
 * Creates an `Err` `Result`. The success type defaults to `never` and is widened by later
 * combinators.
 *
 * @example
 * Err('boom')                  // Result<never, string>
 * Err<string, number>('boom')  // Result<number, string>
 */
export const Err = <E, T = never>(error: E): Result<T, E> => Result.err<T, E>(error)

/**
 * Creates a `Some` `Option`.
 *
 * @example
 * Some(42) // Option<number>
 */
export const Some = <T>(value: T): Option<T> => Option.some(value)

/**
 * Creates a `None` `Option`.
 *
 * @example
 * None<number>() // Option<number>
 */
export const None = <T = never>(): Option<T> => Option.none<T>()

/**
 * Creates an `Ok` `ResultAsync` from a value or a Promise of a value.
 *
 * @example
 * OkAsync(fetchCount()) // ResultAsync<number, never>
 */
export const OkAsync = <T, E = never>(value: MaybePromise<T>): ResultAsync<T, E> => ResultAsync.ok<T, E>(value)

/**
 * Creates an `Err` `ResultAsync` from an error or a Promise of an error.
 *
 * @example
 * ErrAsync('boom') // ResultAsync<never, string>
 */
export const ErrAsync = <E, T = never>(error: MaybePromise<E>): ResultAsync<T, E> => ResultAsync.err<T, E>(error)

/**
 * Creates a `Some` `OptionAsync` from a value or a Promise of a value.
 *
 * @example
 * SomeAsync(fetchName()) // OptionAsync<string>
 */
export const SomeAsync = <T>(value: MaybePromise<T>): OptionAsync<T> => OptionAsync.some(value)

/**
 * Creates a `None` `OptionAsync`.
 *
 * @example
 * NoneAsync<number>() // OptionAsync<number>
 */
export const NoneAsync = <T = never>(): OptionAsync<T> => OptionAsync.none<T>()

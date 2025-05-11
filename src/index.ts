// index.ts
export { Option, Option as O, OptionAsync, OptionAsync as OA, isOption, isOptionAsync } from './option'
export { Result, Result as R, ResultAsync, ResultAsync as RA, isResult, isResultAsync } from './result'
export { pipe, unwrapMaybePromise } from './utils'
export type { Unwrap, MaybePromise, EnsurePromise, ResultLike, OptionLike, IsPromise } from './types'

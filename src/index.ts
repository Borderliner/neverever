// index.ts
export { Option, Option as O, isOption } from './Option'
export { OptionAsync, OptionAsync as OA, isOptionAsync } from './OptionAsync'
export { Result, Result as R, isResult } from './Result'
export { ResultAsync, ResultAsync as RA, isResultAsync } from './ResultAsync'
export { pipe, unwrapMaybePromise } from './utils'
export type { Unwrap, MaybePromise, EnsurePromise, ResultLike, OptionLike, IsPromise } from './types'

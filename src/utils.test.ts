// utils.test.ts
import { pipe, unwrapMaybePromise } from './utils'
import { some, none, Option, OptionAsync } from './option'
import { ok, err, Result, ResultAsync } from './result'
import { MaybePromise, OptionLike, ResultLike } from './types'

describe('utils', () => {
  describe('pipe', () => {
    it('should handle a synchronous pipeline correctly', () => {
      const result = pipe(
        5,
        (n: number) => n * 2,
        (n: number) => n + 10
      )
      expect(result).toBe(20)
      const typedResult: number = result // Verify type
      expect(typedResult).toBe(20)
    })

    it('should handle an asynchronous pipeline correctly', async () => {
      const result = pipe(
        'hello',
        async (s: string) => s.toUpperCase(),
        (s: string) => s + '!'
      )
      expect(await result).toBe('HELLO!')
      const typedResult: Promise<string> = result // Verify type
      expect(await typedResult).toBe('HELLO!')
    })

    it('should handle a mixed synchronous and asynchronous pipeline', async () => {
      const result = pipe(
        42,
        (n: number) => n * 2,
        async (n: number) => n + 10
      )
      expect(await result).toBe(94)
      const typedResult: Promise<number> = result // Verify type
      expect(await typedResult).toBe(94)
    })

    it('should handle a pipeline with Option correctly', () => {
      const result = pipe(
        some(42),
        (opt: Option<number>) => opt.map((n) => n * 2),
        (opt: Option<number>) => opt.map((n) => n + 10)
      )
      expect(result.unwrapOr(0)).toBe(94)
      const typedResult: Option<number> = result // Verify type
      expect(typedResult.unwrapOr(0)).toBe(94)
    })

    it('should handle a pipeline with OptionAsync', async () => {
      const result = pipe(
        some(42).toAsync(),
        async (opt: OptionLike<number>) => {
          const resolved = opt instanceof Promise ? await opt : opt
          // Convert Option<number> to OptionAsync<number>, leave OptionAsync<number> as is
          const asyncOpt = 'toAsync' in resolved ? resolved.toAsync() : resolved
          return asyncOpt.map((n) => n * 2)
        },
        async (opt: OptionLike<number>) => {
          const resolved = opt instanceof Promise ? await opt : opt
          const asyncOpt = 'toAsync' in resolved ? resolved.toAsync() : resolved
          return asyncOpt.map((n) => n + 10)
        }
      )
      const unwrapped = await (await result).unwrapOr(0)
      expect(unwrapped).toBe(94)
      const typedResult: Promise<Option<number>> = result // Verify type
      expect(await (await typedResult).unwrapOr(0)).toBe(94)
    })

    it('should handle a pipeline with Result', () => {
      const result = pipe(
        ok<string, string>('data'),
        (res: Result<string, string>) => res.map((s) => s.toUpperCase()),
        (res: Result<string, string>) => res.map((s) => s + '!')
      )
      expect(result.unwrapOr('')).toBe('DATA!')
      const typedResult: Result<string, string> = result // Verify type
      expect(typedResult.unwrapOr('')).toBe('DATA!')
    })

    it('should handle a pipeline with ResultAsync', async () => {
      const result = pipe(
        ok<string, string>('data').toAsync(),
        async (res: ResultLike<string, string>) => {
          const resolved = res instanceof Promise ? await res : res
          return resolved.map((s) => s.toUpperCase())
        },
        async (res: ResultLike<string, string>) => {
          const resolved = res instanceof Promise ? await res : res
          return resolved.map((s) => s + '!')
        }
      )
      const unwrapped = await (await result).unwrapOr('')
      expect(unwrapped).toBe('DATA!')
      const typedResult: Promise<ResultLike<string, string>> = result // Verify type
      expect(await (await typedResult).unwrapOr('')).toBe('DATA!')
    })

    it('should handle a pipeline with Promise<Result>', async () => {
      const result = pipe(
        Promise.resolve(ok<string, string>('data')),
        async (res: ResultLike<string, string>) => {
          const resolved = res instanceof Promise ? await res : res
          return resolved.map((s) => s.toUpperCase())
        },
        async (res: ResultLike<string, string>) => {
          const resolved = res instanceof Promise ? await res : res
          return resolved.map((s) => s + '!')
        }
      )
      const unwrapped = await (await result).unwrapOr('')
      expect(unwrapped).toBe('DATA!')
      const typedResult: Promise<ResultLike<string, string>> = result // Verify type
      expect(await (await typedResult).unwrapOr('')).toBe('DATA!')
    })

    it('should handle an empty pipeline', () => {
      const result = pipe(42)
      expect(result).toBe(42)
      const typedResult: number = result // Verify type
      expect(typedResult).toBe(42)
    })

    it('should propagate errors in an asynchronous pipeline', async () => {
      const result = pipe(
        'test',
        async (s: string) => {
          throw new Error('fail')
        },
        (s: string) => s + '!'
      )
      await expect(result).rejects.toThrow('fail')
      const typedResult: Promise<string> = result // Verify type
      await expect(typedResult).rejects.toThrow('fail')
    })

    it('should handle a pipeline with Option returning none', () => {
      const result = pipe(
        none(), // No type parameter
        (opt: Option<unknown>) => opt.map((n) => n as number * 2),
        (opt: Option<number>) => opt.map((n) => n + 10)
      )
      expect(result.unwrapOr(0)).toBe(0)
      const typedResult: Option<number> = result // Verify type
      expect(typedResult.unwrapOr(0)).toBe(0)
    })

    it('should handle a pipeline with Result returning err', () => {
      const result = pipe(
        err<string, string>('error'),
        (res: Result<string, string>) => res.map((s) => s.toUpperCase()),
        (res: Result<string, string>) => res.map((s) => s + '!')
      )
      expect(result.unwrapOr('')).toBe('')
      const typedResult: Result<string, string> = result // Verify type
      expect(typedResult.unwrapOr('')).toBe('')
    })
  })

  describe('unwrapMaybePromise', () => {
    it('should unwrap a synchronous MaybePromise', async () => {
      const value: MaybePromise<number> = 42
      const result = await unwrapMaybePromise(value)
      expect(result).toBe(42)
    })

    it('should unwrap an asynchronous MaybePromise', async () => {
      const value: MaybePromise<string> = Promise.resolve('hello')
      const result = await unwrapMaybePromise(value)
      expect(result).toBe('hello')
    })

    it('should handle a rejected Promise in MaybePromise', async () => {
      const value: MaybePromise<string> = Promise.reject(new Error('fail'))
      await expect(unwrapMaybePromise(value)).rejects.toThrow('fail')
    })

    it('should handle null or undefined values', async () => {
      const nullValue: MaybePromise<null> = null
      expect(await unwrapMaybePromise(nullValue)).toBe(null)

      const undefinedValue: MaybePromise<undefined> = undefined
      expect(await unwrapMaybePromise(undefinedValue)).toBe(undefined)
    })

    it('should unwrap a MaybePromise containing an Option', async () => {
      const value: MaybePromise<Option<number>> = some(42)
      const result = await unwrapMaybePromise(value)
      expect(result.unwrapOr(0)).toBe(42)
    })

    it('should unwrap a MaybePromise containing a Result', async () => {
      const value: MaybePromise<Result<string, string>> = ok<string, string>('data')
      const result = await unwrapMaybePromise(value)
      expect(result.unwrapOr('')).toBe('data')
    })
  })
})

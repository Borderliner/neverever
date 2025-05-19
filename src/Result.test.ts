import { isResult, Result } from "./Result"
import { Option } from "./Option"
import { ResultAsync } from "./ResultAsync"

describe('Result', () => {
  describe('Ok', () => {
    let okResult: Result<number, string>

    beforeEach(() => {
      okResult = Result.ok(42)
    })

    test('isOk returns true', () => {
      expect(okResult.isOk()).toBe(true)
    })

    test('isErr returns false', () => {
      expect(okResult.isErr()).toBe(false)
    })

    test('contains checks value', () => {
      expect(okResult.contains(42)).toBe(true)
      expect(okResult.contains(0)).toBe(false)
    })

    test('map transforms value', () => {
      const mapped = okResult.map((x) => x * 2)
      expect(mapped.unwrapOr(0)).toBe(84)
    })

    test('mapErr does not change value', () => {
      const mapped = okResult.mapErr((e) => `Error: ${e}`)
      expect(mapped.unwrapOr(0)).toBe(42)
    })

    test('andThen chains with another Result', () => {
      const chained = okResult.andThen((x) => Result.ok(x + 1))
      expect(chained.unwrapOr(0)).toBe(43)
      const errChained = okResult.andThen(() => Result.err('failed'))
      expect(errChained.match({ ok: () => '', err: (e) => e })).toBe('failed')
    })

    test('orElse does not execute', () => {
      const orElse = okResult.orElse(() => Result.ok(0))
      expect(orElse.unwrapOr(-1)).toBe(42)
    })

    test('filter keeps value if predicate passes', () => {
      const filtered = okResult.filter((x) => x > 0, 'Too small')
      expect(filtered.unwrapOr(0)).toBe(42)
    })

    test('filter returns Err if predicate fails', () => {
      const filtered = okResult.filter((x) => x < 0, 'Too large')
      expect(filtered.match({ ok: () => '', err: (e) => e })).toBe('Too large')
    })

    test('zip combines with another Ok', () => {
      const zipped = okResult.zip(Result.ok('hello'))
      expect(zipped.unwrapOr([0, ''])).toEqual([42, 'hello'])
    })

    test('zip returns Err if other is Err', () => {
      const zipped = okResult.zip(Result.err('failed'))
      expect(zipped.match({ ok: () => '', err: (e) => e })).toBe('failed')
    })

    test('flatten unwraps nested Result', () => {
      const nested = Result.ok(Result.ok(42))
      const flattened = nested.flatten()
      expect(flattened.unwrapOr(0)).toBe(42)
      const nonNested = okResult.flatten()
      expect(nonNested.unwrapOr(0)).toBe(42)
    })

    test('unwrapOr returns value', () => {
      expect(okResult.unwrapOr(0)).toBe(42)
    })

    test('unwrapOrElse returns value', () => {
      expect(okResult.unwrapOrElse(() => 0)).toBe(42)
    })

    test('match calls ok branch', () => {
      const result = okResult.match({
        ok: (x) => `Value: ${x}`,
        err: (e) => `Error: ${e}`,
      })
      expect(result).toBe('Value: 42')
    })

    test('toOption returns Some', () => {
      expect(okResult.toOption()).toEqual(Option.some(42))
    })

    test('recover does not execute', () => {
      const recovered = okResult.recover(() => 0)
      expect(recovered.unwrapOr(-1)).toBe(42)
    })

    test('sequence wraps value in array', () => {
      const sequenced = okResult.sequence()
      expect(sequenced.unwrapOr([])).toEqual([42])
      const arrayResult = Result.ok([1, 2])
      expect(arrayResult.sequence().unwrapOr([])).toEqual([1, 2])
    })

    test('tap executes function', () => {
      const spy = jest.fn()
      okResult.tap(spy)
      expect(spy).toHaveBeenCalledWith(42)
    })

    test('tapErr does not execute', () => {
      const spy = jest.fn()
      okResult.tapErr(spy)
      expect(spy).not.toHaveBeenCalled()
    })

    test('toAsync returns ResultAsync', async () => {
      const asyncResult = okResult.toAsync()
      await expect(asyncResult.isOk()).resolves.toBe(true)
      await expect(asyncResult.unwrapOr(0)).resolves.toBe(42)
    })
  })

  describe('Err', () => {
    let errResult: Result<number, string>

    beforeEach(() => {
      errResult = Result.err('failed')
    })

    test('isOk returns false', () => {
      expect(errResult.isOk()).toBe(false)
    })

    test('isErr returns true', () => {
      expect(errResult.isErr()).toBe(true)
    })

    test('contains returns false', () => {
      expect(errResult.contains(42)).toBe(false)
    })

    test('map does not transform', () => {
      const mapped = errResult.map((x) => x * 2)
      expect(mapped.match({ ok: () => '', err: (e) => e })).toBe('failed')
    })

    test('mapErr transforms error', () => {
      const mapped = errResult.mapErr((e) => `Error: ${e}`)
      expect(mapped.match({ ok: () => '', err: (e) => e })).toBe('Error: failed')
    })

    test('andThen does not chain', () => {
      const chained = errResult.andThen((x) => Result.ok(x + 1))
      expect(chained.match({ ok: () => '', err: (e) => e })).toBe('failed')
    })

    test('orElse executes', () => {
      const orElse = errResult.orElse(() => Result.ok(0))
      expect(orElse.unwrapOr(-1)).toBe(0)
      const errOrElse = errResult.orElse(() => Result.err('other error'))
      expect(errOrElse.match({ ok: () => '', err: (e) => e })).toBe('other error')
    })

    test('filter returns Err', () => {
      const filtered = errResult.filter((x) => x > 0, 'Too small')
      expect(filtered.match({ ok: () => '', err: (e) => e })).toBe('failed')
    })

    test('zip returns Err', () => {
      const zipped = errResult.zip(Result.ok('hello'))
      expect(zipped.match({ ok: () => '', err: (e) => e })).toBe('failed')
    })

    test('flatten returns Err', () => {
      const flattened = errResult.flatten()
      expect(flattened.match({ ok: () => '', err: (e) => e })).toBe('failed')
    })

    test('unwrapOr returns default', () => {
      expect(errResult.unwrapOr(0)).toBe(0)
    })

    test('unwrapOrElse returns computed default', () => {
      expect(errResult.unwrapOrElse((e) => e.length)).toBe(6)
    })

    test('match calls err branch', () => {
      const result = errResult.match({
        ok: (x) => `Value: ${x}`,
        err: (e) => `Error: ${e}`,
      })
      expect(result).toBe('Error: failed')
    })

    test('toOption returns None', () => {
      expect(errResult.toOption()).toEqual(Option.none())
    })

    test('recover returns Ok', () => {
      const recovered = errResult.recover(() => 0)
      expect(recovered.unwrapOr(-1)).toBe(0)
    })

    test('sequence returns Err', () => {
      const sequenced = errResult.sequence()
      expect(sequenced.match({ ok: () => '', err: (e) => e })).toBe('failed')
    })

    test('tap does not execute', () => {
      const spy = jest.fn()
      errResult.tap(spy)
      expect(spy).not.toHaveBeenCalled()
    })

    test('tapErr executes function', () => {
      const spy = jest.fn()
      errResult.tapErr(spy)
      expect(spy).toHaveBeenCalledWith('failed')
    })

    test('toAsync returns ResultAsync', async () => {
      const asyncResult = errResult.toAsync()
      await expect(asyncResult.isErr()).resolves.toBe(true)
      await expect(asyncResult.unwrapOr(0)).resolves.toBe(0)
    })
  })

  describe('Utility Methods', () => {
    describe('from', () => {
      test('creates Ok for non-null value', () => {
        const result = Result.from(42, 'error')
        expect(result.isOk()).toBe(true)
        expect(result.unwrapOr(0)).toBe(42)
      })

      test('creates Err for null or undefined', () => {
        const resultNull = Result.from(null, 'error')
        expect(resultNull.isErr()).toBe(true)
        expect(resultNull.match({ ok: () => '', err: (e) => e })).toBe('error')
        const resultUndefined = Result.from(undefined, 'error')
        expect(resultUndefined.isErr()).toBe(true)
      })
    })

    describe('try', () => {
      test('creates Ok for synchronous success', () => {
        const result = Result.try(
          () => 42,
          (e) => `Error: ${e}`
        )
        expect(result.isOk()).toBe(true)
        expect(result.unwrapOr(0)).toBe(42)
      })

      test('creates Err for synchronous error', () => {
        const result = Result.try(
          () => {
            throw new Error('fail')
          },
          (e) => `Error: ${String(e)}`
        )
        expect(result.isErr()).toBe(true)
        expect(result.match({ ok: () => '', err: (e) => e })).toBe('Error: Error: fail')
      })

      test('creates ResultAsync for asynchronous success', async () => {
        const result = ResultAsync.try(
          () => Promise.resolve(42),
          (e) => `Error: ${e}`
        )
        await expect(result.isOk()).resolves.toBe(true)
        await expect(result.unwrapOr(0)).resolves.toBe(42)
      })

      test('creates ResultAsync for asynchronous error', async () => {
        const result = Result.try(
          () => Promise.reject('fail'),
          (e) => `Error: ${e}`
        )
        await expect(result.isErr()).resolves.toBe(true)
        await expect(result.match({ ok: () => '', err: (e) => e })).resolves.toBe('Error: fail')
      })
    })

    describe('isResult', () => {
      test('returns true for Result', () => {
        expect(isResult(Result.ok(42))).toBe(true)
        expect(isResult(Result.err('error'))).toBe(true)
      })

      test('returns false for non-Result', () => {
        expect(isResult(42)).toBe(false)
        expect(isResult(null)).toBe(false)
      })
    })
  })
})

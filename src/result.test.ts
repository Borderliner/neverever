import { Result, ResultAsync, isResult, isResultAsync } from './result'
import { Option } from './option'

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

describe('ResultAsync', () => {
  describe('Ok', () => {
    let okAsyncResult: ResultAsync<number, string>

    beforeEach(() => {
      okAsyncResult = ResultAsync.ok(42)
    })

    test('isOk resolves to true', async () => {
      await expect(okAsyncResult.isOk()).resolves.toBe(true)
    })

    test('isErr resolves to false', async () => {
      await expect(okAsyncResult.isErr()).resolves.toBe(false)
    })

    test('contains checks value', async () => {
      await expect(okAsyncResult.contains(42)).resolves.toBe(true)
      await expect(okAsyncResult.contains(0)).resolves.toBe(false)
    })

    test('map transforms value with sync fn', async () => {
      const mapped = okAsyncResult.map((x) => x * 2)
      await expect(mapped.unwrapOr(0)).resolves.toBe(84)
    })

    test('map transforms value with async fn', async () => {
      const mapped = okAsyncResult.map(async (x) => x * 2)
      await expect(mapped.unwrapOr(0)).resolves.toBe(84)
    })

    test('mapErr does not change value', async () => {
      const mapped = okAsyncResult.mapErr((e) => `Error: ${e}`)
      await expect(mapped.unwrapOr(0)).resolves.toBe(42)
    })

    test('andThen chains with Result', async () => {
      const chained = okAsyncResult.andThen((x) => Result.ok(x + 1))
      await expect(chained.unwrapOr(0)).resolves.toBe(43)
      const errChained = okAsyncResult.andThen(() => Result.err('failed'))
      await expect(errChained.match({ ok: () => '', err: (e) => e })).resolves.toBe('failed')
    })

    test('andThen chains with ResultAsync', async () => {
      const chained = okAsyncResult.andThen((x) => ResultAsync.ok(x + 1))
      await expect(chained.unwrapOr(0)).resolves.toBe(43)
      const errChained = okAsyncResult.andThen(() => ResultAsync.err('failed'))
      await expect(errChained.match({ ok: () => '', err: (e) => e })).resolves.toBe('failed')
    })

    test('orElse does not execute', async () => {
      const orElse = okAsyncResult.orElse(() => Result.ok(0))
      await expect(orElse.unwrapOr(-1)).resolves.toBe(42)
      const asyncOrElse = okAsyncResult.orElse(() => ResultAsync.ok(0))
      await expect(asyncOrElse.unwrapOr(-1)).resolves.toBe(42)
    })

    test('filter keeps value if sync predicate passes', async () => {
      const filtered = okAsyncResult.filter((x) => x > 0, 'Too small')
      await expect(filtered.unwrapOr(0)).resolves.toBe(42)
    })

    test('filter returns Err if sync predicate fails', async () => {
      const filtered = okAsyncResult.filter((x) => x < 0, 'Too large')
      await expect(filtered.match({ ok: () => '', err: (e) => e })).resolves.toBe('Too large')
    })

    test('filter keeps value if async predicate passes', async () => {
      const filtered = okAsyncResult.filter(async (x) => x > 0, 'Too small')
      await expect(filtered.unwrapOr(0)).resolves.toBe(42)
    })

    test('filter with async error', async () => {
      const filtered = okAsyncResult.filter((x) => x < 0, Promise.resolve('Too large'))
      await expect(filtered.match({ ok: () => '', err: (e) => e })).resolves.toBe('Too large')
    })

    test('zip combines with Result Ok', async () => {
      const zipped = okAsyncResult.zip(Result.ok('hello'))
      await expect(zipped.unwrapOr([0, ''])).resolves.toEqual([42, 'hello'])
    })

    test('zip combines with ResultAsync Ok', async () => {
      const zipped = okAsyncResult.zip(ResultAsync.ok('hello'))
      await expect(zipped.unwrapOr([0, ''])).resolves.toEqual([42, 'hello'])
    })

    test('zip returns Err if other is Err', async () => {
      const zipped = okAsyncResult.zip(Result.err('failed'))
      await expect(zipped.match({ ok: () => '', err: (e) => e })).resolves.toBe('failed')
      const asyncZipped = okAsyncResult.zip(ResultAsync.err('failed'))
      await expect(asyncZipped.match({ ok: () => '', err: (e) => e })).resolves.toBe('failed')
    })

    test('flatten unwraps nested Result', async () => {
      const nested = ResultAsync.ok(Result.ok(42))
      const flattened = nested.flatten()
      await expect(flattened.unwrapOr(0)).resolves.toBe(42)
    })

    test('flatten unwraps nested ResultAsync', async () => {
      const nested = ResultAsync.ok(ResultAsync.ok(42))
      const flattened = nested.flatten()
      await expect(flattened.unwrapOr(0)).resolves.toBe(42)
    })

    test('unwrapOr returns value with sync default', async () => {
      await expect(okAsyncResult.unwrapOr(0)).resolves.toBe(42)
    })

    test('unwrapOr returns value with async default', async () => {
      await expect(okAsyncResult.unwrapOr(Promise.resolve(0))).resolves.toBe(42)
    })

    test('unwrapOrElse returns value with sync fn', async () => {
      await expect(okAsyncResult.unwrapOrElse(() => 0)).resolves.toBe(42)
    })

    test('unwrapOrElse returns value with async fn', async () => {
      await expect(okAsyncResult.unwrapOrElse(async () => 0)).resolves.toBe(42)
    })

    test('match calls ok branch with sync fn', async () => {
      const result = okAsyncResult.match({
        ok: (x) => `Value: ${x}`,
        err: (e) => `Error: ${e}`,
      })
      await expect(result).resolves.toBe('Value: 42')
    })

    test('match calls ok branch with async fn', async () => {
      const result = okAsyncResult.match({
        ok: async (x) => `Value: ${x}`,
        err: async (e) => `Error: ${e}`,
      })
      await expect(result).resolves.toBe('Value: 42')
    })

    test('toOption returns OptionAsync with Some', async () => {
      const option = okAsyncResult.toOption()
      await expect(option.isSome()).resolves.toBe(true)
      await expect(option.unwrapOr(0)).resolves.toBe(42)
    })

    test('sequence wraps value in array', async () => {
      const sequenced = okAsyncResult.sequence()
      await expect(sequenced.unwrapOr([])).resolves.toEqual([42])
      const arrayResult = ResultAsync.ok([1, 2])
      await expect(arrayResult.sequence().unwrapOr([])).resolves.toEqual([1, 2])
    })

    test('tap executes sync function', async () => {
      const spy = jest.fn()
      const tapped = okAsyncResult.tap(spy)
      await expect(tapped.unwrapOr(0)).resolves.toBe(42)
      expect(spy).toHaveBeenCalledWith(42)
    })

    test('tap executes async function', async () => {
      const spy = jest.fn(async () => undefined)
      const tapped = okAsyncResult.tap(spy)
      await expect(tapped.unwrapOr(0)).resolves.toBe(42)
      expect(spy).toHaveBeenCalledWith(42)
    })

    test('tapErr does not execute', async () => {
      const spy = jest.fn()
      const tapped = okAsyncResult.tapErr(spy)
      await expect(tapped.unwrapOr(0)).resolves.toBe(42)
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('Err', () => {
    let errAsyncResult: ResultAsync<number, string>

    beforeEach(() => {
      errAsyncResult = ResultAsync.err('failed')
    })

    test('isOk resolves to false', async () => {
      await expect(errAsyncResult.isOk()).resolves.toBe(false)
    })

    test('isErr resolves to true', async () => {
      await expect(errAsyncResult.isErr()).resolves.toBe(true)
    })

    test('contains returns false', async () => {
      await expect(errAsyncResult.contains(42)).resolves.toBe(false)
    })

    test('map does not transform with sync fn', async () => {
      const mapped = errAsyncResult.map((x) => x * 2)
      await expect(mapped.match({ ok: () => '', err: (e) => e })).resolves.toBe('failed')
    })

    test('map does not transform with async fn', async () => {
      const mapped = errAsyncResult.map(async (x) => x * 2)
      await expect(mapped.match({ ok: () => '', err: (e) => e })).resolves.toBe('failed')
    })

    test('mapErr transforms error with sync fn', async () => {
      const mapped = errAsyncResult.mapErr((e) => `Error: ${e}`)
      await expect(mapped.match({ ok: () => '', err: (e) => e })).resolves.toBe('Error: failed')
    })

    test('mapErr transforms error with async fn', async () => {
      const mapped = errAsyncResult.mapErr(async (e) => `Error: ${e}`)
      await expect(mapped.match({ ok: () => '', err: (e) => e })).resolves.toBe('Error: failed')
    })

    test('andThen does not chain with Result', async () => {
      const chained = errAsyncResult.andThen((x) => Result.ok(x + 1))
      await expect(chained.match({ ok: () => '', err: (e) => e })).resolves.toBe('failed')
    })

    test('andThen does not chain with ResultAsync', async () => {
      const chained = errAsyncResult.andThen((x) => ResultAsync.ok(x + 1))
      await expect(chained.match({ ok: () => '', err: (e) => e })).resolves.toBe('failed')
    })

    test('orElse executes with Result', async () => {
      const orElse = errAsyncResult.orElse(() => Result.ok(0))
      await expect(orElse.unwrapOr(-1)).resolves.toBe(0)
      const errOrElse = errAsyncResult.orElse(() => Result.err('other error'))
      await expect(errOrElse.match({ ok: () => '', err: (e) => e })).resolves.toBe('other error')
    })

    test('orElse executes with ResultAsync', async () => {
      const orElse = errAsyncResult.orElse(() => ResultAsync.ok(0))
      await expect(orElse.unwrapOr(-1)).resolves.toBe(0)
      const errOrElse = errAsyncResult.orElse(() => ResultAsync.err('other error'))
      await expect(errOrElse.match({ ok: () => '', err: (e) => e })).resolves.toBe('other error')
    })

    test('filter returns Err', async () => {
      const filtered = errAsyncResult.filter((x) => x > 0, 'Too small')
      await expect(filtered.match({ ok: () => '', err: (e) => e })).resolves.toBe('failed')
      const asyncFiltered = errAsyncResult.filter(async (x) => x > 0, Promise.resolve('Too small'))
      await expect(asyncFiltered.match({ ok: () => '', err: (e) => e })).resolves.toBe('failed')
    })

    test('zip returns Err with Result', async () => {
      const zipped = errAsyncResult.zip(Result.ok('hello'))
      await expect(zipped.match({ ok: () => '', err: (e) => e })).resolves.toBe('failed')
    })

    test('zip returns Err with ResultAsync', async () => {
      const zipped = errAsyncResult.zip(ResultAsync.ok('hello'))
      await expect(zipped.match({ ok: () => '', err: (e) => e })).resolves.toBe('failed')
    })

    test('flatten returns Err', async () => {
      const flattened = errAsyncResult.flatten()
      await expect(flattened.match({ ok: () => '', err: (e) => e })).resolves.toBe('failed')
    })

    test('unwrapOr returns default with sync default', async () => {
      await expect(errAsyncResult.unwrapOr(0)).resolves.toBe(0)
    })

    test('unwrapOr returns default with async default', async () => {
      await expect(errAsyncResult.unwrapOr(Promise.resolve(0))).resolves.toBe(0)
    })

    test('unwrapOrElse returns computed default with sync fn', async () => {
      await expect(errAsyncResult.unwrapOrElse((e) => e.length)).resolves.toBe(6)
    })

    test('unwrapOrElse returns computed default with async fn', async () => {
      await expect(errAsyncResult.unwrapOrElse(async (e) => e.length)).resolves.toBe(6)
    })

    test('match calls err branch with sync fn', async () => {
      const result = errAsyncResult.match({
        ok: (x) => `Value: ${x}`,
        err: (e) => `Error: ${e}`,
      })
      await expect(result).resolves.toBe('Error: failed')
    })

    test('match calls err branch with async fn', async () => {
      const result = errAsyncResult.match({
        ok: async (x) => `Value: ${x}`,
        err: async (e) => `Error: ${e}`,
      })
      await expect(result).resolves.toBe('Error: failed')
    })

    test('toOption returns OptionAsync with None', async () => {
      const option = errAsyncResult.toOption()
      await expect(option.isNone()).resolves.toBe(true)
      await expect(option.unwrapOr(0)).resolves.toBe(0)
    })

    test('sequence returns Err', async () => {
      const sequenced = errAsyncResult.sequence()
      await expect(sequenced.match({ ok: () => '', err: (e) => e })).resolves.toBe('failed')
    })

    test('tap does not execute with sync fn', async () => {
      const spy = jest.fn()
      const tapped = errAsyncResult.tap(spy)
      await expect(tapped.match({ ok: () => '', err: (e) => e })).resolves.toBe('failed')
      expect(spy).not.toHaveBeenCalled()
    })

    test('tap does not execute with async fn', async () => {
      const spy = jest.fn(async () => undefined)
      const tapped = errAsyncResult.tap(spy)
      await expect(tapped.match({ ok: () => '', err: (e) => e })).resolves.toBe('failed')
      expect(spy).not.toHaveBeenCalled()
    })

    test('tapErr executes sync function', async () => {
      const spy = jest.fn()
      const tapped = errAsyncResult.tapErr(spy)
      await expect(tapped.match({ ok: () => '', err: (e) => e })).resolves.toBe('failed')
      expect(spy).toHaveBeenCalledWith('failed')
    })

    test('tapErr executes async function', async () => {
      const spy = jest.fn(async () => undefined)
      const tapped = errAsyncResult.tapErr(spy)
      await expect(tapped.match({ ok: () => '', err: (e) => e })).resolves.toBe('failed')
      expect(spy).toHaveBeenCalledWith('failed')
    })
  })

  describe('Utility Methods', () => {
    describe('from', () => {
      test('creates Ok for non-null sync value', async () => {
        const result = ResultAsync.from(42, 'error')
        await expect(result.isOk()).resolves.toBe(true)
        await expect(result.unwrapOr(0)).resolves.toBe(42)
      })

      test('creates Ok for non-null async value', async () => {
        const result = ResultAsync.from(Promise.resolve(42), 'error')
        await expect(result.isOk()).resolves.toBe(true)
        await expect(result.unwrapOr(0)).resolves.toBe(42)
      })

      test('creates Err for null or undefined sync value', async () => {
        const resultNull = ResultAsync.from(null, 'error')
        await expect(resultNull.isErr()).resolves.toBe(true)
        await expect(resultNull.match({ ok: () => '', err: (e) => e })).resolves.toBe('error')
        const resultUndefined = ResultAsync.from(undefined, 'error')
        await expect(resultUndefined.isErr()).resolves.toBe(true)
      })

      test('creates Err for null or undefined async value', async () => {
        const resultNull = ResultAsync.from(Promise.resolve(null), 'error')
        await expect(resultNull.isErr()).resolves.toBe(true)
        await expect(resultNull.match({ ok: () => '', err: (e) => e })).resolves.toBe('error')
        const resultUndefined = ResultAsync.from(Promise.resolve(undefined), 'error')
        await expect(resultUndefined.isErr()).resolves.toBe(true)
      })

      test('creates Err with async error', async () => {
        const result = ResultAsync.from(null, Promise.resolve('error'))
        await expect(result.isErr()).resolves.toBe(true)
        await expect(result.match({ ok: () => '', err: (e) => e })).resolves.toBe('error')
      })
    })

    describe('try', () => {
      test('creates ResultAsync for asynchronous success', async () => {
        const result = ResultAsync.try(
          () => Promise.resolve(42),
          (e) => `Error: ${e}`
        )
        await expect(result.isOk()).resolves.toBe(true)
        await expect(result.unwrapOr(0)).resolves.toBe(42)
      })

      test('creates ResultAsync for asynchronous error', async () => {
        const result = ResultAsync.try(
          () => Promise.reject('fail'),
          (e) => `Error: ${e}`
        )
        await expect(result.isErr()).resolves.toBe(true)
        await expect(result.match({ ok: () => '', err: (e) => e })).resolves.toBe('Error: fail')
      })
    })

    describe('fromPromise', () => {
      test('creates Ok for resolved promise', async () => {
        const result = ResultAsync.fromPromise(Promise.resolve(42), (e) => `Error: ${e}`)
        await expect(result.isOk()).resolves.toBe(true)
        await expect(result.unwrapOr(0)).resolves.toBe(42)
      })

      test('creates Err for rejected promise', async () => {
        const result = ResultAsync.fromSafePromise(Promise.reject('fail'))
        await expect(result.isErr()).resolves.toBe(true)
        await expect(result.match({ ok: () => '', err: (e) => String(e) })).resolves.toBe('fail')
      })
    })

    describe('fromSafePromise', () => {
      test('creates Ok for resolved promise', async () => {
        const result = ResultAsync.fromSafePromise(Promise.resolve(42))
        await expect(result.isOk()).resolves.toBe(true)
        await expect(result.unwrapOr(0)).resolves.toBe(42)
      })

      test('creates Err for rejected promise', async () => {
        const result = ResultAsync.fromSafePromise(Promise.reject('fail'))
        await expect(result.isErr()).resolves.toBe(true)
        await expect(result.match({ ok: () => '', err: (e) => String(e) })).resolves.toBe('fail')
      })
    })

    describe('isResultAsync', () => {
      test('returns true for ResultAsync', () => {
        expect(isResultAsync(ResultAsync.ok(42))).toBe(true)
        expect(isResultAsync(ResultAsync.err('error'))).toBe(true)
      })

      test('returns false for non-ResultAsync', () => {
        expect(isResultAsync(Result.ok(42))).toBe(false)
        expect(isResultAsync(42)).toBe(false)
        expect(isResultAsync(null)).toBe(false)
      })
    })
  })
})

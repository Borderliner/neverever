// result.test.ts
import {
  Result,
  ResultAsync,
  Ok,
  Err,
  ok,
  err,
  okAsync,
  errAsync,
  safeTry,
  fromPromise,
  fromSafePromise,
  fromThrowable,
  fromAsyncThrowable,
} from './result'
import { some, none } from './option'

describe('Result', () => {
  describe('Ok', () => {
    let okResult: Result<number, string>

    beforeEach(() => {
      okResult = ok(42)
    })

    test('isOk returns true', () => {
      expect(okResult.isOk()).toBe(true)
    })

    test('isErr returns false', () => {
      expect(okResult.isErr()).toBe(false)
    })

    test('map transforms value', () => {
      const mapped = okResult.map((x) => x * 2)
      expect(mapped).toEqual(ok(84))
    })

    test('mapErr does not change value', () => {
      const mapped = okResult.mapErr((e) => `Error: ${e}`)
      expect(mapped).toEqual(ok(42))
    })

    test('andThen chains with another Result', () => {
      const chained = okResult.andThen((x) => ok(x + 1))
      expect(chained).toEqual(ok(43))
    })

    test('orElse does not execute', () => {
      const orElse = okResult.orElse(() => ok(0))
      expect(orElse).toEqual(ok(42))
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
      expect(okResult.toOption()).toEqual(some(42))
    })

    test('filter keeps value if predicate passes', () => {
      const filtered = okResult.filter((x) => x > 0, 'Too small')
      expect(filtered).toEqual(ok(42))
    })

    test('filter returns Err if predicate fails', () => {
      const filtered = okResult.filter((x) => x < 0, 'Too large')
      expect(filtered).toEqual(err('Too large'))
    })

    test('zip combines with another Ok', () => {
      const zipped = okResult.zip(ok('hello'))
      expect(zipped).toEqual(ok([42, 'hello']))
    })

    test('zip returns Err if other is Err', () => {
      const zipped = okResult.zip(err('failed'))
      expect(zipped).toEqual(err('failed'))
    })

    test('flatten unwraps nested Result', () => {
      const nested = ok(ok(42))
      expect(nested.flatten()).toEqual(ok(42))
    })

    test('contains checks value', () => {
      expect(okResult.contains(42)).toBe(true)
      expect(okResult.contains(0)).toBe(false)
    })

    test('recover does not execute', () => {
      const recovered = okResult.recover(() => 0)
      expect(recovered).toEqual(ok(42))
    })

    test('sequence wraps value in array', () => {
      expect(okResult.sequence()).toEqual(ok([42]))
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
      errResult = err('failed')
    })

    test('isOk returns false', () => {
      expect(errResult.isOk()).toBe(false)
    })

    test('isErr returns true', () => {
      expect(errResult.isErr()).toBe(true)
    })

    test('map does not transform', () => {
      const mapped = errResult.map((x) => x * 2)
      expect(mapped).toEqual(err('failed'))
    })

    test('mapErr transforms error', () => {
      const mapped = errResult.mapErr((e) => `Error: ${e}`)
      expect(mapped).toEqual(err('Error: failed'))
    })

    test('andThen does not chain', () => {
      const chained = errResult.andThen((x) => ok(x + 1))
      expect(chained).toEqual(err('failed'))
    })

    test('orElse executes', () => {
      const orElse = errResult.orElse(() => ok(0))
      expect(orElse).toEqual(ok(0))
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
      expect(errResult.toOption()).toEqual(none())
    })

    test('filter returns Err', () => {
      const filtered = errResult.filter((x) => x > 0, 'Too small')
      expect(filtered).toEqual(err('Too small'))
    })

    test('zip returns Err', () => {
      const zipped = errResult.zip(ok('hello'))
      expect(zipped).toEqual(err('failed'))
    })

    test('flatten returns Err', () => {
      expect(errResult.flatten()).toEqual(err('failed'))
    })

    test('contains returns false', () => {
      expect(errResult.contains(42)).toBe(false)
    })

    test('recover returns Ok', () => {
      const recovered = errResult.recover(() => 0)
      expect(recovered).toEqual(ok(0))
    })

    test('sequence returns Err', () => {
      expect(errResult.sequence()).toEqual(err('failed'))
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

  describe('ResultAsync', () => {
    describe('Ok', () => {
      let okAsyncResult: ResultAsync<number, string>

      beforeEach(() => {
        okAsyncResult = okAsync(42)
      })

      test('isOk resolves to true', async () => {
        await expect(okAsyncResult.isOk()).resolves.toBe(true)
      })

      test('isErr resolves to false', async () => {
        await expect(okAsyncResult.isErr()).resolves.toBe(false)
      })

      test('map transforms value', async () => {
        const mapped = okAsyncResult.map((x) => x * 2)
        await expect(mapped.unwrapOr(0)).resolves.toBe(84)
      })

      test('mapErr does not change error', async () => {
        const mapped = okAsyncResult.mapErr((e) => `Error: ${e}`)
        await expect(mapped.unwrapOr(42)).resolves.toBe(42)
      })

      test('andThen chains with Result', async () => {
        const chained = okAsyncResult.andThen((x) => ok(x + 1))
        await expect(chained.unwrapOr(0)).resolves.toBe(43)
      })

      test('andThen chains with ResultAsync', async () => {
        const chained = okAsyncResult.andThen((x) => okAsync(x + 1))
        await expect(chained.unwrapOr(0)).resolves.toBe(43)
      })

      test('orElse does not execute', async () => {
        const orElse = okAsyncResult.orElse(() => okAsync(0))
        await expect(orElse.unwrapOr(-1)).resolves.toBe(42)
      })

      test('unwrapOr returns value', async () => {
        await expect(okAsyncResult.unwrapOr(0)).resolves.toBe(42)
      })

      test('unwrapOrElse returns value', async () => {
        await expect(okAsyncResult.unwrapOrElse(() => 0)).resolves.toBe(42)
      })

      test('match calls ok branch', async () => {
        const result = await okAsyncResult.match({
          ok: (x) => `Value: ${x}`,
          err: (e) => `Error: ${e}`,
        })
        expect(result).toBe('Value: 42')
      })

      test('toOption returns OptionAsync with Some', async () => {
        const option = okAsyncResult.toOption()
        await expect(option.isSome()).resolves.toBe(true)
        await expect(option.unwrapOr(0)).resolves.toBe(42)
      })

      test('filter keeps value if predicate passes', async () => {
        const filtered = okAsyncResult.filter((x) => x > 0, 'Too small')
        await expect(filtered.unwrapOr(0)).resolves.toBe(42)
      })

      test('filter returns Err if predicate fails', async () => {
        const filtered = okAsyncResult.filter((x) => x < 0, 'Too large')
        await expect(filtered.isErr()).resolves.toBe(true)
      })

      test('zip combines with Ok', async () => {
        const zipped = okAsyncResult.zip(ok('hello'))
        await expect(zipped.unwrapOr([0, ''])).resolves.toEqual([42, 'hello'])
      })

      test('zip returns Err with Err', async () => {
        const zipped = okAsyncResult.zip(err('failed'))
        await expect(zipped.isErr()).resolves.toBe(true)
      })

      test('flatten unwraps nested Result', async () => {
        const nested = okAsync(ok(42))
        const flattened = nested.flatten()
        await expect(flattened.unwrapOr(0)).resolves.toBe(42)
      })

      test('contains checks value', async () => {
        await expect(okAsyncResult.contains(42)).resolves.toBe(true)
        await expect(okAsyncResult.contains(0)).resolves.toBe(false)
      })

      test('recover does not execute', async () => {
        const recovered = okAsyncResult.recover(() => 0)
        await expect(recovered.unwrapOr(-1)).resolves.toBe(42)
      })

      test('sequence wraps value in array', async () => {
        const sequenced = okAsyncResult.sequence()
        await expect(sequenced.unwrapOr([])).resolves.toEqual([42])
      })

      test('tap executes function', async () => {
        const spy = jest.fn()
        const tapped = okAsyncResult.tap(spy)
        await tapped
        expect(spy).toHaveBeenCalledWith(42)
      })

      test('tapErr does not execute', async () => {
        const spy = jest.fn()
        const tapped = okAsyncResult.tapErr(spy)
        await tapped
        expect(spy).not.toHaveBeenCalled()
      })
    })

    describe('Err', () => {
      let errAsyncResult: ResultAsync<number, string>

      beforeEach(() => {
        errAsyncResult = errAsync('failed')
      })

      test('isOk resolves to false', async () => {
        await expect(errAsyncResult.isOk()).resolves.toBe(false)
      })

      test('isErr resolves to true', async () => {
        await expect(errAsyncResult.isErr()).resolves.toBe(true)
      })

      test('map does not transform', async () => {
        const mapped = errAsyncResult.map((x) => x * 2)
        await expect(mapped.isErr()).resolves.toBe(true)
      })

      test('mapErr transforms error', async () => {
        const mapped = errAsyncResult.mapErr((e) => `Error: ${e}`)
        await expect(
          mapped.match({
            ok: () => '',
            err: (e) => e,
          })
        ).resolves.toBe('Error: failed')
      })
      test('andThen does not chain', async () => {
        const chained = errAsyncResult.andThen((x) => okAsync(x + 1))
        await expect(chained.isErr()).resolves.toBe(true)
      })

      test('orElse executes with Result', async () => {
        const orElse = errAsyncResult.orElse(() => ok(0))
        await expect(orElse.unwrapOr(-1)).resolves.toBe(0)
      })

      test('orElse executes with ResultAsync', async () => {
        const orElse = errAsyncResult.orElse(() => okAsync(0))
        await expect(orElse.unwrapOr(-1)).resolves.toBe(0)
      })

      test('unwrapOr returns default', async () => {
        await expect(errAsyncResult.unwrapOr(0)).resolves.toBe(0)
      })

      test('unwrapOrElse returns computed default', async () => {
        await expect(errAsyncResult.unwrapOrElse((e) => e.length)).resolves.toBe(6)
      })

      test('match calls err branch', async () => {
        const result = await errAsyncResult.match({
          ok: (x) => `Value: ${x}`,
          err: (e) => `Error: ${e}`,
        })
        expect(result).toBe('Error: failed')
      })

      test('toOption returns OptionAsync with None', async () => {
        const option = errAsyncResult.toOption()
        await expect(option.isNone()).resolves.toBe(true)
      })

      test('filter returns Err', async () => {
        const filtered = errAsyncResult.filter((x) => x > 0, 'Too small')
        await expect(filtered.isErr()).resolves.toBe(true)
      })

      test('zip returns Err', async () => {
        const zipped = errAsyncResult.zip(okAsync('hello'))
        await expect(zipped.isErr()).resolves.toBe(true)
      })

      test('flatten returns Err', async () => {
        const flattened = errAsyncResult.flatten()
        await expect(flattened.isErr()).resolves.toBe(true)
      })

      test('contains returns false', async () => {
        await expect(errAsyncResult.contains(42)).resolves.toBe(false)
      })

      test('recover returns Ok', async () => {
        const recovered = errAsyncResult.recover(() => 0)
        await expect(recovered.unwrapOr(-1)).resolves.toBe(0)
      })

      test('sequence returns Err', async () => {
        const sequenced = errAsyncResult.sequence()
        await expect(sequenced.isErr()).resolves.toBe(true)
      })

      test('tap does not execute', async () => {
        const spy = jest.fn()
        const tapped = errAsyncResult.tap(spy)
        await tapped
        expect(spy).not.toHaveBeenCalled()
      })

      test('tapErr executes function', async () => {
        const spy = jest.fn()
        await errAsyncResult.tapErr(spy)
        expect(spy).toHaveBeenCalledWith('failed')
      })
    })
  })

  describe('Utility Functions', () => {
    test('fromPromise resolves to Ok on success', async () => {
      const promise = Promise.resolve(42)
      const result = fromPromise(promise, (e) => `Error: ${e}`)
      await expect(result.unwrapOr(0)).resolves.toBe(42)
    })

    test('fromPromise resolves to Err on failure', async () => {
      const promise = Promise.reject('failed')
      const result = fromPromise(promise, (e) => `Error: ${e}`)
      await expect(result.isErr()).resolves.toBe(true)
    })

    test('fromSafePromise resolves to Ok', async () => {
      const promise = Promise.resolve(42)
      const result = fromSafePromise(promise)
      await expect(result.unwrapOr(0)).resolves.toBe(42)
    })

    test('fromThrowable returns Ok on success', () => {
      const result = fromThrowable(
        () => 42,
        (e) => `Error: ${e}`
      )
      expect(result).toEqual(ok(42))
    })

    test('fromThrowable returns Err on failure', () => {
      const result = fromThrowable(
        () => {
          throw new Error('failed')
        },
        (e) => `Error: ${(e as Error).message}`
      )
      expect(result).toEqual(err('Error: failed'))
    })

    test('fromAsyncThrowable returns Ok on success', async () => {
      const result = fromAsyncThrowable(
        () => Promise.resolve(42),
        (e) => `Error: ${e}`
      )
      await expect(result.unwrapOr(0)).resolves.toBe(42)
    })

    test('fromAsyncThrowable returns Err on failure', async () => {
      const result = fromAsyncThrowable(
        () => Promise.reject('failed'),
        (e) => `Error: ${e}`
      )
      await expect(result.isErr()).resolves.toBe(true)
    })

    test('safeTry returns Result on sync success', () => {
      const result = safeTry(
        () => 42,
        (e) => `Error: ${e}`
      )
      expect(result).toEqual(ok(42))
    })

    test('safeTry returns ResultAsync on async success', async () => {
      const result = safeTry(
        () => Promise.resolve(42),
        (e) => `Error: ${e}`
      )
      await expect(result.unwrapOr(0)).resolves.toBe(42)
    })

    test('safeTry returns Err on sync failure', () => {
      const result = safeTry(
        () => {
          throw new Error('failed')
        },
        (e) => `Error: ${(e as Error).message}`
      )
      expect(result).toEqual(err('Error: failed'))
    })

    test('safeTry returns ResultAsync on async failure', async () => {
      const result = safeTry(
        () => Promise.reject('failed'),
        (e) => `Error: ${e}`
      )
      await expect(result.isErr()).resolves.toBe(true)
    })
  })
})

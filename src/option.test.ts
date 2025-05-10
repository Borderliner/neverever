// option.test.ts
import { some, none, from, tryOption, Option, OptionAsync, isOption } from './option'
import { ok, err, okAsync, errAsync } from './result'
import { unwrapMaybePromise } from './utils'

describe('Option', () => {
  describe('Some', () => {
    let opt: Option<number>

    beforeEach(() => {
      opt = some(42)
    })

    test('isSome returns true', () => {
      expect(opt.isSome()).toBe(true)
    })

    test('isNone returns false', () => {
      expect(opt.isNone()).toBe(false)
    })

    test('contains checks value correctly', () => {
      expect(opt.contains(42)).toBe(true)
      expect(opt.contains(99)).toBe(false)
    })

    test('map transforms value', () => {
      const mapped = opt.map((n) => n * 2)
      expect(mapped.unwrapOr(0)).toBe(84)
    })

    test('andThen chains with another Option', () => {
      const chained = opt.andThen((n) => some(n.toString()))
      expect(chained.unwrapOr('')).toBe('42')
      const noneChained = opt.andThen(() => none())
      expect(noneChained.unwrapOr('')).toBe('')
    })

    test('filter retains value if predicate passes', () => {
      const filtered = opt.filter((n) => n > 40)
      expect(filtered.unwrapOr(0)).toBe(42)
      const filteredOut = opt.filter((n) => n > 50)
      expect(filteredOut.unwrapOr(0)).toBe(0)
    })

    test('zip combines with another Some', () => {
      const other = some('hello')
      const zipped = opt.zip(other)
      expect(zipped.unwrapOr([0, ''])).toEqual([42, 'hello'])
      const zippedWithNone = opt.zip(none())
      expect(zippedWithNone.unwrapOr([0, ''])).toEqual([0, ''])
    })

    test('flatten unwraps nested Option', () => {
      const nested = some(some(42))
      const flat = nested.flatten()
      expect(flat.unwrapOr(0)).toBe(42)
      const nonNested = opt.flatten()
      expect(nonNested.unwrapOr(0)).toBe(42)
      const nestedNone = some(none())
      expect(nestedNone.flatten().unwrapOr(0)).toBe(0)
    })

    test('orElse returns self', () => {
      const alternative = opt.orElse(() => some(99))
      expect(alternative.unwrapOr(0)).toBe(42)
    })

    test('unwrapOr returns value', () => {
      expect(opt.unwrapOr(0)).toBe(42)
    })

    test('unwrapOrElse returns value', () => {
      expect(opt.unwrapOrElse(() => 0)).toBe(42)
    })

    test('match executes some branch', () => {
      const result = opt.match({
        some: (value) => `Value: ${value}`,
        none: () => 'None',
      })
      expect(result).toBe('Value: 42')
    })

    test('toResult converts to Ok', () => {
      const result = opt.toResult('error')
      expect(result.isOk()).toBe(true)
      expect(result.unwrapOr(0)).toBe(42)
    })

    test('toAsync converts to OptionAsync', async () => {
      const asyncOpt = opt.toAsync()
      expect(await asyncOpt.isSome()).toBe(true)
      expect(await asyncOpt.unwrapOr(0)).toBe(42)
    })

    test('sequence wraps value in array', () => {
      const sequenced = opt.sequence()
      expect(sequenced.unwrapOr([])).toEqual([42])
      const arrayOpt = some([1, 2])
      expect(arrayOpt.sequence().unwrapOr([])).toEqual([1, 2])
    })

    test('tap executes side-effect and returns self', () => {
      const fn = jest.fn()
      const result = opt.tap(fn)
      expect(fn).toHaveBeenCalledWith(42)
      expect(result).toBe(opt)
    })

    test('pipe chains transformations', async () => {
      const result = opt.pipe(
        (opt) => opt.map((n) => n * 2),
        async (opt) => opt.map((n) => n + 10)
      )
      const unwrapped = await unwrapMaybePromise(result).then((opt) => opt.unwrapOr(0))
      expect(unwrapped).toBe(94)
    })
  })

  describe('None', () => {
    let opt: Option<number>

    beforeEach(() => {
      opt = none() as Option<number>
    })

    test('isSome returns false', () => {
      expect(opt.isSome()).toBe(false)
    })

    test('isNone returns true', () => {
      expect(opt.isNone()).toBe(true)
    })

    test('contains returns false', () => {
      expect(opt.contains(42)).toBe(false)
    })

    test('map returns None', () => {
      const mapped = opt.map((n) => n * 2)
      expect(mapped.isNone()).toBe(true)
    })

    test('andThen returns None', () => {
      const chained = opt.andThen((n) => some(n.toString()))
      expect(chained.isNone()).toBe(true)
    })

    test('filter returns None', () => {
      const filtered = opt.filter((n) => n > 40)
      expect(filtered.isNone()).toBe(true)
    })

    test('zip returns None', () => {
      const other = some('hello')
      const zipped = opt.zip(other)
      expect(zipped.isNone()).toBe(true)
    })

    test('flatten returns None', () => {
      const flat = opt.flatten()
      expect(flat.isNone()).toBe(true)
    })

    test('orElse evaluates alternative', () => {
      const alternative = opt.orElse(() => some(99))
      expect(alternative.unwrapOr(0)).toBe(99)
      const noneAlternative = opt.orElse(() => none() as Option<number>)
      expect(noneAlternative.unwrapOr(0)).toBe(0)
    })

    test('unwrapOr returns default', () => {
      expect(opt.unwrapOr(0)).toBe(0)
    })

    test('unwrapOrElse evaluates default', () => {
      expect(opt.unwrapOrElse(() => 99)).toBe(99)
    })

    test('match executes none branch', () => {
      const result = opt.match({
        some: (value) => `Value: ${value}`,
        none: () => 'None',
      })
      expect(result).toBe('None')
    })

    test('toResult converts to Err', () => {
      const result = opt.toResult('error')
      expect(result.isErr()).toBe(true)
      expect(result.unwrapOr(0)).toBe(0)
    })

    test('toAsync converts to OptionAsync', async () => {
      const asyncOpt = opt.toAsync()
      expect(await asyncOpt.isNone()).toBe(true)
      expect(await asyncOpt.unwrapOr(0)).toBe(0)
    })

    test('sequence returns empty array', () => {
      const sequenced = opt.sequence()
      expect(sequenced.unwrapOr([])).toEqual([])
    })

    test('tap does not execute side-effect', () => {
      const fn = jest.fn()
      const result = opt.tap(fn)
      expect(fn).not.toHaveBeenCalled()
      expect(result).toBe(opt)
    })

    test('pipe chains transformations', async () => {
      const result = opt.pipe(
        (opt) => opt.map((n) => n * 2),
        async (opt) => opt.map((n) => n + 10)
      )
      const unwrapped = await unwrapMaybePromise(result).then((opt) => opt.unwrapOr(0))
      expect(unwrapped).toBe(0)
    })
  })

  describe('Utility Functions', () => {
    describe('from', () => {
      test('creates Some for non-null value', () => {
        const opt = from('hello')
        expect(opt.unwrapOr('')).toBe('hello')
      })

      test('creates None for null', () => {
        const opt = from(null)
        expect(opt.isNone()).toBe(true)
      })

      test('creates None for undefined', () => {
        const opt = from(undefined)
        expect(opt.isNone()).toBe(true)
      })
    })

    describe('tryOption', () => {
      test('creates Some for successful function', () => {
        const opt = tryOption(() => 'success')
        expect(opt.unwrapOr('')).toBe('success')
      })

      test('creates None for throwing function', () => {
        const opt = tryOption(() => {
          throw new Error('fail')
        })
        expect(opt.isNone()).toBe(true)
      })

      test('calls onError when provided', () => {
        const onError = jest.fn()
        const opt = tryOption(() => {
          throw new Error('fail')
        }, onError)
        expect(onError).toHaveBeenCalledWith(expect.any(Error))
        expect(opt.isNone()).toBe(true)
      })
    })

    describe('isOption', () => {
      test('returns true for Some', () => {
        expect(isOption(some(42))).toBe(true)
      })

      test('returns true for None', () => {
        expect(isOption(none())).toBe(true)
      })

      test('returns false for non-Option', () => {
        expect(isOption(42)).toBe(false)
        expect(isOption(null)).toBe(false)
      })
    })
  })
})

describe('OptionAsync', () => {
  describe('Some', () => {
    let opt: OptionAsync<number>

    beforeEach(() => {
      opt = OptionAsync.some(42)
    })

    test('isSome returns true', async () => {
      await expect(opt.isSome()).resolves.toBe(true)
    })

    test('isNone returns false', async () => {
      await expect(opt.isNone()).resolves.toBe(false)
    })

    test('contains checks value', async () => {
      await expect(opt.contains(42)).resolves.toBe(true)
      await expect(opt.contains(99)).resolves.toBe(false)
    })

    test('map transforms value', async () => {
      const mapped = opt.map(async (n) => n * 2)
      await expect(mapped.then((opt) => opt.unwrapOr(0))).resolves.toBe(84)
    })

    test('andThen chains with Option', async () => {
      const chained = opt.andThen((n) => some(n.toString()))
      await expect(chained.then((opt) => opt.unwrapOr(''))).resolves.toBe('42')
      const noneChained = opt.andThen(() => none())
      await expect(noneChained.then((opt) => opt.unwrapOr(''))).resolves.toBe('')
    })

    test('andThen chains with OptionAsync', async () => {
      const chained = opt.andThen((n) => OptionAsync.some(n.toString()))
      await expect(chained.then((opt) => opt.unwrapOr(''))).resolves.toBe('42')
    })

    test('filter retains value if predicate passes', async () => {
      const filtered = opt.filter(async (n) => n > 40)
      await expect(filtered.then((opt) => opt.unwrapOr(0))).resolves.toBe(42)
      const filteredOut = opt.filter(async (n) => n > 50)
      await expect(filteredOut.then((opt) => opt.unwrapOr(0))).resolves.toBe(0)
    })

    test('zip combines with another Some', async () => {
      const other = some('hello')
      const zipped = opt.zip(other)
      await expect(zipped.then((opt) => opt.unwrapOr([0, '']))).resolves.toEqual([42, 'hello'])
      const asyncOther = OptionAsync.some('async')
      const asyncZipped = opt.zip(asyncOther)
      await expect(asyncZipped.then((opt) => opt.unwrapOr([0, '']))).resolves.toEqual([42, 'async'])
      const zippedWithNone = opt.zip(OptionAsync.none<string>())
      await expect(zippedWithNone.then((opt) => opt.unwrapOr([0, '']))).resolves.toEqual([0, ''])
    })

    test('flatten unwraps nested Option', async () => {
      const nested = OptionAsync.some(some(42))
      const flat = nested.flatten()
      await expect(flat.then((opt) => opt.unwrapOr(0))).resolves.toBe(42)

      const innerAsync = OptionAsync.some(42)
      const asyncNested = OptionAsync.some(innerAsync)
      const asyncFlat = asyncNested.flatten()
      await expect(asyncFlat.then((opt) => opt.unwrapOr(0))).resolves.toBe(42)

      const noneNested = OptionAsync.some(none())
      const noneFlat = noneNested.flatten()
      await expect(noneFlat.then((opt) => opt.unwrapOr(0))).resolves.toBe(0)
    })

    test('orElse returns self', async () => {
      const alternative = opt.orElse(() => some(99))
      await expect(alternative.then((opt) => opt.unwrapOr(0))).resolves.toBe(42)
    })

    test('unwrapOr returns value', async () => {
      await expect(opt.unwrapOr(0)).resolves.toBe(42)
      await expect(opt.unwrapOr(Promise.resolve(0))).resolves.toBe(42)
    })

    test('unwrapOrElse returns value', async () => {
      await expect(opt.unwrapOrElse(() => 0)).resolves.toBe(42)
      await expect(opt.unwrapOrElse(async () => 0)).resolves.toBe(42)
    })

    test('match executes some branch', async () => {
      const result = opt.match({
        some: async (value) => `Value: ${value}`,
        none: async () => 'None',
      })
      await expect(result).resolves.toBe('Value: 42')
    })

    test('toResult converts to Ok', async () => {
      const result = opt.toResult('error')
      await expect(result.then((res) => res.isOk())).resolves.toBe(true)
      await expect(result.then((res) => res.unwrapOr(0))).resolves.toBe(42)
      const asyncResult = opt.toResult(Promise.resolve('error'))
      await expect(asyncResult.then((res) => res.isOk())).resolves.toBe(true)
    })

    test('sequence wraps value in array', async () => {
      const sequenced = opt.sequence()
      await expect(sequenced.then((opt) => opt.unwrapOr([]))).resolves.toEqual([42])
      const arrayOpt = OptionAsync.some([1, 2])
      await expect(arrayOpt.sequence().then((opt) => opt.unwrapOr([]))).resolves.toEqual([1, 2])
    })

    test('tap executes side-effect', async () => {
      const fn = jest.fn()
      const result = opt.tap(fn)
      await expect(result.then((opt) => opt.unwrapOr(0))).resolves.toBe(42)
      expect(fn).toHaveBeenCalledWith(42)
      const asyncFn = jest.fn(async (n: number) => undefined)
      const asyncResult = opt.tap(asyncFn)
      await asyncResult
      expect(asyncFn).toHaveBeenCalledWith(42)
    })

    test('pipe chains transformations', async () => {
      const result = opt.pipe(
        (opt) => opt.map((n) => n * 2),
        async (opt) => opt.map((n) => n + 10)
      )
      await expect(result.then((opt) => opt.unwrapOr(0))).resolves.toBe(94)
    })
  })

  describe('None', () => {
    let opt: OptionAsync<number>

    beforeEach(() => {
      opt = OptionAsync.none<number>()
    })

    test('isSome returns false', async () => {
      await expect(opt.isSome()).resolves.toBe(false)
    })

    test('isNone returns true', async () => {
      await expect(opt.isNone()).resolves.toBe(true)
    })

    test('contains returns false', async () => {
      await expect(opt.contains(42)).resolves.toBe(false)
    })

    test('map returns None', async () => {
      const mapped = opt.map(async (n) => n * 2)
      await expect(mapped.then((opt) => opt.isNone())).resolves.toBe(true)
    })

    test('andThen returns None', async () => {
      const chained = opt.andThen((n) => some(n.toString()))
      await expect(chained.then((opt) => opt.isNone())).resolves.toBe(true)
      const asyncChained = opt.andThen(() => OptionAsync.some('test'))
      await expect(asyncChained.then((opt) => opt.isNone())).resolves.toBe(true)
    })

    test('filter returns None', async () => {
      const filtered = opt.filter(async (n) => n > 40)
      await expect(filtered.then((opt) => opt.isNone())).resolves.toBe(true)
    })

    test('zip returns None', async () => {
      const other = some('hello')
      const zipped = opt.zip(other)
      await expect(zipped.then((opt) => opt.isNone())).resolves.toBe(true)
      const asyncOther = OptionAsync.some('async')
      const asyncZipped = opt.zip(asyncOther)
      await expect(asyncZipped.then((opt) => opt.isNone())).resolves.toBe(true)
    })

    test('flatten returns None', async () => {
      const flat = opt.flatten()
      await expect(flat.then((opt) => opt.isNone())).resolves.toBe(true)
    })

    test('orElse evaluates alternative', async () => {
      const alternative = opt.orElse(() => some(99))
      await expect(alternative.then((opt) => opt.unwrapOr(0))).resolves.toBe(99)
      const asyncAlternative = opt.orElse(() => OptionAsync.some(99))
      await expect(asyncAlternative.then((opt) => opt.unwrapOr(0))).resolves.toBe(99)
      const noneAlternative = opt.orElse(() => none() as Option<number>)
      await expect(noneAlternative.then((opt) => opt.unwrapOr(0))).resolves.toBe(0)
    })

    test('unwrapOr returns default', async () => {
      await expect(opt.unwrapOr(0)).resolves.toBe(0)
      await expect(opt.unwrapOr(Promise.resolve(0))).resolves.toBe(0)
    })

    test('unwrapOrElse evaluates default', async () => {
      await expect(opt.unwrapOrElse(() => 99)).resolves.toBe(99)
      await expect(opt.unwrapOrElse(async () => 99)).resolves.toBe(99)
    })

    test('match executes none branch', async () => {
      const result = opt.match({
        some: async (value) => `Value: ${value}`,
        none: async () => 'None',
      })
      await expect(result).resolves.toBe('None')
    })

    test('toResult converts to Err', async () => {
      const result = opt.toResult('error')
      await expect(result.then((res) => res.isErr())).resolves.toBe(true)
      await expect(result.then((res) => res.unwrapOr(0))).resolves.toBe(0)
      const asyncResult = opt.toResult(Promise.resolve('error'))
      await expect(asyncResult.then((res) => res.isErr())).resolves.toBe(true)
    })

    test('sequence returns empty array', async () => {
      const sequenced = opt.sequence()
      await expect(sequenced.then((opt) => opt.unwrapOr([]))).resolves.toEqual([])
    })

    test('tap does not execute side-effect', async () => {
      const fn = jest.fn()
      const result = opt.tap(fn)
      await expect(result.then((opt) => opt.isNone())).resolves.toBe(true)
      expect(fn).not.toHaveBeenCalled()
      const asyncFn = jest.fn(async (n: number) => undefined)
      const asyncResult = opt.tap(asyncFn)
      await asyncResult
      expect(asyncFn).not.toHaveBeenCalled()
    })

    test('pipe chains transformations', async () => {
      const result = opt.pipe(
        (opt) => opt.map((n) => n * 2),
        async (opt) => opt.map((n) => n + 10)
      )
      await expect(result.then((opt) => opt.unwrapOr(0))).resolves.toBe(0)
    })
  })

  describe('Utility Functions', () => {
    describe('from', () => {
      test('creates Some for non-null value', async () => {
        const opt = OptionAsync.from('hello')
        await expect(opt.unwrapOr('')).resolves.toBe('hello')
        const asyncOpt = OptionAsync.from(Promise.resolve('async'))
        await expect(asyncOpt.unwrapOr('')).resolves.toBe('async')
      })

      test('creates None for null or undefined', async () => {
        const optNull = OptionAsync.from(null)
        await expect(optNull.isNone()).resolves.toBe(true)
        const optUndefined = OptionAsync.from(undefined)
        await expect(optUndefined.isNone()).resolves.toBe(true)
        const asyncNull = OptionAsync.from(Promise.resolve(null))
        await expect(asyncNull.isNone()).resolves.toBe(true)
      })
    })

    describe('try', () => {
      test('creates Some for successful function', async () => {
        const opt = OptionAsync.try(() => 'success')
        await expect(opt.unwrapOr('')).resolves.toBe('success')
        const asyncOpt = OptionAsync.try(async () => 'async')
        await expect(asyncOpt.unwrapOr('')).resolves.toBe('async')
      })

      test('creates None for throwing function', async () => {
        const opt = OptionAsync.try(() => {
          throw new Error('fail')
        })
        await expect(opt.isNone()).resolves.toBe(true)
        const asyncOpt = OptionAsync.try(async () => {
          throw new Error('fail')
        })
        await expect(asyncOpt.isNone()).resolves.toBe(true)
      })
    })
  })
})

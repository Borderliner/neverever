import { Option, OptionAsync, isOption, isOptionAsync } from './option'
import { ResultAsync } from './result'

describe('Option', () => {
  describe('Some', () => {
    let opt: Option<number>

    beforeEach(() => {
      opt = Option.some(42)
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
      const chained = opt.andThen((n) => Option.some(n.toString()))
      expect(chained.unwrapOr('')).toBe('42')
      const noneChained = opt.andThen(() => Option.none())
      expect(noneChained.unwrapOr('')).toBe('')
    })

    test('filter retains value if predicate passes', () => {
      const filtered = opt.filter((n) => n > 40)
      expect(filtered.unwrapOr(0)).toBe(42)
      const filteredOut = opt.filter((n) => n > 50)
      expect(filteredOut.unwrapOr(0)).toBe(0)
    })

    test('zip combines with another Some', () => {
      const other = Option.some('hello')
      const zipped = opt.zip(other)
      expect(zipped.unwrapOr([0, ''])).toEqual([42, 'hello'])
      const zippedWithNone = opt.zip(Option.none())
      expect(zippedWithNone.unwrapOr([0, ''])).toEqual([0, ''])
    })

    test('flatten unwraps nested Option', () => {
      const nested = Option.some(Option.some(42))
      const flat = nested.flatten()
      expect(flat.unwrapOr(0)).toBe(42)
      const nonNested = opt.flatten()
      expect(nonNested.unwrapOr(0)).toBe(42)
      const nestedNone = Option.some(Option.none())
      expect(nestedNone.flatten().unwrapOr(0)).toBe(0)
    })

    test('orElse returns self', () => {
      const alternative = opt.orElse(() => Option.some(99))
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
      const arrayOpt = Option.some([1, 2])
      expect(arrayOpt.sequence().unwrapOr([])).toEqual([1, 2])
    })

    test('tap executes side-effect and returns self', () => {
      const fn = jest.fn()
      const result = opt.tap(fn)
      expect(fn).toHaveBeenCalledWith(42)
      expect(result).toBe(opt)
    })

    test('pipe chains transformations', async () => {
      const result = await opt.pipe(
        (opt) => opt.map((n) => n * 2),
        (opt) => opt.map((n) => n + 10)
      )
      expect(result.unwrapOr(0)).toBe(94)
    })

    test('pipe with async transformations', async () => {
      const result = await opt.pipe(
        (opt) => opt.map((n) => n * 2),
        async (opt) => opt.map((n) => n + 10)
      )
      expect(result.unwrapOr(0)).toBe(94)
    })
  })

  describe('None', () => {
    let opt: Option<number>

    beforeEach(() => {
      opt = Option.none<number>()
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
      const chained = opt.andThen((n) => Option.some(n.toString()))
      expect(chained.isNone()).toBe(true)
    })

    test('filter returns None', () => {
      const filtered = opt.filter((n) => n > 40)
      expect(filtered.isNone()).toBe(true)
    })

    test('zip returns None', () => {
      const other = Option.some('hello')
      const zipped = opt.zip(other)
      expect(zipped.isNone()).toBe(true)
    })

    test('flatten returns None', () => {
      const flat = opt.flatten()
      expect(flat.isNone()).toBe(true)
    })

    test('orElse evaluates alternative', () => {
      const alternative = opt.orElse(() => Option.some(99))
      expect(alternative.unwrapOr(0)).toBe(99)
      const noneAlternative = opt.orElse(() => Option.none<number>())
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
      const result = await opt.pipe(
        (opt) => opt.map((n) => n * 2),
        (opt) => opt.map((n) => n + 10)
      )
      expect(result.unwrapOr(0)).toBe(0)
    })
  })

  describe('Utility Functions', () => {
    describe('from', () => {
      test('creates Some for non-null value', () => {
        const opt = Option.from('hello')
        expect(opt.unwrapOr('')).toBe('hello')
      })

      test('creates None for null', () => {
        const opt = Option.from(null)
        expect(opt.isNone()).toBe(true)
      })

      test('creates None for undefined', () => {
        const opt = Option.from(undefined)
        expect(opt.isNone()).toBe(true)
      })
    })

    describe('try', () => {
      test('creates Some for successful function', () => {
        const opt = Option.try(() => 'success')
        expect(opt.unwrapOr('')).toBe('success')
      })

      test('creates None for throwing function', () => {
        const opt = Option.try(() => {
          throw new Error('fail')
        })
        expect(opt.isNone()).toBe(true)
      })
    })

    describe('isOption', () => {
      test('returns true for Some', () => {
        expect(isOption(Option.some(42))).toBe(true)
      })

      test('returns true for None', () => {
        expect(isOption(Option.none())).toBe(true)
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

    test('map transforms value with sync fn', async () => {
      const mapped = opt.map((n) => n * 2)
      await expect(mapped.unwrapOr(0)).resolves.toBe(84)
    })

    test('map transforms value with async fn', async () => {
      const mapped = opt.map(async (n) => n * 2)
      await expect(mapped.unwrapOr(0)).resolves.toBe(84)
    })

    test('andThen chains with Option', async () => {
      const chained = opt.andThen((n) => Option.some(n.toString()))
      await expect(chained.unwrapOr('')).resolves.toBe('42')
      const noneChained = opt.andThen(() => Option.none())
      await expect(noneChained.unwrapOr('')).resolves.toBe('')
    })

    test('andThen chains with OptionAsync', async () => {
      const chained = opt.andThen((n) => OptionAsync.some(n.toString()))
      await expect(chained.unwrapOr('')).resolves.toBe('42')
      const noneChained = opt.andThen(() => OptionAsync.none())
      await expect(noneChained.unwrapOr('')).resolves.toBe('')
    })

    test('filter retains value if predicate passes', async () => {
      const filtered = opt.filter((n) => n > 40)
      await expect(filtered.unwrapOr(0)).resolves.toBe(42)
      const filteredOut = opt.filter((n) => n > 50)
      await expect(filteredOut.unwrapOr(0)).resolves.toBe(0)
      const asyncFiltered = opt.filter(async (n) => n > 40)
      await expect(asyncFiltered.unwrapOr(0)).resolves.toBe(42)
    })

    test('zip combines with another Some', async () => {
      const other = Option.some('hello')
      const zipped = opt.zip(other)
      await expect(zipped.unwrapOr([0, ''])).resolves.toEqual([42, 'hello'])
      const asyncOther = OptionAsync.some('async')
      const asyncZipped = opt.zip(asyncOther)
      await expect(asyncZipped.unwrapOr([0, ''])).resolves.toEqual([42, 'async'])
      const zippedWithNone = opt.zip(OptionAsync.none<string>())
      await expect(zippedWithNone.unwrapOr([0, ''])).resolves.toEqual([0, ''])
    })

    test('flatten unwraps nested Option', async () => {
      const nested = OptionAsync.some(Option.some(42))
      const flat = nested.flatten()
      await expect(flat.unwrapOr(0)).resolves.toBe(42)

      const innerAsync = OptionAsync.some(42)
      const asyncNested = OptionAsync.some(innerAsync)
      const asyncFlat = asyncNested.flatten()
      await expect(asyncFlat.unwrapOr(0)).resolves.toBe(42)

      const noneNested = OptionAsync.some(Option.none())
      const noneFlat = noneNested.flatten()
      await expect(noneFlat.unwrapOr(0)).resolves.toBe(0)
    })

    test('orElse returns self', async () => {
      const alternative = opt.orElse(() => Option.some(99))
      await expect(alternative.unwrapOr(0)).resolves.toBe(42)
      const asyncAlternative = opt.orElse(() => OptionAsync.some(99))
      await expect(asyncAlternative.unwrapOr(0)).resolves.toBe(42)
    })

    test('unwrapOr returns value with sync default', async () => {
      await expect(opt.unwrapOr(0)).resolves.toBe(42)
    })

    test('unwrapOr returns value with async default', async () => {
      await expect(opt.unwrapOr(Promise.resolve(0))).resolves.toBe(42)
    })

    test('unwrapOrElse returns value with sync fn', async () => {
      await expect(opt.unwrapOrElse(() => 0)).resolves.toBe(42)
    })

    test('unwrapOrElse returns value with async fn', async () => {
      await expect(opt.unwrapOrElse(async () => 0)).resolves.toBe(42)
    })

    test('match executes some branch with sync fn', async () => {
      const result = opt.match({
        some: (value) => `Value: ${value}`,
        none: () => 'None',
      })
      await expect(result).resolves.toBe('Value: 42')
    })

    test('match executes some branch with async fn', async () => {
      const result = opt.match({
        some: async (value) => `Value: ${value}`,
        none: async () => 'None',
      })
      await expect(result).resolves.toBe('Value: 42')
    })

    test('toResult converts to Ok with sync error', async () => {
      const result = opt.toResult('error')
      await expect(result.isOk()).resolves.toBe(true)
      await expect(result.unwrapOr(0)).resolves.toBe(42)
    })

    test('toResult converts to Ok with async error', async () => {
      const result = opt.toResult(Promise.resolve('error'))
      await expect(result.isOk()).resolves.toBe(true)
      await expect(result.unwrapOr(0)).resolves.toBe(42)
    })

    test('sequence wraps value in array', async () => {
      const sequenced = opt.sequence()
      await expect(sequenced.unwrapOr([])).resolves.toEqual([42])
      const arrayOpt = OptionAsync.some([1, 2])
      await expect(arrayOpt.sequence().unwrapOr([])).resolves.toEqual([1, 2])
    })

    test('tap executes side-effect with sync fn', async () => {
      const fn = jest.fn()
      const result = opt.tap(fn)
      await expect(result.unwrapOr(0)).resolves.toBe(42)
      expect(fn).toHaveBeenCalledWith(42)
    })

    test('tap executes side-effect with async fn', async () => {
      const fn = jest.fn(async (n: number) => undefined)
      const result = opt.tap(fn)
      await expect(result.unwrapOr(0)).resolves.toBe(42)
      expect(fn).toHaveBeenCalledWith(42)
    })

    test('pipe chains transformations', async () => {
      const result = await opt.pipe(
        (opt) => opt.map((n) => n * 2),
        async (opt) => opt.map((n) => n + 10)
      )
      expect(result.unwrapOr(0)).toBe(94)
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

    test('map returns None with sync fn', async () => {
      const mapped = opt.map((n) => n * 2)
      await expect(mapped.isNone()).resolves.toBe(true)
    })

    test('map returns None with async fn', async () => {
      const mapped = opt.map(async (n) => n * 2)
      await expect(mapped.isNone()).resolves.toBe(true)
    })

    test('andThen returns None with Option', async () => {
      const chained = opt.andThen((n) => Option.some(n.toString()))
      await expect(chained.isNone()).resolves.toBe(true)
    })

    test('andThen returns None with OptionAsync', async () => {
      const chained = opt.andThen((n) => OptionAsync.some(n.toString()))
      await expect(chained.isNone()).resolves.toBe(true)
    })

    test('filter returns None with sync predicate', async () => {
      const filtered = opt.filter((n) => n > 40)
      await expect(filtered.isNone()).resolves.toBe(true)
    })

    test('filter returns None with async predicate', async () => {
      const filtered = opt.filter(async (n) => n > 40)
      await expect(filtered.isNone()).resolves.toBe(true)
    })

    test('zip returns None with sync Option', async () => {
      const other = Option.some('hello')
      const zipped = opt.zip(other)
      await expect(zipped.isNone()).resolves.toBe(true)
    })

    test('zip returns None with async Option', async () => {
      const other = OptionAsync.some('async')
      const zipped = opt.zip(other)
      await expect(zipped.isNone()).resolves.toBe(true)
    })

    test('flatten returns None', async () => {
      const flat = opt.flatten()
      await expect(flat.isNone()).resolves.toBe(true)
    })

    test('orElse evaluates sync alternative', async () => {
      const alternative = opt.orElse(() => Option.some(99))
      await expect(alternative.unwrapOr(0)).resolves.toBe(99)
      const noneAlternative = opt.orElse(() => Option.none<number>())
      await expect(noneAlternative.unwrapOr(0)).resolves.toBe(0)
    })

    test('orElse evaluates async alternative', async () => {
      const alternative = opt.orElse(() => OptionAsync.some(99))
      await expect(alternative.unwrapOr(0)).resolves.toBe(99)
      const noneAlternative = opt.orElse(() => OptionAsync.none<number>())
      await expect(noneAlternative.unwrapOr(0)).resolves.toBe(0)
    })

    test('unwrapOr returns default with sync default', async () => {
      await expect(opt.unwrapOr(0)).resolves.toBe(0)
    })

    test('unwrapOr returns default with async default', async () => {
      await expect(opt.unwrapOr(Promise.resolve(0))).resolves.toBe(0)
    })

    test('unwrapOrElse evaluates default with sync fn', async () => {
      await expect(opt.unwrapOrElse(() => 99)).resolves.toBe(99)
    })

    test('unwrapOrElse evaluates default with async fn', async () => {
      await expect(opt.unwrapOrElse(async () => 99)).resolves.toBe(99)
    })

    test('match executes none branch with sync fn', async () => {
      const result = opt.match({
        some: (value) => `Value: ${value}`,
        none: () => 'None',
      })
      await expect(result).resolves.toBe('None')
    })

    test('match executes none branch with async fn', async () => {
      const result = opt.match({
        some: async (value) => `Value: ${value}`,
        none: async () => 'None',
      })
      await expect(result).resolves.toBe('None')
    })

    test('toResult converts to Err with sync error', async () => {
      const result = opt.toResult('error')
      await expect(result.isErr()).resolves.toBe(true)
      await expect(result.unwrapOr(0)).resolves.toBe(0)
    })

    test('toResult converts to Err with async error', async () => {
      const result = opt.toResult(Promise.resolve('error'))
      await expect(result.isErr()).resolves.toBe(true)
      await expect(result.unwrapOr(0)).resolves.toBe(0)
    })

    test('sequence returns empty array', async () => {
      const sequenced = opt.sequence()
      await expect(sequenced.unwrapOr([])).resolves.toEqual([])
    })

    test('tap does not execute side-effect with sync fn', async () => {
      const fn = jest.fn()
      const result = opt.tap(fn)
      await expect(result.isNone()).resolves.toBe(true)
      expect(fn).not.toHaveBeenCalled()
    })

    test('tap does not execute side-effect with async fn', async () => {
      const fn = jest.fn(async (n: number) => undefined)
      const result = opt.tap(fn)
      await expect(result.isNone()).resolves.toBe(true)
      expect(fn).not.toHaveBeenCalled()
    })

    test('pipe chains transformations', async () => {
      const result = await opt.pipe(
        (opt) => opt.map((n) => n * 2),
        async (opt) => opt.map((n) => n + 10)
      )
      expect(result.unwrapOr(0)).toBe(0)
    })
  })

  describe('Utility Functions', () => {
    describe('from', () => {
      test('creates Some for non-null sync value', async () => {
        const opt = OptionAsync.from('hello')
        await expect(opt.unwrapOr('')).resolves.toBe('hello')
      })

      test('creates Some for non-null async value', async () => {
        const opt = OptionAsync.from(Promise.resolve('async'))
        await expect(opt.unwrapOr('')).resolves.toBe('async')
      })

      test('creates None for null or undefined sync value', async () => {
        const optNull = OptionAsync.from(null)
        await expect(optNull.isNone()).resolves.toBe(true)
        const optUndefined = OptionAsync.from(undefined)
        await expect(optUndefined.isNone()).resolves.toBe(true)
      })

      test('creates None for null or undefined async value', async () => {
        const optNull = OptionAsync.from(Promise.resolve(null))
        await expect(optNull.isNone()).resolves.toBe(true)
        const optUndefined = OptionAsync.from(Promise.resolve(undefined))
        await expect(optUndefined.isNone()).resolves.toBe(true)
      })
    })

    describe('try', () => {
      test('creates Some for successful sync function', async () => {
        const opt = OptionAsync.try(() => 'success')
        await expect(opt.unwrapOr('')).resolves.toBe('success')
      })

      test('creates Some for successful async function', async () => {
        const opt = OptionAsync.try(async () => 'async')
        await expect(opt.unwrapOr('')).resolves.toBe('async')
      })

      test('creates None for throwing sync function', async () => {
        const opt = OptionAsync.try(() => {
          throw new Error('fail')
        })
        await expect(opt.isNone()).resolves.toBe(true)
      })

      test('creates None for throwing async function', async () => {
        const opt = OptionAsync.try(async () => {
          throw new Error('fail')
        })
        await expect(opt.isNone()).resolves.toBe(true)
      })

      test('creates None for rejected promise', async () => {
        const opt = OptionAsync.try(() => Promise.reject(new Error('fail')))
        await expect(opt.isNone()).resolves.toBe(true)
      })
    })

    describe('isOptionAsync', () => {
      test('returns true for OptionAsync Some', () => {
        const opt = OptionAsync.some(42)
        expect(isOptionAsync(opt)).toBe(true)
      })

      test('returns true for OptionAsync None', () => {
        const opt = OptionAsync.none()
        expect(isOptionAsync(opt)).toBe(true)
      })

      test('returns false for non-OptionAsync', () => {
        expect(isOptionAsync(42)).toBe(false)
        expect(isOptionAsync(Option.some(42))).toBe(false)
        expect(isOptionAsync(null)).toBe(false)
      })
    })
  })
})

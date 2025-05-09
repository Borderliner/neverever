import { some, none, from, tryOption, Option, OptionAsync } from './option' // Adjust path as needed

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
      const noneChained = opt.andThen(() => none<string>())
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
      const zippedWithNone = opt.zip(none<string>())
      expect(zippedWithNone.unwrapOr([0, ''])).toEqual([0, ''])
    })

    test('flatten unwraps nested Option', () => {
      const nested = some(some(42))
      const flat = nested.flatten()
      expect(flat.unwrapOr(0)).toBe(42)
      const nonNested = opt.flatten()
      expect(nonNested.unwrapOr(0)).toBe(42)
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
  })

  describe('None', () => {
    let opt: Option<number>

    beforeEach(() => {
      opt = none<number>()
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
  })

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
})

describe('OptionAsync', () => {
  describe('Some', () => {
    let opt: OptionAsync<number>

    beforeEach(() => {
      opt = OptionAsync.some(42)
    })

    test('isSome returns true', async () => {
      expect(await opt.isSome()).toBe(true)
    })

    test('isNone returns false', async () => {
      expect(await opt.isNone()).toBe(false)
    })

    test('contains checks value', async () => {
      expect(await opt.contains(42)).toBe(true)
      expect(await opt.contains(99)).toBe(false)
    })

    test('map transforms value', async () => {
      const mapped = await opt.map(async (n) => n * 2)
      expect(mapped.unwrapOr(0)).toBe(84)
    })

    test('andThen chains with Option', async () => {
      const chained = await opt.andThen((n) => some(n.toString()))
      expect(chained.unwrapOr('')).toBe('42')
      const noneChained = await opt.andThen(() => none<string>())
      expect(noneChained.unwrapOr('')).toBe('')
    })

    test('filter retains value if predicate passes', async () => {
      const filtered = await opt.filter(async (n) => n > 40)
      expect(filtered.unwrapOr(0)).toBe(42)
      const filteredOut = await opt.filter(async (n) => n > 50)
      expect(filteredOut.unwrapOr(0)).toBe(0)
    })

    test('zip combines with another Some', async () => {
      const other = some('hello')
      const zipped = await opt.zip(other)
      expect(zipped.unwrapOr([0, ''])).toEqual([42, 'hello'])
      const zippedWithNone = await opt.zip(OptionAsync.none<string>())
      expect(zippedWithNone.unwrapOr([0, ''])).toEqual([0, ''])
    })

    test('unwrapOr returns value', async () => {
      expect(await opt.unwrapOr(0)).toBe(42)
    })

    test('unwrapOrElse returns value', async () => {
      expect(await opt.unwrapOrElse(() => 0)).toBe(42)
    })

    test('match executes some branch', async () => {
      const result = await opt.match({
        some: async (value) => `Value: ${value}`,
        none: async () => 'None',
      })
      expect(result).toBe('Value: 42')
    })

    test('toResult converts to Ok', async () => {
      const result = await opt.toResult('error')
      expect(await result.isOk()).toBe(true)
      expect(await result.unwrapOr(0)).toBe(42)
    })

    test('sequence wraps value in array', async () => {
      const sequenced = await opt.sequence()
      expect(sequenced.unwrapOr([])).toEqual([42])
    })

    test('tap executes side-effect', async () => {
      const fn = jest.fn()
      const result = await opt.tap(fn)
      expect(fn).toHaveBeenCalledWith(42)
      expect(result.unwrapOr(0)).toBe(42)
    })
  })

  describe('None', () => {
    let opt: OptionAsync<number>

    beforeEach(() => {
      opt = OptionAsync.none<number>()
    })

    test('isSome returns false', async () => {
      expect(await opt.isSome()).toBe(false)
    })

    test('isNone returns true', async () => {
      expect(await opt.isNone()).toBe(true)
    })

    test('contains returns false', async () => {
      expect(await opt.contains(42)).toBe(false)
    })

    test('map returns None', async () => {
      const mapped = await opt.map(async (n) => n * 2)
      expect(mapped.isNone()).toBe(true)
    })

    test('andThen returns None', async () => {
      const chained = await opt.andThen((n) => some(n.toString()))
      expect(chained.isNone()).toBe(true)
    })

    test('filter returns None', async () => {
      const filtered = await opt.filter(async (n) => n > 40)
      expect(filtered.isNone()).toBe(true)
    })

    test('zip returns None', async () => {
      const other = some('hello')
      const zipped = await opt.zip(other)
      expect(zipped.isNone()).toBe(true)
    })

    test('orElse evaluates alternative', async () => {
      const alternative = await opt.orElse(() => some(99))
      expect(alternative.unwrapOr(0)).toBe(99)
    })

    test('unwrapOr returns default', async () => {
      expect(await opt.unwrapOr(0)).toBe(0)
    })

    test('unwrapOrElse evaluates default', async () => {
      expect(await opt.unwrapOrElse(() => 99)).toBe(99)
    })

    test('match executes none branch', async () => {
      const result = await opt.match({
        some: async (value) => `Value: ${value}`,
        none: async () => 'None',
      })
      expect(result).toBe('None')
    })

    test('toResult converts to Err', async () => {
      const result = await opt.toResult('error')
      expect(await result.isErr()).toBe(true)
      expect(await result.unwrapOr(0)).toBe(0)
    })

    test('sequence returns empty array', async () => {
      const sequenced = await opt.sequence()
      expect(sequenced.unwrapOr([])).toEqual([])
    })

    test('tap does not execute side-effect', async () => {
      const fn = jest.fn()
      const result = await opt.tap(fn)
      expect(fn).not.toHaveBeenCalled()
      expect(result.isNone()).toBe(true)
    })
  })

  describe('from', () => {
    test('creates Some for non-null value', async () => {
      const opt = OptionAsync.from('hello')
      expect(await opt.unwrapOr('')).toBe('hello')
      const asyncOpt = OptionAsync.from(Promise.resolve('async'))
      expect(await asyncOpt.unwrapOr('')).toBe('async')
    })

    test('creates None for null or undefined', async () => {
      const optNull = OptionAsync.from(null)
      expect(await optNull.isNone()).toBe(true)
      const optUndefined = OptionAsync.from(undefined)
      expect(await optUndefined.isNone()).toBe(true)
    })
  })

  describe('try', () => {
    test('creates Some for successful function', async () => {
      const opt = OptionAsync.try(() => 'success')
      expect(await opt.unwrapOr('')).toBe('success')
      const asyncOpt = OptionAsync.try(async () => 'async')
      expect(await asyncOpt.unwrapOr('')).toBe('async')
    })

    test('creates None for throwing function', async () => {
      const opt = OptionAsync.try(() => {
        throw new Error('fail')
      })
      expect(await opt.isNone()).toBe(true)
      const asyncOpt = OptionAsync.try(async () => {
        throw new Error('fail')
      })
      expect(await asyncOpt.isNone()).toBe(true)
    })
  })
})

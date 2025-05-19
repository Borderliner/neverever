import { Option, isOption } from './Option'

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

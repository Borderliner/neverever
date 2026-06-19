import {
  Ok,
  Err,
  Some,
  None,
  OkAsync,
  ErrAsync,
  SomeAsync,
  NoneAsync,
  Option,
  OptionAsync,
  Result,
  ResultAsync,
  isResult,
  isResultAsync,
  isOption,
  isOptionAsync,
} from './index'

describe('standalone PascalCase constructors', () => {
  test('Ok / Err build Results with inferred types', () => {
    const ok = Ok(42)
    expect(isResult(ok)).toBe(true)
    expect(ok.unwrapOr(0)).toBe(42)

    const err = Err('boom')
    expect(isResult(err)).toBe(true)
    expect(err.match({ ok: () => 'ok', err: (e) => e })).toBe('boom')
  })

  test('Some / None build Options', () => {
    expect(isOption(Some(42))).toBe(true)
    expect(Some(42).unwrapOr(0)).toBe(42)
    expect(isOption(None())).toBe(true)
    expect(None<number>().isNone()).toBe(true)
  })

  test('OkAsync / ErrAsync build ResultAsyncs and accept Promises', async () => {
    expect(isResultAsync(OkAsync(1))).toBe(true)
    await expect(OkAsync(Promise.resolve(5)).unwrapOr(0)).resolves.toBe(5)
    await expect(ErrAsync('boom').match({ ok: () => 'ok', err: (e) => e })).resolves.toBe('boom')
  })

  test('SomeAsync / NoneAsync build OptionAsyncs', async () => {
    expect(isOptionAsync(SomeAsync(1))).toBe(true)
    await expect(SomeAsync(Promise.resolve(5)).unwrapOr(0)).resolves.toBe(5)
    await expect(NoneAsync<number>().isNone()).resolves.toBe(true)
  })

  test('error/success types widen through the chain', () => {
    const r = Ok(5).andThen((x) => (x > 0 ? Ok(x) : Err('neg')))
    expect(r.unwrapOr(-1)).toBe(5)
  })
})

describe('awaitable async types (PromiseLike)', () => {
  test('await ResultAsync resolves to a synchronous Result', async () => {
    const res = await OkAsync<number, string>(42)
    expect(isResult(res)).toBe(true)
    expect(res.unwrapOr(0)).toBe(42)
  })

  test('await OptionAsync resolves to a synchronous Option', async () => {
    const opt = await SomeAsync(42)
    expect(isOption(opt)).toBe(true)
    expect(opt.unwrapOr(0)).toBe(42)
  })

  test('ResultAsync.then maps the resolved Result', async () => {
    const value = await ResultAsync.ok<number, string>(10).then((res) => res.unwrapOr(0))
    expect(value).toBe(10)
  })

  test('catch handles a rejected underlying promise', async () => {
    const ra = ResultAsync.ok<number, string>(1).map(async () => {
      throw new Error('kaboom')
    })
    const caught = await ra.catch((e) => (e as Error).message)
    expect(caught).toBe('kaboom')
  })

  test('finally runs on settle', async () => {
    const spy = jest.fn()
    const res = await OkAsync<number, string>(1).finally(spy)
    expect(res.unwrapOr(0)).toBe(1)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  test('OptionAsync.then / finally', async () => {
    const value = await SomeAsync(7).then((opt) => opt.unwrapOr(0))
    expect(value).toBe(7)
    const spy = jest.fn()
    await SomeAsync(7).finally(spy)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  test('OptionAsync.catch handles rejection', async () => {
    const oa = OptionAsync.some(1).map(async () => {
      throw new Error('opt-boom')
    })
    await expect(oa.catch((e) => (e as Error).message)).resolves.toBe('opt-boom')
  })
})

describe('auto-promotion: Result becomes ResultAsync on async callbacks', () => {
  test('map with an async fn returns a ResultAsync', async () => {
    const r = Ok<number, string>(5).map(async (x) => x * 2)
    expect(isResultAsync(r)).toBe(true)
    await expect(r.unwrapOr(0)).resolves.toBe(10)
  })

  test('map stays sync with a sync fn', () => {
    const r = Ok(5).map((x) => x * 2)
    expect(isResult(r)).toBe(true)
    expect(r.unwrapOr(0)).toBe(10)
  })

  test('mapErr with an async fn returns a ResultAsync', async () => {
    const r = Err<string, number>('e').mapErr(async (e) => `${e}!`)
    await expect(r.match({ ok: () => '', err: (e) => e })).resolves.toBe('e!')
  })

  test('andThen promotes when fn returns a ResultAsync', async () => {
    const r = Ok<number, string>(5).andThen((x) => OkAsync<number, string>(x + 1))
    expect(isResultAsync(r)).toBe(true)
    await expect(r.unwrapOr(0)).resolves.toBe(6)
  })

  test('andThen promotes when fn returns a Promise<Result>', async () => {
    const r = Ok<number, string>(5).andThen(async (x) => Ok<number, string>(x + 1))
    await expect(r.unwrapOr(0)).resolves.toBe(6)
  })

  test('orElse promotes when fn returns an async fallback', async () => {
    const r = Err<string, number>('e').orElse(() => OkAsync<number, string>(0))
    await expect(r.unwrapOr(-1)).resolves.toBe(0)
    const viaPromise = Err<string, number>('e').orElse(async () => Ok<number, string>(1))
    await expect(viaPromise.unwrapOr(-1)).resolves.toBe(1)
  })

  test('recover with an async fn returns a ResultAsync', async () => {
    const r = Err<string, number>('boom').recover(async (e) => e.length)
    await expect(r.unwrapOr(-1)).resolves.toBe(4)
  })

  test('filter with an async predicate returns a ResultAsync', async () => {
    const pass = Ok<number, string>(42).filter(async (x) => x > 0, 'too small')
    await expect(pass.unwrapOr(0)).resolves.toBe(42)
    const fail = Ok<number, string>(42).filter(async (x) => x < 0, 'too small')
    await expect(fail.match({ ok: () => '', err: (e) => e })).resolves.toBe('too small')
  })

  test('tap with an async fn returns a ResultAsync and runs the effect', async () => {
    const spy = jest.fn(async () => undefined)
    const r = Ok<number, string>(1).tap(spy)
    await expect(r.unwrapOr(0)).resolves.toBe(1)
    expect(spy).toHaveBeenCalledWith(1)
  })

  test('tapErr with an async fn returns a ResultAsync and runs the effect', async () => {
    const spy = jest.fn(async () => undefined)
    const r = Err<string, number>('e').tapErr(spy)
    await expect(r.match({ ok: () => '', err: (e) => e })).resolves.toBe('e')
    expect(spy).toHaveBeenCalledWith('e')
  })

  test('zip promotes when the other side is async', async () => {
    const r = Ok<number, string>(1).zip(OkAsync<string, string>('x'))
    await expect(r.unwrapOr([0, ''])).resolves.toEqual([1, 'x'])
  })

  test('zip promotes when the other side is a Promise<Result>', async () => {
    const r = Ok<number, string>(1).zip(Promise.resolve(Ok<string, string>('y')))
    await expect(r.unwrapOr([0, ''])).resolves.toEqual([1, 'y'])
  })

  test('async-typed chain on an Err short-circuits and is still awaitable', async () => {
    const r = Err<string, number>('e').map(async (x) => x * 2)
    const res = await r
    expect(res.isErr()).toBe(true)
    // `await` is the supported terminal form and tolerates the synchronous short-circuit.
    expect(await r.unwrapOr(0)).toBe(0)
  })

  test('mixed sync/async chain reads top-to-bottom', async () => {
    const r = Ok<number, string>(2)
      .map((x) => x + 1)
      .map(async (x) => x * 10)
      .andThen((x) => (x > 20 ? Ok<number, string>(x) : Err<string, number>('small')))
    await expect(r.unwrapOr(0)).resolves.toBe(30)
  })
})

describe('auto-promotion: Option becomes OptionAsync on async callbacks', () => {
  test('map with an async fn returns an OptionAsync', async () => {
    const o = Some(5).map(async (x) => x * 2)
    expect(isOptionAsync(o)).toBe(true)
    await expect(o.unwrapOr(0)).resolves.toBe(10)
  })

  test('andThen promotes on OptionAsync and Promise<Option>', async () => {
    const a = Some(5).andThen((x) => SomeAsync(x + 1))
    await expect(a.unwrapOr(0)).resolves.toBe(6)
    const b = Some(5).andThen(async (x) => Some(x + 2))
    await expect(b.unwrapOr(0)).resolves.toBe(7)
  })

  test('filter with an async predicate returns an OptionAsync', async () => {
    const pass = Some(42).filter(async (x) => x > 0)
    await expect(pass.unwrapOr(0)).resolves.toBe(42)
    const fail = Some(42).filter(async (x) => x < 0)
    await expect(fail.isNone()).resolves.toBe(true)
  })

  test('orElse promotes when fn returns an async fallback', async () => {
    const o = None<number>().orElse(() => SomeAsync(99))
    await expect(o.unwrapOr(0)).resolves.toBe(99)
    const viaPromise = None<number>().orElse(async () => Some(7))
    await expect(viaPromise.unwrapOr(0)).resolves.toBe(7)
  })

  test('tap with an async fn returns an OptionAsync', async () => {
    const spy = jest.fn(async () => undefined)
    const o = Some(1).tap(spy)
    await expect(o.unwrapOr(0)).resolves.toBe(1)
    expect(spy).toHaveBeenCalledWith(1)
  })

  test('zip promotes on async and Promise<Option> others', async () => {
    const a = Some(1).zip(SomeAsync('x'))
    await expect(a.unwrapOr([0, ''])).resolves.toEqual([1, 'x'])
    const b = Some(1).zip(Promise.resolve(Some('y')))
    await expect(b.unwrapOr([0, ''])).resolves.toEqual([1, 'y'])
  })
})

describe('flatten across async/sync boundaries', () => {
  test('ResultAsync.flatten unwraps a nested sync Result', async () => {
    await expect(OkAsync<Result<number, string>, string>(Ok(42)).flatten().unwrapOr(0)).resolves.toBe(42)
  })

  test('OptionAsync.flatten unwraps a nested sync Option', async () => {
    await expect(SomeAsync(Some(42)).flatten().unwrapOr(0)).resolves.toBe(42)
  })

  test('flatten on a plain (non-wrapped) async value is a no-op', async () => {
    await expect(OkAsync<number, string>(42).flatten().unwrapOr(0)).resolves.toBe(42)
    await expect(SomeAsync(42).flatten().unwrapOr(0)).resolves.toBe(42)
  })

  test('flatten unwraps a nested async inside async', async () => {
    await expect(OkAsync<ResultAsync<number, string>, string>(OkAsync(42)).flatten().unwrapOr(0)).resolves.toBe(42)
    await expect(SomeAsync(SomeAsync(42)).flatten().unwrapOr(0)).resolves.toBe(42)
  })

  test('flatten short-circuits on an empty/error async value', async () => {
    await expect(ErrAsync<string, number>('e').flatten().match({ ok: () => '', err: (e) => e })).resolves.toBe('e')
    await expect(NoneAsync<number>().flatten().isNone()).resolves.toBe(true)
  })

  test('flatten unwraps an async instance stored inside (via andThen)', async () => {
    const oa = Some(1).andThen(async () => Some(SomeAsync(2)))
    await expect(oa.flatten().unwrapOr(0)).resolves.toBe(2)
    const ra = Ok<number, string>(1).andThen(async () => Ok<ResultAsync<number, string>, string>(OkAsync(2)))
    await expect(ra.flatten().unwrapOr(0)).resolves.toBe(2)
  })
})

describe('combine', () => {
  test('Result.combine returns Ok with all values or the first Err', () => {
    expect(Result.combine([Ok(1), Ok(2), Ok(3)]).unwrapOr([])).toEqual([1, 2, 3])
    const withErr = Result.combine([Ok<number, string>(1), Err<string, number>('x'), Ok<number, string>(3)])
    expect(withErr.match({ ok: () => 'ok', err: (e) => e })).toBe('x')
  })

  test('Result.combineWithAllErrors accumulates every error', () => {
    const r = Result.combineWithAllErrors([
      Ok<number, string>(1),
      Err<string, number>('a'),
      Err<string, number>('b'),
    ])
    expect(r.match({ ok: () => [], err: (e) => e })).toEqual(['a', 'b'])
    const allOk = Result.combineWithAllErrors([Ok<number, string>(1), Ok<number, string>(2)])
    expect(allOk.unwrapOr([])).toEqual([1, 2])
  })

  test('Option.combine returns Some with all values or None', () => {
    expect(Option.combine([Some(1), Some(2)]).unwrapOr([])).toEqual([1, 2])
    expect(Option.combine([Some(1), None<number>()]).isNone()).toBe(true)
  })

  test('ResultAsync.combine mixes sync and async inputs', async () => {
    const combined = ResultAsync.combine([OkAsync<number, string>(1), Ok<number, string>(2), OkAsync<number, string>(3)])
    await expect(combined.unwrapOr([])).resolves.toEqual([1, 2, 3])
    const withErr = ResultAsync.combine([OkAsync<number, string>(1), ErrAsync<string, number>('x')])
    await expect(withErr.match({ ok: () => 'ok', err: (e) => e })).resolves.toBe('x')
  })

  test('ResultAsync.combineWithAllErrors accumulates errors across async inputs', async () => {
    const r = ResultAsync.combineWithAllErrors([
      Ok<number, string>(1), // sync input mixed in
      ErrAsync<string, number>('a'),
      ErrAsync<string, number>('b'),
    ])
    await expect(r.match({ ok: () => [], err: (e) => e })).resolves.toEqual(['a', 'b'])
  })

  test('OptionAsync.combine mixes sync and async inputs', async () => {
    const combined = OptionAsync.combine([SomeAsync(1), Some(2)])
    await expect(combined.unwrapOr([])).resolves.toEqual([1, 2])
    const withNone = OptionAsync.combine([SomeAsync(1), NoneAsync<number>()])
    await expect(withNone.isNone()).resolves.toBe(true)
  })
})

describe('unsafe escape hatches', () => {
  test('Result.unwrap / unwrapErr', () => {
    expect(Ok(42).unwrap()).toBe(42)
    expect(() => Err('boom').unwrap()).toThrow('Called unwrap() on an Err value: boom')
    expect(Err('boom').unwrapErr()).toBe('boom')
    expect(() => Ok(42).unwrapErr()).toThrow('Called unwrapErr() on an Ok value: 42')
  })

  test('Result.expect / expectErr', () => {
    expect(Ok(42).expect('nope')).toBe(42)
    expect(() => Err('boom').expect('must be ok')).toThrow('must be ok')
    expect(Err('boom').expectErr('nope')).toBe('boom')
    expect(() => Ok(42).expectErr('must be err')).toThrow('must be err')
  })

  test('Option.unwrap / expect', () => {
    expect(Some(42).unwrap()).toBe(42)
    expect(() => None().unwrap()).toThrow('Called unwrap() on a None value')
    expect(Some(42).expect('nope')).toBe(42)
    expect(() => None().expect('must be some')).toThrow('must be some')
  })

  test('ResultAsync.unwrap / unwrapErr / expect / expectErr', async () => {
    await expect(OkAsync<number, string>(42).unwrap()).resolves.toBe(42)
    await expect(ErrAsync<string, number>('boom').unwrap()).rejects.toThrow('boom')
    await expect(ErrAsync<string, number>('boom').unwrapErr()).resolves.toBe('boom')
    await expect(OkAsync<number, string>(1).unwrapErr()).rejects.toThrow()
    await expect(OkAsync<number, string>(42).expect('nope')).resolves.toBe(42)
    await expect(ErrAsync<string, number>('boom').expect('must be ok')).rejects.toThrow('must be ok')
    await expect(ErrAsync<string, number>('boom').expectErr('nope')).resolves.toBe('boom')
    await expect(OkAsync<number, string>(1).expectErr('must be err')).rejects.toThrow('must be err')
  })

  test('OptionAsync.unwrap / expect', async () => {
    await expect(SomeAsync(42).unwrap()).resolves.toBe(42)
    await expect(NoneAsync<number>().unwrap()).rejects.toThrow('Called unwrap() on a None value')
    await expect(SomeAsync(42).expect('nope')).resolves.toBe(42)
    await expect(NoneAsync<number>().expect('must be some')).rejects.toThrow('must be some')
  })
})

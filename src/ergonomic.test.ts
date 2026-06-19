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

// Invoke an object's Node `util.inspect` custom hook directly (no @types/node needed).
const nodeInspect = (x: unknown): string =>
  (x as Record<symbol, () => string>)[Symbol.for('nodejs.util.inspect.custom')]()

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
  test('Result.combine preserves heterogeneous tuple types', () => {
    const combined = Result.combine([Ok(1), Ok('a'), Ok(true)])
    const tuple: [number, string, boolean] = combined.unwrap() // compile-checks tuple typing
    expect(tuple).toEqual([1, 'a', true])
  })

  test('Result.combine short-circuits on the first Err', () => {
    const withErr = Result.combine([Ok<number, string>(1), Err<string, number>('x'), Ok<number, string>(3)])
    expect(withErr.match({ ok: () => 'ok', err: (e) => e })).toBe('x')
  })

  test('Result.combine supports a record/object form', () => {
    const combined = Result.combine({ id: Ok(1), name: Ok('a') })
    const obj: { id: number; name: string } = combined.unwrap()
    expect(obj).toEqual({ id: 1, name: 'a' })
    const withErr = Result.combine({ id: Ok<number, string>(1), name: Err<string, number>('bad') })
    expect(withErr.match({ ok: () => 'ok', err: (e) => e })).toBe('bad')
  })

  test('Result.combineWithAllErrors accumulates every error', () => {
    const r = Result.combineWithAllErrors([Ok<number, string>(1), Err<string, number>('a'), Err<string, number>('b')])
    expect(r.match({ ok: () => [], err: (e) => e })).toEqual(['a', 'b'])
    const allOk = Result.combineWithAllErrors([Ok<number, string>(1), Ok<number, string>(2)])
    expect(allOk.unwrap()).toEqual([1, 2])
  })

  test('Result.combineWithAllErrors supports the record form', () => {
    const r = Result.combineWithAllErrors({ a: Err<string, number>('a'), b: Ok<number, string>(2) })
    expect(r.match({ ok: () => [], err: (e) => e })).toEqual(['a'])
    const allOk = Result.combineWithAllErrors({ a: Ok<number, string>(1), b: Ok<number, string>(2) })
    expect(allOk.unwrap()).toEqual({ a: 1, b: 2 })
  })

  test('Option.combine preserves tuples and supports records', () => {
    const tuple: [number, string] = Option.combine([Some(1), Some('a')]).unwrap()
    expect(tuple).toEqual([1, 'a'])
    expect(Option.combine([Some(1), None<number>()]).isNone()).toBe(true)
    const obj: { id: number; name: string } = Option.combine({ id: Some(1), name: Some('a') }).unwrap()
    expect(obj).toEqual({ id: 1, name: 'a' })
    expect(Option.combine({ id: Some(1), name: None<string>() }).isNone()).toBe(true)
  })

  test('ResultAsync.combine mixes sync and async inputs and preserves tuples', async () => {
    const combined = ResultAsync.combine([OkAsync(1), Ok('a'), OkAsync(true)])
    const tuple: [number, string, boolean] = await combined.unwrap()
    expect(tuple).toEqual([1, 'a', true])
    const withErr = ResultAsync.combine([OkAsync<number, string>(1), ErrAsync<string, number>('x')])
    await expect(withErr.match({ ok: () => 'ok', err: (e) => e })).resolves.toBe('x')
  })

  test('ResultAsync.combine supports the record form', async () => {
    const combined = ResultAsync.combine({ id: OkAsync(1), name: Ok('a') })
    const obj: { id: number; name: string } = await combined.unwrap()
    expect(obj).toEqual({ id: 1, name: 'a' })
  })

  test('ResultAsync.combineWithAllErrors accumulates errors across async inputs', async () => {
    const r = ResultAsync.combineWithAllErrors([
      Ok<number, string>(1), // sync input mixed in
      ErrAsync<string, number>('a'),
      ErrAsync<string, number>('b'),
    ])
    await expect(r.match({ ok: () => [], err: (e) => e })).resolves.toEqual(['a', 'b'])
    const r2 = ResultAsync.combineWithAllErrors({ a: ErrAsync<string, number>('a'), b: OkAsync(2) })
    await expect(r2.match({ ok: () => [], err: (e) => e })).resolves.toEqual(['a'])
  })

  test('OptionAsync.combine mixes sync and async inputs and supports records', async () => {
    const tuple: [number, string] = await OptionAsync.combine([SomeAsync(1), Some('a')]).unwrap()
    expect(tuple).toEqual([1, 'a'])
    const withNone = OptionAsync.combine([SomeAsync(1), NoneAsync<number>()])
    await expect(withNone.isNone()).resolves.toBe(true)
    const obj: { id: number; name: string } = await OptionAsync.combine({ id: SomeAsync(1), name: Some('a') }).unwrap()
    expect(obj).toEqual({ id: 1, name: 'a' })
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

describe('type-narrowing guards', () => {
  test('isOk narrows and exposes value; isErr narrows and exposes error', () => {
    const ok: Result<number, string> = Ok(42)
    if (ok.isOk()) {
      const v: number = ok.value // compile-checks narrowing to T
      expect(v).toBe(42)
    } else {
      throw new Error('expected Ok')
    }

    const err: Result<number, string> = Err('boom')
    if (err.isErr()) {
      const e: string = err.error // compile-checks narrowing to E
      expect(e).toBe('boom')
    } else {
      throw new Error('expected Err')
    }
  })

  test('isSome narrows and exposes value', () => {
    const some: Option<number> = Some(7)
    if (some.isSome()) {
      const v: number = some.value
      expect(v).toBe(7)
    } else {
      throw new Error('expected Some')
    }
  })

  test('value/error are readable (as T | undefined) without narrowing', () => {
    expect(Ok<number, string>(1).value).toBe(1)
    expect(Ok<number, string>(1).error).toBeUndefined()
    expect(Err<string, number>('x').error).toBe('x')
    expect(Some(1).value).toBe(1)
    expect(None<number>().value).toBeUndefined()
  })
})

describe('mapOr / mapOrElse', () => {
  test('Result', () => {
    expect(Ok<number, string>(2).mapOr(0, (x) => x * 10)).toBe(20)
    expect(Err<string, number>('e').mapOr(0, (x) => x * 10)).toBe(0)
    expect(Ok<number, string>(2).mapOrElse((e) => e.length, (x) => x * 10)).toBe(20)
    expect(Err<string, number>('boom').mapOrElse((e) => e.length, (x) => x * 10)).toBe(4)
  })

  test('Option', () => {
    expect(Some(2).mapOr(0, (x) => x * 10)).toBe(20)
    expect(None<number>().mapOr(0, (x) => x * 10)).toBe(0)
    expect(Some(2).mapOrElse(() => -1, (x) => x * 10)).toBe(20)
    expect(None<number>().mapOrElse(() => -1, (x) => x * 10)).toBe(-1)
  })

  test('ResultAsync / OptionAsync', async () => {
    await expect(OkAsync<number, string>(2).mapOr(0, (x) => x * 10)).resolves.toBe(20)
    await expect(ErrAsync<string, number>('e').mapOr(0, (x) => x * 10)).resolves.toBe(0)
    await expect(OkAsync<number, string>(2).mapOrElse((e) => e.length, (x) => x * 10)).resolves.toBe(20)
    await expect(ErrAsync<string, number>('boom').mapOrElse((e) => e.length, (x) => x * 10)).resolves.toBe(4)
    await expect(SomeAsync(2).mapOr(0, (x) => x * 10)).resolves.toBe(20)
    await expect(NoneAsync<number>().mapOr(0, (x) => x * 10)).resolves.toBe(0)
    await expect(SomeAsync(2).mapOrElse(() => -1, (x) => x * 10)).resolves.toBe(20)
    await expect(NoneAsync<number>().mapOrElse(() => -1, (x) => x * 10)).resolves.toBe(-1)
  })
})

describe('fromThrowable', () => {
  test('Result.fromThrowable wraps a sync throwing function', () => {
    const safeParse = Result.fromThrowable(
      (s: string) => JSON.parse(s) as { a: number },
      (e) => `bad: ${String(e)}`
    )
    expect(safeParse('{"a":1}').unwrap()).toEqual({ a: 1 })
    expect(safeParse('nope').isErr()).toBe(true)
  })

  test('ResultAsync.fromThrowable wraps an async throwing function', async () => {
    const safe = ResultAsync.fromThrowable(
      async (n: number) => {
        if (n < 0) throw new Error('neg')
        return n * 2
      },
      (e) => `bad: ${(e as Error).message}`
    )
    await expect(safe(5).unwrap()).resolves.toBe(10)
    await expect(safe(-1).match({ ok: () => '', err: (e) => e })).resolves.toBe('bad: neg')
  })
})

describe('inspect / inspectErr', () => {
  test('Result.inspect / inspectErr (sync) run effects and pass through', () => {
    const seen: number[] = []
    expect(Ok<number, string>(1).inspect((v) => void seen.push(v)).unwrap()).toBe(1)
    expect(seen).toEqual([1])
    const errs: string[] = []
    expect(Err<string, number>('x').inspectErr((e) => void errs.push(e)).isErr()).toBe(true)
    expect(errs).toEqual(['x'])
    const spy = jest.fn()
    Err<string, number>('x').inspect(spy)
    Ok<number, string>(1).inspectErr(spy)
    expect(spy).not.toHaveBeenCalled()
  })

  test('Result.inspect / inspectErr promote to async', async () => {
    const seen: number[] = []
    await expect(Ok<number, string>(1).inspect(async (v) => void seen.push(v)).unwrapOr(0)).resolves.toBe(1)
    const errs: string[] = []
    await expect(
      Err<string, number>('x').inspectErr(async (e) => void errs.push(e)).match({ ok: () => '', err: (e) => e })
    ).resolves.toBe('x')
    expect(seen).toEqual([1])
    expect(errs).toEqual(['x'])
  })

  test('Option.inspect runs and passes through (sync + async)', async () => {
    const seen: number[] = []
    expect(Some(1).inspect((v) => void seen.push(v)).unwrap()).toBe(1)
    const spy = jest.fn()
    None<number>().inspect(spy)
    expect(spy).not.toHaveBeenCalled()
    await expect(Some(2).inspect(async (v) => void seen.push(v)).unwrapOr(0)).resolves.toBe(2)
    expect(seen).toEqual([1, 2])
  })

  test('async inspect / inspectErr aliases', async () => {
    const seen: number[] = []
    await expect(OkAsync<number, string>(1).inspect((v) => void seen.push(v)).unwrapOr(0)).resolves.toBe(1)
    const errs: string[] = []
    await expect(
      ErrAsync<string, number>('x').inspectErr((e) => void errs.push(e)).match({ ok: () => '', err: (e) => e })
    ).resolves.toBe('x')
    await expect(SomeAsync(3).inspect((v) => void seen.push(v)).unwrapOr(0)).resolves.toBe(3)
    expect(seen).toEqual([1, 3])
    expect(errs).toEqual(['x'])
  })
})

describe('pretty-printing (toString / toJSON / inspect)', () => {
  test('Result toString / toJSON', () => {
    expect(Ok(42).toString()).toBe('Ok(42)')
    expect(Err('boom').toString()).toBe('Err("boom")')
    expect(Ok({ a: 1 }).toString()).toBe('Ok({"a":1})')
    expect(Ok(null).toString()).toBe('Ok(null)')
    expect(Ok(42).toJSON()).toEqual({ type: 'Ok', value: 42 })
    expect(Err('boom').toJSON()).toEqual({ type: 'Err', error: 'boom' })
  })

  test('Option toString / toJSON', () => {
    expect(Some(42).toString()).toBe('Some(42)')
    expect(None().toString()).toBe('None')
    expect(Some(42).toJSON()).toEqual({ type: 'Some', value: 42 })
    expect(None().toJSON()).toEqual({ type: 'None' })
  })

  test('display falls back to String() on a non-serializable value', () => {
    const circular: { self?: unknown } = {}
    circular.self = circular
    expect(Ok(circular).toString()).toBe('Ok([object Object])')
  })

  test('Node inspect hook prints the compact form', () => {
    expect(nodeInspect(Ok(42))).toBe('Ok(42)')
    expect(nodeInspect(Err('boom'))).toBe('Err("boom")')
    expect(nodeInspect(Some(1))).toBe('Some(1)')
    expect(nodeInspect(None())).toBe('None')
    expect(nodeInspect(OkAsync(1))).toBe('ResultAsync(<pending>)')
    expect(nodeInspect(SomeAsync(1))).toBe('OptionAsync(<pending>)')
  })

  test('async toString shows a pending marker', () => {
    expect(String(OkAsync(1))).toBe('ResultAsync(<pending>)')
    expect(String(SomeAsync(1))).toBe('OptionAsync(<pending>)')
  })
})

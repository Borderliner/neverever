# neverever

`neverever` is a zero-dependency TypeScript library for safe and expressive data handling. It provides enhanced `Option<T>` and `Result<T, E>` types, inspired by functional programming, for managing optional values and success/error outcomes. With support for both synchronous and asynchronous workflows, chainable methods, and utility functions, it’s a robust alternative to libraries like `neverthrow`. Use it to eliminate null checks, simplify error handling, and streamline data transformations.

## Installation

Install `neverever` via (p)npm:

```bash
npm install neverever
```

Ensure TypeScript is installed and configured. Add the following to your `tsconfig.json` for optimal compatibility:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Node"
  }
}
```

Import the library in your TypeScript or JavaScript files:

```typescript
import { ok, some, pipe } from 'neverever';
```

## Core Concepts

### Option and OptionAsync

`Option<T>` represents a value that may or may not exist:
- `Some<T>`: Contains a value of type `T`.
- `None`: Represents the absence of a value.

`OptionAsync<T>` extends this for asynchronous operations, wrapping a `Promise<Option<T>>`. Use these to safely handle nullable or undefined values without explicit checks.

### Result and ResultAsync

`Result<T, E>` represents a computation that may succeed or fail:
- `Ok<T>`: Contains a successful value of type `T`.
- `Err<E>`: Contains an error of type `E`.

`ResultAsync<T, E>` handles asynchronous computations, wrapping a `Promise<Result<T, E>>`. These are ideal for robust error handling without try-catch blocks.

### Pipe Utility

The `pipe` function composes functions in a pipeline, supporting both synchronous and asynchronous operations. It’s perfect for chaining transformations with `Option` and `Result` types.

## Usage

Below are detailed examples for each component. All examples assume `neverever` is imported.

### Option

`Option<T>` provides methods to safely handle optional values.

#### Creating Options

```typescript
import { some, none, from, tryOption } from 'neverever';

// Create a Some value
const opt1 = some(42);
console.log(opt1.unwrapOr(0)); // 42

// Create a None value
const opt2 = none<string>();
console.log(opt2.unwrapOr('default')); // 'default'

// Create from nullable value
const opt3 = from(null);
console.log(opt3.unwrapOr('value')); // 'value'

// Create from a potentially throwing function
const opt4 = tryOption(() => JSON.parse('{"key": "value"}').key, console.error);
console.log(opt4.unwrapOr('')); // 'value'
```

#### Transforming Options

```typescript
import { some } from 'neverever';

const opt = some(5);
const mapped = opt.map(n => n * 2);
console.log(mapped.unwrapOr(0)); // 10

const chained = opt.andThen(n => n > 0 ? some(n + 10) : none());
console.log(chained.unwrapOr(0)); // 15

const filtered = opt.filter(n => n > 0);
console.log(filtered.unwrapOr(0)); // 5
```

#### Combining and Flattening Options

```typescript
import { some, none } from 'neverever';

const opt1 = some('hello');
const opt2 = some(42);
const zipped = opt1.zip(opt2);
console.log(zipped.unwrapOr(['', 0])); // ['hello', 42]

const nested = some(some(42));
console.log(nested.flatten().unwrapOr(0)); // 42

const sequenced = opt1.sequence();
console.log(sequenced.unwrapOr([])); // ['hello']
```

#### Pattern Matching

```typescript
import { some, none } from 'neverever';

const opt = some(42);
const result = opt.match({
  some: value => `Value: ${value}`,
  none: () => 'No value'
});
console.log(result); // 'Value: 42'

console.log(none<number>().match({ some: v => v, none: () => 0 })); // 0
```

### OptionAsync

`OptionAsync<T>` handles asynchronous optional values.

#### Creating OptionAsync

```typescript
import { OptionAsync } from 'neverever';

// Create a Some value
const opt1 = OptionAsync.some(Promise.resolve('hello'));
console.log(await opt1.unwrapOr('')); // 'hello'

// Create a None value
const opt2 = OptionAsync.none<string>();
console.log(await opt2.unwrapOr('default')); // 'default'

// Create from Promise
const opt3 = OptionAsync.from(Promise.resolve('async'));
console.log(await opt3.unwrapOr('')); // 'async'

// Create from a throwing async function
const opt4 = OptionAsync.try(async () => (await fetch('https://api.example.com')).json());
console.log(await opt4.unwrapOr({})); // JSON or {}
```

#### Transforming OptionAsync

```typescript
import { OptionAsync } from 'neverever';

const opt = OptionAsync.some(5);
const mapped = await opt.map(async n => n * 2);
console.log(mapped.unwrapOr(0)); // 10

const chained = await opt.andThen(async n => n > 0 ? some(n + 10) : none());
console.log(chained.unwrapOr(0)); // 15

const filtered = await opt.filter(async n => n > 0);
console.log(filtered.unwrapOr(0)); // 5
```

#### Combining OptionAsync

```typescript
import { OptionAsync, some } from 'neverever';

const opt1 = OptionAsync.some('hello');
const opt2 = some(42);
const zipped = await opt1.zip(opt2);
console.log(zipped.unwrapOr(['', 0])); // ['hello', 42]

const asyncZipped = await opt1.zip(OptionAsync.some(100));
console.log(asyncZipped.unwrapOr(['', 0])); // ['hello', 100]
```

### Result

`Result<T, E>` handles synchronous success or error outcomes.

#### Creating Results

```typescript
import { ok, err, fromThrowable } from 'neverever';

// Create an Ok value
const result1 = ok<string, string>('success');
console.log(result1.unwrapOr('')); // 'success'

// Create an Err value
const result2 = err<string, string>('failed');
console.log(result2.unwrapOr('default')); // 'default'

// Create from a function
const result3 = fromThrowable(
  () => JSON.parse('{"key": "value"}').key,
  e => (e instanceof Error ? e.message : 'Unknown error')
);
console.log(result3.unwrapOr('')); // 'value'
```

#### Transforming Results

```typescript
import { ok } from 'neverever';

const result = ok<number, string>(10);
const mapped = result.map(n => n * 2);
console.log(mapped.unwrapOr(0)); // 20

const filtered = result.filter(n => n > 5, 'Too small');
console.log(filtered.unwrapOr(0)); // 10

const recovered = result.recover(e => 0);
console.log(recovered.unwrapOr(-1)); // 10
```

#### Combining Results

```typescript
import { ok, err } from 'neverever';

const result1 = ok<string, string>('hello');
const result2 = ok<number, string>(42);
const zipped = result1.zip(result2);
console.log(zipped.unwrapOr(['', 0])); // ['hello', 42]

console.log(result1.zip(err<number, string>('failed')).unwrapOr(['', 0])); // ['', 0]
```

### ResultAsync

`ResultAsync<T, E>` handles asynchronous success or error outcomes.

#### Creating ResultAsync

```typescript
import { okAsync, errAsync, fromAsyncThrowable } from 'neverever';

// Create an Ok value
const result1 = okAsync<string, string>(Promise.resolve('success'));
console.log(await result1.unwrapOr('')); // 'success'

// Create an Err value
const result2 = errAsync<string, string>('failed');
console.log(await result2.unwrapOr('default')); // 'default'

// Create from an async function
const result3 = fromAsyncThrowable(
  async () => (await fetch('https://api.example.com')).json(),
  e => 'Fetch error'
);
console.log(await result3.unwrapOr({})); // JSON or {}
```

#### Transforming ResultAsync

```typescript
import { okAsync } from 'neverever';

const result = okAsync<number, string>(10);
const mapped = await result.map(async n => n * 2);
console.log(await mapped.unwrapOr(0)); // 20

const filtered = await result.filter(async n => n > 5, 'Too small');
console.log(await filtered.unwrapOr(0)); // 10

const recovered = await result.recover(async e => 0);
console.log(await recovered.unwrapOr(-1)); // 10
```

#### Combining ResultAsync

```typescript
import { okAsync, ok } from 'neverever';

const result1 = okAsync<string, string>('hello');
const result2 = ok<number, string>(42);
const zipped = await result1.zip(result2);
console.log(await zipped.unwrapOr(['', 0])); // ['hello', 42]

const asyncZipped = await result1.zip(okAsync<number, string>(100));
console.log(await asyncZipped.unwrapOr(['', 0])); // ['hello', 100]
```

### Pipe Utility

The `pipe` function composes functions in a pipeline, handling both synchronous and asynchronous operations.

#### Synchronous Pipeline

```typescript
import { pipe } from 'neverever';

const result = pipe(
  5,
  (n: number) => n * 2,
  (n: number) => n + 10
);
console.log(result); // 20
```

#### Asynchronous Pipeline

```typescript
import { pipe } from 'neverever';

const result = pipe(
  'hello',
  async (s: string) => s.toUpperCase(),
  (s: string) => s + '!'
);
console.log(await result); // 'HELLO!'
```

#### Pipeline with Option

```typescript
import { pipe, some } from 'neverever';

const result = pipe(
  some(5),
  (opt: OptionLike<number>) => opt.map(n => n * 2),
  async (opt: OptionLike<number>) => opt.map(n => n + 10)
);
console.log(await (await result).unwrapOr(0)); // 20
```

#### Pipeline with Result

```typescript
import { pipe, ok } from 'neverever';

const result = pipe(
  ok<string, string>('data'),
  (res: ResultLike<string, string>) => res.map(s => s.toUpperCase()),
  async (res: ResultLike<string, string>) => res.map(s => s + '!')
);
console.log(await (await result).unwrapOr('')); // 'DATA!'
```

### Type Utilities

`neverever` provides utility types for enhanced type safety.

#### Unwrap

Extracts the inner type of a `Promise`, `Option`, or `Result`.

```typescript
import { Unwrap, ok, some } from 'neverever';

type PromiseType = Unwrap<Promise<string>>; // string
type OptionType = Unwrap<Option<number>>; // number
type ResultType = Unwrap<Result<boolean, string>>; // boolean

const value: OptionType = some(42).unwrapOr(0);
console.log(value); // 42
```

#### MaybePromise

Represents a value that may be synchronous or a `Promise`.

```typescript
import { MaybePromise, OptionAsync } from 'neverever';

function processValue(value: MaybePromise<string>): OptionAsync<string> {
  return OptionAsync.from(value);
}
console.log(await processValue('hello').unwrapOr('')); // 'hello'
console.log(await processValue(Promise.resolve('world')).unwrapOr('')); // 'world'
```

#### OptionLike and ResultLike

Allow functions to accept `Option` or `Result`, including their async variants or promises.

```typescript
import { OptionLike, ResultLike, some, ok } from 'neverever';

async function processOption<T>(opt: OptionLike<T>): Promise<T> {
  const option = await (opt instanceof Promise ? opt : opt);
  return option.unwrapOr(undefined as T);
}
console.log(await processOption(some('hello'))); // 'hello'

async function processResult<T, E>(res: ResultLike<T, E>): Promise<T> {
  const result = await (res instanceof Promise ? res : res);
  return result.unwrapOr(undefined as T);
}
console.log(await processResult(ok<string, string>('data'))); // 'data'
```

## API Reference

Generate detailed API documentation using `typedoc`:

```bash
npx typedoc --entryPoints src --out docs
```

This creates HTML documentation from JSDoc comments in the source files.

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Make changes and commit (`git commit -m 'Add your feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

Please ensure tests pass and add new tests for features or bug fixes.

## License

MIT License. See [LICENSE](LICENSE) for details.
Made with <3 by Mohammadreza Hajianpour

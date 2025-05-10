# neverever

`neverever` is a zero-dependency TypeScript library for safe handling of data in TypeScript. It provides enhanced `Option<T>` and `Result<T, E>` types for handling optional values and success/error outcomes, just like the `neverthrow` library with additional chainable methods and utilities. The library supports both synchronous and asynchronous workflows, making it ideal for robust error handling and data transformation.

## Installation

Install `neverever` via (p)npm:

```bash
npm install neverever
```

Ensure you have TypeScript installed and configured in your project. Add the following to your `tsconfig.json` for optimal compatibility:

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

The `Option<T>` type represents a value that may or may not be present:
- `Some<T>`: Contains a value of type `T`.
- `None`: Represents the absence of a value.

`OptionAsync<T>` extends this for asynchronous values, wrapping a `Promise<Option<T>>`. Use these to safely handle nullable or undefined values without explicit null checks.

### Result and ResultAsync

The `Result<T, E>` type represents a computation that may succeed or fail:
- `Ok<T>`: Contains a successful value of type `T`.
- `Err<E>`: Contains an error of type `E`.

`ResultAsync<T, E>` extends this for asynchronous computations, wrapping a `Promise<Result<T, E>>`. Use these for robust error handling without try-catch blocks.

### Pipe Utility

The `pipe` function composes functions in a pipeline, supporting both synchronous and asynchronous operations. It’s ideal for chaining transformations with `Option` and `Result` types.

## Usage

Below are detailed examples for each component of `neverever`. All examples are written in TypeScript and assume the package is imported as `neverever`.

### Option

`Option<T>` provides methods to safely handle optional values.

#### Creating Options

```typescript
import { some, none, from } from 'neverever';

// Create a Some value
const opt1 = some(42);
console.log(opt1.unwrapOr(0)); // 42

// Create a None value
const opt2 = none<string>();
console.log(opt2.unwrapOr('default')); // 'default'

// Create from nullable value
const opt3 = from(null);
console.log(opt3.unwrapOr('value')); // 'value'
```

#### Transforming Options

```typescript
import { some } from 'neverever';

const opt = some(5);
const mapped = opt.map(n => n * 2);
console.log(mapped.unwrapOr(0)); // 10

const chained = opt.andThen(n => some(n + 10));
console.log(chained.unwrapOr(0)); // 15
```

#### Combining Options

```typescript
import { some, none } from 'neverever';

const opt1 = some('hello');
const opt2 = some(42);
const zipped = opt1.zip(opt2);
console.log(zipped.unwrapOr(['', 0])); // ['hello', 42]

const zippedWithNone = opt1.zip(none<number>());
console.log(zippedWithNone.unwrapOr(['', 0])); // ['', 0]
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
const opt1 = OptionAsync.some('hello');
console.log(await opt1.unwrapOr('')); // 'hello'

// Create a None value
const opt2 = OptionAsync.none<string>();
console.log(await opt2.unwrapOr('default')); // 'default'

// Create from Promise
const opt3 = OptionAsync.from(Promise.resolve('async'));
console.log(await opt3.unwrapOr('')); // 'async'
```

#### Transforming OptionAsync

```typescript
import { OptionAsync } from 'neverever';

const opt = OptionAsync.some(5);
const mapped = await opt.map(async n => n * 2);
console.log(mapped.unwrapOr(0)); // 10

const chained = await opt.andThen(n => some(n + 10));
console.log(chained.unwrapOr(0)); // 15
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
import { ok, err, tryCatch } from 'neverever';

// Create an Ok value
const result1 = ok<string, string>('success');
console.log(result1.unwrapOr('')); // 'success'

// Create an Err value
const result2 = err<string, string>('failed');
console.log(result2.unwrapOr('default')); // 'default'

// Create from a function
const result3 = tryCatch(
  () => {
    if (Math.random() > 0.5) throw new Error('Failed');
    return 'success';
  },
  e => (e instanceof Error ? e.message : 'Unknown error')
);
console.log(result3.unwrapOr('')); // 'success' or ''
```

#### Transforming Results

```typescript
import { ok } from 'neverever';

const result = ok<number, string>(10);
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
import { okAsync, errAsync, tryCatch } from 'neverever';

// Create an Ok value
const result1 = okAsync<string, string>('success');
console.log(await result1.unwrapOr('')); // 'success'

// Create an Err value
const result2 = errAsync<string, string>('failed');
console.log(await result2.unwrapOr('default')); // 'default'

// Create from an async function
const result3 = tryCatch(
  async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return 'async';
  },
  e => 'Async error'
);
console.log(await result3.unwrapOr('')); // 'async' or ''
```

#### Transforming ResultAsync

```typescript
import { okAsync } from 'neverever';

const result = okAsync<number, string>(10);
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

The `pipe` function composes functions in a pipeline, supporting both synchronous and asynchronous operations.

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

`neverever` provides utility types to enhance type safety and flexibility.

#### Unwrap

Extracts the inner type of a Promise, Option, or Result.

```typescript
import { Unwrap, ok, some } from 'neverever';

type PromiseType = Unwrap<Promise<string>>; // string
type OptionType = Unwrap<Option<number>>; // number
type ResultType = Unwrap<Result<boolean, string>>; // boolean

const value: OptionType = some(42).unwrapOr(0);
console.log(value); // 42
```

#### MaybePromise

Represents a value that may be synchronous or a Promise.

```typescript
import { MaybePromise, OptionAsync } from 'neverever';

function processValue(value: MaybePromise<string>): OptionAsync<string> {
  return OptionAsync.from(value);
}
console.log(await processValue('hello').unwrapOr('')); // 'hello'
console.log(await processValue(Promise.resolve('world')).unwrapOr('')); // 'world'
```

#### OptionLike and ResultLike

Allow functions to accept Options or Results, including their async variants.

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

For detailed documentation, generate API docs using `typedoc`:

```bash
npx typedoc --entryPoints src --out docs
```

This will create HTML documentation from the JSDoc comments in the source files.

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Make your changes and commit (`git commit -m 'Add your feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License

MIT License. See [LICENSE](LICENSE) for details.
Made with <3 by Mohammadreza Hajianpour

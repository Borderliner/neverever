# neverever

`neverever` is a zero-dependency TypeScript library for safe and expressive data handling. It provides enhanced `Option<T>`, `OptionAsync<T>`, `Result<T, E>`, and `ResultAsync<T, E>` types, inspired by functional programming, to manage optional values and success/error outcomes. With support for synchronous and asynchronous workflows, chainable methods, and utility functions like `pipe`, it’s a robust alternative to libraries like `neverthrow`. Use it to eliminate null checks, simplify error handling, and streamline data transformations.

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
import { Option, Result, pipe } from 'neverever';
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

### Utility Functions

- `pipe`: Composes functions in a pipeline, supporting both synchronous and asynchronous operations.
- `unwrapMaybePromise`: Unwraps a `MaybePromise<T>` to a `Promise<T>` for consistent handling.

### Type Utilities

- `Unwrap<T>`: Extracts the inner type of a `Promise`, `Option`, or `Result`.
- `MaybePromise<T>`: Represents a value that is either synchronous or a `Promise`.
- `OptionLike<T>`: Represents an `Option<T>`, `OptionAsync<T>`, or `Promise<Option<T>>`.
- `ResultLike<T, E>`: Represents a `Result<T, E>`, `ResultAsync<T, E>`, or `Promise<Result<T, E>>`.

## Usage

Below are detailed examples for each component. All examples assume `neverever` is imported.

### Option

`Option<T>` provides methods to safely handle optional values.

#### Creating Options

```typescript
import { Option } from 'neverever';

// Create a Some value
const opt1 = Option.some(42);
console.log(opt1.unwrapOr(0)); // 42

// Create a None value
const opt2 = Option.none<string>();
console.log(opt2.unwrapOr('default')); // 'default'

// Create from nullable value
const opt3 = Option.from(null);
console.log(opt3.unwrapOr('value')); // 'value'

// Create from a potentially throwing function
const opt4 = Option.try(() => JSON.parse('{"key": "value"}').key);
console.log(opt4.unwrapOr('')); // 'value'
```

**Comparison**:
- `Option.some` vs. `Option.from`: Use `some` when you have a known value; use `from` to handle nullable values (`null` or `undefined`).
- `Option.from` vs. `Option.try`: Use `from` for simple null checks; use `try` for functions that might throw errors.

#### Transforming Options

```typescript
import { Option } from 'neverever';

const opt = Option.some(5);

// Map to transform the value
const mapped = opt.map(n => n * 2);
console.log(mapped.unwrapOr(0)); // 10

// Chain with another Option
const chained = opt.andThen(n => n > 0 ? Option.some(n + 10) : Option.none());
console.log(chained.unwrapOr(0)); // 15

// Filter based on a predicate
const filtered = opt.filter(n => n > 0);
console.log(filtered.unwrapOr(0)); // 5

// Tap to perform side effects
const tapped = opt.tap(n => console.log(`Value: ${n}`)); // Logs: Value: 5
console.log(tapped.unwrapOr(0)); // 5
```

**Comparison**:
- `map` vs. `andThen`: `map` transforms the value to a new type; `andThen` chains to another `Option`.
- `filter` vs. `andThen`: `filter` keeps or discards the value based on a predicate; `andThen` allows constructing a new `Option` based on the value.
- `tap` vs. `map`: `tap` is for side effects without changing the value; `map` transforms the value.

#### Combining and Flattening Options

```typescript
import { Option } from 'neverever';

const opt1 = Option.some('hello');
const opt2 = Option.some(42);

// Zip two Options into a tuple
const zipped = opt1.zip(opt2);
console.log(zipped.unwrapOr(['', 0])); // ['hello', 42]

// Flatten a nested Option
const nested = Option.some(Option.some(42));
console.log(nested.flatten().unwrapOr(0)); // 42

// Sequence to convert Option<T> to Option<T[]>
const sequenced = opt1.sequence();
console.log(sequenced.unwrapOr([])); // ['hello']
```

**Comparison**:
- `zip` vs. `andThen`: `zip` combines two `Option` values into a tuple; `andThen` chains to a single new `Option`.
- `flatten` vs. `sequence`: `flatten` unwraps nested `Option` types; `sequence` converts a value to an array, useful for collections.

#### Pattern Matching and Conversion

```typescript
import { Option } from 'neverever';

const opt = Option.some(42);

// Match to handle both cases
const result = opt.match({
  some: value => `Value: ${value}`,
  none: () => 'No value'
});
console.log(result); // 'Value: 42'

// Convert to Result
const res = opt.toResult('No value');
console.log(res.unwrapOr(0)); // 42

// Convert to OptionAsync
const asyncOpt = opt.toAsync();
console.log(await asyncOpt.unwrapOr(0)); // 42

// OrElse to provide a fallback
const fallback = Option.none<number>().orElse(() => Option.some(100));
console.log(fallback.unwrapOr(0)); // 100
```

**Comparison**:
- `match` vs. `unwrapOr`: `match` provides full control over both cases; `unwrapOr` provides a default value for `None`.
- `toResult` vs. `toAsync`: `toResult` converts to a `Result` with a specified error; `toAsync` converts to `OptionAsync` for async workflows.

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
const opt4 = OptionAsync.try(async () => {
  const res = await fetch('https://jsonplaceholder.typicode.com/todos/1');
  return res.json();
});
console.log(await opt4.unwrapOr({})); // { id: 1, ... } or {}
```

**Comparison**:
- `OptionAsync.some` vs. `OptionAsync.from`: `some` wraps a value or promise; `from` handles nullable values or promises.
- `OptionAsync.from` vs. `OptionAsync.try`: `from` is for nullable promises; `try` handles async functions that might throw.

#### Transforming OptionAsync

```typescript
import { OptionAsync } from 'neverever';

const opt = OptionAsync.some(5);

// Map with async transformation
const mapped = opt.map(async n => n * 2);
console.log(await mapped.unwrapOr(0)); // 10

// Chain with another Option
const chained = opt.andThen(async n => n > 0 ? Option.some(n + 10) : Option.none());
console.log(await chained.unwrapOr(0)); // 15

// Filter with async predicate
const filtered = opt.filter(async n => n > 0);
console.log(await filtered.unwrapOr(0)); // 5

// Tap for async side effects
const tapped = opt.tap(async n => console.log(`Value: ${n}`)); // Logs: Value: 5
console.log(await tapped.unwrapOr(0)); // 5
```

**Comparison**:
- `map` vs. `andThen`: `map` transforms the value asynchronously; `andThen` chains to another `Option` or `OptionAsync`.
- `filter` vs. `map`: `filter` keeps or discards based on an async predicate; `map` transforms the value.
- `tap` vs. `map`: `tap` performs async side effects; `map` transforms the value.

#### Combining OptionAsync

```typescript
import { OptionAsync, Option } from 'neverever';

const opt1 = OptionAsync.some('hello');
const opt2 = Option.some(42);

// Zip with synchronous Option
const zipped = opt1.zip(opt2);
console.log(await zipped.unwrapOr(['', 0])); // ['hello', 42]

// Zip with another OptionAsync
const asyncZipped = opt1.zip(OptionAsync.some(100));
console.log(await asyncZipped.unwrapOr(['', 0])); // ['hello', 100]

// Flatten nested OptionAsync
const nested = OptionAsync.some(Option.some(42));
console.log(await nested.flatten().unwrapOr(0)); // 42

// Sequence to array
const sequenced = opt1.sequence();
console.log(await sequenced.unwrapOr([])); // ['hello']
```

**Comparison**:
- `zip` vs. `andThen`: `zip` combines two async or sync `Option` values; `andThen` chains to a single `Option`.
- `flatten` vs. `sequence`: `flatten` unwraps nested `Option` or `OptionAsync`; `sequence` converts to an array.

### Result

`Result<T, E>` handles synchronous success or error outcomes.

#### Creating Results

```typescript
import { Result } from 'neverever';

// Create an Ok value
const result1 = Result.ok<string, string>('success');
console.log(result1.unwrapOr('')); // 'success'

// Create an Err value
const result2 = Result.err<string, string>('failed');
console.log(result2.unwrapOr('default')); // 'default'

// Create from nullable value
const result3 = Result.from('value', 'No value');
console.log(result3.unwrapOr('')); // 'value'

// Create from a potentially throwing function
const result4 = Result.try(
  () => JSON.parse('{"key": "value"}').key,
  e => (e instanceof Error ? e.message : 'Unknown error')
);
console.log(result4.unwrapOr('')); // 'value'
```

**Comparison**:
- `Result.ok` vs. `Result.from`: `ok` is for known successful values; `from` handles nullable values with a fallback error.
- `Result.from` vs. `Result.try`: `from` is for simple null checks; `try` handles functions that might throw.

#### Transforming Results

```typescript
import { Result } from 'neverever';

const result = Result.ok<number, string>(10);

// Map to transform the value
const mapped = result.map(n => n * 2);
console.log(mapped.unwrapOr(0)); // 20

// Map error
const mappedErr = result.mapErr(e => `Error: ${e}`);
console.log(mappedErr.unwrapOr(0)); // 20

// Filter with error
const filtered = result.filter(n => n > 5, 'Too small');
console.log(filtered.unwrapOr(0)); // 10

// Recover from error
const errResult = Result.err<number, string>('failed');
const recovered = errResult.recover(e => 0);
console.log(recovered.unwrapOr(-1)); // 0

// Tap for side effects
const tapped = result.tap(n => console.log(`Value: ${n}`)); // Logs: Value: 10
console.log(tapped.unwrapOr(0)); // 10

// TapErr for error side effects
const tappedErr = errResult.tapErr(e => console.log(`Error: ${e}`)); // Logs: Error: failed
console.log(tappedErr.unwrapOr(0)); // 0
```

**Comparison**:
- `map` vs. `mapErr`: `map` transforms the success value; `mapErr` transforms the error.
- `filter` vs. `recover`: `filter` discards success values based on a predicate; `recover` provides a success value for errors.
- `tap` vs. `tapErr`: `tap` is for success side effects; `tapErr` is for error side effects.

#### Combining Results

```typescript
import { Result } from 'neverever';

const result1 = Result.ok<string, string>('hello');
const result2 = Result.ok<number, string>(42);

// Zip two Results
const zipped = result1.zip(result2);
console.log(zipped.unwrapOr(['', 0])); // ['hello', 42]

// Flatten nested Result
const nested = Result.ok<Result<number, string>, string>(Result.ok(42));
console.log(nested.flatten().unwrapOr(0)); // 42

// Sequence to array
const sequenced = result1.sequence();
console.log(sequenced.unwrapOr([])); // ['hello']
```

**Comparison**:
- `zip` vs. `andThen`: `zip` combines two `Result` values into a tuple; `andThen` chains to a new `Result`.
- `flatten` vs. `sequence`: `flatten` unwraps nested `Result` types; `sequence` converts to an array.

### ResultAsync

`ResultAsync<T, E>` handles asynchronous success or error outcomes.

#### Creating ResultAsync

```typescript
import { ResultAsync } from 'neverever';

// Create an Ok value
const result1 = ResultAsync.ok<string, string>(Promise.resolve('success'));
console.log(await result1.unwrapOr('')); // 'success'

// Create an Err value
const result2 = ResultAsync.err<string, string>('failed');
console.log(await result2.unwrapOr('default')); // 'default'

// Create from Promise
const result3 = ResultAsync.from(Promise.resolve('value'), 'No value');
console.log(await result3.unwrapOr('')); // 'value'

// Create from an async function
const result4 = ResultAsync.try(
  async () => (await fetch('https://jsonplaceholder.typicode.com/todos/1')).json(),
  e => 'Fetch error'
);
console.log(await result4.unwrapOr({})); // { id: 1, ... } or {}
```

**Comparison**:
- `ResultAsync.ok` vs. `ResultAsync.from`: `ok` wraps a success value or promise; `from` handles nullable values or promises with an error.
- `ResultAsync.from` vs. `ResultAsync.try`: `from` is for nullable promises; `try` handles async functions that might throw.

#### Transforming ResultAsync

```typescript
import { ResultAsync } from 'neverever';

const result = ResultAsync.ok<number, string>(10);

// Map with async transformation
const mapped = result.map(async n => n * 2);
console.log(await mapped.unwrapOr(0)); // 20

// Map error
const mappedErr = result.mapErr(async e => `Error: ${e}`);
console.log(await mappedErr.unwrapOr(0)); // 20

// Filter with async predicate
const filtered = result.filter(async n => n > 5, 'Too small');
console.log(await filtered.unwrapOr(0)); // 10

// Tap for async side effects
const tapped = result.tap(async n => console.log(`Value: ${n}`)); // Logs: Value: 10
console.log(await tapped.unwrapOr(0)); // 10

// TapErr for async error side effects
const errResult = ResultAsync.err<number, string>('failed');
const tappedErr = errResult.tapErr(async e => console.log(`Error: ${e}`)); // Logs: Error: failed
console.log(await tappedErr.unwrapOr(0)); // 0
```

**Comparison**:
- `map` vs. `mapErr`: `map` transforms the success value asynchronously; `mapErr` transforms the error.
- `filter` vs. `map`: `filter` discards success values based on an async predicate; `map` transforms the value.
- `tap` vs. `tapErr`: `tap` is for async success side effects; `tapErr` is for async error side effects.

#### Combining ResultAsync

```typescript
import { ResultAsync, Result } from 'neverever';

const result1 = ResultAsync.ok<string, string>('hello');
const result2 = Result.ok<number, string>(42);

// Zip with synchronous Result
const zipped = result1.zip(result2);
console.log(await zipped.unwrapOr(['', 0])); // ['hello', 42]

// Zip with another ResultAsync
const asyncZipped = result1.zip(ResultAsync.ok<number, string>(100));
console.log(await asyncZipped.unwrapOr(['', 0])); // ['hello', 100]

// Flatten nested ResultAsync
const nested = ResultAsync.ok<Result<number, string>, string>(Result.ok(42));
console.log(await nested.flatten().unwrapOr(0)); // 42

// Sequence to array
const sequenced = result1.sequence();
console.log(await sequenced.unwrapOr([])); // ['hello']
```

**Comparison**:
- `zip` vs. `andThen`: `zip` combines async or sync `Result` values; `andThen` chains to a new `Result`.
- `flatten` vs. `sequence`: `flatten` unwraps nested `Result` or `ResultAsync`; `sequence` converts to an array.

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
import { pipe, Option } from 'neverever';

const result = pipe(
  Option.some(5),
  (opt: Option<number>) => opt.map(n => n * 2),
  (opt: Option<number>) => opt.map(n => n + 10)
);
console.log(result.unwrapOr(0)); // 20
```

#### Pipeline with OptionAsync

```typescript
import { pipe, Option } from 'neverever';

const result = pipe(
  Option.some(5).toAsync(),
  async (opt: OptionAsync<number>) => opt.map(n => n * 2),
  async (opt: OptionAsync<number>) => opt.map(n => n + 10)
);
console.log(await (await result).unwrapOr(0)); // 20
```

#### Pipeline with Result

```typescript
import { pipe, Result } from 'neverever';

const result = pipe(
  Result.ok<string, string>('data'),
  (res: Result<string, string>) => res.map(s => s.toUpperCase()),
  (res: Result<string, string>) => res.map(s => s + '!')
);
console.log(result.unwrapOr('')); // 'DATA!'
```

#### Pipeline with ResultAsync

```typescript
import { pipe, Result } from 'neverever';

const result = pipe(
  Result.ok<string, string>('data').toAsync(),
  async (res: ResultAsync<string, string>) => res.map(s => s.toUpperCase()),
  async (res: ResultAsync<string, string>) => res.map(s => s + '!')
);
console.log(await (await result).unwrapOr('')); // 'DATA!'
```

**Comparison**:
- `pipe` vs. method chaining: `pipe` is more flexible for composing arbitrary functions; method chaining is specific to `Option` or `Result` methods.
- `pipe` with sync vs. async: Sync pipelines return values directly; async pipelines return `Promise` if any function is async.

### unwrapMaybePromise

Unwraps a `MaybePromise<T>` to a `Promise<T>`.

```typescript
import { unwrapMaybePromise } from 'neverever';

// Synchronous value
const syncValue = 42;
console.log(await unwrapMaybePromise(syncValue)); // 42

// Promise value
const asyncValue = Promise.resolve('hello');
console.log(await unwrapMaybePromise(asyncValue)); // 'hello'
```

**Comparison**:
- `unwrapMaybePromise` vs. `Promise.resolve`: `unwrapMaybePromise` ensures consistent `Promise` output; `Promise.resolve` is a native JS utility without type safety.

### Type Utilities

`neverever` provides utility types for enhanced type safety, exported via `index.ts`.

#### Unwrap

Extracts the inner type of a `Promise`, `Option`, or `Result`.

```typescript
import { Unwrap, Option, Result } from 'neverever';

type PromiseType = Unwrap<Promise<string>>; // string
type OptionType = Unwrap<Option<number>>; // number
type ResultType = Unwrap<Result<boolean, string>>; // boolean

const value: OptionType = Option.some(42).unwrapOr(0);
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

#### OptionLike

Accepts `Option<T>`, `OptionAsync<T>`, or `Promise<Option<T>>`.

```typescript
import { OptionLike, Option, OptionAsync } from 'neverever';

async function processOption<T>(opt: OptionLike<T>): Promise<T> {
  const option = await (opt instanceof OptionAsync ? opt.promise : opt);
  return option.unwrapOr(undefined as T);
}
console.log(await processOption(Option.some('hello'))); // 'hello'
console.log(await processOption(OptionAsync.some('world'))); // 'world'
```

#### ResultLike

Accepts `Result<T, E>`, `ResultAsync<T, E>`, or `Promise<Result<T, E>>`.

```typescript
import { ResultLike, Result, ResultAsync } from 'neverever';

async function processResult<T, E>(res: ResultLike<T, E>): Promise<T> {
  const result = await (res instanceof ResultAsync ? res.promise : res);
  return result.unwrapOr(undefined as T);
}
console.log(await processResult(Result.ok<string, string>('data'))); // 'data'
console.log(await processResult(ResultAsync.ok<string, string>('async'))); // 'async'
```

### Practical Examples

#### Fetching and Processing Data

```typescript
import { OptionAsync, ResultAsync } from 'neverever';

async function fetchUser(id: number): Promise<ResultAsync<any, string>> {
  return ResultAsync.try(
    async () => (await fetch(`https://jsonplaceholder.typicode.com/users/${id}`)).json(),
    () => 'Fetch failed'
  );
}

async function getUserName(id: number): Promise<string> {
  const user = await fetchUser(id);
  return user
    .map(user => user.name)
    .unwrapOr('Unknown');
}

console.log(await getUserName(1)); // 'Leanne Graham'
console.log(await getUserName(999)); // 'Unknown'
```

#### Chaining Transformations

```typescript
import { pipe, Option } from 'neverever';

function processData(data: string | null): string {
  return pipe(
    Option.from(data),
    opt => opt.map(s => s.toUpperCase()),
    opt => opt.map(s => s + '!'),
    opt => opt.unwrapOr('NO DATA')
  );
}

console.log(processData('hello')); // 'HELLO!'
console.log(processData(null)); // 'NO DATA'
```

#### Error Handling with ResultAsync

```typescript
import { ResultAsync, pipe } from 'neverever';

async function processApiCall(): Promise<string> {
  const result = await pipe(
    ResultAsync.try(
      async () => (await fetch('https://jsonplaceholder.typicode.com/posts/1')).json(),
      e => `Error: ${e}`
    ),
    res => res.map(post => post.title),
    res => res.map(title => title.toUpperCase())
  );
  return result.unwrapOr('Failed to fetch');
}

console.log(await processApiCall()); // 'SUNT AUT FACERE ...'
```

## API Reference

Generate detailed API documentation using `typedoc`:

```bash
npx typedoc --entryPoints src --out docs
```

This creates HTML documentation from JSDoc comments in the source files.

## Internal Types

The library uses internal types like `PipeChain`, `HasPromise`, `PipeReturn`, `EnsurePromise`, and `IsPromise` to support the implementation of `pipe` and type utilities. These are not exported and are used solely for internal type computations.

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

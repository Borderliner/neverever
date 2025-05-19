# neverever - A TypeScript Library for Functional Data Handling
![Coverage](https://raw.githubusercontent.com/Borderliner/neverever/badges/coverage.svg)

`neverever` is a zero-dependency TypeScript library designed for expressive, type-safe data handling in functional programming paradigms. It provides robust implementations of `Option<T>`, `OptionAsync<T>`, `Result<T, E>`, and `ResultAsync<T, E>`, inspired by languages like Rust and Gleam. Built for synchronous and asynchronous workflows, it offers chainable monadic methods, a powerful `pipe` utility, and seamless integration of `MaybePromise<T>` for flexible Promise handling. As a performant alternative to libraries like `neverthrow`, `neverever` eliminates null checks, simplifies error handling, and enables declarative data transformations.

## Installation

Install `neverever` via (p)npm:

```bash
npm install neverever
```

Configure TypeScript for optimal compatibility by including the following in `tsconfig.json`:

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

Import the required types and utilities:

```typescript
import { Option, Result, OptionAsync, ResultAsync, pipe } from 'neverever';
```

## Core Concepts

`neverever` provides four primary abstractions for functional error handling and optional value management, each with synchronous and asynchronous variants:

- **`Option<T>`**: Represents an optional value, either `Some<T>` (a value of type `T`) or `None` (absence of a value). Ideal for null-safety and eliminating explicit `null`/`undefined` checks.
- **`OptionAsync<T>`**: Extends `Option<T>` for asynchronous workflows, wrapping a `Promise<Option<T>>`. Supports Promise-based operations with monadic chaining.
- **`Result<T, E>`**: Represents a computation outcome, either `Ok<T>` (success with a value of type `T`) or `Err<E>` (failure with an error of type `E`). Perfect for robust error handling without try-catch.
- **`ResultAsync<T, E>`**: Extends `Result<T, E>` for asynchronous computations, wrapping a `Promise<Result<T, E>>`. Enables seamless error handling in Promise-based code.

### Utility Functions and Types

- **`pipe`**: A higher-order function for composing synchronous and asynchronous transformations, supporting monadic types and `MaybePromise<T>`.
- **`OptionLike<T>`**: A union type for `Option<T>`, `OptionAsync<T>`, or `Promise<Option<T>>`, enabling flexible method signatures.
- **`ResultLike<T, E>`**: A union type for `Result<T, E>`, `ResultAsync<T, E>`, or `Promise<Result<T, E>>`, facilitating interoperability.
- **`MaybePromise<T>`**: A type alias for `T | Promise<T>`, allowing methods to accept both synchronous and asynchronous inputs.
- **`Unwrap<T>`**: A type utility to extract the inner type from `Promise`, `Option`, or `Result`, useful for flattening nested structures.

## Usage

Below are advanced examples showcasing the monadic and compositional capabilities of `neverever`. All examples assume the library is imported.

### Option: Monadic Null-Safety

`Option<T>` provides a monadic interface for handling optional values with chainable methods.

#### Creating and Transforming Options

```typescript
import { Option } from 'neverever';

// Create and chain transformations
const opt = Option.from("hello")
  .map(s => s.toUpperCase())
  .andThen(s => s.length > 5 ? Option.some(s + "!") : Option.none())
  .filter(s => s.includes("!"));
console.log(opt.unwrapOr("default")); // "default"

// Handle potentially throwing operations
const parsed = Option.try(
  () => JSON.parse('{"key": "value"}').key,
  () => "parse_error"
);
console.log(parsed.unwrapOr("")); // "value"
```

#### Composition with Pipe

```typescript
import { pipe, Option } from 'neverever';

const process = pipe(
  Option.some(10),
  opt => opt.map(n => n * 2),
  opt => opt.andThen(n => n > 15 ? Option.some(n + 5) : Option.none()),
  opt => opt.map(n => `Result: ${n}`)
);
console.log(process.unwrapOr("none")); // "Result: 25"
```

#### Combining and Flattening

```typescript
import { Option } from 'neverever';

const opt1 = Option.some(42);
const opt2 = Option.some("world");

// Combine with zip
const zipped = opt1.zip(opt2).map(([n, s]) => `${s}-${n}`);
console.log(zipped.unwrapOr("")); // "world-42"

// Flatten nested Option
const nested = Option.some(Option.some(100));
console.log(nested.flatten().unwrapOr(0)); // 100
```

### OptionAsync: Asynchronous Monadic Operations

`OptionAsync<T>` extends `Option<T>` for Promise-based workflows, supporting async transformations and compositions.

#### Async Transformations

```typescript
import { OptionAsync } from 'neverever';

const opt = OptionAsync.some(Promise.resolve(5))
  .map(async n => n * 2)
  .andThen(async n => n > 10 ? OptionAsync.some(n + 10) : OptionAsync.none())
  .tap(async n => console.log(`Processed: ${n}`)); // Logs if Some
console.log(await opt.unwrapOr(0)); // 20
```

#### Async Data Fetching

```typescript
import { OptionAsync } from 'neverever';

async function fetchOptionalData(id: number): Promise<OptionAsync<any>> {
  return OptionAsync.try(async () => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
    return res.json();
  });
}

const data = await fetchOptionalData(1)
  .map(async post => post.title.toUpperCase())
  .unwrapOr("No data");
console.log(data); // "SUNT AUT FACERE ..."
```

### Result: Monadic Error Handling

`Result<T, E>` provides a monadic interface for handling success and error outcomes with type-safe error propagation.

#### Creating and Transforming Results

```typescript
import { Result } from 'neverever';

const result = Result.try(
  () => JSON.parse('{"value": 42}').value,
  e => `Parse error: ${e}`
)
  .map(n => n * 2)
  .andThen(n => n > 50 ? Result.ok<string, string>(`Large: ${n}`) : Result.err("Too small"))
  .mapErr(e => `Failed: ${e}`);
console.log(result.unwrapOr("default")); // "Failed: Too small"
```

#### Error Recovery and Composition

```typescript
import { pipe, Result } from 'neverever';

const process = pipe(
  Result.from("data", "Missing"),
  res => res.map(s => s.toUpperCase()),
  res => res.recover(e => "RECOVERED"),
  res => res.map(s => s + "!")
);
console.log(process.unwrapOr("")); // "DATA!"
```

### ResultAsync: Asynchronous Error Handling

`ResultAsync<T, E>` extends `Result<T, E>` for asynchronous computations, with robust error handling and monadic chaining.

#### Async Error Handling

```typescript
import { ResultAsync } from 'neverever';

async function fetchPost(id: number): Promise<ResultAsync<any, string>> {
  return ResultAsync.fromPromise(
    fetch(`https://jsonplaceholder.typicode.com/posts/${id}`).then(res => res.json()),
    () => "Fetch failed"
  );
}

const post = await fetchPost(1)
  .map(async post => post.title)
  .andThen(async title => ResultAsync.ok<string, string>(title.toUpperCase()))
  .orElse(async e => ResultAsync.ok(e.length.toString()));
console.log(await post.unwrapOr("")); // "SUNT AUT FACERE ..."
```

#### Complex Async Pipeline

```typescript
import { pipe, ResultAsync } from 'neverever';

const process = await pipe(
  ResultAsync.ok<string, string>("input"),
  async res => res.map(s => s.toUpperCase()),
  async res => res.andThen(s => s.length > 5 ? Result.ok(s + "!") : Result.err("Too short")),
  async res => res.mapErr(e => `Error: ${e}`)
);
console.log(await process.unwrapOr("")); // "Error: Too short"
```

### Utility Functions and Types

#### Pipe: Functional Composition

```typescript
import { pipe, ResultAsync } from 'neverever';

const complex = await pipe(
  ResultAsync.from(Promise.resolve(10), "Missing"),
  async res => res.map(n => n * 2),
  async res => res.filter(async n => n > 15, "Too small"),
  async res => res.map(n => `Final: ${n}`)
);
console.log(await complex.unwrapOr("none")); // "Final: 20"
```

#### Type Utilities

- **`MaybePromise<T>`**:

```typescript
import { MaybePromise, ResultAsync } from 'neverever';

function processAsync(value: MaybePromise<number>): ResultAsync<number, string> {
  return ResultAsync.from(value, "Invalid");
}
console.log(await processAsync(42).unwrapOr(0)); // 42
console.log(await processAsync(Promise.resolve(100)).unwrapOr(0)); // 100
```

- **`Unwrap<T>`**:

```typescript
import { Unwrap, ResultAsync } from 'neverever';

type Inner = Unwrap<ResultAsync<string, string>>; // string
const result = ResultAsync.ok<string, string>("test");
const value: Inner = await result.unwrapOr("");
console.log(value); // "test"
```

- **`OptionLike<T>` and `ResultLike<T, E>`**:

```typescript
import { OptionLike, ResultLike, OptionAsync, ResultAsync } from 'neverever';

async function processOption<T>(opt: OptionLike<T>): Promise<T | null> {
  const option = await (opt instanceof OptionAsync ? opt.promise : opt);
  return option.unwrapOr(null);
}

async function processResult<T, E>(res: ResultLike<T, E>): Promise<T | null> {
  const result = await (res instanceof ResultAsync ? res.promise : res);
  return result.unwrapOr(null);
}

console.log(await processOption(OptionAsync.some(42))); // 42
console.log(await processResult(Result.ok<string, string>("data"))); // "data"
```

## Advanced Features

- **Monadic Chaining**: Methods like `andThen`, `map`, and `orElse` support monadic composition, enabling declarative workflows.
- **Async/Sync Interoperability**: `OptionAsync` and `ResultAsync` seamlessly integrate with `Option` and `Result` via `zip`, `andThen`, and `toAsync`.
- **Type-Safe Error Handling**: `Result<T, E>` and `ResultAsync<T, E>` enforce type constraints on error types, improving reliability.
- **Flexible Composition**: The `pipe` utility supports arbitrary function composition, including mixed sync/async operations and monadic types.

## API Reference

Generate detailed API documentation with TypeDoc:

```bash
npx typedoc --entryPoints src --out docs
```

This produces HTML documentation from JSDoc comments, detailing every method and type.

## Contributing

Contributions are encouraged! To contribute:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/monad-enhancements`).
3. Commit changes (`git commit -m 'Add monad law optimizations'`).
4. Push the branch (`git push origin feature/monad-enhancements`).
5. Open a pull request with a clear description and test coverage.

Ensure adherence to monadic laws and type safety in contributions.

## License

MIT License. See [LICENSE](LICENSE) for details.
Made with  by Mohammadreza Hajianpour

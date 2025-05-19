# neverever - A TypeScript Library for Safe Data Handling by Adding Option<T> and Result<T, E>
[![Coverage](https://Borderliner.github.io/neverever/badges/coverage.svg)](https://github.com/Borderliner/neverever/actions)
[View Coverage Report](https://Borderliner.github.io/neverever/index.html)

*Advanced programmer? [Read this instead](./README_ADVANCED.md).*

Welcome to `neverever`! This is a TypeScript library that helps you write safer and cleaner code by handling situations where data might be missing or operations might fail. It’s perfect for beginners because it reduces confusing errors like "undefined is not a function" or messy try-catch blocks. `neverever` is easy to use, works with both regular and asynchronous (Promise-based) code, and has no dependencies, so it won’t bloat your project.

## What Does `neverever` Do?

Imagine you’re writing code that looks up a user’s name, but sometimes the name isn’t there (it’s `null` or `undefined`). Or maybe you’re fetching data from a server, and the request might fail. Normally, you’d write lots of `if` checks or try-catch blocks to handle these cases, which can make your code messy. `neverever` gives you two main tools to make this easier:

1. **Option**: Helps you deal with values that might be missing, like a user’s name that could be `null`.
2. **Result**: Helps you handle operations that might succeed (e.g., fetching data) or fail (e.g., server error).

These tools come in two flavors:
- **Synchronous** (`Option` and `Result`): For regular code that runs immediately.
- **Asynchronous** (`OptionAsync` and `ResultAsync`): For code that waits for Promises, like fetching data from a server.

## Installation

To start using `neverever`, install it with npm (or pnpm/yarn):

```bash
npm install neverever
```

You’ll need TypeScript in your project. If you don’t have a `tsconfig.json` file, create one with these settings for the best experience:

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

Then, import the tools you need in your TypeScript file:

```typescript
import { Option, Result } from 'neverever';
```

## Core Concepts for Beginners

### Option: Handling Missing Values

An `Option` is a way to represent a value that might or might not exist. Think of it like a box:
- **Some**: The box contains a value, like a number or string.
- **None**: The box is empty (no value).

This helps you avoid errors when a value might be `null` or `undefined`. Instead of checking `if (value !== null)`, you use `Option` to handle it safely.

#### Example: Checking a User’s Name

Suppose you have a function that gets a user’s name, but it might return `null`:

```typescript
import { Option } from 'neverever';

function getUserName(userId: number): string | null {
  if (userId === 1) return "Alice";
  return null;
}

// Without Option, you need checks
const name = getUserName(999);
if (name === null) {
  console.log("No name found"); // No name found
} else {
  console.log(name);
}

// With Option, it’s simpler
const optName = Option.from(getUserName(999));
console.log(optName.unwrapOr("No name found")); // No name found
console.log(Option.from(getUserName(1)).unwrapOr("No name found")); // Alice
```

Here, `Option.from` turns a `null` or `undefined` value into `None`, and a real value into `Some`. The `unwrapOr` method gives you the value if it’s `Some`, or a default if it’s `None`.

### OptionAsync: Handling Missing Values in Async Code

`OptionAsync` is like `Option`, but for code that uses Promises (e.g., fetching data from a server). It’s still a box that’s either `Some` (has a value) or `None` (empty), but it waits for the Promise to resolve.

#### Example: Fetching a User’s Email

Suppose you fetch a user’s email, but the server might return `null`:

```typescript
import { OptionAsync } from 'neverever';

async function fetchEmail(userId: number): Promise<string | null> {
  // Simulate fetching data
  return userId === 1 ? "alice@example.com" : null;
}

const email = await OptionAsync.from(fetchEmail(999)).unwrapOr("No email");
console.log(email); // No email
console.log(await OptionAsync.from(fetchEmail(1)).unwrapOr("No email")); // alice@example.com
```

`OptionAsync.from` handles the Promise and checks if the result is `null`, making it `None` if so. You use `await` with `unwrapOr` to get the value or a default.

### Result: Handling Success or Failure

A `Result` represents an operation that can either succeed or fail:
- **Ok**: The operation worked and has a value (e.g., data from a server).
- **Err**: The operation failed and has an error message.

This is great for avoiding try-catch blocks when something might go wrong.

#### Example: Parsing JSON

Suppose you want to parse some JSON, which might fail if the JSON is invalid:

```typescript
import { Result } from 'neverever';

function parseJson(data: string): Result<any, string> {
  return Result.try(
    () => JSON.parse(data),
    (e) => `Parse error: ${e}`
  );
}

const valid = parseJson('{"name": "Bob"}');
console.log(valid.unwrapOr({})); // { name: "Bob" }

const invalid = parseJson('invalid');
console.log(invalid.unwrapOr({})); // {}
```

`Result.try` runs the function and returns `Ok` if it works or `Err` if it throws an error. `unwrapOr` gives you the successful value or a default.

### ResultAsync: Handling Success or Failure in Async Code

`ResultAsync` is like `Result`, but for asynchronous operations that return Promises. It’s either `Ok` (success) or `Err` (failure), but it waits for the Promise.

#### Example: Fetching Data from a Server

Suppose you fetch data from a server, which might fail:

```typescript
import { ResultAsync } from 'neverever';

async function fetchData(id: number): Promise<ResultAsync<any, string>> {
  return ResultAsync.try(
    async () => (await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`)).json(),
    () => "Fetch failed"
  );
}

const data = await fetchData(1);
console.log(await data.unwrapOr({ title: "No data" })); // { id: 1, title: ..., ... }

const failed = await fetchData(999);
console.log(await failed.unwrapOr({ title: "No data" })); // { title: "No data" }
```

`ResultAsync.try` handles the async function, returning `Ok` for success or `Err` for failure. You use `await` with `unwrapOr` to get the value or a default.

## Why Use `neverever`?

- **Fewer Errors**: No more `null` or `undefined` surprises. `Option` and `Result` make it clear when something might be missing or fail.
- **Cleaner Code**: Avoid repetitive `if` checks and try-catch blocks. Methods like `map` and `unwrapOr` simplify your logic.
- **Works with Async**: `OptionAsync` and `ResultAsync` make it easy to handle Promises without messy error handling.
- **Beginner-Friendly**: The library is straightforward, with simple methods to get started.

## Getting Started

Try this example to see `neverever` in action:

```typescript
import { OptionAsync, ResultAsync } from 'neverever';

// Simulate fetching a user’s profile
async function fetchProfile(userId: number): Promise<ResultAsync<{ name: string }, string>> {
  return ResultAsync.try(
    async () => {
      const response = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`);
      if (!response.ok) throw new Error("User not found");
      return response.json();
    },
    () => "Failed to fetch profile"
  );
}

// Get the user’s name or a default
async function getName(userId: number): Promise<string> {
  const profile = await fetchProfile(userId);
  return profile.map(user => user.name).unwrapOr("Unknown user");
}

console.log(await getName(1)); // "Leanne Graham"
console.log(await getName(999)); // "Unknown user"
```

This code safely fetches a user’s profile and extracts the name, handling missing data and errors without `if` checks or try-catch.

## Common Methods

Here are some key methods you’ll use a lot:

- **Option/OptionAsync**:
  - `unwrapOr(default)`: Get the value or a default if missing.
  - `map(fn)`: Transform the value (e.g., double a number).
  - `filter(predicate)`: Keep the value only if it meets a condition.
  - `toResult(error)`: Turn an `Option` into a `Result` with an error for `None`.

- **Result/ResultAsync**:
  - `unwrapOr(default)`: Get the success value or a default if it’s an error.
  - `map(fn)`: Transform the success value.
  - `mapErr(fn)`: Transform the error message.
  - `toOption()`: Turn a `Result` into an `Option`, ignoring the error.

## Tips for Beginners

- **Start Small**: Try `Option.from` to handle `null` values in your code, like user inputs or API responses.
- **Use `Result` for Errors**: Replace try-catch with `Result.try` for functions that might fail, like parsing or calculations.
- **Practice with Async**: Use `ResultAsync.try` for API calls to avoid complex error handling.
- **Read Errors**: TypeScript will guide you if you use `Option` or `Result` incorrectly, making it easier to learn.

## Documentation

To learn more, generate detailed API docs with:

```bash
npx typedoc --entryPoints src --out docs
```

This creates a website with full details on every method.

## Contributing

Want to help improve `neverever`? Here’s how:
1. Fork the repository on GitHub.
2. Create a branch (`git checkout -b my-fix`).
3. Make changes and commit (`git commit -m 'Fixed a bug'`).
4. Push your branch (`git push origin my-fix`).
5. Open a pull request.

## License

MIT License. See [LICENSE](LICENSE) for details.
Made with  by Mohammadreza Hajianpour

# create-react-ctx

A simple utility for creating type-safe React contexts with minimal boilerplate.

## Installation

Install the package using npm or Yarn:

```bash
npm install create-react-ctx
# or
yarn add create-react-ctx
```

## Usage

Create a custom hook that initializes and returns the context value based on incoming props.

### 1. Create the context

Generate the context, provider, and consumer hook using `createReactCtx`.

```tsx
import { useState } from 'react'
import createReactCtx from 'create-react-ctx'

const { Provider: AuthProvider, use: useAuth } = createReactCtx(
  ({ initialUser }: { initialUser: string }) => {
    const [user, setUser] = useState(initialUser)

    function login(username: string) {
      setUser(username)
    }

    return { user, login }
  }
)
```

### 2. Wrap your app with the provider

Pass required props to the `Provider` component.

```tsx
import { AuthProvider } from './auth-context'

function App() {
  return (
    <AuthProvider initialUser="guest">
      <Main />
    </AuthProvider>
  )
}
```

### 3. Consume the context

Use the generated hook anywhere inside the provider tree.

```tsx
import { useAuth } from './auth-context'

function Main() {
  const { user, login } = useAuth()

  return (
    <div>
      <p>Current user: {user}</p>
      <button onClick={() => login('admin')}>Login as Admin</button>
    </div>
  )
}
```

## API

### createReactCtx

```ts
function createReactCtx<
  TCtxProps extends object,
  TResult,
  THookProps extends unknown[] = []
>(
  useProvider: (props: TCtxProps) => TResult,
  useContextHook?: (...input: THookProps) => void
): {
  ctx: React.Context<TResult>
  Provider: React.FC<TCtxProps & { children: React.ReactNode }>
  use: (...input: THookProps) => TResult
}
```

- `useProvider`: A hook that receives props and returns the context value.
- `useContextHook`: An optional hook that runs when the context is consumed.
- Returns:
  - `ctx`: The raw React context instance.
  - `Provider`: Context provider component.
  - `use`: Hook to access context value.

## TypeScript Support

Fully typed API with generics for props and return values.

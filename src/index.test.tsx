import * as React from 'react'
import { createReactCtx } from './index'
import { describe, it, expect, mock } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
}

interface UserState {
  user: { name: string; id: number } | null
  login: (name: string, id: number) => void
  logout: () => void
}

interface ThemeState {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

interface NestedState {
  data: {
    nested: {
      value: string
      array: number[]
    }
  }
  updateValue: (value: string) => void
  addToArray: (num: number) => void
}

describe('createReactCtx', () => {
  describe('Basic functionality', () => {
    it('should create context with provider and hook', () => {
      const useCounterProvider = () => {
        const [count, setCount] = React.useState(0)
        return {
          count,
          increment: () => setCount((c) => c + 1),
          decrement: () => setCount((c) => c - 1),
        }
      }

      const { Provider, useContext } = createReactCtx(useCounterProvider)

      expect(Provider).toBeDefined()
      expect(useContext).toBeDefined()
      expect(typeof Provider).toBe('function')
      expect(typeof useContext).toBe('function')
    })

    it('should provide context value to children', () => {
      const useCounterProvider = () => {
        const [count, setCount] = React.useState(5)
        return { count, setCount }
      }

      const { Provider, useContext } = createReactCtx(useCounterProvider)

      function Counter() {
        const { count } = useContext()
        return <div data-testid="count">{count}</div>
      }

      render(
        <Provider>
          <Counter />
        </Provider>
      )

      expect(screen.getByTestId('count').textContent).toBe('5')
    })

    it('should allow state updates through context', () => {
      const useCounterProvider = () => {
        const [count, setCount] = React.useState(0)
        return {
          count,
          increment: () => setCount((c) => c + 1),
        }
      }

      const { Provider, useContext } = createReactCtx(useCounterProvider)

      function Counter() {
        const { count, increment } = useContext()
        return (
          <div>
            <div data-testid="count">{count}</div>
            <button data-testid="increment" onClick={increment}>
              +
            </button>
          </div>
        )
      }

      render(
        <Provider>
          <Counter />
        </Provider>
      )

      expect(screen.getByTestId('count')).toHaveTextContent('0')
      fireEvent.click(screen.getByTestId('increment'))
      expect(screen.getByTestId('count')).toHaveTextContent('1')
    })

    it('should work with multiple consumers', () => {
      const useCounterProvider = () => {
        const [count, setCount] = React.useState(10)
        return { count, setCount }
      }

      const { Provider, useContext } = createReactCtx(useCounterProvider)

      function Counter1() {
        const { count } = useContext()
        return <div data-testid="count1">{count}</div>
      }

      function Counter2() {
        const { count } = useContext()
        return <div data-testid="count2">{count}</div>
      }

      render(
        <Provider>
          <Counter1 />
          <Counter2 />
        </Provider>
      )

      expect(screen.getByTestId('count1')).toHaveTextContent('10')
      expect(screen.getByTestId('count2')).toHaveTextContent('10')
    })

    it('should share state between multiple consumers', () => {
      const useCounterProvider = () => {
        const [count, setCount] = React.useState(0)
        return {
          count,
          increment: () => setCount((c) => c + 1),
        }
      }

      const { Provider, useContext } = createReactCtx(useCounterProvider)

      function Counter() {
        const { count } = useContext()
        return <div data-testid="count">{count}</div>
      }

      function IncrementButton() {
        const { increment } = useContext()
        return (
          <button data-testid="increment" onClick={increment}>
            +
          </button>
        )
      }

      render(
        <Provider>
          <Counter />
          <IncrementButton />
        </Provider>
      )

      expect(screen.getByTestId('count')).toHaveTextContent('0')
      fireEvent.click(screen.getByTestId('increment'))
      expect(screen.getByTestId('count')).toHaveTextContent('1')
    })
  })

  describe('Error handling', () => {
    it('should throw error when useContext is called outside Provider', () => {
      const useCounterProvider = () => ({ count: 0 })
      const { useContext } = createReactCtx(useCounterProvider)

      function Counter() {
        useContext()
        return <div>Counter</div>
      }

      expect(() => render(<Counter />)).toThrow(
        'useContext must be used within a Provider'
      )
    })

    it('should throw error when nested component uses context outside Provider', () => {
      const useCounterProvider = () => ({ count: 0 })
      const { useContext } = createReactCtx(useCounterProvider)

      function NestedCounter() {
        useContext()
        return <div>Nested Counter</div>
      }

      function Container() {
        return <NestedCounter />
      }

      expect(() => render(<Container />)).toThrow(
        'useContext must be used within a Provider'
      )
    })

    it('should not throw error when context is used inside Provider', () => {
      const useCounterProvider = () => ({ count: 0 })
      const { Provider, useContext } = createReactCtx(useCounterProvider)

      function Counter() {
        const { count } = useContext()
        return <div data-testid="count">{count}</div>
      }

      expect(() =>
        render(
          <Provider>
            <Counter />
          </Provider>
        )
      ).not.toThrow()
    })
  })

  describe('Provider props', () => {
    it('should pass props to provider function', () => {
      const useProviderWithProps = (props: { initialCount: number }) => {
        const [count, setCount] = React.useState(props.initialCount)
        return { count, setCount }
      }

      const { Provider, useContext } = createReactCtx(useProviderWithProps)

      function Counter() {
        const { count } = useContext()
        return <div data-testid="count">{count}</div>
      }

      render(
        <Provider initialCount={42}>
          <Counter />
        </Provider>
      )

      expect(screen.getByTestId('count')).toHaveTextContent('42')
    })

    it('should work with multiple props', () => {
      const useProviderWithProps = (props: {
        initialCount: number
        step: number
      }) => {
        const [count, setCount] = React.useState(props.initialCount)
        return {
          count,
          increment: () => setCount((c) => c + props.step),
        }
      }

      const { Provider, useContext } = createReactCtx(useProviderWithProps)

      function Counter() {
        const { count, increment } = useContext()
        return (
          <div>
            <div data-testid="count">{count}</div>
            <button data-testid="increment" onClick={increment}>
              +
            </button>
          </div>
        )
      }

      render(
        <Provider initialCount={10} step={5}>
          <Counter />
        </Provider>
      )

      expect(screen.getByTestId('count')).toHaveTextContent('10')
      fireEvent.click(screen.getByTestId('increment'))
      expect(screen.getByTestId('count')).toHaveTextContent('15')
    })

    it('should work with object props', () => {
      const useProviderWithProps = (props: {
        config: { theme: string; size: number }
      }) => {
        return {
          theme: props.config.theme,
          size: props.config.size,
        }
      }

      const { Provider, useContext } = createReactCtx(useProviderWithProps)

      function Component() {
        const { theme, size } = useContext()
        return (
          <div data-testid="theme-size">
            {theme}-{size}
          </div>
        )
      }

      render(
        <Provider config={{ theme: 'dark', size: 16 }}>
          <Component />
        </Provider>
      )

      expect(screen.getByTestId('theme-size')).toHaveTextContent('dark-16')
    })
  })

  describe('Context hook functionality', () => {
    it('should call context hook when useContext is called', () => {
      const mockHook = mock(() => {})
      const useCounterProvider = () => ({ count: 0 })

      const { Provider, useContext } = createReactCtx(
        useCounterProvider,
        mockHook
      )

      function Counter() {
        useContext()
        return <div>Counter</div>
      }

      render(
        <Provider>
          <Counter />
        </Provider>
      )

      expect(mockHook).toHaveBeenCalledTimes(1)
    })

    it('should pass arguments to context hook', () => {
      const mockHook = mock(() => {})
      const useCounterProvider = () => ({ count: 0 })

      const { Provider, useContext } = createReactCtx(
        useCounterProvider,
        mockHook
      )

      function Counter() {
        useContext('arg1', 42, { key: 'value' })
        return <div>Counter</div>
      }

      render(
        <Provider>
          <Counter />
        </Provider>
      )

      expect(mockHook).toHaveBeenCalledWith('arg1', 42, { key: 'value' })
    })

    it('should call context hook on every useContext call', () => {
      const mockHook = mock(() => {})
      const useCounterProvider = () => ({ count: 0 })

      const { Provider, useContext } = createReactCtx(
        useCounterProvider,
        mockHook
      )

      function Counter() {
        useContext()
        useContext()
        return <div>Counter</div>
      }

      render(
        <Provider>
          <Counter />
        </Provider>
      )

      expect(mockHook).toHaveBeenCalledTimes(2)
    })

    it('should work with complex context hook logic', () => {
      const logs: string[] = []
      const contextHook = (action: string) => {
        logs.push(action)
      }

      const useCounterProvider = () => {
        const [count, setCount] = React.useState(0)
        return {
          count,
          increment: () => setCount((c) => c + 1),
        }
      }

      const { Provider, useContext } = createReactCtx(
        useCounterProvider,
        contextHook
      )

      function Counter() {
        const { count, increment } = useContext('read')
        return (
          <div>
            <div data-testid="count">{count}</div>
            <button
              data-testid="increment"
              onClick={() => {
                useContext('write')
                increment()
              }}
            >
              +
            </button>
          </div>
        )
      }

      render(
        <Provider>
          <Counter />
        </Provider>
      )

      expect(logs).toContain('read')
      fireEvent.click(screen.getByTestId('increment'))
      expect(logs).toContain('write')
    })
  })

  describe('Complex state scenarios', () => {
    it('should handle nested state objects', () => {
      const useNestedProvider = (): NestedState => {
        const [data, setData] = React.useState({
          nested: {
            value: 'initial',
            array: [1, 2, 3],
          },
        })

        return {
          data,
          updateValue: (value: string) =>
            setData((prev) => ({
              ...prev,
              nested: { ...prev.nested, value },
            })),
          addToArray: (num: number) =>
            setData((prev) => ({
              ...prev,
              nested: { ...prev.nested, array: [...prev.nested.array, num] },
            })),
        }
      }

      const { Provider, useContext } = createReactCtx(useNestedProvider)

      function Component() {
        const { data, updateValue, addToArray } = useContext()
        return (
          <div>
            <div data-testid="value">{data.nested.value}</div>
            <div data-testid="array">{data.nested.array.join(',')}</div>
            <button data-testid="update" onClick={() => updateValue('updated')}>
              Update
            </button>
            <button data-testid="add" onClick={() => addToArray(4)}>
              Add
            </button>
          </div>
        )
      }

      render(
        <Provider>
          <Component />
        </Provider>
      )

      expect(screen.getByTestId('value')).toHaveTextContent('initial')
      expect(screen.getByTestId('array')).toHaveTextContent('1,2,3')

      fireEvent.click(screen.getByTestId('update'))
      expect(screen.getByTestId('value')).toHaveTextContent('updated')

      fireEvent.click(screen.getByTestId('add'))
      expect(screen.getByTestId('array')).toHaveTextContent('1,2,3,4')
    })

    it('should handle user authentication state', () => {
      const useUserProvider = (): UserState => {
        const [user, setUser] = React.useState<{
          name: string
          id: number
        } | null>(null)

        return {
          user,
          login: (name: string, id: number) => setUser({ name, id }),
          logout: () => setUser(null),
        }
      }

      const { Provider, useContext } = createReactCtx(useUserProvider)

      function AuthComponent() {
        const { user, login, logout } = useContext()
        return (
          <div>
            <div data-testid="user">
              {user ? `${user.name}-${user.id}` : 'guest'}
            </div>
            <button data-testid="login" onClick={() => login('John', 123)}>
              Login
            </button>
            <button data-testid="logout" onClick={logout}>
              Logout
            </button>
          </div>
        )
      }

      render(
        <Provider>
          <AuthComponent />
        </Provider>
      )

      expect(screen.getByTestId('user')).toHaveTextContent('guest')

      fireEvent.click(screen.getByTestId('login'))
      expect(screen.getByTestId('user')).toHaveTextContent('John-123')

      fireEvent.click(screen.getByTestId('logout'))
      expect(screen.getByTestId('user')).toHaveTextContent('guest')
    })

    it('should handle theme switching', () => {
      const useThemeProvider = (): ThemeState => {
        const [theme, setTheme] = React.useState<'light' | 'dark'>('light')

        return {
          theme,
          toggleTheme: () =>
            setTheme((prev) => (prev === 'light' ? 'dark' : 'light')),
        }
      }

      const { Provider, useContext } = createReactCtx(useThemeProvider)

      function ThemeComponent() {
        const { theme, toggleTheme } = useContext()
        return (
          <div>
            <div data-testid="theme">{theme}</div>
            <button data-testid="toggle" onClick={toggleTheme}>
              Toggle
            </button>
          </div>
        )
      }

      render(
        <Provider>
          <ThemeComponent />
        </Provider>
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('light')

      fireEvent.click(screen.getByTestId('toggle'))
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')

      fireEvent.click(screen.getByTestId('toggle'))
      expect(screen.getByTestId('theme')).toHaveTextContent('light')
    })

    it('should handle array state operations', () => {
      const useListProvider = () => {
        const [items, setItems] = React.useState<string[]>(['a', 'b'])

        return {
          items,
          addItem: (item: string) => setItems((prev) => [...prev, item]),
          removeItem: (index: number) =>
            setItems((prev) => prev.filter((_, i) => i !== index)),
          clearItems: () => setItems([]),
        }
      }

      const { Provider, useContext } = createReactCtx(useListProvider)

      function ListComponent() {
        const { items, addItem, removeItem, clearItems } = useContext()
        return (
          <div>
            <div data-testid="items">{items.join(',')}</div>
            <button data-testid="add" onClick={() => addItem('c')}>
              Add
            </button>
            <button data-testid="remove" onClick={() => removeItem(0)}>
              Remove First
            </button>
            <button data-testid="clear" onClick={clearItems}>
              Clear
            </button>
          </div>
        )
      }

      render(
        <Provider>
          <ListComponent />
        </Provider>
      )

      expect(screen.getByTestId('items')).toHaveTextContent('a,b')

      fireEvent.click(screen.getByTestId('add'))
      expect(screen.getByTestId('items')).toHaveTextContent('a,b,c')

      fireEvent.click(screen.getByTestId('remove'))
      expect(screen.getByTestId('items')).toHaveTextContent('b,c')

      fireEvent.click(screen.getByTestId('clear'))
      expect(screen.getByTestId('items')).toHaveTextContent('')
    })
  })

  describe('Edge cases and stress tests', () => {
    it('should handle rapid state updates', () => {
      const useCounterProvider = () => {
        const [count, setCount] = React.useState(0)
        return {
          count,
          increment: () => setCount((c) => c + 1),
          incrementBy: (amount: number) => setCount((c) => c + amount),
        }
      }

      const { Provider, useContext } = createReactCtx(useCounterProvider)

      function Counter() {
        const { count, increment, incrementBy } = useContext()
        return (
          <div>
            <div data-testid="count">{count}</div>
            <button data-testid="increment" onClick={increment}>
              +1
            </button>
            <button data-testid="increment10" onClick={() => incrementBy(10)}>
              +10
            </button>
            <button
              data-testid="rapid"
              onClick={() => {
                for (let i = 0; i < 5; i++) {
                  increment()
                }
              }}
            >
              Rapid +5
            </button>
          </div>
        )
      }

      render(
        <Provider>
          <Counter />
        </Provider>
      )

      expect(screen.getByTestId('count')).toHaveTextContent('0')

      fireEvent.click(screen.getByTestId('increment10'))
      expect(screen.getByTestId('count')).toHaveTextContent('10')

      fireEvent.click(screen.getByTestId('rapid'))
      expect(screen.getByTestId('count')).toHaveTextContent('15')
    })

    it('should handle deep nesting of components', () => {
      const useCounterProvider = () => {
        const [count, setCount] = React.useState(0)
        return { count, setCount }
      }

      const { Provider, useContext } = createReactCtx(useCounterProvider)

      function Level4() {
        const { count } = useContext()
        return <div data-testid="deep-count">{count}</div>
      }

      function Level3() {
        return <Level4 />
      }

      function Level2() {
        return <Level3 />
      }

      function Level1() {
        return <Level2 />
      }

      render(
        <Provider>
          <Level1 />
        </Provider>
      )

      expect(screen.getByTestId('deep-count')).toHaveTextContent('0')
    })

    it('should handle provider with no props', () => {
      const useSimpleProvider = () => {
        return { message: 'hello' }
      }

      const { Provider, useContext } = createReactCtx(useSimpleProvider)

      function Component() {
        const { message } = useContext()
        return <div data-testid="message">{message}</div>
      }

      render(
        <Provider>
          <Component />
        </Provider>
      )

      expect(screen.getByTestId('message')).toHaveTextContent('hello')
    })

    it('should handle provider with empty object props', () => {
      const useProviderWithEmptyProps = (props: {}) => {
        return { value: 'works' }
      }

      const { Provider, useContext } = createReactCtx(useProviderWithEmptyProps)

      function Component() {
        const { value } = useContext()
        return <div data-testid="value">{value}</div>
      }

      render(
        <Provider>
          <Component />
        </Provider>
      )

      expect(screen.getByTestId('value')).toHaveTextContent('works')
    })

    it('should work with boolean state', () => {
      const useBooleanProvider = () => {
        const [isEnabled, setIsEnabled] = React.useState(false)
        return {
          isEnabled,
          toggle: () => setIsEnabled((prev) => !prev),
          enable: () => setIsEnabled(true),
          disable: () => setIsEnabled(false),
        }
      }

      const { Provider, useContext } = createReactCtx(useBooleanProvider)

      function Component() {
        const { isEnabled, toggle, enable, disable } = useContext()
        return (
          <div>
            <div data-testid="enabled">{isEnabled.toString()}</div>
            <button data-testid="toggle" onClick={toggle}>
              Toggle
            </button>
            <button data-testid="enable" onClick={enable}>
              Enable
            </button>
            <button data-testid="disable" onClick={disable}>
              Disable
            </button>
          </div>
        )
      }

      render(
        <Provider>
          <Component />
        </Provider>
      )

      expect(screen.getByTestId('enabled')).toHaveTextContent('false')

      fireEvent.click(screen.getByTestId('toggle'))
      expect(screen.getByTestId('enabled')).toHaveTextContent('true')

      fireEvent.click(screen.getByTestId('disable'))
      expect(screen.getByTestId('enabled')).toHaveTextContent('false')

      fireEvent.click(screen.getByTestId('enable'))
      expect(screen.getByTestId('enabled')).toHaveTextContent('true')
    })

    it('should handle null and undefined values', () => {
      const useNullableProvider = () => {
        const [value, setValue] = React.useState<string | null>(null)
        const [optional, setOptional] = React.useState<string | undefined>(
          undefined
        )

        return {
          value,
          optional,
          setValue,
          setOptional,
          clear: () => {
            setValue(null)
            setOptional(undefined)
          },
        }
      }

      const { Provider, useContext } = createReactCtx(useNullableProvider)

      function Component() {
        const { value, optional, setValue, setOptional, clear } = useContext()
        return (
          <div>
            <div data-testid="value">{value || 'null'}</div>
            <div data-testid="optional">{optional || 'undefined'}</div>
            <button data-testid="set-value" onClick={() => setValue('test')}>
              Set Value
            </button>
            <button
              data-testid="set-optional"
              onClick={() => setOptional('test')}
            >
              Set Optional
            </button>
            <button data-testid="clear" onClick={clear}>
              Clear
            </button>
          </div>
        )
      }

      render(
        <Provider>
          <Component />
        </Provider>
      )

      expect(screen.getByTestId('value')).toHaveTextContent('null')
      expect(screen.getByTestId('optional')).toHaveTextContent('undefined')

      fireEvent.click(screen.getByTestId('set-value'))
      expect(screen.getByTestId('value')).toHaveTextContent('test')

      fireEvent.click(screen.getByTestId('set-optional'))
      expect(screen.getByTestId('optional')).toHaveTextContent('test')

      fireEvent.click(screen.getByTestId('clear'))
      expect(screen.getByTestId('value')).toHaveTextContent('null')
      expect(screen.getByTestId('optional')).toHaveTextContent('undefined')
    })
  })

  describe('Multiple providers and nesting', () => {
    it('should work with nested providers of different types', () => {
      const useCounterProvider = () => {
        const [count, setCount] = React.useState(0)
        return { count, increment: () => setCount((c) => c + 1) }
      }

      const useThemeProvider = () => {
        const [theme, setTheme] = React.useState('light')
        return {
          theme,
          toggleTheme: () =>
            setTheme((t) => (t === 'light' ? 'dark' : 'light')),
        }
      }

      const Counter = createReactCtx(useCounterProvider)
      const Theme = createReactCtx(useThemeProvider)

      function Component() {
        const { count, increment } = Counter.useContext()
        const { theme, toggleTheme } = Theme.useContext()
        return (
          <div>
            <div data-testid="count">{count}</div>
            <div data-testid="theme">{theme}</div>
            <button data-testid="increment" onClick={increment}>
              +
            </button>
            <button data-testid="toggle-theme" onClick={toggleTheme}>
              Toggle Theme
            </button>
          </div>
        )
      }

      render(
        <Counter.Provider>
          <Theme.Provider>
            <Component />
          </Theme.Provider>
        </Counter.Provider>
      )

      expect(screen.getByTestId('count')).toHaveTextContent('0')
      expect(screen.getByTestId('theme')).toHaveTextContent('light')

      fireEvent.click(screen.getByTestId('increment'))
      expect(screen.getByTestId('count')).toHaveTextContent('1')

      fireEvent.click(screen.getByTestId('toggle-theme'))
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    })

    it('should handle same provider type nested', () => {
      const useCounterProvider = (props: { initialCount: number }) => {
        const [count, setCount] = React.useState(props.initialCount)
        return { count, increment: () => setCount((c) => c + 1) }
      }

      const { Provider, useContext } = createReactCtx(useCounterProvider)

      function InnerCounter() {
        const { count } = useContext()
        return <div data-testid="inner-count">{count}</div>
      }

      function OuterCounter() {
        const { count } = useContext()
        return (
          <div>
            <div data-testid="outer-count">{count}</div>
            <Provider initialCount={100}>
              <InnerCounter />
            </Provider>
          </div>
        )
      }

      render(
        <Provider initialCount={10}>
          <OuterCounter />
        </Provider>
      )

      expect(screen.getByTestId('outer-count')).toHaveTextContent('10')
      expect(screen.getByTestId('inner-count')).toHaveTextContent('100')
    })
  })

  describe('Performance and re-rendering', () => {
    it('should not cause unnecessary re-renders', () => {
      let renderCount = 0
      const useCounterProvider = () => {
        const [count, setCount] = React.useState(0)
        return { count, increment: () => setCount((c) => c + 1) }
      }

      const { Provider, useContext } = createReactCtx(useCounterProvider)

      function Counter() {
        renderCount++
        const { count } = useContext()
        return <div data-testid="count">{count}</div>
      }

      function Button() {
        const { increment } = useContext()
        return (
          <button data-testid="increment" onClick={increment}>
            +
          </button>
        )
      }

      render(
        <Provider>
          <Counter />
          <Button />
        </Provider>
      )

      const initialRenderCount = renderCount

      fireEvent.click(screen.getByTestId('increment'))

      expect(renderCount).toBe(initialRenderCount + 1)
    })

    it('should handle frequent state changes', () => {
      const useCounterProvider = () => {
        const [count, setCount] = React.useState(0)
        return {
          count,
          increment: () => setCount((c) => c + 1),
          multiply: (factor: number) => setCount((c) => c * factor),
        }
      }

      const { Provider, useContext } = createReactCtx(useCounterProvider)

      function Counter() {
        const { count, increment, multiply } = useContext()
        return (
          <div>
            <div data-testid="count">{count}</div>
            <button data-testid="increment" onClick={increment}>
              +
            </button>
            <button data-testid="multiply" onClick={() => multiply(2)}>
              x2
            </button>
          </div>
        )
      }

      render(
        <Provider>
          <Counter />
        </Provider>
      )

      expect(screen.getByTestId('count')).toHaveTextContent('0')

      for (let i = 0; i < 10; i++) {
        fireEvent.click(screen.getByTestId('increment'))
      }
      expect(screen.getByTestId('count')).toHaveTextContent('10')

      fireEvent.click(screen.getByTestId('multiply'))
      expect(screen.getByTestId('count')).toHaveTextContent('20')
    })
  })

  describe('Advanced context hook scenarios', () => {
    it('should handle context hook with side effects', () => {
      const sideEffects: string[] = []
      const contextHook = (action: string) => {
        sideEffects.push(`Hook: ${action}`)
      }

      const useCounterProvider = () => {
        const [count, setCount] = React.useState(0)
        return {
          count,
          increment: () => setCount((c) => c + 1),
        }
      }

      const { Provider, useContext } = createReactCtx(
        useCounterProvider,
        contextHook
      )

      function Counter() {
        const { count, increment } = useContext('read-count')
        React.useEffect(() => {
          sideEffects.push(`Effect: count is ${count}`)
        }, [count])

        return (
          <div>
            <div data-testid="count">{count}</div>
            <button
              data-testid="increment"
              onClick={() => {
                useContext('increment-count')
                increment()
              }}
            >
              +
            </button>
          </div>
        )
      }

      render(
        <Provider>
          <Counter />
        </Provider>
      )

      expect(sideEffects).toContain('Hook: read-count')
      expect(sideEffects).toContain('Effect: count is 0')

      fireEvent.click(screen.getByTestId('increment'))
      expect(sideEffects).toContain('Hook: increment-count')
      expect(sideEffects).toContain('Effect: count is 1')
    })

    it('should handle context hook that modifies behavior', () => {
      let debugMode = false
      const contextHook = (mode: 'debug' | 'normal') => {
        debugMode = mode === 'debug'
      }

      const useCounterProvider = () => {
        const [count, setCount] = React.useState(0)
        return {
          count,
          increment: () => setCount((c) => c + 1),
          getDebugInfo: () => (debugMode ? `Debug: ${count}` : 'Normal mode'),
        }
      }

      const { Provider, useContext } = createReactCtx(
        useCounterProvider,
        contextHook
      )

      function Counter() {
        const { count, increment, getDebugInfo } = useContext('normal')
        return (
          <div>
            <div data-testid="count">{count}</div>
            <div data-testid="debug">{getDebugInfo()}</div>
            <button data-testid="increment" onClick={increment}>
              +
            </button>
            <button
              data-testid="debug-mode"
              onClick={() => useContext('debug')}
            >
              Debug
            </button>
          </div>
        )
      }

      render(
        <Provider>
          <Counter />
        </Provider>
      )

      expect(screen.getByTestId('debug')).toHaveTextContent('Normal mode')

      fireEvent.click(screen.getByTestId('debug-mode'))
      expect(screen.getByTestId('debug')).toHaveTextContent('Debug: 0')
    })

    it('should work with context hook that throws errors', () => {
      const contextHook = (shouldThrow: boolean) => {
        if (shouldThrow) {
          throw new Error('Context hook error')
        }
      }

      const useCounterProvider = () => ({ count: 0 })
      const { Provider, useContext } = createReactCtx(
        useCounterProvider,
        contextHook
      )

      function SafeCounter() {
        try {
          const { count } = useContext(false)
          return <div data-testid="count">{count}</div>
        } catch {
          return <div data-testid="error">Error occurred</div>
        }
      }

      function ThrowingCounter() {
        const { count } = useContext(true)
        return <div data-testid="count">{count}</div>
      }

      render(
        <Provider>
          <SafeCounter />
        </Provider>
      )

      expect(screen.getByTestId('count')).toHaveTextContent('0')

      expect(() =>
        render(
          <Provider>
            <ThrowingCounter />
          </Provider>
        )
      ).toThrow('Context hook error')
    })
  })

  describe('Integration with React features', () => {
    it('should work with React.memo', () => {
      const useCounterProvider = () => {
        const [count, setCount] = React.useState(0)
        const [other, setOther] = React.useState(0)
        return {
          count,
          other,
          incrementCount: () => setCount((c) => c + 1),
          incrementOther: () => setOther((o) => o + 1),
        }
      }

      const { Provider, useContext } = createReactCtx(useCounterProvider)

      let memoRenderCount = 0
      const MemoCounter = React.memo(() => {
        memoRenderCount++
        const { count } = useContext()
        return <div data-testid="memo-count">{count}</div>
      })

      function OtherButton() {
        const { incrementOther } = useContext()
        return (
          <button data-testid="increment-other" onClick={incrementOther}>
            Other
          </button>
        )
      }

      render(
        <Provider>
          <MemoCounter />
          <OtherButton />
        </Provider>
      )

      const initialRenders = memoRenderCount
      fireEvent.click(screen.getByTestId('increment-other'))

      expect(memoRenderCount).toBe(initialRenders + 1)
    })

    it('should work with useEffect dependencies', () => {
      const effects: string[] = []
      const useCounterProvider = () => {
        const [count, setCount] = React.useState(0)
        return {
          count,
          increment: () => setCount((c) => c + 1),
        }
      }

      const { Provider, useContext } = createReactCtx(useCounterProvider)

      function Counter() {
        const { count, increment } = useContext()

        React.useEffect(() => {
          effects.push(`Effect: ${count}`)
        }, [count])

        return (
          <div>
            <div data-testid="count">{count}</div>
            <button data-testid="increment" onClick={increment}>
              +
            </button>
          </div>
        )
      }

      render(
        <Provider>
          <Counter />
        </Provider>
      )

      expect(effects).toContain('Effect: 0')

      fireEvent.click(screen.getByTestId('increment'))
      expect(effects).toContain('Effect: 1')

      fireEvent.click(screen.getByTestId('increment'))
      expect(effects).toContain('Effect: 2')
    })

    it('should work with conditional rendering', () => {
      const useToggleProvider = () => {
        const [show, setShow] = React.useState(true)
        const [count, setCount] = React.useState(0)
        return {
          show,
          count,
          toggle: () => setShow((s) => !s),
          increment: () => setCount((c) => c + 1),
        }
      }

      const { Provider, useContext } = createReactCtx(useToggleProvider)

      function ConditionalCounter() {
        const { show, count, toggle, increment } = useContext()
        return (
          <div>
            <button data-testid="toggle" onClick={toggle}>
              Toggle
            </button>
            {show && (
              <div>
                <div data-testid="count">{count}</div>
                <button data-testid="increment" onClick={increment}>
                  +
                </button>
              </div>
            )}
          </div>
        )
      }

      render(
        <Provider>
          <ConditionalCounter />
        </Provider>
      )

      expect(screen.getByTestId('count')).toHaveTextContent('0')

      fireEvent.click(screen.getByTestId('increment'))
      expect(screen.getByTestId('count')).toHaveTextContent('1')

      fireEvent.click(screen.getByTestId('toggle'))
      expect(screen.queryByTestId('count')).toBeNull()

      fireEvent.click(screen.getByTestId('toggle'))
      expect(screen.getByTestId('count')).toHaveTextContent('1')
    })
  })

  describe('Custom hook patterns', () => {
    it('should work as base for custom hooks', () => {
      const useCounterProvider = () => {
        const [count, setCount] = React.useState(0)
        return {
          count,
          increment: () => setCount((c) => c + 1),
          decrement: () => setCount((c) => c - 1),
        }
      }

      const { Provider, useContext } = createReactCtx(useCounterProvider)

      const useCounter = () => {
        const context = useContext()
        return {
          ...context,
          isPositive: context.count > 0,
          isZero: context.count === 0,
          double: () => {
            context.increment()
            context.increment()
          },
        }
      }

      function Counter() {
        const { count, increment, isPositive, isZero, double } = useCounter()
        return (
          <div>
            <div data-testid="count">{count}</div>
            <div data-testid="positive">{isPositive.toString()}</div>
            <div data-testid="zero">{isZero.toString()}</div>
            <button data-testid="increment" onClick={increment}>
              +1
            </button>
            <button data-testid="double" onClick={double}>
              +2
            </button>
          </div>
        )
      }

      render(
        <Provider>
          <Counter />
        </Provider>
      )

      expect(screen.getByTestId('count')).toHaveTextContent('0')
      expect(screen.getByTestId('positive')).toHaveTextContent('false')
      expect(screen.getByTestId('zero')).toHaveTextContent('true')

      fireEvent.click(screen.getByTestId('increment'))
      expect(screen.getByTestId('positive')).toHaveTextContent('true')
      expect(screen.getByTestId('zero')).toHaveTextContent('false')

      fireEvent.click(screen.getByTestId('double'))
      expect(screen.getByTestId('count')).toHaveTextContent('3')
    })

    it('should support selector pattern', () => {
      const useAppProvider = () => {
        const [state, setState] = React.useState({
          user: { name: 'John', age: 30 },
          settings: { theme: 'light', language: 'en' },
          data: { items: [1, 2, 3], loading: false },
        })

        return {
          state,
          updateUser: (updates: Partial<typeof state.user>) =>
            setState((prev) => ({
              ...prev,
              user: { ...prev.user, ...updates },
            })),
          updateSettings: (updates: Partial<typeof state.settings>) =>
            setState((prev) => ({
              ...prev,
              settings: { ...prev.settings, ...updates },
            })),
        }
      }

      const { Provider, useContext } = createReactCtx(useAppProvider)

      const useUser = () => {
        const { state, updateUser } = useContext()
        return { user: state.user, updateUser }
      }

      const useSettings = () => {
        const { state, updateSettings } = useContext()
        return { settings: state.settings, updateSettings }
      }

      function UserComponent() {
        const { user, updateUser } = useUser()
        return (
          <div>
            <div data-testid="user-name">{user.name}</div>
            <button
              data-testid="update-name"
              onClick={() => updateUser({ name: 'Jane' })}
            >
              Update Name
            </button>
          </div>
        )
      }

      function SettingsComponent() {
        const { settings, updateSettings } = useSettings()
        return (
          <div>
            <div data-testid="theme">{settings.theme}</div>
            <button
              data-testid="toggle-theme"
              onClick={() =>
                updateSettings({
                  theme: settings.theme === 'light' ? 'dark' : 'light',
                })
              }
            >
              Toggle Theme
            </button>
          </div>
        )
      }

      render(
        <Provider>
          <UserComponent />
          <SettingsComponent />
        </Provider>
      )

      expect(screen.getByTestId('user-name')).toHaveTextContent('John')
      expect(screen.getByTestId('theme')).toHaveTextContent('light')

      fireEvent.click(screen.getByTestId('update-name'))
      expect(screen.getByTestId('user-name')).toHaveTextContent('Jane')

      fireEvent.click(screen.getByTestId('toggle-theme'))
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    })
  })

  describe('Real-world scenarios', () => {
    it('should handle shopping cart functionality', () => {
      interface CartItem {
        id: number
        name: string
        price: number
        quantity: number
      }

      const useCartProvider = () => {
        const [items, setItems] = React.useState<CartItem[]>([])

        return {
          items,
          addItem: (item: Omit<CartItem, 'quantity'>) => {
            setItems((prev) => {
              const existing = prev.find((i) => i.id === item.id)
              if (existing) {
                return prev.map((i) =>
                  i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                )
              }
              return [...prev, { ...item, quantity: 1 }]
            })
          },
          removeItem: (id: number) =>
            setItems((prev) => prev.filter((i) => i.id !== id)),
          updateQuantity: (id: number, quantity: number) => {
            if (quantity <= 0) {
              setItems((prev) => prev.filter((i) => i.id !== id))
            } else {
              setItems((prev) =>
                prev.map((i) => (i.id === id ? { ...i, quantity } : i))
              )
            }
          },
          clearCart: () => setItems([]),
          getTotal: () =>
            items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        }
      }

      const { Provider, useContext } = createReactCtx(useCartProvider)

      function Cart() {
        const {
          items,
          addItem,
          removeItem,
          updateQuantity,
          clearCart,
          getTotal,
        } = useContext()

        return (
          <div>
            <div data-testid="item-count">{items.length}</div>
            <div data-testid="total">{getTotal()}</div>
            <button
              data-testid="add-item"
              onClick={() => addItem({ id: 1, name: 'Item 1', price: 10 })}
            >
              Add Item
            </button>
            <button
              data-testid="add-expensive"
              onClick={() => addItem({ id: 2, name: 'Item 2', price: 50 })}
            >
              Add Expensive
            </button>
            {items.length > 0 && (
              <button
                data-testid="remove-first"
                onClick={() => removeItem(items[0].id)}
              >
                Remove First
              </button>
            )}
            {items.length > 0 && (
              <button
                data-testid="increase-first"
                onClick={() =>
                  updateQuantity(items[0].id, items[0].quantity + 1)
                }
              >
                Increase First
              </button>
            )}
            <button data-testid="clear" onClick={clearCart}>
              Clear
            </button>
          </div>
        )
      }

      render(
        <Provider>
          <Cart />
        </Provider>
      )

      expect(screen.getByTestId('item-count')).toHaveTextContent('0')
      expect(screen.getByTestId('total')).toHaveTextContent('0')

      fireEvent.click(screen.getByTestId('add-item'))
      expect(screen.getByTestId('item-count')).toHaveTextContent('1')
      expect(screen.getByTestId('total')).toHaveTextContent('10')

      fireEvent.click(screen.getByTestId('add-item'))
      expect(screen.getByTestId('total')).toHaveTextContent('20')

      fireEvent.click(screen.getByTestId('add-expensive'))
      expect(screen.getByTestId('item-count')).toHaveTextContent('2')
      expect(screen.getByTestId('total')).toHaveTextContent('70')

      fireEvent.click(screen.getByTestId('increase-first'))
      expect(screen.getByTestId('total')).toHaveTextContent('80')

      fireEvent.click(screen.getByTestId('clear'))
      expect(screen.getByTestId('item-count')).toHaveTextContent('0')
      expect(screen.getByTestId('total')).toHaveTextContent('0')
    })

    it('should handle form state management', () => {
      interface FormData {
        name: string
        email: string
        age: number
        preferences: {
          newsletter: boolean
          notifications: boolean
        }
      }

      const useFormProvider = () => {
        const [data, setData] = React.useState<FormData>({
          name: '',
          email: '',
          age: 0,
          preferences: {
            newsletter: false,
            notifications: false,
          },
        })

        const [errors, setErrors] = React.useState<Partial<FormData>>({})

        return {
          data,
          errors,
          updateField: (field: keyof FormData, value: any) => {
            setData((prev) => ({ ...prev, [field]: value }))
            if (errors[field]) {
              setErrors((prev) => ({ ...prev, [field]: undefined }))
            }
          },
          updatePreference: (
            pref: keyof FormData['preferences'],
            value: boolean
          ) => {
            setData((prev) => ({
              ...prev,
              preferences: { ...prev.preferences, [pref]: value },
            }))
          },
          validate: () => {
            const newErrors: Partial<FormData> = {}
            if (!data.name) newErrors.name = 'Name is required'
            if (!data.email) newErrors.email = 'Email is required'
            if (data.age < 18) newErrors.age = 'Must be 18 or older'

            setErrors(newErrors)
            return Object.keys(newErrors).length === 0
          },
          reset: () => {
            setData({
              name: '',
              email: '',
              age: 0,
              preferences: { newsletter: false, notifications: false },
            })
            setErrors({})
          },
        }
      }

      const { Provider, useContext } = createReactCtx(useFormProvider)

      function Form() {
        const { data, errors, updateField, updatePreference, validate, reset } =
          useContext()

        return (
          <div>
            <div data-testid="name">{data.name}</div>
            <div data-testid="email">{data.email}</div>
            <div data-testid="age">{data.age}</div>
            <div data-testid="newsletter">
              {data.preferences.newsletter.toString()}
            </div>
            <div data-testid="errors">{Object.keys(errors).length}</div>

            <button
              data-testid="set-name"
              onClick={() => updateField('name', 'John')}
            >
              Set Name
            </button>
            <button
              data-testid="set-email"
              onClick={() => updateField('email', 'john@test.com')}
            >
              Set Email
            </button>
            <button
              data-testid="set-age"
              onClick={() => updateField('age', 25)}
            >
              Set Age
            </button>
            <button
              data-testid="toggle-newsletter"
              onClick={() =>
                updatePreference('newsletter', !data.preferences.newsletter)
              }
            >
              Toggle Newsletter
            </button>
            <button data-testid="validate" onClick={validate}>
              Validate
            </button>
            <button data-testid="reset" onClick={reset}>
              Reset
            </button>
          </div>
        )
      }

      render(
        <Provider>
          <Form />
        </Provider>
      )

      expect(screen.getByTestId('name')).toHaveTextContent('')
      expect(screen.getByTestId('newsletter')).toHaveTextContent('false')

      fireEvent.click(screen.getByTestId('validate'))
      expect(screen.getByTestId('errors')).toHaveTextContent('3')

      fireEvent.click(screen.getByTestId('set-name'))
      fireEvent.click(screen.getByTestId('set-email'))
      fireEvent.click(screen.getByTestId('set-age'))

      expect(screen.getByTestId('name')).toHaveTextContent('John')
      expect(screen.getByTestId('email')).toHaveTextContent('john@test.com')
      expect(screen.getByTestId('age')).toHaveTextContent('25')

      fireEvent.click(screen.getByTestId('validate'))
      expect(screen.getByTestId('errors')).toHaveTextContent('0')

      fireEvent.click(screen.getByTestId('toggle-newsletter'))
      expect(screen.getByTestId('newsletter')).toHaveTextContent('true')

      fireEvent.click(screen.getByTestId('reset'))
      expect(screen.getByTestId('name')).toHaveTextContent('')
      expect(screen.getByTestId('newsletter')).toHaveTextContent('false')
    })
  })
})

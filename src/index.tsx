import * as React from 'react'

function createReactCtx<
  TCtxProps extends object,
  TResult,
  THookProps extends unknown[] = []
>(
  useProvider: (props: TCtxProps) => TResult,
  useContextHook: (...input: THookProps) => void = () => {}
) {
  const ctx = React.createContext<NoInfer<TResult>>(
    undefined as NoInfer<TResult>
  )

  function useCtxHook(...input: THookProps) {
    const context = React.useContext(ctx)
    if (!context) throw new Error('useContext must be used within a Provider')

    useContextHook(...input)
    return context
  }

  function Provider({
    children,
    ...props
  }: TCtxProps & { children: React.ReactNode }) {
    const value = useProvider(props as TCtxProps)
    return <ctx.Provider value={value}>{children}</ctx.Provider>
  }

  return {
    ctx,
    Provider,
    use: useCtxHook as (...input: THookProps) => TResult,
  }
}

export { createReactCtx }
export default createReactCtx

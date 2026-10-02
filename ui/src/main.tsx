import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import { createPluginHostClient, type AccountSnapshot } from '@wonderland/plugin-ui-sdk'

import { MyWonderlandPage } from './index'
import type { WonderlandApi } from './index'
import type { Scope, Series } from './types.generated'
import './host.css'

// Presentation hint only; Core enforces remote authorization independently.
document.documentElement.dataset.wonderlandRemote = String(new URLSearchParams(location.search).get('wonderlandClient') === 'web')

const host = createPluginHostClient('my_wonderland')

const api: WonderlandApi = {
  accountSnapshot: () => host.call<AccountSnapshot>('account_snapshot'),
  collect: (scope: Scope) => host.call<Series>('collect', { scope }),
  series: (scope: Scope) => host.call<Series | null>('series', { scope }),
}

function App() {
  const [snapshot, setSnapshot] = useState<AccountSnapshot | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let disposed = false
    let stopTheme: () => void = () => {}
    let stopLifecycle: () => void = () => {}
    void host.followHostTheme(({ resolved }) => {
      document.documentElement.dataset.theme = resolved
    }).then((stop) => {
      if (disposed) stop()
      else stopTheme = stop
    })
    void host.onSurfaceLifecycle((state) => {
      document.documentElement.dataset.surfaceState = state
    }).then((stop) => {
      if (disposed) stop()
      else stopLifecycle = stop
    })
    void api.accountSnapshot().then((value) => {
      if (!disposed) setSnapshot(value)
    }).catch((cause: unknown) => {
      if (!disposed) setError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => {
      disposed = true
      stopTheme()
      stopLifecycle()
    }
  }, [])

  return error && !snapshot
    ? <p role="alert">{error}</p>
    : <MyWonderlandPage api={api} snapshot={snapshot} />
}

createRoot(document.getElementById('root')!).render(<App />)

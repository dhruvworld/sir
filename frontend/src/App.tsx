import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { LogsView } from './components/LogsView'
import { ResultsTable } from './components/ResultsTable'
import { SearchForm } from './components/SearchForm'
import { SummaryBar } from './components/SummaryBar'
import { useVoterSearch } from './hooks/useVoterSearch'

function App() {
  const [isLogsRoute, setIsLogsRoute] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.location.pathname.startsWith('/logs') : false,
  )

  const updateRoute = useCallback(() => {
    setIsLogsRoute(window.location.pathname.startsWith('/logs'))
  }, [])

  useEffect(() => {
    // Check on mount
    updateRoute()
    
    // Listen for route changes (popstate for back/forward, pushState/replaceState for navigation)
    window.addEventListener('popstate', updateRoute)
    
    // Override pushState and replaceState to detect navigation
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args)
      // Use setTimeout to ensure state update happens after pushState
      setTimeout(updateRoute, 0)
    }
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args)
      setTimeout(updateRoute, 0)
    }
    
    return () => {
      window.removeEventListener('popstate', updateRoute)
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
    }
  }, [updateRoute])

  // Hidden access to logs: Press Ctrl+L (or Cmd+L on Mac)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'l' && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        window.history.pushState({}, '', '/logs')
        // Directly update state instead of relying on event
        updateRoute()
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [updateRoute])

  if (isLogsRoute) {
    return <LogsView />
  }

  const { params, data, summary, meta, isLoading, error, runSearch, updateParams, reset } =
    useVoterSearch()
  const hasResults = !!data && data.results.length > 0
  const limitedView = !!data?.limited

  return (
    <div className="page">
      <header>
        <div>
          <p className="eyebrow">Kalol • Gandhinagar District • 2002 rolls</p>
          <h1>Find voters instantly (Gujarati search only)</h1>
          <p className="lede">Type Gujarati smart search keywords and optional access pass.</p>
        </div>
      </header>

      <SearchForm
        params={params}
        isLoading={isLoading}
        onChange={(field, value) => updateParams({ [field]: value })}
        onSearch={() => runSearch()}
        onReset={() => {
          reset()
        }}
      />

      <SummaryBar
        datasetSize={meta?.total_records}
        total={summary?.totalMatches}
        returned={summary?.returned}
      />

      {limitedView && (
        <div className="banner warning">
          Showing limited details. Add the pass to view full voter information.
        </div>
      )}

      {error && <div className="banner error">{error}</div>}

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner" />
            <p>Searching records…</p>
          </div>
        </div>
      )}

      {!hasResults && !isLoading && !error && (
        <div className="empty-state">
          <h2>Ready when you are</h2>
          <p>Fill any field above and press Search to see matching voters.</p>
        </div>
      )}

      {hasResults && !isLoading && <ResultsTable records={data!.results} limited={limitedView} />}
    </div>
  )
}

export default App

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    const handle = () => {
      setIsLogsRoute(window.location.pathname.startsWith('/logs'))
    }
    handle()
  }, [])

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
      {isLoading && <div className="banner info">Searching records…</div>}

      {!hasResults && !isLoading && !error && (
        <div className="empty-state">
          <h2>Ready when you are</h2>
          <p>Fill any field above and press Search to see matching voters.</p>
        </div>
      )}

      {hasResults && <ResultsTable records={data!.results} limited={limitedView} />}
    </div>
  )
}

export default App

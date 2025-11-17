import './App.css'
import { SearchForm } from './components/SearchForm'
import { ResultsTable } from './components/ResultsTable'
import { SummaryBar } from './components/SummaryBar'
import { useVoterSearch } from './hooks/useVoterSearch'

function App() {
  const { params, data, summary, meta, isLoading, error, runSearch, updateParams, reset } =
    useVoterSearch()
  const hasResults = !!data && data.results.length > 0

  return (
    <div className="page">
      <header>
        <div>
          <p className="eyebrow">Kalol • Gandhinagar District • 2002 rolls</p>
          <h1>Find voters instantly</h1>
          <p className="lede">
            Search by voter name, relative name, EPIC number or house number. 
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

      {error && <div className="banner error">{error}</div>}
      {isLoading && <div className="banner info">Searching records…</div>}

      {!hasResults && !isLoading && !error && (
        <div className="empty-state">
          <h2>Ready when you are</h2>
          <p>Fill any field above and press Search to see matching voters.</p>
        </div>
      )}

      {hasResults && <ResultsTable records={data!.results} />}
    </div>
  )
}

export default App

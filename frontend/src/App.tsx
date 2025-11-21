import { useCallback, useEffect, useState, lazy, Suspense } from 'react'
import './App.css'
import { LogsView } from './components/LogsView'
import { ResultsActions } from './components/ResultsActions'
import { SearchForm } from './components/SearchForm'
import { StructuredSearchCard } from './components/StructuredSearchCard'
import { SummaryBar } from './components/SummaryBar'
import { useFilterOptions } from './hooks/useFilterOptions'
import { useVoterSearch } from './hooks/useVoterSearch'
import type { SearchParams } from './types'

// Lazy load heavy components
const ResultsTable = lazy(() => import('./components/ResultsTable').then(m => ({ default: m.ResultsTable })))

function App() {
  // Use pathname directly in state to force re-render on change
  const [pathname, setPathname] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/',
  )

  const isLogsRoute = pathname.startsWith('/logs')

  const updateRoute = useCallback(() => {
    const newPath = window.location.pathname
    setPathname(newPath)
  }, [])

  useEffect(() => {
    // Check on mount
    updateRoute()
    
    // Listen for route changes
    window.addEventListener('popstate', updateRoute)
    
    // Override pushState and replaceState to detect navigation
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args)
      // Immediately update route
      updateRoute()
    }
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args)
      updateRoute()
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
      // Only handle if not in an input field
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'l' && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        e.stopPropagation()
        // Update state first, then pushState
        setPathname('/logs')
        window.history.pushState({}, '', '/logs')
        // Force update
        updateRoute()
      }
    }
    
    window.addEventListener('keydown', handleKeyPress, true)
    return () => window.removeEventListener('keydown', handleKeyPress, true)
  }, [updateRoute])

  if (isLogsRoute) {
    return <LogsView key="logs-view" />
  }

  const { params, data, summary, meta, isLoading, error, runSearch, updateParams, reset } =
    useVoterSearch()
  const filterOptions = useFilterOptions()
  const [searchMode, setSearchMode] = useState<'smart' | 'dropdown'>('smart')
  const hasResults = !!data && data.results.length > 0
  const limitedView = !!data?.limited

  useEffect(() => {
    if (params.polling_station_booth || params.page_no) {
      setSearchMode('dropdown')
    } else if (params.q) {
      setSearchMode('smart')
    }
  }, [params.polling_station_booth, params.page_no, params.q])

  const handleStructuredChange = (
    field: 'polling_station_booth' | 'page_no' | 'pass',
    value: string,
  ) => {
    if (field === 'polling_station_booth') {
      const updates: Partial<SearchParams> = { polling_station_booth: value }
      if (!value) {
        updates.page_no = ''
      } else {
        // Clear page_no when polling_station_booth changes
        const allowedPages = value
          ? filterOptions.options?.pollingStationBoothToPages?.[value] ?? []
          : []
        if (params.page_no && allowedPages.length > 0 && !allowedPages.includes(params.page_no)) {
          updates.page_no = ''
        }
      }
      updateParams(updates)
      return
    }

    updateParams({ [field]: value })
  }

  const handleStructuredSearch = () => {
    runSearch({
      q: '',
      polling_station_booth: params.polling_station_booth,
      page_no: params.page_no,
      pass: params.pass,
    })
  }

  const handleStructuredClear = () => {
    updateParams({
      polling_station_booth: '',
      page_no: '',
    })
  }

  const handleClear = () => {
    reset()
    setSearchMode('smart')
  }

  return (
    <div className="page">
      <header>
        <div>
          <p className="eyebrow">Kalol • Gandhinagar District • 2002 rolls</p>
          <h1>Find voters instantly (Gujarati search only)</h1>
        </div>
      </header>

      <div className="search-container">
        <form className="search-form unified-form" onSubmit={(e) => { e.preventDefault(); runSearch(); }}>
          {filterOptions.optionsLoading && <div className="banner info">Loading dropdown values…</div>}
          {filterOptions.optionsError && <div className="banner error">{filterOptions.optionsError}</div>}
          
          <div className="unified-search-fields">
            {/* Smart Search Field */}
            <label className="field field-with-icon">
              <span>Smart search</span>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={params.q ?? ''}
                  placeholder="Name, relative name, house no, EPIC no…"
                  onChange={(e) => updateParams({ q: e.target.value })}
                />
                <svg
                  className="field-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </label>

            {/* Dropdown: Polling Station - Booth */}
            <label className="field">
              <span>Polling station - Booth no</span>
              <select
                value={params.polling_station_booth ?? ''}
                onChange={(e) => {
                  const value = e.target.value
                  handleStructuredChange('polling_station_booth', value)
                }}
              >
                <option value="">Select polling station and booth…</option>
                {filterOptions.options?.pollingStationBooths?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </label>

            {/* Dropdown: Page No */}
            <label className={`field ${!params.polling_station_booth ? 'field-disabled' : ''}`}>
              <span>Page no</span>
              <select
                value={params.page_no ?? ''}
                onChange={(e) => handleStructuredChange('page_no', e.target.value)}
                disabled={!params.polling_station_booth}
              >
                <option value="">Select page…</option>
                {params.polling_station_booth && filterOptions.options?.pollingStationBoothToPages?.[params.polling_station_booth]?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </label>

            {/* Pass Field */}
            <label className="field field-with-icon pass-field">
              <span>Pass</span>
              <div className="input-wrapper">
                <input
                  type="password"
                  value={params.pass ?? ''}
                  placeholder="Access pass"
                  onChange={(e) => updateParams({ pass: e.target.value })}
                />
                <svg
                  className="field-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="button-pill primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="loading-spinner" />
                  Searching…
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Search
                </>
              )}
            </button>
            <button
              type="button"
              className="button-pill secondary"
              onClick={handleClear}
              disabled={isLoading}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

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

      {hasResults && !isLoading && (
        <>
          <ResultsActions records={data!.results} limited={limitedView} />
          <Suspense fallback={<div className="loading-overlay"><div className="loading-content"><div className="loading-spinner" /><p>Loading results…</p></div></div>}>
            <ResultsTable records={data!.results} limited={limitedView} />
          </Suspense>
        </>
      )}
    </div>
  )
}

export default App

import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { LogsView } from './components/LogsView'
import { ResultsActions } from './components/ResultsActions'
import { ResultsTable } from './components/ResultsTable'
import { SearchForm } from './components/SearchForm'
import { StructuredSearchCard } from './components/StructuredSearchCard'
import { SummaryBar } from './components/SummaryBar'
import { useFilterOptions } from './hooks/useFilterOptions'
import { useVoterSearch } from './hooks/useVoterSearch'
import type { SearchParams } from './types'

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
  const [showStructuredSearch, setShowStructuredSearch] = useState(false)
  const hasResults = !!data && data.results.length > 0
  const limitedView = !!data?.limited

  useEffect(() => {
    if (params.polling_station_booth || params.page_no) {
      setShowStructuredSearch(true)
    }
  }, [params.polling_station_booth, params.page_no])

  const handleStructuredChange = (
    field: 'polling_station_booth' | 'page_no',
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
    })
  }

  const handleStructuredClear = () => {
    updateParams({
      polling_station_booth: '',
      page_no: '',
    })
  }

  return (
    <div className="page">
      <header>
        <div>
          <p className="eyebrow">Kalol • Gandhinagar District • 2002 rolls</p>
          <h1>Find voters instantly (Gujarati search only)</h1>
          <p className="lede">
            Type Gujarati smart search keywords and optional access pass. Prefer dropdowns? Use the
            detail search panel below.
          </p>
        </div>
      </header>

      <StructuredSearchCard
        isVisible={showStructuredSearch}
        onToggle={() => setShowStructuredSearch((prev) => !prev)}
        options={filterOptions.options}
        optionsLoading={filterOptions.isLoading}
        optionsError={filterOptions.error}
        values={{
          polling_station_booth: params.polling_station_booth ?? '',
          page_no: params.page_no ?? '',
        }}
        isSearching={isLoading}
        onChange={handleStructuredChange}
        onSubmit={handleStructuredSearch}
        onClear={handleStructuredClear}
      />

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

      {hasResults && !isLoading && (
        <>
          <ResultsActions records={data!.results} limited={limitedView} />
          <ResultsTable records={data!.results} limited={limitedView} />
        </>
      )}
    </div>
  )
}

export default App

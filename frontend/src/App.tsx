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
    if (params.booth_no || params.polling_station_name || params.page_no) {
      setShowStructuredSearch(true)
    }
  }, [params.booth_no, params.polling_station_name, params.page_no])

  const handleStructuredChange = (
    field: 'booth_no' | 'polling_station_name' | 'page_no',
    value: string,
  ) => {
    if (field === 'polling_station_name') {
      const updates: Partial<SearchParams> = { polling_station_name: value }
      const allowedBooths = value
        ? filterOptions.options?.stationToBooths?.[value] ?? []
        : []

      if (!value) {
        updates.booth_no = ''
        updates.page_no = ''
      } else {
        if (params.booth_no && allowedBooths.length > 0 && !allowedBooths.includes(params.booth_no)) {
          updates.booth_no = ''
        }
        if (params.page_no) {
          updates.page_no = ''
        }
      }

      updateParams(updates)
      return
    }

    if (field === 'booth_no') {
      const updates: Partial<SearchParams> = { booth_no: value }
      if (value) {
        const autoStation = filterOptions.options?.boothToStation?.[value]
        if (autoStation) {
          updates.polling_station_name = autoStation
        }
        const allowedPages = filterOptions.options?.boothToPages?.[value] ?? []
        if (params.page_no && allowedPages.length > 0 && !allowedPages.includes(params.page_no)) {
          updates.page_no = ''
        }
      } else {
        updates.page_no = ''
      }
      updateParams(updates)
      return
    }

    updateParams({ [field]: value })
  }

  const handleStructuredSearch = () => {
    runSearch({
      q: '',
      booth_no: params.booth_no,
      polling_station_name: params.polling_station_name,
      page_no: params.page_no,
    })
  }

  const handleStructuredClear = () => {
    updateParams({
      booth_no: '',
      polling_station_name: '',
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
          booth_no: params.booth_no ?? '',
          polling_station_name: params.polling_station_name ?? '',
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

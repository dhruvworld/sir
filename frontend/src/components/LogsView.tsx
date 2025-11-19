import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchSearchLogs } from '../api'
import type { SearchLogEntry } from '../types'

const PASS_STORAGE_KEY = 'sircheck-logs-pass'

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

const summarizeEntries = (entries: SearchLogEntry[]) => {
  const totalSearches = entries.length
  const passUses = entries.filter((entry) => entry.passProvided).length
  const uniqueVisitors = new Set(entries.map((entry) => entry.visitorId || entry.ip || '')).size
  return { totalSearches, passUses, uniqueVisitors }
}

export const LogsView = () => {
  const [password, setPassword] = useState('')
  const [entries, setEntries] = useState<SearchLogEntry[]>([])
  const [isAuthed, setIsAuthed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadEntries = useCallback(
    async (pass: string) => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchSearchLogs(pass)
        setEntries(data)
        setIsAuthed(true)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(PASS_STORAGE_KEY, pass)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load logs'
        setError(message)
        setIsAuthed(false)
        setEntries([])
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem(PASS_STORAGE_KEY)
    if (saved) {
      setPassword(saved)
      loadEntries(saved)
    }
  }, [loadEntries])

  const summary = useMemo(() => summarizeEntries(entries), [entries])

  if (!isAuthed) {
    return (
      <div className="logs-page">
        <div className="logs-card">
          <h1>Logs access</h1>
          <p>Enter the pass to review search activity.</p>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              loadEntries(password.trim())
            }}
          >
            <label className="field field-with-icon">
              <span>Access pass</span>
              <div className="input-wrapper">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter pass"
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
            <button type="submit" className="primary" disabled={isLoading}>
              {isLoading ? 'Checking…' : 'Unlock'}
            </button>
          </form>
          {error && <p className="logs-error">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="logs-page">
      <div className="logs-header">
        <div>
          <h1>Search activity</h1>
          <p>Showing the most recent {entries.length} logs.</p>
        </div>
        <div className="logs-actions">
          <button type="button" className="secondary" onClick={() => loadEntries(password)}>
            Refresh
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setIsAuthed(false)
              setPassword('')
              if (typeof window !== 'undefined') {
                window.localStorage.removeItem(PASS_STORAGE_KEY)
              }
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="logs-summary">
        <div>
          <span>Total searches</span>
          <strong>{summary.totalSearches}</strong>
        </div>
        <div>
          <span>Pass used</span>
          <strong>{summary.passUses}</strong>
        </div>
        <div>
          <span>Unique visitors</span>
          <strong>{summary.uniqueVisitors}</strong>
        </div>
      </div>

      <div className="results-wrapper">
        <table className="results-table logs-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Query</th>
              <th>Visitor</th>
              <th>Location</th>
              <th>Totals</th>
              <th>Pass</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{formatDate(entry.timestamp)}</td>
                <td>{entry.query || '—'}</td>
                <td>{entry.visitorId || entry.ip || '—'}</td>
                <td>
                  {[entry.city, entry.region, entry.country].filter(Boolean).join(', ') || '—'}
                </td>
                <td>
                  Total {entry.results?.total ?? '—'} / Returned {entry.results?.returned ?? '—'}{' '}
                  {entry.results?.limited ? '(limited)' : ''}
                </td>
                <td>{entry.passProvided ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


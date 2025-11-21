import { useCallback, useEffect, useMemo, useState } from 'react'
import { searchVoters, fetchMeta, logSearchEvent } from '../api'
import type { SearchParams, SearchResponse } from '../types'

const defaultParams: SearchParams = {
  pass: '',
  q: '',
  booth_no: '',
  polling_station_name: '',
  page_no: '',
}

const describeQuery = (current: SearchParams) => {
  const parts: string[] = []
  if (current.q?.trim()) parts.push(`q=${current.q.trim()}`)
  if (current.booth_no?.trim()) parts.push(`booth=${current.booth_no.trim()}`)
  if (current.polling_station_name?.trim())
    parts.push(`polling=${current.polling_station_name.trim()}`)
  if (current.page_no?.trim()) parts.push(`page=${current.page_no.trim()}`)
  if (parts.length === 0) return 'empty'
  return parts.join(' | ')
}

const VISITOR_ID_KEY = 'sircheck-visitor-id'

const generateVisitorId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const getVisitorId = () => {
  if (typeof window === 'undefined') return 'anonymous'
  const stored = window.localStorage.getItem(VISITOR_ID_KEY)
  if (stored) return stored
  const newId = generateVisitorId()
  window.localStorage.setItem(VISITOR_ID_KEY, newId)
  return newId
}

export const useVoterSearch = () => {
  const [visitorId] = useState<string>(() => getVisitorId())
  const [params, setParams] = useState<SearchParams>({ ...defaultParams })
  const [meta, setMeta] = useState<{ total_records: number } | null>(null)
  const [data, setData] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Defer meta loading to avoid blocking initial render
    const loadMeta = async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
      fetchMeta()
        .then(setMeta)
        .catch(() => setMeta(null))
    }
    loadMeta()
  }, [])

  const runSearch = useCallback(
    async (overrides?: Partial<SearchParams>) => {
      const nextParams = { ...params, ...overrides }
      setParams(nextParams)
      setIsLoading(true)
      setError(null)
      try {
        const response = await searchVoters(nextParams)
        setData(response)
        logSearchEvent({
          visitorId,
          query: describeQuery(nextParams),
          passProvided: Boolean(nextParams.pass?.trim()),
          results: {
            total: response.total,
            returned: response.returned,
            limited: response.limited,
          },
        }).catch(() => undefined)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        setData(null)
      } finally {
        setIsLoading(false)
      }
    },
    [params, visitorId],
  )

  const updateParams = useCallback((partial: Partial<SearchParams>) => {
    setParams((prev) => ({ ...prev, ...partial }))
  }, [])

  const reset = useCallback(() => {
    setParams({ ...defaultParams })
    setData(null)
    setError(null)
  }, [])

  const summary = useMemo(() => {
    if (!data) return null
    return {
      totalMatches: data.total,
      returned: data.returned,
      limited: data.limited,
    }
  }, [data])

  return {
    params,
    meta,
    data,
    summary,
    isLoading,
    error,
    updateParams,
    runSearch,
    reset,
  }
}


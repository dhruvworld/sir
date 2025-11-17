import { useCallback, useEffect, useMemo, useState } from 'react'
import { searchVoters, fetchMeta } from '../api'
import type { SearchParams, SearchResponse } from '../types'

const defaultParams: SearchParams = {
  q: '',
  epic_no: '',
  house_no: '',
  limit: null,
}

export const useVoterSearch = () => {
  const [params, setParams] = useState<SearchParams>({ ...defaultParams })
  const [meta, setMeta] = useState<{ total_records: number } | null>(null)
  const [data, setData] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMeta()
      .then(setMeta)
      .catch(() => setMeta(null))
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
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        setData(null)
      } finally {
        setIsLoading(false)
      }
    },
    [params],
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


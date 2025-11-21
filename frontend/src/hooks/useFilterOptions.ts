import { useEffect, useState } from 'react'
import { fetchFilterOptions } from '../api'
import type { FilterOptionsResponse } from '../types'

export const useFilterOptions = () => {
  const [options, setOptions] = useState<FilterOptionsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      // Defer loading to avoid blocking initial render
      await new Promise(resolve => setTimeout(resolve, 0))
      if (cancelled) return
      
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetchFilterOptions()
        if (!cancelled) {
          setOptions(response)
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load dropdown values right now.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { options, isLoading, error }
}



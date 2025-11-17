import type { SearchLogPayload, SearchParams, SearchResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

const buildEndpoint = (path: string) => {
  if (API_BASE_URL) {
    return `${API_BASE_URL}${path}`
  }
  return `/.netlify/functions${path}`
}

const buildQueryString = (params: SearchParams): string => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    const trimmedValue = typeof value === 'string' ? value.trim() : value
    if (trimmedValue === '' || trimmedValue === null) return
    searchParams.append(key, String(trimmedValue))
  })
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ''
}

export const searchVoters = async (params: SearchParams): Promise<SearchResponse> => {
  const response = await fetch(`${buildEndpoint('/search')}${buildQueryString(params)}`)
  if (!response.ok) {
    throw new Error('Unable to fetch voter data. Please try again.')
  }
  return response.json()
}

export const fetchMeta = async (): Promise<{ total_records: number }> => {
  const response = await fetch(buildEndpoint('/meta'))
  if (!response.ok) {
    throw new Error('Unable to fetch dataset metadata.')
  }
  return response.json()
}

export const logSearchEvent = async (payload: SearchLogPayload): Promise<void> => {
  try {
    await fetch(buildEndpoint('/log-search'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.warn('Unable to log search event', error)
  }
}


import type {
  FilterOptionsResponse,
  SearchLogEntry,
  SearchLogPayload,
  SearchParams,
  SearchResponse,
} from './types'

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

// Cache meta in memory
let metaCache: { total_records: number } | null = null
let metaCacheTime: number = 0
const META_CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export const fetchMeta = async (): Promise<{ total_records: number }> => {
  const now = Date.now()
  
  // Return cached meta if available and fresh
  if (metaCache && (now - metaCacheTime) < META_CACHE_DURATION) {
    return metaCache
  }
  
  const response = await fetch(buildEndpoint('/meta'), {
    cache: 'default',
  })
  if (!response.ok) {
    throw new Error('Unable to fetch dataset metadata.')
  }
  const data = await response.json()
  
  // Cache the response
  metaCache = data
  metaCacheTime = now
  
  return data
}

// Cache options in memory to avoid repeated requests
let optionsCache: FilterOptionsResponse | null = null
let optionsCacheTime: number = 0
const OPTIONS_CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export const fetchFilterOptions = async (): Promise<FilterOptionsResponse> => {
  const now = Date.now()
  
  // Return cached options if available and fresh
  if (optionsCache && (now - optionsCacheTime) < OPTIONS_CACHE_DURATION) {
    return optionsCache
  }
  
  const response = await fetch(buildEndpoint('/options'), {
    // Use browser cache if available
    cache: 'default',
  })
  if (!response.ok) {
    throw new Error('Unable to load dropdown values.')
  }
  const data = await response.json()
  
  // Cache the response
  optionsCache = data
  optionsCacheTime = now
  
  return data
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

export const fetchSearchLogs = async (password: string): Promise<SearchLogEntry[]> => {
  try {
    const response = await fetch(buildEndpoint('/get-logs'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pass: password }),
    })

    if (response.status === 401) {
      throw new Error('Incorrect password')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || errorData.details || 'Unable to load logs'
      throw new Error(errorMessage)
    }

    const data = await response.json()
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return data
    }
    
    if (data.entries && Array.isArray(data.entries)) {
      return data.entries
    }
    
    return []
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Unable to load logs. Please check if Netlify Blobs is configured.')
  }
}


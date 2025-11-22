import type { Handler } from '@netlify/functions'
import { loadVoters } from './lib/data'

// Cache meta since it doesn't change often
let cachedMeta: { total_records: number } | null = null
let metaCacheTimestamp: number = 0
const META_CACHE_TTL = 30 * 60 * 1000 // 30 minutes cache

export const handler: Handler = async () => {
  const now = Date.now()
  
  // Return cached meta if available and fresh
  if (cachedMeta && (now - metaCacheTimestamp) < META_CACHE_TTL) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=1800', // 30 minutes browser cache
      },
      body: JSON.stringify(cachedMeta),
    }
  }
  
  const voters = loadVoters()
  cachedMeta = { total_records: voters.length }
  metaCacheTimestamp = now
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=1800', // 30 minutes browser cache
    },
    body: JSON.stringify(cachedMeta),
  }
}

export default handler


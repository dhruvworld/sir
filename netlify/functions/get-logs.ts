import type { Handler } from '@netlify/functions'
import { getStore } from '@netlify/blobs'

const ADMIN_PASS = '0613'
const MAX_ENTRIES = 200

const parseBody = (body: string | null): { pass?: string } | null => {
  if (!body) return null
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

export const handler: Handler = async (event) => {
  try {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
      },
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  const payload = parseBody(event.body ?? '')
  const providedPass = payload?.pass ?? ''

  if (providedPass !== ADMIN_PASS) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Unauthorized' }),
    }
  }

  let store
  try {
    store = getStore({ name: 'search-logs' })
  } catch (err) {
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Blobs not configured', 
        details: 'Please enable Netlify Blobs and create a store named "search-logs". See ENABLE_BLOBS_GUIDE.md for detailed steps.'
      }),
    }
  }

  let list
  try {
    list = await store.list()
  } catch (err) {
    console.error('Failed to list blobs', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Failed to list logs',
        details: err instanceof Error ? err.message : 'Unknown error. Make sure Blobs is enabled.'
      }),
    }
  }

  // Filter to only log keys and sort by timestamp (newest first)
  const blobs = list.blobs || []
  const logBlobs = blobs
    .filter((blob: any) => blob.key && blob.key.startsWith('log:'))
    .sort((a: any, b: any) => {
      // Extract timestamp from key format: log:timestamp:id
      const aTime = parseInt(a.key?.split(':')[1]) || (a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0)
      const bTime = parseInt(b.key?.split(':')[1]) || (b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0)
      return bTime - aTime
    })
    .slice(0, MAX_ENTRIES)

  const entries = await Promise.all(
    logBlobs.map(async (blob: any) => {
      try {
        const entry = await store.get(blob.key, { type: 'json' })
        return entry
      } catch (err) {
        console.error(`Failed to get blob ${blob.key}`, err)
        return null
      }
    }),
  )

  // Filter out null entries
  const validEntries = entries.filter((entry) => entry !== null)

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ entries: validEntries }),
  }
  } catch (error) {
    console.error('Failed to load logs', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Server error', details: (error as Error).message }),
    }
  }
}

export default handler


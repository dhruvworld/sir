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
        details: 'Please enable Netlify Blobs in your site settings: Site settings > Build & deploy > Environment > Enable Blobs'
      }),
    }
  }

  const list = await store.list()
  const sorted = [...list.blobs].sort((a, b) => {
    const aTime = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0
    const bTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0
    return bTime - aTime
  })

  const limited = sorted.slice(0, MAX_ENTRIES)

  const entries = await Promise.all(
    limited.map(async (blob) => {
      const entry = await store.get(blob.key, { type: 'json' })
      return entry
    }),
  )

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ entries }),
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


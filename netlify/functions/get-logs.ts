import type { Handler } from '@netlify/functions'
import { getStore } from '@netlify/blobs'

const ADMIN_PASS = '0613'
const MAX_ENTRIES = 200

const store = getStore({ name: 'search-logs' })

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,x-admin-pass',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
      },
    }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  const providedPass =
    Object.entries(event.headers || {}).find(([key]) => key.toLowerCase() === 'x-admin-pass')?.[1] ||
    ''

  if (providedPass !== ADMIN_PASS) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Unauthorized' }),
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
}

export default handler


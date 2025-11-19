import type { Handler } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import { randomUUID } from 'node:crypto'

type SearchLogPayload = {
  visitorId?: string
  query?: string
  passProvided?: boolean
  results?: {
    total?: number
    returned?: number
    limited?: boolean
  }
}

const parseBody = (body: string | null): SearchLogPayload | null => {
  if (!body) return null
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
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
  if (!payload) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Invalid JSON payload' }),
    }
  }

  const ip =
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['client-ip'] ||
    event.headers['x-forwarded-for'] ||
    ''

  const userAgent = event.headers['user-agent'] || ''
  const geo = event.context.geo || {}

  const entry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ip,
    userAgent,
    country: geo?.country?.code ?? null,
    region: geo?.subdivision?.code ?? null,
    city: geo?.city ?? null,
    visitorId: payload.visitorId ?? null,
    query: payload.query ?? '',
    passProvided: Boolean(payload.passProvided),
    results: payload.results ?? null,
  }

  // Store log using Netlify Blobs
  // Note: Blobs store "search-logs" must be created in Netlify dashboard
  // See ENABLE_BLOBS_GUIDE.md for detailed instructions
  try {
    const store = getStore({ name: 'search-logs' })
    const key = `log:${Date.now()}:${entry.id}`
    await store.set(key, JSON.stringify(entry))
  } catch (err) {
    // Silently fail if Blobs is not configured - logs just won't be saved
    console.warn('Blobs store not configured. Enable Blobs and create "search-logs" store. See ENABLE_BLOBS_GUIDE.md')
  }

  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ success: true }),
  }
}

export default handler


import type { Handler } from '@netlify/functions'
import fs from 'node:fs'
import path from 'node:path'

// Pre-computed meta cache (loaded once, stays in memory)
let cachedMeta: { total_records: number } | null = null

const resolveMetaPath = (): string => {
  const root = process.env.LAMBDA_TASK_ROOT
    ? path.join(process.env.LAMBDA_TASK_ROOT, 'data')
    : path.join(process.cwd(), 'data')
  return path.join(root, 'meta.json')
}

const loadMeta = (): { total_records: number } => {
  // Return cached if already loaded
  if (cachedMeta) {
    return cachedMeta
  }
  
  const filePath = resolveMetaPath()
  const raw = fs.readFileSync(filePath, 'utf-8')
  cachedMeta = JSON.parse(raw)
  return cachedMeta
}

export const handler: Handler = async () => {
  // Load pre-computed meta (instant - just reads a tiny JSON file)
  const meta = loadMeta()
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600', // 1 hour browser cache
    },
    body: JSON.stringify(meta),
  }
}

export default handler


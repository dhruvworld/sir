import type { Handler } from '@netlify/functions'
import fs from 'node:fs'
import path from 'node:path'

// Pre-computed options cache (loaded once, stays in memory)
let cachedOptions: any = null

const resolveOptionsPath = (): string => {
  const root = process.env.LAMBDA_TASK_ROOT
    ? path.join(process.env.LAMBDA_TASK_ROOT, 'data')
    : path.join(process.cwd(), 'data')
  return path.join(root, 'options.json')
}

const loadOptions = (): any => {
  // Return cached if already loaded
  if (cachedOptions) {
    return cachedOptions
  }
  
  const filePath = resolveOptionsPath()
  const raw = fs.readFileSync(filePath, 'utf-8')
  cachedOptions = JSON.parse(raw)
  return cachedOptions
}

export const handler: Handler = async () => {
  // Load pre-computed options (instant - just reads a 58KB file)
  const options = loadOptions()

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600', // 1 hour browser cache
    },
    body: JSON.stringify(options),
  }
}

export default handler



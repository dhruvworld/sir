import type { Handler } from '@netlify/functions'
import { loadVoters } from './lib/data'

export const handler: Handler = async () => {
  const voters = loadVoters()
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ total_records: voters.length }),
  }
}

export default handler


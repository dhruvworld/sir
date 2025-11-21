import type { Handler } from '@netlify/functions'
import { loadVoters, type VoterRecord } from './lib/data'

type FilterField = 'booth_no' | 'polling_station_name' | 'page_no'

const buildUniqueList = (records: VoterRecord[], field: FilterField) => {
  const set = new Set<string>()

  for (const record of records) {
    const value = record[field]
    if (value) {
      set.add(value)
    }
  }

  return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

export const handler: Handler = async () => {
  const voters = loadVoters()
  const [boothNumbers, pollingStations, pageNumbers] = [
    buildUniqueList(voters, 'booth_no'),
    buildUniqueList(voters, 'polling_station_name'),
    buildUniqueList(voters, 'page_no'),
  ]

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      boothNumbers,
      pollingStations,
      pageNumbers,
    }),
  }
}

export default handler



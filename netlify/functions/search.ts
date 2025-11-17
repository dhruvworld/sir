import type { Handler } from '@netlify/functions'
import { loadVoters, type VoterRecord } from './lib/data'

const SEARCHABLE_COLUMNS: Array<keyof VoterRecord> = [
  'name',
  'relative_name',
  'relation',
  'epic_no',
  'house_no',
  'serial_no',
  'section_id',
  'booth_no',
  'ac_no',
  'gender',
]

type QueryDict = Record<string, string | undefined>

const normalize = (value: string | undefined | null) => value?.trim().toLowerCase() ?? ''

const tokenize = (value: string) => value.split(/\s+/).filter(Boolean)

const matchesAllTokens = (recordValue: string | undefined, tokens: string[]) => {
  if (tokens.length === 0) return true
  const value = (recordValue ?? '').toLowerCase()
  return tokens.every((token) => value.includes(token))
}

const matchesField = (recordValue: string | undefined, needle: string) => {
  if (!needle) return true
  const value = recordValue ?? ''
  return value.toLowerCase().includes(needle)
}

const filterRecords = (records: VoterRecord[], params: QueryDict): VoterRecord[] => {
  const filters: Array<[keyof VoterRecord, string]> = [
    ['epic_no', normalize(params.epic_no)],
    ['house_no', normalize(params.house_no)],
  ]

  const nameTokens = tokenize(normalize(params.name))
  const relativeTokens = tokenize(normalize(params.relative_name))
  const globalTokens = tokenize(normalize(params.q))

  return records.filter((record) => {
    if (!matchesAllTokens(record.name, nameTokens)) {
      return false
    }

    if (!matchesAllTokens(record.relative_name, relativeTokens)) {
      return false
    }

    for (const [field, needle] of filters) {
      if (needle && !matchesField(record[field], needle)) {
        return false
      }
    }

    if (globalTokens.length > 0) {
      const hasMatch = SEARCHABLE_COLUMNS.some((column) => {
        const value = (record[column] ?? '').toLowerCase()
        return globalTokens.every((token) => value.includes(token))
      })
      if (!hasMatch) {
        return false
      }
    }

    return true
  })
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    }
  }

  const voters = loadVoters()
  const params = event.queryStringParameters ?? {}
  const filtered = filterRecords(voters, params)

  const passValue = params.pass?.trim() ?? ''
  const allowedPasses = new Set(['ds', 'DS', 'Ds'])
  const hasFullAccess = allowedPasses.has(passValue)

  const limitParam = params.limit?.trim()
  const limit = limitParam ? Number(limitParam) : undefined
  const results =
    limit && limit > 0 ? filtered.slice(0, limit) : filtered.slice(0, filtered.length)

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      total: filtered.length,
      returned: results.length,
      results,
      limited: !hasFullAccess,
    }),
  }
}

export default handler


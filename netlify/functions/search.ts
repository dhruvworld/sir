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
  'section_name',
  'booth_no',
  'ac_no',
  'lok_sabha_name',
  'polling_station_name',
  'main_village',
  'gender',
]

type QueryDict = Record<string, string | undefined>

const normalize = (value: string | undefined | null) => value?.trim().toLowerCase() ?? ''

const tokenize = (value: string) => value.split(/\s+/).filter(Boolean)

type IndexedRecord = VoterRecord & { _searchText: string }

let indexedCache: IndexedRecord[] | null = null

const buildSearchText = (record: VoterRecord): string => {
  return SEARCHABLE_COLUMNS.map((col) => (record[col] ?? '')).join(' ').toLowerCase()
}

const getIndexedRecords = (records: VoterRecord[]): IndexedRecord[] => {
  if (indexedCache && indexedCache.length === records.length) {
    return indexedCache
  }
  indexedCache = records.map((record) => ({
    ...record,
    _searchText: buildSearchText(record),
  }))
  return indexedCache
}

const filterRecords = (
  records: VoterRecord[],
  params: QueryDict,
  limit?: number,
): { results: VoterRecord[]; total: number } => {
  const indexed = getIndexedRecords(records)
  const filters: Array<[keyof VoterRecord, string]> = [
    ['epic_no', normalize(params.epic_no)],
    ['house_no', normalize(params.house_no)],
  ]

  const nameTokens = tokenize(normalize(params.name))
  const relativeTokens = tokenize(normalize(params.relative_name))
  const globalTokens = tokenize(normalize(params.q))

  const results: VoterRecord[] = []
  const maxResults = limit && limit > 0 ? limit : Infinity
  let totalCount = 0

  for (const record of indexed) {
    if (nameTokens.length > 0) {
      const nameLower = (record.name ?? '').toLowerCase()
      if (!nameTokens.every((token) => nameLower.includes(token))) {
        continue
      }
    }

    if (relativeTokens.length > 0) {
      const relativeLower = (record.relative_name ?? '').toLowerCase()
      if (!relativeTokens.every((token) => relativeLower.includes(token))) {
        continue
      }
    }

    let fieldMatch = true
    for (const [field, needle] of filters) {
      if (needle) {
        const value = (record[field] ?? '').toLowerCase()
        if (!value.includes(needle)) {
          fieldMatch = false
          break
        }
      }
    }
    if (!fieldMatch) continue

    if (globalTokens.length > 0) {
      if (!globalTokens.every((token) => record._searchText.includes(token))) {
        continue
      }
    }

    totalCount++
    if (results.length < maxResults) {
      results.push(record)
    }
  }

  return { results, total: totalCount }
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
  const limitParam = params.limit?.trim()
  const limit = limitParam ? Number(limitParam) : undefined

  const passValue = params.pass?.trim() ?? ''
  const hasFullAccess = passValue.toLowerCase() == 'ds'

  const { results, total } = filterRecords(voters, params, limit)

  const sanitizedResults = hasFullAccess
    ? results
    : results.map((record) => ({
        id: record.id,
        section_id: record.section_id,
        booth_no: record.booth_no,
        page_no: record.page_no,
        row_no_on_page: record.row_no_on_page,
        serial_no: record.serial_no,
        name: record.name,
        relation: record.relation,
        relative_name: record.relative_name,
        house_no: '',
        epic_no: '',
        gender: '',
        age: '',
        ac_no: '',
      }))

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      total,
      returned: results.length,
      results: sanitizedResults,
      limited: !hasFullAccess,
    }),
  }
}

export default handler



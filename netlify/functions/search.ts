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

const normalize = (value: string | undefined | null): string => {
  if (!value) return ''
  return value.trim().toLowerCase()
}

const tokenize = (value: string): string[] => {
  if (!value) return []
  return value.split(/\s+/).filter(Boolean)
}

type IndexedRecord = VoterRecord & { _searchText: string }

let indexedCache: IndexedRecord[] | null = null
let votersCache: VoterRecord[] | null = null

const buildSearchText = (record: VoterRecord): string => {
  let text = ''
  for (let i = 0; i < SEARCHABLE_COLUMNS.length; i++) {
    const val = record[SEARCHABLE_COLUMNS[i]]
    if (val) text += val.toLowerCase() + ' '
  }
  return text
}

const getIndexedRecords = (records: VoterRecord[]): IndexedRecord[] => {
  if (indexedCache && indexedCache.length === records.length) {
    return indexedCache
  }
  indexedCache = new Array(records.length)
  for (let i = 0; i < records.length; i++) {
    indexedCache[i] = {
      ...records[i],
      _searchText: buildSearchText(records[i]),
    }
  }
  return indexedCache
}

const fastIncludes = (haystack: string, needle: string): boolean => {
  return haystack.indexOf(needle) !== -1
}

const filterRecords = (
  records: VoterRecord[],
  params: QueryDict,
  limit?: number,
): { results: VoterRecord[]; total: number } => {
  const indexed = getIndexedRecords(records)
  
  // Normalize all params once
  const epicNo = normalize(params.epic_no)
  const houseNo = normalize(params.house_no)
  const nameQuery = normalize(params.name)
  const relativeQuery = normalize(params.relative_name)
  const globalQuery = normalize(params.q)

  // Tokenize once
  const nameTokens = tokenize(nameQuery)
  const relativeTokens = tokenize(relativeQuery)
  const globalTokens = tokenize(globalQuery)

  const results: VoterRecord[] = []
  const maxResults = limit && limit > 0 ? limit : Infinity
  let totalCount = 0
  const hasLimit = maxResults !== Infinity

  // Fast path: exact matches on epic_no or house_no (most selective)
  if (epicNo || houseNo) {
    for (let i = 0; i < indexed.length; i++) {
      const record = indexed[i]
      
      // Check exact matches first (most selective)
      if (epicNo && !fastIncludes((record.epic_no ?? '').toLowerCase(), epicNo)) {
        continue
      }
      if (houseNo && !fastIncludes((record.house_no ?? '').toLowerCase(), houseNo)) {
        continue
      }

      // Check name tokens
      if (nameTokens.length > 0) {
        const nameLower = (record.name ?? '').toLowerCase()
        let nameMatch = true
        for (let j = 0; j < nameTokens.length; j++) {
          if (!fastIncludes(nameLower, nameTokens[j])) {
            nameMatch = false
            break
          }
        }
        if (!nameMatch) continue
      }

      // Check relative tokens
      if (relativeTokens.length > 0) {
        const relativeLower = (record.relative_name ?? '').toLowerCase()
        let relativeMatch = true
        for (let j = 0; j < relativeTokens.length; j++) {
          if (!fastIncludes(relativeLower, relativeTokens[j])) {
            relativeMatch = false
            break
          }
        }
        if (!relativeMatch) continue
      }

      // Check global tokens
      if (globalTokens.length > 0) {
        let globalMatch = true
        for (let j = 0; j < globalTokens.length; j++) {
          if (!fastIncludes(record._searchText, globalTokens[j])) {
            globalMatch = false
            break
          }
        }
        if (!globalMatch) continue
      }

      totalCount++
      if (results.length < maxResults) {
        results.push(record)
      } else if (hasLimit) {
        // Early termination when we have enough results
        break
      }
    }
  } else {
    // No exact matches, use global search
    for (let i = 0; i < indexed.length; i++) {
      const record = indexed[i]

      // Check name tokens first (most selective)
      if (nameTokens.length > 0) {
        const nameLower = (record.name ?? '').toLowerCase()
        let nameMatch = true
        for (let j = 0; j < nameTokens.length; j++) {
          if (!fastIncludes(nameLower, nameTokens[j])) {
            nameMatch = false
            break
          }
        }
        if (!nameMatch) continue
      }

      // Check relative tokens
      if (relativeTokens.length > 0) {
        const relativeLower = (record.relative_name ?? '').toLowerCase()
        let relativeMatch = true
        for (let j = 0; j < relativeTokens.length; j++) {
          if (!fastIncludes(relativeLower, relativeTokens[j])) {
            relativeMatch = false
            break
          }
        }
        if (!relativeMatch) continue
      }

      // Check global tokens (least selective, check last)
      if (globalTokens.length > 0) {
        let globalMatch = true
        for (let j = 0; j < globalTokens.length; j++) {
          if (!fastIncludes(record._searchText, globalTokens[j])) {
            globalMatch = false
            break
          }
        }
        if (!globalMatch) continue
      }

      totalCount++
      if (results.length < maxResults) {
        results.push(record)
      } else if (hasLimit) {
        // Early termination when we have enough results
        break
      }
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

  // Cache voters across invocations (Netlify Functions reuse containers)
  if (!votersCache) {
    votersCache = loadVoters()
  }
  const voters = votersCache

  const params = event.queryStringParameters ?? {}
  const limitParam = params.limit?.trim()
  const limit = limitParam ? Number(limitParam) : undefined

  const passValue = params.pass?.trim() ?? ''
  const hasFullAccess = passValue.toLowerCase() == 'ds'

  // Fast path: if no search terms, return empty results immediately
  const hasSearchTerms =
    params.q?.trim() ||
    params.name?.trim() ||
    params.relative_name?.trim() ||
    params.epic_no?.trim() ||
    params.house_no?.trim()

  if (!hasSearchTerms) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        total: 0,
        returned: 0,
        results: [],
        limited: !hasFullAccess,
      }),
    }
  }

  const { results, total } = filterRecords(voters, params, limit)

  // Only sanitize if needed (avoid unnecessary object creation)
  const sanitizedResults = hasFullAccess
    ? results
    : (() => {
        const sanitized = new Array(results.length)
        for (let i = 0; i < results.length; i++) {
          const record = results[i]
          sanitized[i] = {
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
          }
        }
        return sanitized
      })()

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



import type { Handler } from '@netlify/functions'
import { loadVoters, type VoterRecord } from './lib/data'

type FilterField = 'booth_no' | 'polling_station_name' | 'page_no'

// Cache computed options to avoid recomputing on every request
let cachedOptions: any = null
let optionsCacheTimestamp: number = 0
const OPTIONS_CACHE_TTL = 30 * 60 * 1000 // 30 minutes cache

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
  const now = Date.now()
  
  // Return cached options if available and fresh
  if (cachedOptions && (now - optionsCacheTimestamp) < OPTIONS_CACHE_TTL) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=1800', // 30 minutes browser cache
      },
      body: JSON.stringify(cachedOptions),
    }
  }

  const voters = loadVoters()
  
  // Single-pass optimization: build all data structures in one iteration
  const boothSet = new Set<string>()
  const stationSet = new Set<string>()
  const pageSet = new Set<string>()
  const boothToStation: Record<string, string> = {}
  const stationToBooths: Record<string, Set<string>> = {}
  const boothToPages: Record<string, Set<string>> = {}
  const pollingStationBoothSet = new Set<string>()
  const pollingStationBoothToPages: Record<string, Set<string>> = {}

  // Single pass through all records
  for (let i = 0; i < voters.length; i++) {
    const record = voters[i]
    const booth = record.booth_no
    const station = record.polling_station_name
    const page = record.page_no

    // Collect unique values
    if (booth) boothSet.add(booth)
    if (station) stationSet.add(station)
    if (page) pageSet.add(page)

    // Build booth to station mapping (first occurrence)
    if (booth && station && !boothToStation[booth]) {
      boothToStation[booth] = station
    }

    // Build station to booths mapping
    if (station && booth) {
      if (!stationToBooths[station]) {
        stationToBooths[station] = new Set()
      }
      stationToBooths[station].add(booth)
    }

    // Build booth to pages mapping
    if (booth && page) {
      if (!boothToPages[booth]) {
        boothToPages[booth] = new Set()
      }
      boothToPages[booth].add(page)
    }

    // Build combined polling station - booth options
    if (booth && station) {
      const combined = `${station} - ${booth}`
      pollingStationBoothSet.add(combined)
      
      if (page) {
        if (!pollingStationBoothToPages[combined]) {
          pollingStationBoothToPages[combined] = new Set()
        }
        pollingStationBoothToPages[combined].add(page)
      }
    }
  }

  // Convert sets to sorted arrays
  const boothNumbers = Array.from(boothSet).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  )
  const pollingStations = Array.from(stationSet).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  )
  const pageNumbers = Array.from(pageSet).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  )

  const stationToBoothsSorted: Record<string, string[]> = {}
  for (const [station, set] of Object.entries(stationToBooths)) {
    stationToBoothsSorted[station] = Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    )
  }

  const boothToPagesSorted: Record<string, string[]> = {}
  for (const [booth, set] of Object.entries(boothToPages)) {
    boothToPagesSorted[booth] = Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    )
  }

  const pollingStationBooths = Array.from(pollingStationBoothSet).sort((a, b) => {
    // Sort by station name first, then by booth number
    const [stationA, boothA] = a.split(' - ')
    const [stationB, boothB] = b.split(' - ')
    const stationCompare = stationA.localeCompare(stationB, undefined, { numeric: true })
    if (stationCompare !== 0) return stationCompare
    return boothA.localeCompare(boothB, undefined, { numeric: true })
  })
  
  const pollingStationBoothToPagesSorted: Record<string, string[]> = {}
  for (const [key, set] of Object.entries(pollingStationBoothToPages)) {
    pollingStationBoothToPagesSorted[key] = Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    )
  }

  // Cache the computed options
  cachedOptions = {
    boothNumbers,
    pollingStations,
    pageNumbers,
    boothToStation,
    stationToBooths: stationToBoothsSorted,
    boothToPages: boothToPagesSorted,
    pollingStationBooths,
    pollingStationBoothToPages: pollingStationBoothToPagesSorted,
  }
  optionsCacheTimestamp = now

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=1800', // 30 minutes browser cache
    },
    body: JSON.stringify(cachedOptions),
  }
}

export default handler



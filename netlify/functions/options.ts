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
  const boothToStation: Record<string, string> = {}
  const stationToBooths: Record<string, Set<string>> = {}
  const boothToPages: Record<string, Set<string>> = {}

  voters.forEach((record) => {
    const booth = record.booth_no
    const station = record.polling_station_name
    const page = record.page_no

    if (booth && station && !boothToStation[booth]) {
      boothToStation[booth] = station
    }

    if (station) {
      if (!stationToBooths[station]) {
        stationToBooths[station] = new Set()
      }
      if (booth) {
        stationToBooths[station].add(booth)
      }
    }

    if (booth) {
      if (!boothToPages[booth]) {
        boothToPages[booth] = new Set()
      }
      if (page) {
        boothToPages[booth].add(page)
      }
    }
  })

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

  const [boothNumbers, pollingStations, pageNumbers] = [
    buildUniqueList(voters, 'booth_no'),
    buildUniqueList(voters, 'polling_station_name'),
    buildUniqueList(voters, 'page_no'),
  ]

  // Build combined polling station - booth options
  const pollingStationBoothSet = new Set<string>()
  const pollingStationBoothToPages: Record<string, Set<string>> = {}
  
  voters.forEach((record) => {
    const booth = record.booth_no
    const station = record.polling_station_name
    const page = record.page_no
    
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
  })
  
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
      boothToStation,
      stationToBooths: stationToBoothsSorted,
      boothToPages: boothToPagesSorted,
      pollingStationBooths,
      pollingStationBoothToPages: pollingStationBoothToPagesSorted,
    }),
  }
}

export default handler



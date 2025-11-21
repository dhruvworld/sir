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
    }),
  }
}

export default handler



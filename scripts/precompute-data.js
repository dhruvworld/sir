#!/usr/bin/env node
/**
 * Pre-compute options and meta from mixed.json
 * Run this script whenever mixed.json is updated
 */

const fs = require('fs')
const path = require('path')

const dataPath = path.join(__dirname, '..', 'data', 'mixed.json')
const optionsPath = path.join(__dirname, '..', 'data', 'options.json')
const metaPath = path.join(__dirname, '..', 'data', 'meta.json')

console.log('Loading data...')
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
console.log(`Processing ${data.length} records...`)

// Pre-compute options
const boothSet = new Set()
const stationSet = new Set()
const pageSet = new Set()
const boothToStation = {}
const stationToBooths = {}
const boothToPages = {}
const pollingStationBoothSet = new Set()
const pollingStationBoothToPages = {}

for (const record of data) {
  const booth = record.booth_no
  const station = record.polling_station_name
  const page = record.page_no

  if (booth) boothSet.add(booth)
  if (station) stationSet.add(station)
  if (page) pageSet.add(page)

  if (booth && station && !boothToStation[booth]) {
    boothToStation[booth] = station
  }

  if (station && booth) {
    if (!stationToBooths[station]) {
      stationToBooths[station] = new Set()
    }
    stationToBooths[station].add(booth)
  }

  if (booth && page) {
    if (!boothToPages[booth]) {
      boothToPages[booth] = new Set()
    }
    boothToPages[booth].add(page)
  }

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

const numericSort = (a, b) => {
  const numA = parseInt(a, 10)
  const numB = parseInt(b, 10)
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB
  }
  return a.localeCompare(b, undefined, { numeric: true })
}

const boothNumbers = Array.from(boothSet).sort(numericSort)
const pollingStations = Array.from(stationSet).sort()
const pageNumbers = Array.from(pageSet).sort(numericSort)

const stationToBoothsSorted = {}
for (const [station, booths] of Object.entries(stationToBooths)) {
  stationToBoothsSorted[station] = Array.from(booths).sort(numericSort)
}

const boothToPagesSorted = {}
for (const [booth, pages] of Object.entries(boothToPages)) {
  boothToPagesSorted[booth] = Array.from(pages).sort(numericSort)
}

const pollingStationBooths = Array.from(pollingStationBoothSet).sort((a, b) => {
  const [stationA, boothA] = a.split(' - ')
  const [stationB, boothB] = b.split(' - ')
  const stationCompare = stationA.localeCompare(stationB, undefined, { numeric: true })
  if (stationCompare !== 0) return stationCompare
  return numericSort(boothA, boothB)
})

const pollingStationBoothToPagesSorted = {}
for (const [key, pages] of Object.entries(pollingStationBoothToPages)) {
  pollingStationBoothToPagesSorted[key] = Array.from(pages).sort(numericSort)
}

const options = {
  boothNumbers,
  pollingStations,
  pageNumbers,
  boothToStation,
  stationToBooths: stationToBoothsSorted,
  boothToPages: boothToPagesSorted,
  pollingStationBooths,
  pollingStationBoothToPages: pollingStationBoothToPagesSorted,
}

// Save options
fs.writeFileSync(optionsPath, JSON.stringify(options, null, 2), 'utf-8')
console.log(`✓ Options saved to ${optionsPath} (${(JSON.stringify(options).length / 1024).toFixed(2)} KB)`)

// Pre-compute meta
const meta = { total_records: data.length }
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
console.log(`✓ Meta saved to ${metaPath}`)

console.log('Done!')


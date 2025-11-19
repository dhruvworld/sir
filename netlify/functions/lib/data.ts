import fs from 'node:fs'
import path from 'node:path'

export type VoterRecord = {
  id: string
  serial_no: string
  section_id: string
  section_name: string
  house_no: string
  name: string
  relation: string
  relative_name: string
  gender: string
  age: string
  epic_no: string
  ac_no: string
  lok_sabha_name: string
  booth_no: string
  polling_station_name: string
  main_village: string
  page_no: string
  row_no_on_page: string
  part_no: string
}

let cache: VoterRecord[] | null = null

const resolveDataPath = (): string => {
  const root = process.env.LAMBDA_TASK_ROOT
    ? path.join(process.env.LAMBDA_TASK_ROOT, 'data')
    : path.join(process.cwd(), 'data')
  return path.join(root, 'mixed.json')
}

export const loadVoters = (): VoterRecord[] => {
  if (cache) return cache
  const filePath = resolveDataPath()
  const raw = fs.readFileSync(filePath, 'utf-8')
  cache = JSON.parse(raw)
  return cache
}


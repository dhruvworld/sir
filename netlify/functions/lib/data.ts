import fs from 'node:fs'
import path from 'node:path'

export type VoterRecord = {
  id: string
  section_id: string
  serial_no: string
  house_no: string
  name: string
  relation: string
  relative_name: string
  gender: string
  age: string
  epic_no: string
  ac_no: string
  booth_no: string
  page_no: string
  row_no_on_page: string
}

let cache: VoterRecord[] | null = null

const resolveDataPath = (): string => {
  const root = process.env.LAMBDA_TASK_ROOT
    ? path.join(process.env.LAMBDA_TASK_ROOT, 'data')
    : path.join(process.cwd(), 'data')
  return path.join(root, 'city_route.json')
}

export const loadVoters = (): VoterRecord[] => {
  if (cache) return cache
  const filePath = resolveDataPath()
  const raw = fs.readFileSync(filePath, 'utf-8')
  cache = JSON.parse(raw)
  return cache
}


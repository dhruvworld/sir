export interface VoterRecord {
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

export interface SearchResponse {
  total: number
  returned: number
  results: VoterRecord[]
  limited: boolean
}

export interface SearchParams {
  pass?: string
  q?: string
}

export interface SearchLogPayload {
  visitorId: string
  query: string
  passProvided: boolean
  results: {
    total: number
    returned: number
    limited: boolean
  }
}

export interface SearchLogEntry {
  id: string
  timestamp: string
  ip?: string
  country?: string | null
  region?: string | null
  city?: string | null
  visitorId?: string | null
  query: string
  passProvided: boolean
  userAgent?: string
  results?: {
    total?: number
    returned?: number
    limited?: boolean
  } | null
}


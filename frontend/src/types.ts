export interface VoterRecord {
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


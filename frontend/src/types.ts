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
}

export interface SearchParams {
  q?: string
  name?: string
  relative_name?: string
  epic_no?: string
  house_no?: string
  limit?: number | null
}


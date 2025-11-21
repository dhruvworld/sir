import * as XLSX from 'xlsx'
import type { VoterRecord } from '../types'

type ExportOptions = {
  limited?: boolean
}

type FieldDescriptor = {
  key: keyof VoterRecord
  label: string
}

const limitedFields: FieldDescriptor[] = [
  { key: 'serial_no', label: 'Serial' },
  { key: 'name', label: 'Name' },
  { key: 'relative_name', label: 'Relative name' },
  { key: 'section_id', label: 'Section' },
  { key: 'booth_no', label: 'Booth' },
  { key: 'page_no', label: 'Page' },
  { key: 'row_no_on_page', label: 'Row' },
]

const fullFields: FieldDescriptor[] = [
  { key: 'serial_no', label: 'Serial' },
  { key: 'name', label: 'Name' },
  { key: 'relation', label: 'Relation' },
  { key: 'relative_name', label: 'Relative name' },
  { key: 'house_no', label: 'House' },
  { key: 'epic_no', label: 'EPIC' },
  { key: 'gender', label: 'Gender' },
  { key: 'age', label: 'Age' },
  { key: 'section_id', label: 'Section ID' },
  { key: 'section_name', label: 'Section name' },
  { key: 'booth_no', label: 'Booth' },
  { key: 'polling_station_name', label: 'Polling station' },
  { key: 'main_village', label: 'Village' },
  { key: 'page_no', label: 'Page' },
  { key: 'row_no_on_page', label: 'Row' },
  { key: 'part_no', label: 'Part' },
]

const sanitize = (value: string | undefined | null) => {
  if (!value) return '—'
  return value
}

const buildRecordLines = (record: VoterRecord, fields: FieldDescriptor[], index: number) => {
  const lines: string[] = []
  lines.push(`Record ${index + 1}`)
  for (const field of fields) {
    lines.push(`${field.label}: ${sanitize(record[field.key])}`)
  }
  lines.push('------------------------------')
  return lines
}

const gatherLines = (records: VoterRecord[], options?: ExportOptions) => {
  const fields = options?.limited ? limitedFields : fullFields
  let lines: string[] = []
  records.forEach((record, index) => {
    lines = lines.concat(buildRecordLines(record, fields, index))
  })
  return lines
}

export const buildResultsText = (records: VoterRecord[], options?: ExportOptions) => {
  const lines = gatherLines(records, options)
  return lines.join('\n')
}

export const downloadResultsExcel = (records: VoterRecord[], options?: ExportOptions) => {
  if (!records.length) return
  
  const fields = options?.limited ? limitedFields : fullFields
  
  // Create worksheet data with headers
  const headers = fields.map(f => f.label)
  const rows = records.map(record => 
    fields.map(field => {
      const value = record[field.key]
      return value || ''
    })
  )
  
  const wsData = [headers, ...rows]
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  
  // Set column widths for better readability
  const colWidths = fields.map(() => ({ wch: 20 }))
  ws['!cols'] = colWidths
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Voter Data')
  
  // Generate filename with date
  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `sircheck-voters-${dateStr}.xlsx`
  
  // Download the file
  XLSX.writeFile(wb, filename)
}

export const shareResultsAsText = async (records: VoterRecord[], options?: ExportOptions) => {
  if (!records.length) return
  const text = buildResultsText(records, options)
  if (!text) return

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: 'SIR CHECK • Voter list',
        text,
      })
      return
    } catch {
      // Ignore and fall back
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    window.alert('Organized voter summary copied. Paste into WhatsApp or email.')
    return
  }

  window.alert(text)
}



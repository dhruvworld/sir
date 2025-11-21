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

const generateExcelFile = (records: VoterRecord[], options?: ExportOptions): { wb: XLSX.WorkBook; filename: string } => {
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
  
  // Generate filename with booth_no, polling_station_name, and page_no
  const firstRecord = records[0]
  const boothNo = firstRecord.booth_no || ''
  const pollingStation = firstRecord.polling_station_name || ''
  const pageNo = firstRecord.page_no || ''
  
  // Get unique page numbers if multiple pages exist
  const uniquePageNos = Array.from(new Set(records.map(r => r.page_no).filter(Boolean)))
  const pageNumbersStr = uniquePageNos.length > 0 
    ? (uniquePageNos.length === 1 ? pageNo : uniquePageNos.sort().join('-'))
    : ''
  
  // Build filename parts
  const filenameParts: string[] = []
  
  if (boothNo) {
    filenameParts.push(`booth${boothNo}`)
  }
  
  if (pollingStation) {
    // Sanitize polling station name for filename (remove special chars)
    const sanitizedStation = pollingStation.replace(/[^a-zA-Z0-9\u0A80-\u0AFF]/g, '_').substring(0, 30)
    if (sanitizedStation) {
      filenameParts.push(sanitizedStation)
    }
  }
  
  if (pageNumbersStr) {
    filenameParts.push(`page${pageNumbersStr}`)
  }
  
  // If no filters, use date
  if (filenameParts.length === 0) {
    const dateStr = new Date().toISOString().split('T')[0]
    filenameParts.push(dateStr)
  }
  
  const filename = `sircheck-${filenameParts.join('-')}.xlsx`
  
  return { wb, filename }
}

export const downloadResultsExcel = (records: VoterRecord[], options?: ExportOptions) => {
  if (!records.length) return
  
  const { wb, filename } = generateExcelFile(records, options)
  
  // Download the file
  XLSX.writeFile(wb, filename)
}

export const shareResultsExcel = async (records: VoterRecord[], options?: ExportOptions) => {
  if (!records.length) return
  
  const { wb, filename } = generateExcelFile(records, options)
  
  // Convert workbook to binary string, then to Blob
  const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
  const file = new File([blob], filename, { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
  
  // Try Web Share API first (works on mobile and modern browsers)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    // Check if browser supports file sharing
    const canShareFiles = typeof navigator.canShare === 'function' 
      ? navigator.canShare({ files: [file] })
      : true // Some browsers support files but don't have canShare
    
    if (canShareFiles) {
      try {
        await navigator.share({
          title: 'SIR CHECK • Voter Data',
          text: `Voter list: ${records.length} records`,
          files: [file],
        })
        return
      } catch (error) {
        // User cancelled or error occurred, fall back to download
        const err = error as Error
        if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
          console.error('Share failed:', error)
        }
        // Fall through to download
      }
    }
  }
  
  // Fall back to download if Web Share API not available or failed
  downloadResultsExcel(records, options)
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



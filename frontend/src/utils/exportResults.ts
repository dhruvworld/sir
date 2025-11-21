import { jsPDF } from 'jspdf'
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

export const downloadResultsPdf = (records: VoterRecord[], options?: ExportOptions) => {
  if (!records.length) return
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 40
  const lineHeight = 16
  let cursorY = margin

  const lines = gatherLines(records, options)

  lines.forEach((line) => {
    if (cursorY > pageHeight - margin) {
      doc.addPage()
      cursorY = margin
    }
    doc.text(line, margin, cursorY)
    cursorY += lineHeight
  })

  const filename = `sircheck-voters-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
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



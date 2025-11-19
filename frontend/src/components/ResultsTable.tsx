import type { VoterRecord } from '../types'

type ResultsTableProps = {
  records: VoterRecord[]
  limited?: boolean
}

const limitedHeaders = [
  'Serial',
  'Name',
  'Relative name',
  'Section',
  'Booth',
  'Page',
  'Row',
  'Share',
]

const fullColumnTitles: Array<{ key: keyof VoterRecord | 'relation_block'; label: string }> = [
  { key: 'serial_no', label: 'Serial' },
  { key: 'name', label: 'Name' },
  { key: 'relation_block', label: 'Relation' },
  { key: 'house_no', label: 'House' },
  { key: 'epic_no', label: 'EPIC' },
  { key: 'gender', label: 'Gender' },
  { key: 'age', label: 'Age' },
  { key: 'section_id', label: 'Section ID' },
  { key: 'section_name', label: 'Section Name' },
  { key: 'booth_no', label: 'Booth' },
  { key: 'polling_station_name', label: 'Polling Station' },
  { key: 'ac_no', label: 'AC' },
  { key: 'main_village', label: 'Village' },
  { key: 'page_no', label: 'Page' },
  { key: 'row_no_on_page', label: 'Row' },
  { key: 'part_no', label: 'Part' },
  { key: 'id', label: 'ID' },
]

const buildShareText = (record: VoterRecord) => {
  const entries: Array<[string, string | undefined]> = [
    ['Serial', record.serial_no],
    ['Name', record.name],
    ['Relation', record.relation],
    ['Relative name', record.relative_name],
    ['House', record.house_no],
    ['EPIC', record.epic_no],
    ['Gender', record.gender],
    ['Age', record.age],
    ['Section ID', record.section_id],
    ['Section Name', record.section_name],
    ['Booth', record.booth_no],
    ['Polling Station', record.polling_station_name],
    ['AC', record.ac_no],
    ['Village', record.main_village],
    ['Page', record.page_no],
    ['Row', record.row_no_on_page],
    ['Part', record.part_no],
    ['ID', record.id],
  ]

  return entries
    .filter(([, value]) => Boolean(value && value !== '—'))
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n')
}

const shareRecord = async (record: VoterRecord) => {
  if (typeof window === 'undefined') return
  const text = buildShareText(record)
  if (!text) return

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: 'SIR CHECK • Voter details',
        text,
      })
      return
    } catch {
      // fall back to clipboard if share cancelled or unsupported
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    window.alert('Details copied. Paste into SMS or WhatsApp.')
    return
  }

  window.alert(text)
}

export const ResultsTable = ({ records, limited = false }: ResultsTableProps) => {
  if (limited) {
    return (
      <div className="results-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              {limitedHeaders.map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.serial_no || '—'}</td>
                <td>{record.name || '—'}</td>
                <td>{record.relative_name || '—'}</td>
                <td>{record.section_id || '—'}</td>
                <td>{record.booth_no || '—'}</td>
                <td>{record.page_no || '—'}</td>
                <td>{record.row_no_on_page || '—'}</td>
                <td>
                  <button type="button" className="share-button" onClick={() => shareRecord(record)}>
                    <svg
                      className="share-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                    Share
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="results-wrapper">
      <table className="results-table">
        <thead>
          <tr>
            {fullColumnTitles.map(({ key, label }) => (
              <th key={key}>{label}</th>
            ))}
            <th>Share</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>{record.serial_no}</td>
              <td>{record.name || '—'}</td>
              <td>
                <div className="cell-main">{record.relation || '—'}</div>
                <div className="cell-sub">{record.relative_name || '—'}</div>
              </td>
              <td>{record.house_no || '—'}</td>
              <td>{record.epic_no || '—'}</td>
              <td>{record.gender || '—'}</td>
              <td>{record.age || '—'}</td>
              <td>{record.section_id || '—'}</td>
              <td>{record.section_name || '—'}</td>
              <td>{record.booth_no || '—'}</td>
              <td>{record.polling_station_name || '—'}</td>
              <td>{record.ac_no || '—'}</td>
              <td>{record.main_village || '—'}</td>
              <td>{record.page_no || '—'}</td>
              <td>{record.row_no_on_page || '—'}</td>
              <td>{record.part_no || '—'}</td>
              <td>{record.id || '—'}</td>
              <td>
                <button type="button" className="share-button" onClick={() => shareRecord(record)}>
                  <svg
                    className="share-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  Share
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


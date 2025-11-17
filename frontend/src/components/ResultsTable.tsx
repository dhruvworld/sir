import type { VoterRecord } from '../types'

type ResultsTableProps = {
  records: VoterRecord[]
}

const columnTitles: Array<{ key: keyof VoterRecord | 'relation_block'; label: string }> = [
  { key: 'serial_no', label: 'Serial' },
  { key: 'name', label: 'Name' },
  { key: 'relation_block', label: 'Relation' },
  { key: 'house_no', label: 'House' },
  { key: 'epic_no', label: 'EPIC' },
  { key: 'booth_no', label: 'Booth' },
  { key: 'section_id', label: 'Section' },
  { key: 'page_no', label: 'Page' },
  { key: 'row_no_on_page', label: 'Row' },
]

export const ResultsTable = ({ records }: ResultsTableProps) => {
  return (
    <div className="results-wrapper">
      <table className="results-table">
        <thead>
          <tr>
            {columnTitles.map(({ key, label }) => (
              <th key={key}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>{record.serial_no}</td>
              <td>
                <div className="cell-main">{record.name || '—'}</div>
                <div className="cell-sub">
                  ID: {record.id} • Gender: {record.gender || 'NA'} • Age:{' '}
                  {record.age || 'NA'}
                </div>
              </td>
              <td>
                <div className="cell-main">{record.relation || '—'}</div>
                <div className="cell-sub">{record.relative_name || '—'}</div>
              </td>
              <td>{record.house_no || '—'}</td>
              <td>{record.epic_no || '—'}</td>
              <td>{record.booth_no || '—'}</td>
              <td>{record.section_id || '—'}</td>
              <td>{record.page_no || '—'}</td>
              <td>{record.row_no_on_page || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


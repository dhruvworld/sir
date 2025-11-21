import type { VoterRecord } from '../types'
import { downloadResultsExcel, shareResultsAsText } from '../utils/exportResults'

type ResultsActionsProps = {
  records: VoterRecord[]
  limited?: boolean
}

export const ResultsActions = ({ records, limited = false }: ResultsActionsProps) => {
  if (!records.length) return null

  const handleExcel = () => {
    downloadResultsExcel(records, { limited })
  }

  const handleShareText = () => {
    void shareResultsAsText(records, { limited })
  }

  return (
    <div className="results-actions">
      <button type="button" className="button-pill primary ghost" onClick={handleExcel}>
        Download Excel file
      </button>
      <button type="button" className="button-pill secondary ghost" onClick={handleShareText}>
        Copy clean text
      </button>
    </div>
  )
}



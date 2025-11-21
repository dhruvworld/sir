import type { VoterRecord } from '../types'
import { shareResultsExcel } from '../utils/exportResults'

type ResultsActionsProps = {
  records: VoterRecord[]
  limited?: boolean
}

export const ResultsActions = ({ records, limited = false }: ResultsActionsProps) => {
  if (!records.length) return null

  const handleShareExcel = () => {
    void shareResultsExcel(records, { limited })
  }

  return (
    <div className="results-actions">
      <button type="button" className="button-pill primary ghost" onClick={handleShareExcel}>
        Share Excel file
      </button>
    </div>
  )
}



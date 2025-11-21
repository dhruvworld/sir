import type { VoterRecord } from '../types'
import { downloadResultsPdf, shareResultsAsText } from '../utils/exportResults'

type ResultsActionsProps = {
  records: VoterRecord[]
  limited?: boolean
}

export const ResultsActions = ({ records, limited = false }: ResultsActionsProps) => {
  if (!records.length) return null

  const handlePdf = () => {
    downloadResultsPdf(records, { limited })
  }

  const handleShareText = () => {
    void shareResultsAsText(records, { limited })
  }

  return (
    <div className="results-actions">
      <button type="button" className="button-pill primary ghost" onClick={handlePdf}>
        Download organized PDF
      </button>
      <button type="button" className="button-pill secondary ghost" onClick={handleShareText}>
        Copy clean text
      </button>
    </div>
  )
}



type SummaryBarProps = {
  total?: number
  returned?: number
  datasetSize?: number
}

export const SummaryBar = ({ total, returned, datasetSize }: SummaryBarProps) => {
  return (
    <div className="summary-bar">
      <div>
        <span className="summary-label">Dataset size</span>
        <strong>{datasetSize?.toLocaleString() ?? '—'}</strong>
      </div>
      <div>
        <span className="summary-label">Matches found</span>
        <strong>{total !== undefined ? total.toLocaleString() : '—'}</strong>
      </div>
      <div>
        <span className="summary-label">Rows displayed</span>
        <strong>{returned !== undefined ? returned.toLocaleString() : '—'}</strong>
      </div>
    </div>
  )
}


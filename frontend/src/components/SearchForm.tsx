import type { FormEvent } from 'react'
import type { SearchParams } from '../types'

type SearchFormProps = {
  params: SearchParams
  isLoading: boolean
  onChange: (field: keyof SearchParams, value: string | number | null) => void
  onSearch: () => void
  onReset: () => void
}

const textFields: Array<{
  name: keyof SearchParams
  label: string
  placeholder: string
}> = [
  { name: 'q', label: 'Smart search', placeholder: 'Any keyword, EPIC, relation, etc.' },
  { name: 'name', label: 'Voter name', placeholder: 'Full or partial name' },
  { name: 'relative_name', label: 'Relative name', placeholder: 'Parent / spouse name' },
  { name: 'epic_no', label: 'EPIC number', placeholder: 'e.g., GJX1234567' },
  { name: 'house_no', label: 'House number', placeholder: 'e.g., 45/A' },
]

export const SearchForm = ({
  params,
  isLoading,
  onChange,
  onSearch,
  onReset,
}: SearchFormProps) => {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSearch()
  }

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="field-grid">
        {textFields.map(({ name, label, placeholder }) => (
          <label key={name} className="field">
            <span>{label}</span>
            <input
              type="text"
              value={params[name] ?? ''}
              placeholder={placeholder}
              onChange={(e) => onChange(name, e.target.value)}
            />
          </label>
        ))}
      </div>
      <label className="field pass-field">
        <span>Access pass</span>
        <input
          type="password"
          value={params.pass ?? ''}
          placeholder="Enter DS to unlock full data"
          onChange={(e) => onChange('pass', e.target.value)}
        />
      </label>
      <div className="form-actions">
        <button type="submit" className="primary" disabled={isLoading}>
          {isLoading ? 'Searching…' : 'Search'}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => onReset()}
          disabled={isLoading}
        >
          Clear
        </button>
      </div>
    </form>
  )
}


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
  { name: 'relation', label: 'Relation type', placeholder: 'Father / Husband / Other' },
  { name: 'epic_no', label: 'EPIC number', placeholder: 'e.g., GJX1234567' },
  { name: 'house_no', label: 'House number', placeholder: 'e.g., 45/A' },
  { name: 'serial_no', label: 'Serial number', placeholder: 'e.g., 102' },
  { name: 'section_id', label: 'Section ID', placeholder: 'e.g., 1144' },
  { name: 'booth_no', label: 'Booth', placeholder: 'e.g., 79/184' },
  { name: 'ac_no', label: 'AC number', placeholder: 'e.g., 79' },
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
        <label className="field">
          <span>Limit (optional)</span>
          <input
            type="number"
            min="0"
            placeholder="Leave blank to return all"
            value={params.limit ?? ''}
            onChange={(e) =>
              onChange('limit', e.target.value === '' ? null : Number(e.target.value))
            }
          />
        </label>
      </div>
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


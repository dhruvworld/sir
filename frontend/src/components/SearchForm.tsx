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
  {
    name: 'q',
    label: 'Smart search',
    placeholder: 'Name, relative name, house no, EPIC no…',
  },
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
          <label key={name} className="field field-with-icon">
            <span>{label}</span>
            <div className="input-wrapper">
              <input
                type="text"
                value={params[name] ?? ''}
                placeholder={placeholder}
                onChange={(e) => onChange(name, e.target.value)}
              />
              <svg
                className="field-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </label>
        ))}
      </div>
      <label className="field field-with-icon pass-field">
        <span>Access pass</span>
        <div className="input-wrapper">
          <input
            type="password"
            value={params.pass ?? ''}
            placeholder="Add pass to show full details"
            onChange={(e) => onChange('pass', e.target.value)}
          />
          <svg
            className="field-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
      </label>
      <div className="form-actions">
        <button type="submit" className="primary" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="loading-spinner" />
              Searching…
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Search
            </>
          )}
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


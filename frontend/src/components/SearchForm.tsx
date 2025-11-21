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
    <form className="search-form unified-form" onSubmit={handleSubmit}>
      <div className="unified-search-fields">
        <label className="field field-with-icon">
          <span>Smart search</span>
          <div className="input-wrapper">
            <input
              type="text"
              value={params.q ?? ''}
              placeholder="Name, relative name, house no, EPIC no…"
              onChange={(e) => onChange('q', e.target.value)}
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
        <label className="field field-with-icon pass-field">
          <span>Pass</span>
          <div className="input-wrapper">
            <input
              type="password"
              value={params.pass ?? ''}
              placeholder="Access pass"
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
      </div>
      <div className="form-actions">
        <button type="submit" className="button-pill primary" disabled={isLoading}>
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
          className="button-pill secondary"
          onClick={() => onReset()}
          disabled={isLoading}
        >
          Clear
        </button>
      </div>
    </form>
  )
}


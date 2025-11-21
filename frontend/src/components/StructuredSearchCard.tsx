import type { FormEvent } from 'react'
import { useMemo } from 'react'
import type { FilterOptionsResponse, SearchParams } from '../types'

type StructuredSearchCardProps = {
  isVisible: boolean
  onToggle: () => void
  options: FilterOptionsResponse | null
  optionsLoading: boolean
  optionsError: string | null
  values: Pick<SearchParams, 'polling_station_booth' | 'page_no' | 'pass'>
  isSearching: boolean
  onChange: (field: 'polling_station_booth' | 'page_no' | 'pass', value: string) => void
  onSubmit: () => void
  onClear: () => void
}

const buildOptions = (items: string[]) => {
  return items.map((value) => (
    <option key={value} value={value}>
      {value}
    </option>
  ))
}

export const StructuredSearchCard = ({
  isVisible,
  onToggle,
  options,
  optionsLoading,
  optionsError,
  values,
  isSearching,
  onChange,
  onSubmit,
  onClear,
}: StructuredSearchCardProps) => {
  const hasSelection = useMemo(() => {
    return Boolean(values.polling_station_booth || values.page_no)
  }, [values.polling_station_booth, values.page_no])

  const disableSubmit = isSearching || !hasSelection

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (disableSubmit) return
    onSubmit()
  }

  const pollingStationBoothOptions = useMemo(() => {
    if (!options) return []
    return options.pollingStationBooths ?? []
  }, [options])

  const pageOptions = useMemo(() => {
    if (!options) return []
    if (values.polling_station_booth) {
      return options.pollingStationBoothToPages?.[values.polling_station_booth] ?? []
    }
    return []
  }, [options, values.polling_station_booth])

  const pageDisabled = !values.polling_station_booth

  const renderSelect = (
    label: string,
    placeholder: string,
    field: 'polling_station_booth' | 'page_no',
    optionsList: string[],
    disabled: boolean,
  ) => {
    return (
      <label className={`field ${disabled ? 'field-disabled' : ''}`} key={field}>
        <span>{label}</span>
        <select
          value={values[field] ?? ''}
          onChange={(e) => onChange(field, e.target.value)}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {optionsList.length ? buildOptions(optionsList) : null}
        </select>
      </label>
    )
  }

  return (
    <form className="search-form unified-form structured-form" onSubmit={handleSubmit}>
      {optionsLoading && <div className="banner info">Loading dropdown values…</div>}
      {optionsError && <div className="banner error">{optionsError}</div>}
      
      <div className="unified-search-fields">
        {renderSelect(
          'Polling station - Booth no',
          'Select polling station and booth…',
          'polling_station_booth',
          pollingStationBoothOptions,
          false,
        )}
        {renderSelect(
          'Page no',
          'Select page…',
          'page_no',
          pageOptions,
          pageDisabled,
        )}
        <label className="field field-with-icon pass-field">
          <span>Pass</span>
          <div className="input-wrapper">
            <input
              type="password"
              value={values.pass ?? ''}
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
        <button type="submit" className="button-pill primary" disabled={disableSubmit}>
          {isSearching ? (
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
          onClick={() => onClear()}
          disabled={isSearching && !hasSelection}
        >
          Clear
        </button>
      </div>
    </form>
  )
}



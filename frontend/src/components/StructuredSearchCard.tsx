import type { FormEvent } from 'react'
import { useMemo } from 'react'
import type { FilterOptionsResponse, SearchParams } from '../types'

type StructuredSearchCardProps = {
  isVisible: boolean
  onToggle: () => void
  options: FilterOptionsResponse | null
  optionsLoading: boolean
  optionsError: string | null
  values: Pick<SearchParams, 'polling_station_booth' | 'page_no'>
  isSearching: boolean
  onChange: (field: 'polling_station_booth' | 'page_no', value: string) => void
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
    helper?: string,
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
        {helper && <small className="field-hint">{helper}</small>}
      </label>
    )
  }

  return (
    <section className="structured-card">
      <div className="structured-card-header">
        <div>
          <p className="eyebrow secondary-eyebrow">Need precise lists?</p>
          <h2>Search by booth, polling station, or page</h2>
          <p className="lede muted">
            Tap once to reveal dropdowns, pick the exact detail, and fetch everyone from that section.
          </p>
        </div>
        <button type="button" className="button-pill secondary ghost" onClick={onToggle}>
          {isVisible ? 'Hide dropdown search' : 'Search by these details'}
        </button>
      </div>

      {isVisible && (
        <div className="structured-card-body">
          {optionsLoading && <div className="banner info">Loading dropdown values…</div>}
          {optionsError && <div className="banner error">{optionsError}</div>}

          <form className="structured-form" onSubmit={handleSubmit}>
            <div className="field-grid">
              {renderSelect(
                'Polling station - Booth no',
                'Select polling station and booth…',
                'polling_station_booth',
                pollingStationBoothOptions,
                false,
                'Start here',
              )}
              {renderSelect(
                'Page no',
                'Select page…',
                'page_no',
                pageOptions,
                pageDisabled,
                pageDisabled ? 'Pick a polling station-booth first' : undefined,
              )}
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
                    Show voters
                  </>
                )}
              </button>
              <button
                type="button"
                className="button-pill secondary"
                onClick={() => onClear()}
                disabled={isSearching && !hasSelection}
              >
                Clear dropdowns
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}



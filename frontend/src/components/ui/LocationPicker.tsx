import { useState, useEffect, useRef, useCallback } from 'react'
import { COUNTRIES, getCountryByCode } from '../../data/countries'

interface LocationValue {
  country: string
  city: string
  neighborhood?: string
}

interface Props {
  value: LocationValue
  onChange: (val: LocationValue) => void
  showNeighborhood?: boolean
  required?: boolean
}

interface NominatimResult {
  display_name: string
  name: string
  type: string
  address?: { city?: string; town?: string; village?: string; municipality?: string }
}

const CITY_TYPES = new Set(['city', 'town', 'village', 'municipality', 'administrative', 'borough', 'suburb'])

function extractCityName(result: NominatimResult): string {
  if (result.address) {
    return (
      result.address.city ||
      result.address.town ||
      result.address.village ||
      result.address.municipality ||
      result.name
    )
  }
  return result.name
}

export default function LocationPicker({ value, onChange, showNeighborhood = false, required = false }: Props) {
  const [cityQuery, setCityQuery] = useState(value.city)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoadingCities, setIsLoadingCities] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cityInputRef = useRef<HTMLInputElement>(null)
  const countryRef = useRef<HTMLDivElement>(null)
  const cityRef = useRef<HTMLDivElement>(null)

  const selectedCountry = getCountryByCode(value.country)

  // Keep cityQuery in sync when value.city changes externally (e.g. pre-fill)
  useEffect(() => {
    setCityQuery(value.city)
  }, [value.city])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false)
        setCountrySearch('')
      }
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchCities = useCallback(async (query: string, countryCode: string) => {
    if (!countryCode) return
    setIsLoadingCities(true)
    try {
      const params = new URLSearchParams({
        format: 'json',
        q: query,
        countrycodes: countryCode.toLowerCase(),
        limit: '8',
        addressdetails: '1',
        featuretype: 'city',
      })
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { 'User-Agent': 'HaulHub/1.0' },
      })
      const data: NominatimResult[] = await res.json()
      const names = Array.from(
        new Set(
          data
            .filter((r) => CITY_TYPES.has(r.type) || (r.address && (r.address.city || r.address.town)))
            .map(extractCityName)
            .filter(Boolean)
        )
      )
      setSuggestions(names)
      setShowSuggestions(names.length > 0)
    } catch {
      setSuggestions([])
    } finally {
      setIsLoadingCities(false)
    }
  }, [])

  function handleCityInput(q: string) {
    setCityQuery(q)
    onChange({ ...value, city: q })
    setSuggestions([])

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (q.length >= 3 && value.country) {
      debounceRef.current = setTimeout(() => fetchCities(q, value.country), 400)
    } else {
      setShowSuggestions(false)
    }
  }

  function selectCity(city: string) {
    setCityQuery(city)
    onChange({ ...value, city })
    setShowSuggestions(false)
    setSuggestions([])
  }

  function handleCountrySelect(code: string) {
    setCityQuery('')
    onChange({ ...value, country: code, city: '' })
    setShowCountryDropdown(false)
    setCountrySearch('')
    setTimeout(() => cityInputRef.current?.focus(), 50)
  }

  const filteredCountries = countrySearch
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
          c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : COUNTRIES

  return (
    <div className="space-y-4">
      {/* Country */}
      <div>
        <label className="label">Country{required && <span className="text-red-500 ml-0.5">*</span>}</label>
        <div className="relative" ref={countryRef}>
          <button
            type="button"
            onClick={() => setShowCountryDropdown((v) => !v)}
            className="input w-full text-left flex items-center gap-2"
          >
            {selectedCountry ? (
              <>
                <span className="text-lg leading-none">{selectedCountry.emoji}</span>
                <span>{selectedCountry.name}</span>
              </>
            ) : (
              <span className="text-navy-400 dark:text-navy-500">Select a country...</span>
            )}
            <svg
              className={`ml-auto w-4 h-4 text-navy-400 shrink-0 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showCountryDropdown && (
            <div className="absolute z-50 mt-1 w-full bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl shadow-lg overflow-hidden">
              <div className="p-2 border-b border-navy-100 dark:border-navy-700">
                <input
                  autoFocus
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Search countries..."
                  className="w-full px-3 py-1.5 text-sm bg-navy-50 dark:bg-navy-700 rounded-lg outline-none text-navy-900 dark:text-white placeholder-navy-400"
                />
              </div>
              <ul className="max-h-52 overflow-y-auto">
                {filteredCountries.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-navy-500 dark:text-navy-400">No results</li>
                ) : (
                  filteredCountries.map((c) => (
                    <li key={c.code}>
                      <button
                        type="button"
                        onMouseDown={() => handleCountrySelect(c.code)}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-navy-50 dark:hover:bg-navy-700 transition-colors ${
                          value.country === c.code ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-medium' : 'text-navy-900 dark:text-white'
                        }`}
                      >
                        <span className="text-base leading-none w-6 text-center">{c.emoji}</span>
                        <span>{c.name}</span>
                        <span className="ml-auto text-xs text-navy-400 dark:text-navy-500">{c.code}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* City */}
      <div>
        <label className="label">City{required && <span className="text-red-500 ml-0.5">*</span>}</label>
        <div className="relative" ref={cityRef}>
          <input
            ref={cityInputRef}
            type="text"
            value={cityQuery}
            onChange={(e) => handleCityInput(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder={value.country ? 'Type at least 3 letters...' : 'Select a country first'}
            disabled={!value.country}
            className="input w-full disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {isLoadingCities && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="w-4 h-4 animate-spin text-navy-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl shadow-lg overflow-hidden">
              {suggestions.map((city) => (
                <li key={city}>
                  <button
                    type="button"
                    onMouseDown={() => selectCity(city)}
                    className="w-full text-left px-4 py-2.5 text-sm text-navy-900 dark:text-white hover:bg-navy-50 dark:hover:bg-navy-700 flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 text-navy-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {city}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {!value.country && (
          <p className="mt-1 text-xs text-navy-400 dark:text-navy-500">Select a country to enable city search</p>
        )}
      </div>

      {/* Neighborhood */}
      {showNeighborhood && (
        <div>
          <label className="label">
            Neighborhood
            <span className="ml-1 text-xs font-normal text-navy-400 dark:text-navy-500">(optional)</span>
          </label>
          <input
            type="text"
            value={value.neighborhood ?? ''}
            onChange={(e) => onChange({ ...value, neighborhood: e.target.value })}
            placeholder="e.g. Williamsburg, Downtown, Midtown..."
            className="input w-full"
          />
        </div>
      )}
    </div>
  )
}

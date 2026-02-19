import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { jobsApi } from '../../api/jobs'
import JobCard from '../../components/jobs/JobCard'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { useAuthStore } from '../../stores/authStore'
import { getCountryByCode } from '../../data/countries'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'furniture_moving', label: 'Furniture' },
  { value: 'junk_removal', label: 'Junk Removal' },
  { value: 'appliance', label: 'Appliance' },
  { value: 'assembly', label: 'Assembly' },
  { value: 'heavy_lifting', label: 'Heavy Lifting' },
  { value: 'packing', label: 'Packing' },
  { value: 'storage', label: 'Storage' },
  { value: 'other', label: 'Other' },
]

const DATE_OPTIONS = [
  { value: 'any', label: 'Any time' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'budget_desc', label: 'Budget ↓' },
  { value: 'budget_asc', label: 'Budget ↑' },
  { value: 'soonest', label: 'Soonest' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface BoardFilters {
  country: string
  city: string
  categories: string[]
  budgetMin: string
  budgetMax: string
  dateRange: 'any' | 'this_week' | 'this_month'
  sort: 'newest' | 'budget_asc' | 'budget_desc' | 'soonest'
}

// ─── FilterSection ────────────────────────────────────────────────────────────

function FilterSection({
  title,
  activeCount,
  defaultOpen = true,
  children,
}: {
  title: string
  activeCount?: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-navy-50 dark:hover:bg-navy-700/40 transition-colors duration-150 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-navy-800 dark:text-navy-100">{title}</span>
          {activeCount !== undefined && activeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-600 text-white text-[10px] font-bold leading-none">
              {activeCount}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-navy-400 dark:text-navy-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Pill helper ──────────────────────────────────────────────────────────────

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 cursor-pointer ${
        active
          ? 'bg-brand-600 text-white shadow-sm'
          : 'bg-navy-50 text-navy-700 border border-navy-200 hover:border-brand-400 hover:text-brand-600 dark:bg-navy-700/50 dark:text-navy-200 dark:border-navy-600 dark:hover:border-brand-400 dark:hover:text-brand-400'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Board() {
  const { user } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const [filters, setFilters] = useState<BoardFilters>(() => ({
    country: user?.country ?? '',
    city: user?.city ?? '',
    categories: [],
    budgetMin: '',
    budgetMax: '',
    dateRange: 'any',
    sort: 'newest',
  }))

  const setFilter = (patch: Partial<BoardFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch }))

  function resetFilters() {
    setFilters({
      country: '',
      city: '',
      categories: [],
      budgetMin: '',
      budgetMax: '',
      dateRange: 'any',
      sort: 'newest',
    })
  }

  // ─── Server-side fetch (country + city) ────────────────────────────────────

  const { data: rawJobs = [], isLoading, isFetching } = useQuery({
    queryKey: ['jobs', filters.country, filters.city],
    queryFn: () =>
      jobsApi.list({
        country: filters.country || undefined,
        city: filters.city || undefined,
      }).then((r) => r.data),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

  // ─── Client-side filter + sort ─────────────────────────────────────────────

  const filteredJobs = useMemo(() => {
    let result = rawJobs

    if (filters.categories.length > 0) {
      result = result.filter((j) => filters.categories.includes(j.category))
    }

    const minVal = filters.budgetMin !== '' ? parseFloat(filters.budgetMin) : null
    const maxVal = filters.budgetMax !== '' ? parseFloat(filters.budgetMax) : null
    if (minVal !== null && !isNaN(minVal)) {
      result = result.filter((j) => parseFloat(j.budget) >= minVal)
    }
    if (maxVal !== null && !isNaN(maxVal)) {
      result = result.filter((j) => parseFloat(j.budget) <= maxVal)
    }

    if (filters.dateRange !== 'any') {
      const now = new Date()
      if (filters.dateRange === 'this_week') {
        const start = new Date(now)
        start.setDate(now.getDate() - now.getDay())
        start.setHours(0, 0, 0, 0)
        const end = new Date(start)
        end.setDate(start.getDate() + 6)
        end.setHours(23, 59, 59, 999)
        result = result.filter((j) => {
          const d = new Date(j.scheduled_date)
          return d >= start && d <= end
        })
      } else {
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        result = result.filter((j) => {
          const d = new Date(j.scheduled_date)
          return d >= start && d <= end
        })
      }
    }

    const sorted = [...result]
    switch (filters.sort) {
      case 'budget_desc':
        sorted.sort((a, b) => parseFloat(b.budget) - parseFloat(a.budget))
        break
      case 'budget_asc':
        sorted.sort((a, b) => parseFloat(a.budget) - parseFloat(b.budget))
        break
      case 'soonest':
        sorted.sort(
          (a, b) =>
            new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
        )
        break
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
    }
    return sorted
  }, [rawJobs, filters.categories, filters.budgetMin, filters.budgetMax, filters.dateRange, filters.sort])

  // ─── Active filter counts ───────────────────────────────────────────────────

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (filters.country)          n++
    if (filters.city)             n++
    n += filters.categories.length
    if (filters.budgetMin !== '') n++
    if (filters.budgetMax !== '') n++
    if (filters.dateRange !== 'any')  n++
    if (filters.sort !== 'newest')    n++
    return n
  }, [filters])

  const locationCount = (filters.country ? 1 : 0) + (filters.city ? 1 : 0)
  const budgetCount   = (filters.budgetMin !== '' ? 1 : 0) + (filters.budgetMax !== '' ? 1 : 0)

  const countryInfo = filters.country ? getCountryByCode(filters.country) : null

  // ─── Filter panel (shared between desktop sidebar + mobile overlay) ─────────

  const filterPanel = (
    <div className="flex flex-col h-full">

      {/* Sidebar header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-navy-100 dark:border-navy-700 shrink-0">
        <div className="flex items-center gap-2.5">
          <svg className="w-4 h-4 text-navy-500 dark:text-navy-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          <span className="font-semibold text-navy-900 dark:text-white">Filters</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand-600 text-white text-xs font-bold leading-none">
              {activeFilterCount}
            </span>
          )}
        </div>
        {/* Desktop collapse */}
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg hover:bg-navy-100 dark:hover:bg-navy-700 transition-colors cursor-pointer text-navy-400 dark:text-navy-500 hover:text-navy-600 dark:hover:text-navy-300"
          aria-label="Collapse sidebar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        {/* Mobile close */}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg hover:bg-navy-100 dark:hover:bg-navy-700 transition-colors cursor-pointer text-navy-400 dark:text-navy-500"
          aria-label="Close filters"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto divide-y divide-navy-100 dark:divide-navy-700">

        {/* Location */}
        <FilterSection title="Location" activeCount={locationCount}>
          <div className="flex flex-wrap gap-2 mt-1 min-h-[2rem] items-start">
            {filters.country ? (
              <>
                <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-sm font-medium bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-900/20 dark:text-brand-300 dark:border-brand-800">
                  {countryInfo && <span className="text-base leading-none">{countryInfo.emoji}</span>}
                  <span>{countryInfo?.name ?? filters.country}</span>
                  <button
                    type="button"
                    onClick={() => setFilter({ country: '', city: '' })}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors cursor-pointer"
                    aria-label="Remove country filter"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
                {filters.city && (
                  <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-sm font-medium bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-900/20 dark:text-brand-300 dark:border-brand-800">
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span>{filters.city}</span>
                    <button
                      type="button"
                      onClick={() => setFilter({ city: '' })}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors cursor-pointer"
                      aria-label="Remove city filter"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm text-navy-400 dark:text-navy-500 italic">All locations</span>
            )}
            {!filters.country && user?.country && (
              <button
                type="button"
                onClick={() => setFilter({ country: user.country, city: user.city })}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                + Use my location
              </button>
            )}
          </div>
        </FilterSection>

        {/* Category */}
        <FilterSection title="Category" activeCount={filters.categories.length}>
          <div className="flex flex-wrap gap-2 mt-1">
            <Pill
              active={filters.categories.length === 0}
              onClick={() => setFilter({ categories: [] })}
            >
              All
            </Pill>
            {CATEGORIES.map(({ value, label }) => (
              <Pill
                key={value}
                active={filters.categories.includes(value)}
                onClick={() =>
                  setFilter({
                    categories: filters.categories.includes(value)
                      ? filters.categories.filter((c) => c !== value)
                      : [...filters.categories, value],
                  })
                }
              >
                {label}
              </Pill>
            ))}
          </div>
        </FilterSection>

        {/* Budget */}
        <FilterSection title="Budget" activeCount={budgetCount} defaultOpen={false}>
          <div className="flex items-center gap-2 mt-1">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 dark:text-navy-500 text-sm pointer-events-none select-none">$</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Min"
                value={filters.budgetMin}
                onChange={(e) => setFilter({ budgetMin: e.target.value })}
                className="input pl-7"
              />
            </div>
            <span className="text-navy-400 dark:text-navy-500 shrink-0 text-sm">—</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 dark:text-navy-500 text-sm pointer-events-none select-none">$</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Max"
                value={filters.budgetMax}
                onChange={(e) => setFilter({ budgetMax: e.target.value })}
                className="input pl-7"
              />
            </div>
          </div>
        </FilterSection>

        {/* Scheduled */}
        <FilterSection title="Scheduled" activeCount={filters.dateRange !== 'any' ? 1 : 0} defaultOpen={false}>
          <div className="flex flex-wrap gap-2 mt-1">
            {DATE_OPTIONS.map(({ value, label }) => (
              <Pill
                key={value}
                active={filters.dateRange === value}
                onClick={() => setFilter({ dateRange: value as BoardFilters['dateRange'] })}
              >
                {label}
              </Pill>
            ))}
          </div>
        </FilterSection>

        {/* Sort */}
        <FilterSection title="Sort by" activeCount={filters.sort !== 'newest' ? 1 : 0} defaultOpen={false}>
          <div className="flex flex-wrap gap-2 mt-1">
            {SORT_OPTIONS.map(({ value, label }) => (
              <Pill
                key={value}
                active={filters.sort === value}
                onClick={() => setFilter({ sort: value as BoardFilters['sort'] })}
              >
                {label}
              </Pill>
            ))}
          </div>
        </FilterSection>
      </div>

      {/* Reset */}
      {activeFilterCount > 0 && (
        <div className="px-5 py-3 border-t border-navy-100 dark:border-navy-700 shrink-0">
          <button
            type="button"
            onClick={resetFilters}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-navy-600 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-700 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Reset all filters
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Job Board</h1>
          <p className="text-navy-600 dark:text-navy-400 mt-1">Browse open jobs and apply to the ones that fit you.</p>
        </div>

        {/* Mobile filter toggle */}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden btn-secondary shrink-0 relative"
          aria-label="Open filters"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Layout: sidebar + content */}
      <div className="flex gap-6 items-start">

        {/* ── Desktop sidebar ──────────────────────────────────────────────────── */}
        <div className={`hidden lg:block shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-14'}`}>
          {sidebarOpen ? (
            <div
              className="card overflow-hidden sticky top-6 flex flex-col"
              style={{ maxHeight: 'calc(100vh - 3rem)' }}
            >
              {filterPanel}
            </div>
          ) : (
            /* Rail (collapsed) */
            <div className="card sticky top-6 flex flex-col items-center py-4 gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-navy-100 dark:hover:bg-navy-700 transition-colors cursor-pointer text-navy-500 dark:text-navy-400 hover:text-navy-700 dark:hover:text-navy-200"
                aria-label="Expand filters"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold leading-none">
                  {activeFilterCount}
                </span>
              )}
              <span
                className="text-xs font-semibold text-navy-400 dark:text-navy-500 tracking-widest uppercase select-none"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                Filters
              </span>
            </div>
          )}
        </div>

        {/* ── Mobile overlay ───────────────────────────────────────────────────── */}
        {mobileSidebarOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setMobileSidebarOpen(false)}
              aria-hidden="true"
            />
            <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-white dark:bg-navy-800 shadow-2xl flex flex-col">
              {filterPanel}
            </div>
          </>
        )}

        {/* ── Content ─────────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Results line */}
          {!isLoading && (
            <div className="flex items-center gap-2 text-sm text-navy-500 dark:text-navy-400">
              <span>
                {filteredJobs.length} open job{filteredJobs.length !== 1 ? 's' : ''}
                {rawJobs.length !== filteredJobs.length && (
                  <span className="text-navy-400 dark:text-navy-500">
                    {' '}· filtered from {rawJobs.length}
                  </span>
                )}
              </span>
              {isFetching && (
                <span className="flex items-center gap-1 text-navy-400 dark:text-navy-500">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Refreshing
                </span>
              )}
            </div>
          )}

          {isLoading && <PageLoader />}

          {!isLoading && filteredJobs.length === 0 && (
            <div className="card text-center py-16">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-navy-100 dark:bg-navy-700 flex items-center justify-center">
                <svg className="w-7 h-7 text-navy-400 dark:text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-2">
                {activeFilterCount > 0 ? 'No jobs match your filters' : 'No open jobs right now'}
              </h3>
              <p className="text-navy-600 dark:text-navy-400 mb-4">
                {activeFilterCount > 0
                  ? 'Try adjusting or clearing your filters.'
                  : 'Check back soon — new jobs are posted regularly.'}
              </p>
              {activeFilterCount > 0 && (
                <button type="button" onClick={resetFilters} className="btn-secondary mx-auto">
                  Reset filters
                </button>
              )}
            </div>
          )}

          {!isLoading && filteredJobs.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import PropTypes from 'prop-types'
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { navigationItems, CATEGORIES } from '../../config/navigation'

const CATEGORY_ICONS = {
  audio:         '🎵',
  ai:            '🤖',
  visualization: '📊',
  tools:         '🔧',
  interactive:   '🕹️',
  immersive:     '🌌',
}

function SearchBar({ value, onChange }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
        viewBox="0 0 20 20" fill="currentColor"
      >
        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
      </svg>
      <input
        type="search"
        placeholder="Search demos…"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
      />
    </div>
  )
}

SearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
}

function CategoryTabs({ active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
      {CATEGORIES.map(cat => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-full border transition-colors whitespace-nowrap
            ${active === cat.id
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500 hover:text-gray-900'
            }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}

CategoryTabs.propTypes = {
  active: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
}

function DemoCard({ item }) {
  const icon = item.fullscreen ? '⛶' : (CATEGORY_ICONS[item.category] ?? '📦')
  return (
    <Link
      to={`/${item.id}`}
      className="group flex flex-col gap-2 p-4 sm:p-5 bg-white rounded-xl border border-gray-200 shadow-sm
                 hover:shadow-md hover:border-gray-300 active:scale-[0.98] transition-all duration-150
                 min-h-[80px] touch-manipulation"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl leading-none mt-0.5 select-none">{icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-gray-700 truncate">
            {item.label}
          </h3>
          {item.fullscreen && (
            <span className="inline-block mt-1 text-xs text-gray-400">Fullscreen</span>
          )}
        </div>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 mt-0.5 transition-colors" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    </Link>
  )
}

DemoCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    category: PropTypes.string,
    fullscreen: PropTypes.bool,
  }).isRequired,
}

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return navigationItems.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory
      const matchesQuery = !q || item.label.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [query, activeCategory])

  // Group by category when showing 'all' without a query
  const grouped = useMemo(() => {
    if (activeCategory !== 'all' || query.trim()) return null
    const groups = {}
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    }
    return groups
  }, [filtered, activeCategory, query])

  return (
    <div className="space-y-4 px-4 pb-8 sm:px-0">
      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={query} onChange={setQuery} />
      </div>
      <CategoryTabs active={activeCategory} onChange={setActiveCategory} />

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No demos found for &quot;{query}&quot;</p>
      ) : grouped ? (
        // Grouped view (all + no query)
        Object.entries(grouped).map(([cat, items]) => {
          const catMeta = CATEGORIES.find(c => c.id === cat)
          return (
            <section key={cat}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                {catMeta?.label ?? cat}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(item => <DemoCard key={item.id} item={item} />)}
              </div>
            </section>
          )
        })
      ) : (
        // Flat filtered view
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(item => <DemoCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}

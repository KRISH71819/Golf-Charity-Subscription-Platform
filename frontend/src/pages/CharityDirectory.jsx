import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { enrichCharities } from '../services/predefinedCharities'
import './CharityDirectory.css'

function formatMoney(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))
}

export default function CharityDirectory() {
  const [charities, setCharities] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadCharities() {
      try {
        const { data } = await api.get('/charities')
        if (!cancelled) {
          setCharities(enrichCharities(data || []))
        }
      } catch {
        if (!cancelled) {
          setCharities([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadCharities()
    return () => {
      cancelled = true
    }
  }, [])

  const categories = useMemo(
    () => ['All', ...new Set(charities.map((charity) => charity.category).filter(Boolean))],
    [charities]
  )

  const filtered = charities.filter((charity) => {
    const haystack = `${charity.name} ${charity.description} ${charity.mission}`.toLowerCase()
    const matchSearch = haystack.includes(search.toLowerCase())
    const matchCat = selectedCat === 'All' || charity.category === selectedCat
    return matchSearch && matchCat
  })

  return (
    <div className="charity-dir-page">
      <section className="section page-header">
        <div className="container text-center">
          <span className="badge badge-copper">{charities.length || 0}+ Partners</span>
          <h1 style={{ marginTop: 'var(--space-4)' }}>Charity Directory</h1>
          <p style={{ maxWidth: '600px', margin: 'var(--space-4) auto 0' }}>
            Discover and support verified non-profits making a difference
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="filters-bar" id="charity-filters">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="form-input search-input"
                placeholder="Search charities..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                id="charity-search"
              />
            </div>
            <div className="filter-tags">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`filter-tag ${selectedCat === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCat(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="charity-loading">Loading partner charities...</div>
          ) : (
            <>
              <div className="grid grid-3" style={{ marginTop: 'var(--space-8)' }}>
                {filtered.map((charity) => {
                  const color = charity.preset_color || charity.theme_color || 'var(--color-forest)'
                  return (
                    <Link
                      to={`/charities/${charity.id}`}
                      className="card charity-dir-card"
                      key={charity.id}
                      style={{ textDecoration: 'none' }}
                    >
                      <div className="charity-dir-img" style={{ background: `linear-gradient(135deg, ${color}22, ${color}08)` }}>
                        {charity.icon ? (
                          <span style={{ fontSize: '2.5rem' }}>{charity.icon}</span>
                        ) : charity.logo_url ? (
                          <img src={charity.logo_url} alt={charity.name} className="charity-dir-logo" />
                        ) : (
                          <span className="charity-dir-initial"></span>
                        )}
                      </div>
                      <div className="charity-dir-body">
                        <span className="badge badge-forest">{charity.category || 'General'}</span>
                        <h4>{charity.name}</h4>
                        <p>{charity.preset_desc || charity.description || ''}</p>
                        <div className="charity-dir-footer">
                          <span className="raised-amount">{charity.preset_raised_label || formatMoney(charity.total_raised)} raised</span>
                          <span className="view-link">View →</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {filtered.length === 0 && (
                <div className="text-center" style={{ padding: 'var(--space-16) 0', color: 'var(--color-slate)' }}>
                  <p style={{ fontSize: 'var(--text-xl)' }}>No charities found matching your criteria.</p>
                  <button className="btn btn-secondary" style={{ marginTop: 'var(--space-4)' }} onClick={() => { setSearch(''); setSelectedCat('All') }}>
                    Clear Filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

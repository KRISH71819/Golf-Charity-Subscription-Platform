import { useState } from 'react'
import { Link } from 'react-router-dom'
import './CharityDirectory.css'

const charities = [
  { id: 1, name: 'First Tee', category: 'Youth Development', raised: '$340,000', desc: 'Building game changers by introducing young people to golf and its values.', icon: '🌱', color: '#4A8B4A' },
  { id: 2, name: 'Folds of Honor', category: 'Military Families', raised: '$520,000', desc: 'Providing educational scholarships to spouses and children of fallen and disabled service members.', icon: '🇺🇸', color: '#4A7B8B' },
  { id: 3, name: 'PGA REACH', category: 'Community Outreach', raised: '$280,000', desc: 'The charitable foundation of the PGA of America, focused on inclusion, impact, and community.', icon: '⛳', color: '#D4A030' },
  { id: 4, name: 'Special Olympics Golf', category: 'Adaptive Sports', raised: '$190,000', desc: 'Providing year-round sports training and competition for people with intellectual disabilities.', icon: '🏅', color: '#8B4A6B' },
  { id: 5, name: "St. Jude Children's", category: 'Healthcare', raised: '$410,000', desc: 'Leading the way the world understands, treats and defeats childhood cancer.', icon: '❤️', color: '#8B4A4A' },
  { id: 6, name: 'Golf Course Superintendents Environmental', category: 'Environment', raised: '$150,000', desc: 'Advancing environmentally sound golf course management through research and education.', icon: '🌿', color: '#4A8B6B' },
  { id: 7, name: 'Veterans Golf Association', category: 'Military Families', raised: '$230,000', desc: 'Using golf to enhance veterans\' physical, mental, social, and emotional well-being.', icon: '🎖️', color: '#6B7B4A' },
  { id: 8, name: 'Youth on Course', category: 'Youth Development', raised: '$175,000', desc: 'Providing subsidized rounds for young golfers and support for career development.', icon: '🧒', color: '#4A6B8B' },
  { id: 9, name: 'Wounded Warrior Project', category: 'Military Families', raised: '$380,000', desc: 'Serving veterans and service members who incurred a physical or mental injury.', icon: '💪', color: '#8B6B4A' },
]

const categories = ['All', ...new Set(charities.map(c => c.category))]

export default function CharityDirectory() {
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('All')

  const filtered = charities.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.desc.toLowerCase().includes(search.toLowerCase())
    const matchCat = selectedCat === 'All' || c.category === selectedCat
    return matchSearch && matchCat
  })

  return (
    <div className="charity-dir-page">
      <section className="section page-header">
        <div className="container text-center">
          <span className="badge badge-copper">340+ Partners</span>
          <h1 style={{ marginTop: 'var(--space-4)' }}>Charity Directory</h1>
          <p style={{ maxWidth: '600px', margin: 'var(--space-4) auto 0' }}>
            Discover and support verified non-profits making a difference
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          {/* Search & Filters */}
          <div className="filters-bar" id="charity-filters">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="form-input search-input"
                placeholder="Search charities..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                id="charity-search"
              />
            </div>
            <div className="filter-tags">
              {categories.map(cat => (
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

          {/* Results */}
          <div className="grid grid-3" style={{ marginTop: 'var(--space-8)' }}>
            {filtered.map(charity => (
              <Link
                to={`/charities/${charity.id}`}
                className="card charity-dir-card"
                key={charity.id}
                style={{ textDecoration: 'none' }}
              >
                <div className="charity-dir-img" style={{ background: `linear-gradient(135deg, ${charity.color}20, ${charity.color}08)` }}>
                  <span style={{ fontSize: '2.5rem' }}>{charity.icon}</span>
                </div>
                <div className="charity-dir-body">
                  <span className="badge badge-forest">{charity.category}</span>
                  <h4>{charity.name}</h4>
                  <p>{charity.desc}</p>
                  <div className="charity-dir-footer">
                    <span className="raised-amount">{charity.raised} raised</span>
                    <span className="view-link">View →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center" style={{ padding: 'var(--space-16) 0', color: 'var(--color-slate)' }}>
              <p style={{ fontSize: 'var(--text-xl)' }}>No charities found matching your criteria.</p>
              <button className="btn btn-secondary" style={{ marginTop: 'var(--space-4)' }} onClick={() => { setSearch(''); setSelectedCat('All') }}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

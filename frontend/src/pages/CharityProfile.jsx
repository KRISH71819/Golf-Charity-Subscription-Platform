import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { enrichCharity, getPredefinedCharity } from '../services/predefinedCharities'
import './CharityProfile.css'

function formatMoney(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))
}

export default function CharityProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [charity, setCharity] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadCharity() {
      try {
        const { data } = await api.get(`/charities/${id}`)
        if (!cancelled) {
          setCharity(enrichCharity(data))
        }
      } catch {
        if (!cancelled) {
          setCharity(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadCharity()
    return () => {
      cancelled = true
    }
  }, [id])

  const handleSupportClick = () => {
    const target = `/subscription?charity=${encodeURIComponent(charity.id)}`
    if (user) {
      navigate(target)
    } else {
      navigate(`/signup?redirect=${encodeURIComponent(target)}`)
    }
  }

  if (loading) {
    return <div className="charity-loading-page">Loading charity profile...</div>
  }

  if (!charity) {
    return (
      <div className="charity-loading-page">
        <div className="container text-center">
          <h1>Charity not found</h1>
          <p>This charity may have been removed or is no longer active.</p>
          <Link to="/charities" className="btn btn-secondary" style={{ marginTop: 'var(--space-4)' }}>
            Back to directory
          </Link>
        </div>
      </div>
    )
  }

  const color = charity.theme_color || '#2F4F2F'
  const media = Array.isArray(charity.media_gallery) ? charity.media_gallery.slice(0, 3) : []
  const preset = getPredefinedCharity(charity)
  const scaleFactor = Number(charity.total_raised || preset?.raised_value || 0) / 340000 || 0
  const dynamicDonationHistory = preset ? [
    { month: 'January', amount: 12400 * scaleFactor },
    { month: 'February', amount: 14200 * scaleFactor },
    { month: 'March', amount: 11800 * scaleFactor },
    { month: 'April', amount: 16500 * scaleFactor },
    { month: 'May', amount: 18300 * scaleFactor },
    { month: 'June', amount: 15700 * scaleFactor },
  ] : []
  const maxDonation = Math.max(...dynamicDonationHistory.map((item) => item.amount), 1)
  const baseSupporters = ['Sarah Mitchell', 'James Chen', 'Maria Rodriguez', 'David Park', 'Emily Watson', 'Michael Chang', 'Jessica Taylor', 'Robert Vance', 'Amanda Cole', 'William Hunt']
  const startIndex = (((preset?.id || 1) * 3) % baseSupporters.length)
  const topSupporters = preset
    ? [...baseSupporters.slice(startIndex), ...baseSupporters.slice(0, startIndex)].slice(0, 5)
    : []

  return (
    <div className="charity-profile-page">
      <section className="charity-hero" style={{ background: `linear-gradient(160deg, ${color}18, ${color}06)` }}>
        <div className="container">
          <Link to="/charities" className="back-link">Back to Charities</Link>
          <div className="charity-hero-content">
            <div className="charity-hero-icon" style={{ background: `${color}15` }}>
              {charity.logo_url ? (
                <img src={charity.logo_url} alt={charity.name} className="charity-hero-logo" />
              ) : charity.icon ? (
                <span>{charity.icon}</span>
              ) : (
                <span></span>
              )}
            </div>
            <div>
              <span className="badge badge-forest">{charity.category || 'General'}</span>
              <h1 style={{ marginTop: 'var(--space-2)' }}>{charity.name}</h1>
              <p className="charity-hero-mission">{charity.mission || ''}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="charity-profile-grid">
            <div className="charity-stats-col">
              <div className="card-solid">
                <h3>Impact Summary</h3>
                <div className="charity-stat-list">
                  <div className="charity-stat-item">
                    <span className="charity-stat-label">Total Raised</span>
                    <span className="charity-stat-value">{preset?.raised || formatMoney(charity.total_raised)}</span>
                  </div>
                  <div className="charity-stat-item">
                    <span className="charity-stat-label">Founded</span>
                    <span className="charity-stat-value">{charity.founded || ''}</span>
                  </div>
                  <div className="charity-stat-item">
                    <span className="charity-stat-label">Impact</span>
                    <span className="charity-stat-value">{preset?.impact || charity.impact_summary || ''}</span>
                  </div>
                  <div className="charity-stat-item">
                    <span className="charity-stat-label">Active Supporters</span>
                    <span className="charity-stat-value">{preset ? (Number(charity.total_raised || 0) / 275).toFixed(0).toLocaleString() : Number(charity.supporter_count || 0).toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={handleSupportClick} className="btn btn-copper" style={{ width: '100%', marginTop: 'var(--space-4)' }}>
                  Support This Charity
                </button>
              </div>
            </div>

            <div className="charity-main-col">
              {preset ? (
                <>
                  <div className="card-solid">
                    <h3>Monthly Donations (2025)</h3>
                    <div className="donation-chart">
                      {dynamicDonationHistory.map((item) => (
                        <div className="donation-bar-wrap" key={item.month}>
                          <div
                            className="donation-bar"
                            style={{ height: `${(item.amount / maxDonation) * 100}%`, background: color }}
                          ></div>
                          <span className="donation-month">{item.month.slice(0, 3)}</span>
                          <span className="donation-amount">${item.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card-solid" style={{ marginTop: 'var(--space-6)' }}>
                    <h3>Top Supporters</h3>
                    <div className="supporters-list">
                      {topSupporters.map((name, index) => {
                        const initials = name.split(' ').map((word) => word.charAt(0)).join('')
                        return (
                          <div className="supporter-item" key={name}>
                            <div className="supporter-avatar" style={{ background: `hsl(${(index * 60 + (preset.id * 20)) % 360}, 40%, 85%)` }}>
                              {initials}
                            </div>
                            <div>
                              <strong>{name}</strong>
                              <span className="supporter-rounds">{24 - index * 2 + (preset.id % 3)} rounds this season</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="card-solid">
                    <h3>Mission</h3>
                    <p>{charity.mission || ''}</p>
                  </div>

                  <div className="card-solid" style={{ marginTop: 'var(--space-6)' }}>
                    <h3>Impact Summary</h3>
                    <p>{charity.impact_summary || ''}</p>

                    {media.length > 0 && (
                      <div className="charity-media-grid">
                        {media.map((item) => (
                          <div className="charity-media-tile" key={item} style={{ backgroundImage: `linear-gradient(rgba(47,79,47,0.18), rgba(47,79,47,0.08)), url(${item})` }} />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

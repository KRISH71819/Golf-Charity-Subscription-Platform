import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAuth()
  const [rounds, setRounds] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [roundsRes, statsRes] = await Promise.all([
          api.get('/scores/my-scores'),
          api.get('/scores/stats'),
        ])
        setRounds(roundsRes.data.slice(0, 5))
        setStats(statsRes.data)
      } catch {
        // silently fall back to empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const firstName = user?.full_name?.split(' ')[0] || 'Golfer'
  const tier = user?.subscription_tier || 'birdie'

  // Fallback stats when API returns empty
  const handicap = stats?.handicap ?? '—'
  const totalRounds = stats?.total_rounds ?? 0
  const totalDonated = stats?.total_donated ? `$${stats.total_donated.toFixed(0)}` : '$0'
  const rank = stats?.rank ? `#${stats.rank}` : '—'

  return (
    <div className="dashboard-page">
      <section className="section page-header" style={{ paddingBottom: 'var(--space-4)' }}>
        <div className="container">
          <div className="dash-header">
            <div>
              <h1 style={{ fontSize: 'var(--text-2xl)' }}>Welcome back, {firstName} 👋</h1>
              <p>{tier.charAt(0).toUpperCase() + tier.slice(1)} plan · {totalRounds} rounds played</p>
            </div>
            <Link to="/scores" className="btn btn-copper" id="new-round-btn">
              + Log New Round
            </Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <p style={{ color: 'var(--color-slate)' }}>Loading your data…</p>
            </div>
          ) : (
            <>
              {/* Stat cards */}
              <div className="dash-stats" id="dashboard-stats">
                {[
                  { label: 'Handicap', value: handicap, sub: 'Current index', accent: 'forest' },
                  { label: 'Rounds Played', value: totalRounds, sub: 'This season', accent: 'copper' },
                  { label: 'Total Donated', value: totalDonated, sub: 'Across charities', accent: 'copper' },
                  { label: 'Leaderboard', value: rank, sub: 'Current rank', accent: 'forest' },
                ].map(s => (
                  <div className="card dash-stat-card" key={s.label}>
                    <span className="dash-stat-label">{s.label}</span>
                    <strong className={`dash-stat-value color-${s.accent}`}>{s.value}</strong>
                    <span className="dash-stat-sub">{s.sub}</span>
                  </div>
                ))}
              </div>

              <div className="dash-grid">
                {/* Recent Rounds */}
                <div className="card" id="recent-rounds">
                  <div className="card-header-row">
                    <h3>Recent Rounds</h3>
                    <Link to="/scores" className="link-sm">View all →</Link>
                  </div>
                  {rounds.length === 0 ? (
                    <p style={{ color: 'var(--color-slate)', padding: 'var(--space-4)' }}>No rounds yet — <Link to="/scores">log your first round</Link>!</p>
                  ) : (
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Course</th>
                          <th>Score</th>
                          <th>+/−</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rounds.map(r => {
                          const diff = r.total_score - (r.course_par || 72)
                          return (
                            <tr key={r.id}>
                              <td>{new Date(r.date_played).toLocaleDateString()}</td>
                              <td>{r.course_name}</td>
                              <td><strong>{r.total_score}</strong></td>
                              <td className={diff > 0 ? 'over' : 'under'}>
                                {diff > 0 ? '+' : ''}{diff}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Charity Impact placeholder */}
                <div className="card" id="charity-impact">
                  <div className="card-header-row">
                    <h3>Your Impact</h3>
                    <span className="badge badge-copper">{totalDonated} donated</span>
                  </div>
                  <p style={{ color: 'var(--color-slate)', padding: 'var(--space-4)' }}>
                    Your subscription contributions are distributed to your chosen charities each month.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

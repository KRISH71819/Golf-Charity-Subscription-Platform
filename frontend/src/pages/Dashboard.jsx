import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Dashboard.css'

export default function Dashboard() {
  const { user, setUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [rounds, setRounds] = useState([])
  const [stats, setStats] = useState(null)
  const [wins, setWins] = useState([])
  const [subscriptionHistory, setSubscriptionHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncingSubscription, setSyncingSubscription] = useState(false)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')

    const load = async () => {
      try {
        if (sessionId) {
          setSyncingSubscription(true)
          await api.post('/subscriptions/sync-session', { sessionId })
          const nextParams = new URLSearchParams(searchParams)
          nextParams.delete('session_id')
          setSearchParams(nextParams, { replace: true })
        }

        const [roundsRes, statsRes, userRes, winsRes, historyRes] = await Promise.all([
          api.get('/scores/my-scores'),
          api.get('/users/me/stats'),
          api.get('/users/me'),
          api.get('/users/me/wins'),
          api.get('/subscriptions/history'),
        ])

        setRounds((roundsRes.data || []).slice(0, 5))
        setStats(statsRes.data)
        setWins(winsRes.data || [])
        setSubscriptionHistory(historyRes.data || [])
        setUser((current) => ({ ...current, ...userRes.data }))
      } catch {
        // Keep the dashboard resilient if one request fails.
      } finally {
        setSyncingSubscription(false)
        setLoading(false)
      }
    }

    load()
  }, [searchParams, setSearchParams, setUser])

  const firstName = user?.full_name?.split(' ')[0] || 'Golfer'
  const tier = user?.subscription_tier || 'birdie'
  const handicap = stats?.handicap ?? '—'
  const totalRounds = stats?.total_rounds ?? 0
  const totalDonated = stats?.total_donated ? `$${stats.total_donated.toFixed(0)}` : '$0'
  const rank = stats?.rank ? `#${stats.rank}` : '—'
  const totalWinnings = stats?.totalWinnings ? `$${Number(stats.totalWinnings).toLocaleString()}` : '$0'
  const planStatus = user?.subscription_status || 'inactive'
  const supportedCharity = user?.selected_charity?.name || 'No charity selected'

  return (
    <div className="dashboard-page">
      <section className="section page-header" style={{ paddingBottom: 'var(--space-4)' }}>
        <div className="container">
          <div className="dash-header">
            <div>
              <h1 style={{ fontSize: 'var(--text-2xl)' }}>Welcome back, {firstName}</h1>
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
              <p style={{ color: 'var(--color-slate)' }}>
                {syncingSubscription ? 'Updating your subscription...' : 'Loading your data...'}
              </p>
            </div>
          ) : (
            <>
              <div className="dash-stats" id="dashboard-stats">
                {[
                  { label: 'Handicap', value: handicap, sub: 'Current index', accent: 'forest' },
                  { label: 'Rounds Played', value: totalRounds, sub: 'This season', accent: 'copper' },
                  { label: 'Total Donated', value: totalDonated, sub: 'Across charities', accent: 'copper' },
                  { label: 'Leaderboard', value: rank, sub: 'Current rank', accent: 'forest' },
                ].map((entry) => (
                  <div className="card dash-stat-card" key={entry.label}>
                    <span className="dash-stat-label">{entry.label}</span>
                    <strong className={`dash-stat-value color-${entry.accent}`}>{entry.value}</strong>
                    <span className="dash-stat-sub">{entry.sub}</span>
                  </div>
                ))}
              </div>

              <div className="dash-grid">
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
                          <th>Stableford</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rounds.map((round) => (
                          <tr key={round.id}>
                            <td>{new Date(round.played_at).toLocaleDateString()}</td>
                            <td>{round.course_name}</td>
                            <td><strong>{round.stableford_points}</strong></td>
                            <td>{round.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="card" id="charity-impact">
                  <div className="card-header-row">
                    <h3>Your Impact</h3>
                    <span className="badge badge-copper">{totalDonated} donated</span>
                  </div>
                  <div className="dashboard-impact-copy">
                    <p>Your subscription contributions are distributed to your chosen charities each month.</p>
                    <p><strong>Current plan:</strong> {tier.charAt(0).toUpperCase() + tier.slice(1)} ({planStatus})</p>
                    <p><strong>Supporting:</strong> {supportedCharity}</p>
                    <p><strong>{totalWinnings}</strong> prize winnings recorded so far.</p>
                  </div>
                </div>

                <div className="card" id="recent-wins">
                  <div className="card-header-row">
                    <h3>Your Wins</h3>
                    <span className="badge badge-forest">{wins.length} total</span>
                  </div>
                  {wins.length === 0 ? (
                    <p style={{ color: 'var(--color-slate)', padding: 'var(--space-4)' }}>When you win a draw, it will appear here automatically.</p>
                  ) : (
                    <div className="win-list">
                      {wins.slice(0, 3).map((win) => (
                        <article className="win-item" key={win.id}>
                          <div>
                            <strong>{win.draw?.title || 'Monthly Draw'}</strong>
                            <p>Rank #{win.rank}{win.charity?.name ? ` · Supporting ${win.charity.name}` : ''}</p>
                          </div>
                          <div className="win-item-meta">
                            <span>${Number(win.payout_amount || 0).toLocaleString()}</span>
                            <small>{win.payout_status}</small>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card" id="subscription-history">
                  <div className="card-header-row">
                    <h3>Subscription History</h3>
                    <span className="badge badge-forest">{subscriptionHistory.length} records</span>
                  </div>
                  {subscriptionHistory.length === 0 ? (
                    <p style={{ color: 'var(--color-slate)', padding: 'var(--space-4)' }}>Your payments and subscription activity will appear here after checkout.</p>
                  ) : (
                    <div className="win-list">
                      {subscriptionHistory.slice(0, 4).map((entry) => (
                        <article className="win-item" key={entry.id}>
                          <div>
                            <strong>{entry.tier?.charAt(0).toUpperCase() + entry.tier?.slice(1)} Plan</strong>
                            <p>{entry.charity?.name || 'No charity selected'}</p>
                            <small>
                              Paid on {new Date(entry.created_at).toLocaleDateString()}
                              {entry.current_period_end ? ` · Renews until ${new Date(entry.current_period_end).toLocaleDateString()}` : ''}
                            </small>
                          </div>
                          <div className="win-item-meta">
                            <span>{entry.status}</span>
                            <small>{entry.stripe_subscription_id ? 'Stripe' : 'Manual'}</small>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

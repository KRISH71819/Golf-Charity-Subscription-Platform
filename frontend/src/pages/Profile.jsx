import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Profile.css'

function formatMonth(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(value))
}

export default function Profile() {
  const { user, setUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [subscriptionHistory, setSubscriptionHistory] = useState([])
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    handicap: '',
    subscription_tier: 'free',
    subscription_status: 'inactive',
    home_course: '',
    selected_charity_name: '',
    created_at: '',
  })
  const [stats, setStats] = useState({ totalScores: 0, totalWinnings: 0, drawEntries: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      try {
        const [{ data: profileData }, { data: statsData }, { data: historyData }] = await Promise.all([
          api.get('/users/me'),
          api.get('/users/me/stats'),
          api.get('/subscriptions/history'),
        ])

        if (cancelled) return
        setProfile({
          full_name: profileData.full_name || '',
          email: profileData.email || '',
          handicap: profileData.handicap ?? '',
          subscription_tier: profileData.subscription_tier || 'free',
          subscription_status: profileData.subscription_status || 'inactive',
          home_course: profileData.home_course || '',
          selected_charity_name: profileData.selected_charity?.name || '',
          created_at: profileData.created_at || '',
        })
        setStats(statsData || { totalScores: 0, totalWinnings: 0, drawEntries: 0 })
        setSubscriptionHistory(historyData || [])
        setUser((current) => ({ ...current, ...profileData }))
      } catch {
        // leave current values if request fails
      }
    }

    loadProfile()
    return () => {
      cancelled = true
    }
  }, [setUser])

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.patch('/users/me', {
        full_name: profile.full_name,
        handicap: profile.handicap === '' ? null : Number(profile.handicap),
        home_course: profile.home_course,
      })

      setProfile((current) => ({
        ...current,
        full_name: data.full_name || '',
        handicap: data.handicap ?? '',
        home_course: data.home_course || '',
      }))
      setUser((current) => ({ ...current, ...data }))
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const initials = (profile.full_name || user?.full_name || 'FG')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'FG'

  const plan = profile.subscription_tier
    ? profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)
    : 'Free'
  const planStatus = profile.subscription_status || 'inactive'

  return (
    <div className="profile-page">
      <section className="section page-header" style={{ paddingBottom: 'var(--space-4)' }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <h1>My Profile</h1>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <div className="profile-grid">
            <div className="card" id="profile-info">
              <div className="profile-avatar-row">
                <div className="profile-avatar">{initials}</div>
                <div>
                  <h2>{profile.full_name || 'Member'}</h2>
                  <span className="badge badge-forest">{plan} Plan</span>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => setEditing((current) => !current)}
                  id="edit-profile-btn"
                >
                  {editing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {editing ? (
                <form className="profile-fields" onSubmit={handleSave}>
                  <label className="form-label">
                    Full Name
                    <input className="form-input" value={profile.full_name} onChange={(event) => setProfile({ ...profile, full_name: event.target.value })} id="prof-name" />
                  </label>
                  <label className="form-label">
                    Email
                    <input className="form-input" type="email" value={profile.email} disabled id="prof-email" />
                  </label>
                  <label className="form-label">
                    Home Course
                    <input className="form-input" value={profile.home_course} onChange={(event) => setProfile({ ...profile, home_course: event.target.value })} />
                  </label>
                  <label className="form-label">
                    Handicap
                    <input className="form-input" type="number" step="0.1" value={profile.handicap} onChange={(event) => setProfile({ ...profile, handicap: event.target.value })} />
                  </label>
                  <button className="btn btn-copper" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                </form>
              ) : (
                <div className="profile-details">
                  {[
                    ['Email', profile.email],
                    ['Handicap', profile.handicap === '' ? '' : profile.handicap],
                    ['Home Course', profile.home_course],
                    ['Plan Status', planStatus],
                    ['Supporting', profile.selected_charity_name || 'No charity selected'],
                    ['Member Since', formatMonth(profile.created_at)],
                  ].map(([label, value]) => (
                    <div className="detail-row" key={label}>
                      <span className="detail-label">{label}</span>
                      <span className="detail-value">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card" id="season-history">
              <h3>Member Summary</h3>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Rounds Logged</strong></td>
                    <td>{stats.totalScores || 0}</td>
                  </tr>
                  <tr>
                    <td><strong>Draw Entries</strong></td>
                    <td>{stats.drawEntries || 0}</td>
                  </tr>
                  <tr>
                    <td><strong>Total Winnings</strong></td>
                    <td>${Number(stats.totalWinnings || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td><strong>Current Plan</strong></td>
                    <td>{plan}</td>
                  </tr>
                  <tr>
                    <td><strong>Plan Status</strong></td>
                    <td>{planStatus}</td>
                  </tr>
                  <tr>
                    <td><strong>Supported Charity</strong></td>
                    <td>{profile.selected_charity_name || 'No charity selected'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card" id="payment-history">
              <h3>Payment History</h3>
              {subscriptionHistory.length === 0 ? (
                <p style={{ color: 'var(--color-slate)' }}>No subscription payments recorded yet.</p>
              ) : (
                <div className="profile-details">
                  {subscriptionHistory.map((entry) => (
                    <div className="detail-row" key={entry.id}>
                      <div>
                        <div className="detail-value">
                          {(entry.tier?.charAt(0).toUpperCase() + entry.tier?.slice(1)) || 'Plan'} · {entry.charity?.name || 'No charity selected'}
                        </div>
                        <div className="detail-label">
                          Paid on {formatMonth(entry.created_at)}
                          {entry.current_period_end ? ` · Active until ${formatMonth(entry.current_period_end)}` : ''}
                        </div>
                      </div>
                      <span className="detail-value">{entry.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

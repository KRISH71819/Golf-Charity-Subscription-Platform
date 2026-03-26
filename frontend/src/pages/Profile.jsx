import { useState } from 'react'
import './Profile.css'

const seasonHistory = [
  { season: 'Season 14 (current)', rounds: 24, avg: 79.2, donated: '$310', rank: '#5' },
  { season: 'Season 13', rounds: 30, avg: 81.4, donated: '$225', rank: '#8' },
  { season: 'Season 12', rounds: 18, avg: 83.1, donated: '$148', rank: '#14' },
]

export default function Profile() {
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    handicap: '8.4',
    plan: 'Eagle',
    homeCourse: 'Pine Valley GC',
  })

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
            {/* Info card */}
            <div className="card" id="profile-info">
              <div className="profile-avatar-row">
                <div className="profile-avatar">SC</div>
                <div>
                  <h2>{profile.name}</h2>
                  <span className="badge badge-forest">{profile.plan} Plan</span>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => setEditing(!editing)}
                  id="edit-profile-btn"
                >
                  {editing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {editing ? (
                <form className="profile-fields" onSubmit={e => { e.preventDefault(); setEditing(false) }}>
                  <label className="form-label">
                    Full Name
                    <input className="form-input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} id="prof-name" />
                  </label>
                  <label className="form-label">
                    Email
                    <input className="form-input" type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} id="prof-email" />
                  </label>
                  <label className="form-label">
                    Home Course
                    <input className="form-input" value={profile.homeCourse} onChange={e => setProfile({ ...profile, homeCourse: e.target.value })} />
                  </label>
                  <button className="btn btn-copper" type="submit">Save Changes</button>
                </form>
              ) : (
                <div className="profile-details">
                  {[
                    ['Email', profile.email],
                    ['Handicap', profile.handicap],
                    ['Home Course', profile.homeCourse],
                    ['Member Since', 'Jan 2024'],
                  ].map(([l, v]) => (
                    <div className="detail-row" key={l}>
                      <span className="detail-label">{l}</span>
                      <span className="detail-value">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Season history */}
            <div className="card" id="season-history">
              <h3>Season History</h3>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Season</th>
                    <th>Rounds</th>
                    <th>Avg Score</th>
                    <th>Donated</th>
                    <th>Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonHistory.map(s => (
                    <tr key={s.season}>
                      <td><strong>{s.season}</strong></td>
                      <td>{s.rounds}</td>
                      <td>{s.avg}</td>
                      <td className="color-copper">{s.donated}</td>
                      <td>{s.rank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Settings quick links */}
            <div className="card" id="profile-settings">
              <h3>Settings</h3>
              <div className="settings-list">
                {[
                  ['🎯', 'Charity Preferences', 'Choose where your donations go'],
                  ['💳', 'Billing & Plan', 'Manage your Eagle subscription'],
                  ['🔔', 'Notifications', 'Email & push preferences'],
                  ['🔒', 'Privacy & Data', 'Download or delete your data'],
                ].map(([icon, title, desc]) => (
                  <button className="settings-item" key={title}>
                    <span className="settings-icon">{icon}</span>
                    <div>
                      <strong>{title}</strong>
                      <span>{desc}</span>
                    </div>
                    <span className="settings-arrow">→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function AdminConsole() {
  const stats = [
    { label: 'Total Members', value: '2,041', icon: '👥' },
    { label: 'Active Season', value: 'Season 14', icon: '📅' },
    { label: 'Total Donated', value: '$48,320', icon: '💚' },
    { label: 'Pending Reviews', value: '3', icon: '📋' },
  ]

  return (
    <div className="score-page">
      <section className="section page-header" style={{ paddingBottom: 'var(--space-4)' }}>
        <div className="container" style={{ maxWidth: 1000 }}>
          <h1>Admin Console</h1>
          <p>Platform management and oversight.</p>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ maxWidth: 1000 }}>
          <div className="stat-grid">
            {stats.map(s => (
              <div className="stat-card card" key={s.label}>
                <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                <h3 className="stat-value" style={{ marginTop: 'var(--space-2)' }}>{s.value}</h3>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ marginTop: 'var(--space-6)', padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-slate)' }}>
            <p>Full admin features (member management, draw execution, charity payouts, season configuration) will be available in the next release.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

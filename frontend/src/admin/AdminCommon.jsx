/* eslint-disable react-refresh/only-export-components */

export const adminSections = [
  { id: 'analytics', label: 'Analytics', href: '/admin/analytics', blurb: 'Platform totals and recent operations.' },
  { id: 'users', label: 'Users', href: '/admin/users', blurb: 'Profiles, plans, and score editing.' },
  { id: 'draws', label: 'Draws', href: '/admin/draws', blurb: 'Configure, simulate, and publish monthly draws.' },
  { id: 'charities', label: 'Charities', href: '/admin/charities', blurb: 'Manage partner content and media.' },
  { id: 'winners', label: 'Winners', href: '/admin/winners', blurb: 'Verify proof and mark payouts.' },
]

export const subscriptionStatuses = ['active', 'inactive', 'past_due', 'cancelled', 'trialing']
export const subscriptionTiers = ['free', 'birdie', 'eagle', 'albatross']
export const drawModes = ['random', 'algorithmic']
export const proofStatuses = ['pending', 'approved', 'rejected']
export const payoutStatuses = ['pending', 'paid']

export function formatMoney(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))
}

export function formatDate(value, options = {}) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(new Date(value))
}

export function toDateTimeInput(value) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 16)
}

export function galleryArrayToText(value) {
  return Array.isArray(value) ? value.join('\n') : ''
}

export function galleryTextToArray(value) {
  return String(value || '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function createEmptyScoreForm() {
  return {
    stableford_points: '',
    course_name: '',
    played_at: '',
    notes: '',
  }
}

export function createEmptyDrawForm() {
  return {
    title: '',
    draw_date: '',
    prize_description: '',
    prize_value: 0,
    charity_donation: 0,
    selection_mode: 'random',
    winner_count: 1,
    entry_window_start: '',
    entry_window_end: '',
    notes: '',
  }
}

export function createEmptyCharityForm() {
  return {
    name: '',
    slug: '',
    category: '',
    description: '',
    mission: '',
    impact_summary: '',
    icon: '',
    founded: '',
    logo_url: '',
    cover_url: '',
    website: '',
    media_gallery: '',
    total_raised: 0,
    supporter_count: 0,
    featured: false,
    active: true,
    theme_color: '#204e4a',
  }
}

export function statusTone(status) {
  switch (status) {
    case 'active':
    case 'approved':
    case 'paid':
    case 'completed':
      return 'success'
    case 'pending':
    case 'trialing':
      return 'warning'
    case 'rejected':
    case 'past_due':
    case 'cancelled':
      return 'danger'
    default:
      return 'neutral'
  }
}

export function StatusPill({ status, children }) {
  return <span className={`admin-pill admin-pill-${statusTone(status)}`}>{children || status}</span>
}

export function SectionHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="admin-section-header">
      <div>
        <span className="admin-section-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="admin-section-actions">{actions}</div> : null}
    </div>
  )
}

export function Panel({ title, subtitle, actions, children, className = '' }) {
  return (
    <section className={`admin-panel ${className}`.trim()}>
      {(title || actions) && (
        <div className="admin-panel-head">
          <div>
            {title ? <h2>{title}</h2> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {actions ? <div className="admin-panel-actions">{actions}</div> : null}
        </div>
      )}
      {children}
    </section>
  )
}

export function LoadingBlock({ label = 'Loading admin data...' }) {
  return (
    <div className="admin-state">
      <div className="admin-spinner" />
      <p>{label}</p>
    </div>
  )
}

export function EmptyState({ title, body }) {
  return (
    <div className="admin-state admin-state-muted">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { adminApi, getErrorMessage } from './adminApi'
import {
  adminSections,
  LoadingBlock,
  SectionHeader,
} from './AdminCommon'
import AdminAnalyticsView from './AdminAnalyticsView'
import AdminUsersView from './AdminUsersView'
import AdminDrawsView from './AdminDrawsView'
import AdminCharitiesView from './AdminCharitiesView'
import AdminWinnersView from './AdminWinnersView'
import './admin.css'

function AccessDenied() {
  return (
    <div className="admin-shell admin-access-shell">
      <div className="admin-access-card">
        <span className="admin-section-eyebrow">Restricted Surface</span>
        <h1>Admin access is limited to approved operators.</h1>
        <p>
          Your account is authenticated, but the Supabase profile does not currently have the
          required <code>is_admin</code> flag.
        </p>
        <div className="admin-access-actions">
          <Link to="/dashboard" className="btn btn-secondary">Go to dashboard</Link>
          <Link to="/" className="btn btn-primary">Return home</Link>
        </div>
      </div>
    </div>
  )
}

export default function AdminApp() {
  const { logout, setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [error, setError] = useState('')

  const activeSection = useMemo(() => {
    const segment = location.pathname.split('/')[2] || 'analytics'
    return adminSections.some((section) => section.id === segment) ? segment : 'analytics'
  }, [location.pathname])

  useEffect(() => {
    if (location.pathname === '/admin' || location.pathname === '/admin/') {
      navigate('/admin/analytics', { replace: true })
    }
  }, [location.pathname, navigate])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true })
      return
    }

    let cancelled = false

    async function loadSession() {
      setLoading(true)
      try {
        const { data } = await adminApi.getSession()
        if (cancelled) return
        setSession(data)
        setUser((current) => ({ ...current, ...data }))
        setDenied(false)
        setError('')
      } catch (requestError) {
        if (cancelled) return
        const status = requestError?.response?.status
        if (status === 401) {
          navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true })
          return
        }
        if (status === 403) {
          setDenied(true)
          setError('')
          return
        }
        setError(getErrorMessage(requestError, 'Unable to load admin session.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadSession()
    return () => {
      cancelled = true
    }
  }, [location.pathname, navigate, setUser])

  if (loading) {
    return (
      <div className="admin-shell admin-access-shell">
        <LoadingBlock label="Checking admin access..." />
      </div>
    )
  }

  if (denied) {
    return <AccessDenied />
  }

  const sectionTitle = adminSections.find((section) => section.id === activeSection)

  return (
    <div className="admin-shell">
      <div className="admin-backdrop admin-backdrop-one" />
      <div className="admin-backdrop admin-backdrop-two" />

      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand">
          <span className="admin-brand-mark">FG</span>
          <div>
            <strong>FairwayGives</strong>
            <span>Admin Control</span>
          </div>
        </Link>

        <nav className="admin-nav">
          {adminSections.map((section) => (
            <NavLink
              key={section.id}
              to={section.href}
              className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
            >
              <strong>{section.label}</strong>
              <span>{section.blurb}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <span className="admin-section-eyebrow">Signed in as</span>
          <strong>{session?.full_name || session?.email}</strong>
          <button type="button" className="btn btn-secondary" onClick={() => logout('/login')}>Log out</button>
        </div>
      </aside>

      <main className="admin-main">
        <SectionHeader
          eyebrow="Operations"
          title={sectionTitle?.label || 'Admin'}
          description={sectionTitle?.blurb || 'Manage the platform from a single operational surface.'}
          actions={error ? <span className="admin-inline-error">{error}</span> : null}
        />

        {activeSection === 'analytics' && <AdminAnalyticsView />}
        {activeSection === 'users' && <AdminUsersView />}
        {activeSection === 'draws' && <AdminDrawsView />}
        {activeSection === 'charities' && <AdminCharitiesView />}
        {activeSection === 'winners' && <AdminWinnersView />}
      </main>
    </div>
  )
}

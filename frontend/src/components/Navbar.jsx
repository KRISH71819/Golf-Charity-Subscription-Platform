import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { isAuthenticated, user, logout } = useAuth()

  const publicLinks = [
    { to: '/', label: 'Home' },
    { to: '/how-it-works', label: 'How It Works' },
    { to: '/charities', label: 'Charities' },
    { to: '/leaderboard', label: 'Leaderboard' },
    { to: '/pricing', label: 'Pricing' },
  ]

  const authLinks = [
    { to: '/scores', label: 'Scores' },
    { to: '/dashboard', label: 'Dashboard' },
  ]

  const links = isAuthenticated ? [...publicLinks, ...authLinks] : publicLinks

  return (
    <nav className="navbar" id="main-navigation">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo" id="logo-link">
          <span className="logo-icon">⛳</span>
          <span className="logo-text">GolfGives</span>
        </Link>

        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {links.map(link => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="btn btn-secondary btn-sm" id="profile-btn">
                {user?.full_name?.split(' ')[0] || 'Profile'}
              </Link>
              <button className="btn btn-primary btn-sm" id="logout-btn" onClick={logout}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm" id="login-btn">Log In</Link>
              <Link to="/signup" className="btn btn-primary btn-sm" id="signup-btn">Subscribe</Link>
            </>
          )}
        </div>

        <button
          className="navbar-toggle"
          id="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${menuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>
    </nav>
  )
}

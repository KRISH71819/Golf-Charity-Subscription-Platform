import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Signup.css'

export default function Signup() {
  const { register, loading } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const searchParams = new URLSearchParams(window.location.search)
      const redirectParam = searchParams.get('redirect')

      await register(
        {
          full_name: form.name,
          email: form.email,
          password: form.password,
        },
        {
          redirectTo: redirectParam || '/dashboard',
        }
      )
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.'
      setError(errorMessage)
    }
  }

  return (
    <div className="signup-page">
      <section className="section">
        <div className="container signup-container">
          <div className="signup-sidebar">
            <h2>Join FairwayGives</h2>
            <p>Create your account first. You can choose a plan later from the subscription page.</p>

            <div className="signup-benefits">
              <h4>What you get:</h4>
              <ul>
                <li>Score tracking & handicap</li>
                <li>Automatic charity donations</li>
                <li>Seasonal prize pool access</li>
                <li>Community leaderboard</li>
              </ul>
            </div>
          </div>

          <div className="signup-form-panel card" id="signup-form">
            <div className="step-panel">
              <h3>Create your account</h3>
              {error && (
                <div style={{
                  background: 'rgba(220,53,69,0.1)',
                  border: '1px solid rgba(220,53,69,0.3)',
                  borderRadius: 8,
                  padding: 'var(--space-3)',
                  marginBottom: 'var(--space-4)',
                  color: '#dc3545',
                  fontSize: 'var(--text-sm)',
                  textAlign: 'center',
                }}>
                  {error}
                </div>
              )}
              <form className="signup-fields" onSubmit={handleRegister}>
                <label className="form-label">
                  Full Name
                  <input
                    type="text"
                    className="form-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    id="signup-name"
                  />
                </label>
                <label className="form-label">
                  Email
                  <input
                    type="email"
                    className="form-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    id="signup-email"
                  />
                </label>
                <label className="form-label">
                  Password
                  <input
                    type="password"
                    className="form-input"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    id="signup-password"
                  />
                </label>
                <button type="submit" className="btn btn-copper" disabled={loading} style={{ width: '100%', marginTop: 'var(--space-5)' }}>
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </form>
              <p className="text-xs" style={{ marginTop: 'var(--space-4)', color: 'var(--color-slate)' }}>
                By signing up you agree to our <Link to="#">Terms</Link> and <Link to="#">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

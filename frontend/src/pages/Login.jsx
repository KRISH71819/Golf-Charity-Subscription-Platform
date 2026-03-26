import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      
      // Look for a redirect parameter in the URL if they came from a payment button
      const searchParams = new URLSearchParams(window.location.search)
      const redirectParam = searchParams.get('redirect')
      
      if (redirectParam) {
        navigate(redirectParam)
      }
    } catch (err) {
      // Ensure the error message specifically mentions login failure
      const errorMessage = err.response?.data?.error || "Invalid email or password. Please try again."
      setError(errorMessage)
    }
  }

  return (
    <div className="score-page">
      <section className="section" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ maxWidth: 440 }}>
          <div className="card" style={{ padding: 'var(--space-8)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-2)' }}>Welcome Back</h2>
            <p style={{ textAlign: 'center', color: 'var(--color-slate)', marginBottom: 'var(--space-6)' }}>
              Sign in to your FairwayGives account
            </p>

            {error && (
              <div style={{
                background: 'rgba(220,53,69,0.1)',
                border: '1px solid rgba(220,53,69,0.3)',
                borderRadius: 8,
                padding: 'var(--space-3)',
                marginBottom: 'var(--space-4)',
                color: '#dc3545',
                fontSize: 'var(--text-sm)',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} id="login-form">
              <label className="form-label">
                Email
                <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required id="login-email" />
              </label>
              <label className="form-label" style={{ marginTop: 'var(--space-4)' }}>
                Password
                <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required id="login-password" />
              </label>
              <button
                className="btn btn-copper btn-lg"
                style={{ width: '100%', marginTop: 'var(--space-6)' }}
                type="submit"
                id="login-submit"
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 'var(--space-5)', fontSize: 'var(--text-sm)' }}>
              Don't have an account? <Link to="/signup" style={{ color: 'var(--color-copper)', fontWeight: 600 }}>Sign up</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Signup.css'

const plans = [
  { id: 'birdie', name: 'Birdie', price: 29, icon: '🐦' },
  { id: 'eagle', name: 'Eagle', price: 59, icon: '🦅' },
  { id: 'albatross', name: 'Albatross', price: 99, icon: '🏆' },
]

const charities = [
  'First Tee',
  'The First Green',
  'PGA REACH',
  'Golf Fore Africa',
  'Birdies for the Brave',
  'Folds of Honor',
]

export default function Signup() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState('eagle')
  const [selectedCharities, setSelectedCharities] = useState([])
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  const toggleCharity = (c) => {
    setSelectedCharities(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    )
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await register({
        full_name: form.name,
        email: form.email,
        password: form.password,
        subscription_tier: selectedPlan,
      })
      
      // Look for a redirect parameter in the URL (e.g., ?redirect=/subscription)
      const searchParams = new URLSearchParams(window.location.search)
      const redirectParam = searchParams.get('redirect')
      
      if (redirectParam) {
        navigate(redirectParam)
      }
    } catch (err) {
      // Safely extract the 409 Conflict error message from your backend
      const errorMessage = err.response?.data?.error || "Registration failed. Please try again."
      setError(errorMessage)
    }
  }

  return (
    <div className="signup-page">
      <section className="section">
        <div className="container signup-container">
          <div className="signup-sidebar">
            <h2>Join FairwayGives</h2>
            <p>Start your journey of playing with purpose in just 3 steps.</p>

            <div className="step-progress">
              {['Choose Plan', 'Select Charities', 'Create Account'].map((label, i) => (
                <div className={`step-item ${step > i + 1 ? 'done' : ''} ${step === i + 1 ? 'active' : ''}`} key={label}>
                  <div className="step-circle">{step > i + 1 ? '✓' : i + 1}</div>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="signup-benefits">
              <h4>What you get:</h4>
              <ul>
                <li>✓ Score tracking & handicap</li>
                <li>✓ Automatic charity donations</li>
                <li>✓ Seasonal prize pool access</li>
                <li>✓ Community leaderboard</li>
              </ul>
            </div>
          </div>

          <div className="signup-form-panel card" id="signup-form">
            {/* Step 1 – Plan */}
            {step === 1 && (
              <div className="step-panel">
                <h3>Choose your plan</h3>
                <div className="plan-picker">
                  {plans.map(p => (
                    <button
                      key={p.id}
                      className={`plan-option ${selectedPlan === p.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPlan(p.id)}
                      id={`pick-${p.id}`}
                    >
                      <span className="plan-option-icon">{p.icon}</span>
                      <strong>{p.name}</strong>
                      <span className="plan-option-price">${p.price}/mo</span>
                    </button>
                  ))}
                </div>
                <button className="btn btn-copper btn-lg" style={{ width: '100%', marginTop: 'var(--space-6)' }} onClick={() => setStep(2)}>
                  Continue
                </button>
              </div>
            )}

            {/* Step 2 – Charities */}
            {step === 2 && (
              <div className="step-panel">
                <h3>Select your charities</h3>
                <p className="text-sm" style={{ color: 'var(--color-slate)', marginBottom: 'var(--space-4)' }}>
                  Choose where your giving goes
                </p>
                <div className="charity-picker">
                  {charities.map(c => (
                    <button
                      key={c}
                      className={`charity-chip ${selectedCharities.includes(c) ? 'selected' : ''}`}
                      onClick={() => toggleCharity(c)}
                    >
                      {selectedCharities.includes(c) ? '✓ ' : ''}{c}
                    </button>
                  ))}
                </div>
                <div className="step-actions">
                  <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                  <button className="btn btn-copper" onClick={() => setStep(3)} disabled={selectedCharities.length === 0}>
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 – Account */}
            {step === 3 && (
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
                    textAlign: 'center'
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
                      onChange={e => setForm({ ...form, name: e.target.value })}
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
                      onChange={e => setForm({ ...form, email: e.target.value })}
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
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      required
                      id="signup-password"
                    />
                  </label>
                  <div className="step-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
                    <button type="submit" className="btn btn-copper" disabled={loading}>
                      {loading ? 'Creating…' : 'Create Account'}
                    </button>
                  </div>
                </form>
                <p className="text-xs" style={{ marginTop: 'var(--space-4)', color: 'var(--color-slate)' }}>
                  By signing up you agree to our <Link to="#">Terms</Link> and <Link to="#">Privacy Policy</Link>.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
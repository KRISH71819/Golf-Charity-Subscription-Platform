import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Pricing.css'

const plans = [
  {
    id: 'birdie',
    name: 'Birdie',
    price: { monthly: 29, annual: 290 },
    charity: '10%',
    icon: '🐦',
    desc: 'Perfect for casual golfers who want to give back.',
    features: [
      'Score tracking & handicap calc',
      'Choose 1 charity',
      '10% of subscription donated',
      'Seasonal leaderboard access',
      'Community forums',
    ],
    cta: 'Start with Birdie',
    popular: false,
  },
  {
    id: 'eagle',
    name: 'Eagle',
    price: { monthly: 59, annual: 590 },
    charity: '15%',
    icon: '🦅',
    desc: 'For the dedicated golfer who plays and gives more.',
    features: [
      'Everything in Birdie',
      'Choose up to 3 charities',
      '15% of subscription donated',
      'Premium leaderboard stats',
      'Priority prize pool entry',
      'Course discount network',
      'Monthly impact reports',
    ],
    cta: 'Go Eagle',
    popular: true,
  },
  {
    id: 'albatross',
    name: 'Albatross',
    price: { monthly: 99, annual: 990 },
    charity: '20%',
    icon: '🏆',
    desc: 'Maximum impact for the passionate golfer-philanthropist.',
    features: [
      'Everything in Eagle',
      'Unlimited charity selections',
      '20% of subscription donated',
      'VIP seasonal experiences',
      'Pro lesson credits',
      'Exclusive merchandise',
      'Dedicated account manager',
      'Annual charity gala invite',
    ],
    cta: 'Go Albatross',
    popular: false,
  },
]

export default function Pricing() {
  const [billing, setBilling] = useState('monthly')
  const navigate = useNavigate()
  const { user } = useAuth()

  // Smart redirect logic that remembers the exact plan and billing cycle
  const handlePlanClick = (e, planId) => {
    e.preventDefault()
    
    // Create a specific URL that includes their choices
    const checkoutUrl = `/subscription?tier=${planId}&billing=${billing}`

    if (user) {
      navigate(checkoutUrl)
    } else {
      // encodeURIComponent ensures the full URL survives the trip through the signup page!
      navigate(`/signup?redirect=${encodeURIComponent(checkoutUrl)}`)
    }
  }

  return (
    <div className="pricing-page">
      <section className="section page-header">
        <div className="container text-center">
          <span className="badge badge-copper">Simple Pricing</span>
          <h1 style={{ marginTop: 'var(--space-4)' }}>Choose Your Impact Level</h1>
          <p style={{ maxWidth: '500px', margin: 'var(--space-3) auto 0' }}>
            Every plan includes charity giving, score tracking, and prize pool access
          </p>

          <div className="billing-toggle" id="billing-toggle">
            <button className={billing === 'monthly' ? 'active' : ''} onClick={() => setBilling('monthly')}>Monthly</button>
            <button className={billing === 'annual' ? 'active' : ''} onClick={() => setBilling('annual')}>
              Annual <span className="save-badge">Save 17%</span>
            </button>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="pricing-grid">
            {plans.map(plan => (
              <div className={`card pricing-card ${plan.popular ? 'popular' : ''}`} key={plan.id} id={`plan-${plan.id}`}>
                {plan.popular && <span className="popular-tag">Most Popular</span>}
                <span className="plan-icon">{plan.icon}</span>
                <h3>{plan.name}</h3>
                <p className="plan-desc">{plan.desc}</p>

                <div className="plan-price">
                  <span className="price-dollar">$</span>
                  <span className="price-amount">{plan.price[billing]}</span>
                  <span className="price-period">/{billing === 'monthly' ? 'mo' : 'yr'}</span>
                </div>

                <div className="charity-pct">
                  <span>{plan.charity}</span> goes to your charities
                </div>

                <ul className="plan-features">
                  {plan.features.map(f => (
                    <li key={f}>
                      <span className="check">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={(e) => handlePlanClick(e, plan.id)}
                  className={`btn btn-lg ${plan.popular ? 'btn-copper' : 'btn-secondary'}`}
                  style={{ width: '100%', cursor: 'pointer', border: 'none' }}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section text-center">
        <div className="container">
          <div className="trust-bar">
            <div className="trust-item">
              <strong>🔒</strong>
              <span>Secure payments via Stripe</span>
            </div>
            <div className="trust-item">
              <strong>🔄</strong>
              <span>Cancel anytime, no lock-in</span>
            </div>
            <div className="trust-item">
              <strong>📊</strong>
              <span>Transparent donation tracking</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 
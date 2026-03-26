import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Home.css'

const fallbackLeaders = [
  { rank: 1, full_name: 'Emily Watson', handicap: 3.8, total_rounds: 3, avg_score: 41.0, total_donated: 1350 },
  { rank: 2, full_name: 'Sarah Mitchell', handicap: 4.2, total_rounds: 3, avg_score: 38.7, total_donated: 1240 },
  { rank: 3, full_name: 'Maria Rodriguez', handicap: 6.5, total_rounds: 3, avg_score: 38.0, total_donated: 1120 },
  { rank: 4, full_name: 'Michael Brown', handicap: 5.6, total_rounds: 3, avg_score: 38.0, total_donated: 1050 },
  { rank: 5, full_name: 'James Chen', handicap: 8.1, total_rounds: 3, avg_score: 35.0, total_donated: 980 },
]

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [leaders, setLeaders] = useState(fallbackLeaders)

  const handleSubscriptionClick = (e, tierId = 'eagle') => {
    e.preventDefault()
    const checkoutUrl = `/subscription?tier=${tierId}&billing=monthly`

    if (user) {
      navigate(checkoutUrl)
    } else {
      navigate(`/signup?redirect=${encodeURIComponent(checkoutUrl)}`)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadLeaders() {
      try {
        const { data } = await api.get('/scores/leaderboard')
        if (!cancelled && Array.isArray(data) && data.length) {
          setLeaders(data.slice(0, 5))
        }
      } catch {
        // Keep fallback preview if the API is unavailable.
      }
    }

    loadLeaders()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="home-page">
      <section className="hero" id="hero-section">
        <div className="hero-bg"></div>
        <div className="container hero-content">
          <div className="hero-badge animate-fade-in">
            <span className="badge badge-copper">Season 2026 - Now Open</span>
          </div>
          <h1 className="hero-title animate-fade-in-up">
            Every Round<br />
            <span className="text-copper">Gives Back</span>
          </h1>
          <p className="hero-subtitle animate-fade-in-up delay-1">
            Subscribe. Play your favourite courses. Post your scores.
            Win exclusive prizes while raising funds for charities you love.
          </p>
          <div className="hero-cta animate-fade-in-up delay-2">
            <button onClick={(e) => handleSubscriptionClick(e, 'eagle')} className="btn btn-copper btn-lg">
              Start Your Subscription
            </button>
            <Link to="/how-it-works" className="btn btn-secondary btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', marginLeft: '1rem' }}>
              How It Works
            </Link>
          </div>
          <div className="hero-stats animate-fade-in-up delay-3">
            <div className="stat">
              <span className="stat-number">$2.4M+</span>
              <span className="stat-label">Raised for Charity</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-number">12,500+</span>
              <span className="stat-label">Active Golfers</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-number">340+</span>
              <span className="stat-label">Charity Partners</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section how-preview" id="how-it-works-preview">
        <div className="container text-center">
          <span className="badge badge-forest">Simple & Rewarding</span>
          <h2 style={{ marginTop: 'var(--space-4)' }}>How GolfGives Works</h2>
          <p style={{ maxWidth: '600px', margin: 'var(--space-4) auto 0' }}>
            Three simple steps to make every round count
          </p>

          <div className="grid grid-3 steps-grid">
            {[
              { num: '01', icon: '🏌️', title: 'Subscribe & Choose', desc: 'Pick your plan and select the charities you want to support. A portion of your subscription goes directly to them.' },
              { num: '02', icon: '📊', title: 'Play & Post Scores', desc: 'Play at any participating course. Submit your verified scorecard after each round to climb the leaderboard.' },
              { num: '03', icon: '🏆', title: 'Win & Give', desc: 'Top golfers win exclusive prizes each season. The more you play, the more your charities receive.' },
            ].map((step, i) => (
              <div className={`card step-card animate-fade-in-up delay-${i + 1}`} key={step.num}>
                <span className="step-num">{step.num}</span>
                <span className="step-icon">{step.icon}</span>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>

          <Link to="/how-it-works" className="btn btn-secondary" style={{ marginTop: 'var(--space-8)' }}>
            Learn More →
          </Link>
        </div>
      </section>

      <section className="section featured-charities" id="featured-charities">
        <div className="container">
          <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-8)' }}>
            <div>
              <span className="badge badge-copper">Making an Impact</span>
              <h2 style={{ marginTop: 'var(--space-3)' }}>Featured Charities</h2>
            </div>
            <Link to="/charities" className="btn btn-secondary hide-mobile">View All Charities →</Link>
          </div>

          <div className="grid grid-3">
            {[
              { name: 'First Tee', category: 'Youth Development', raised: '$340,000', img: '🌱', color: '#4A8B4A' },
              { name: 'Folds of Honor', category: 'Military Families', raised: '$520,000', img: '🇺🇸', color: '#4A7B8B' },
              { name: 'PGA REACH', category: 'Community Outreach', raised: '$280,000', img: '⛳', color: '#D4A030' },
            ].map((charity, i) => (
              <Link to={`/charities/${i + 1}`} className={`card charity-card animate-fade-in-up delay-${i + 1}`} key={charity.name} style={{ textDecoration: 'none' }}>
                <div className="charity-card-img" style={{ background: `linear-gradient(135deg, ${charity.color}20, ${charity.color}08)` }}>
                  <span style={{ fontSize: '3rem' }}>{charity.img}</span>
                </div>
                <span className="badge badge-forest" style={{ marginTop: 'var(--space-4)' }}>{charity.category}</span>
                <h4 style={{ marginTop: 'var(--space-2)' }}>{charity.name}</h4>
                <p className="charity-raised">{charity.raised} raised</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section leaderboard-preview" id="leaderboard-preview">
        <div className="container">
          <div className="text-center" style={{ marginBottom: 'var(--space-8)' }}>
            <span className="badge badge-forest">Season Standings</span>
            <h2 style={{ marginTop: 'var(--space-3)' }}>Current Leaderboard</h2>
          </div>

          <div className="card-solid" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Golfer</th>
                    <th>HCP</th>
                    <th>Rounds</th>
                    <th>Avg Score</th>
                    <th>Donated</th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.map((player, index) => (
                    <tr key={player.user_id || player.full_name}>
                      <td><span className={`rank-badge rank-${index + 1}`}>{index + 1}</span></td>
                      <td><strong>{player.full_name}</strong></td>
                      <td>{player.handicap ?? '—'}</td>
                      <td>{player.total_rounds ?? 0}</td>
                      <td>{player.avg_score ?? '—'}</td>
                      <td className="home-donation-cell">${Number(player.total_donated || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="home-leaderboard-link">
              <Link to="/leaderboard" className="btn btn-secondary">View Full Leaderboard</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section pricing" id="pricing-section">
        <div className="container text-center">
          <span className="badge badge-copper">Choose Your Plan</span>
          <h2 style={{ marginTop: 'var(--space-3)' }}>Subscription Plans</h2>
          <p style={{ maxWidth: '500px', margin: 'var(--space-3) auto 0' }}>
            Every plan supports charity. Upgrade for more perks and bigger impact.
          </p>

          <div className="grid grid-3 pricing-grid">
            {[
              {
                id: 'birdie',
                name: 'Birdie',
                price: '$9.99',
                period: '/month',
                features: ['Score tracking', 'Choose 1 charity', 'Monthly leaderboard', 'Basic profile'],
                cta: 'Start Free Trial',
                popular: false,
              },
              {
                id: 'eagle',
                name: 'Eagle',
                price: '$24.99',
                period: '/month',
                features: ['All Birdie features', 'Choose 3 charities', 'Priority verification', 'Exclusive events access', 'Premium profile badge'],
                cta: 'Most Popular',
                popular: true,
              },
              {
                id: 'albatross',
                name: 'Albatross',
                price: '$49.99',
                period: '/month',
                features: ['All Eagle features', 'Unlimited charities', 'VIP concierge', 'Personal coach match', 'Annual gala invitation', 'Tax receipt dashboard'],
                cta: 'Go Premium',
                popular: false,
              },
            ].map((plan, i) => (
              <div className={`card pricing-card ${plan.popular ? 'pricing-card-popular' : ''} animate-fade-in-up delay-${i + 1}`} key={plan.name}>
                {plan.popular && <div className="popular-ribbon">Most Popular</div>}
                <h4 className="plan-name">{plan.name}</h4>
                <div className="plan-price">
                  <span className="price-amount">{plan.price}</span>
                  <span className="price-period">{plan.period}</span>
                </div>
                <ul className="plan-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>✓ {feature}</li>
                  ))}
                </ul>
                <button onClick={(e) => handleSubscriptionClick(e, plan.id)} className={`btn ${plan.popular ? 'btn-copper' : 'btn-primary'} btn-lg`} style={{ width: '100%', marginTop: 'auto' }}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-lg cta-section" id="cta-section">
        <div className="container text-center">
          <div className="cta-card">
            <h2 style={{ color: 'var(--color-cream)' }}>Ready to Make Every Round Count?</h2>
            <p style={{ color: 'var(--color-mist)', maxWidth: '500px', margin: 'var(--space-4) auto 0' }}>
              Join thousands of golfers who play with purpose. Start your free trial today.
            </p>
            <button onClick={(e) => handleSubscriptionClick(e, 'eagle')} className="btn btn-copper btn-lg" style={{ marginTop: 'var(--space-6)' }}>
              Subscribe Now - It&apos;s Free to Try
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

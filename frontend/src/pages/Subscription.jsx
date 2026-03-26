import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const PLAN_CONFIG = {
  birdie: {
    name: 'Birdie',
    monthly: 'price_1TF9YO4JuqdjL3dVQ9fzUhUk',
    annual: 'price_1TFA8N4JuqdjL3dV2JLsB5yx',
    summary: 'A lighter plan for everyday golfers who want to start giving back.',
  },
  eagle: {
    name: 'Eagle',
    monthly: 'price_1TF9Yj4JuqdjL3dViz9myT83',
    annual: 'price_1TFA8h4JuqdjL3dVZPcOweHm',
    summary: 'The balanced plan for committed golfers and regular charity support.',
  },
  albatross: {
    name: 'Albatross',
    monthly: 'price_1TF9Z14JuqdjL3dVkqhyHt8A',
    annual: 'price_1TFA8z4JuqdjL3dVql4JuUAo',
    summary: 'The top tier for members who want maximum impact and benefits.',
  },
}

export default function Subscription() {
  const { user, loading: authLoading, refreshUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [error, setError] = useState('')
  const [charity, setCharity] = useState(null)
  const [submittingPlan, setSubmittingPlan] = useState('')

  const tierId = searchParams.get('tier')
  const billingCycle = searchParams.get('billing') || 'monthly'
  const charityId = searchParams.get('charity')
  const selectedPlan = PLAN_CONFIG[tierId]

  useEffect(() => {
    if (!charityId) {
      setCharity(null)
      return
    }

    let cancelled = false

    async function loadCharity() {
      try {
        const { data } = await api.get(`/charities/${charityId}`)
        if (!cancelled) setCharity(data)
      } catch {
        if (!cancelled) setCharity(null)
      }
    }

    loadCharity()
    return () => {
      cancelled = true
    }
  }, [charityId])

  useEffect(() => {
    if (!authLoading && user && tierId && selectedPlan) {
      handleCheckout(tierId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, tierId, billingCycle, charityId])

  const handlePlanSelect = (planId) => {
    const next = new URLSearchParams(searchParams)
    next.set('tier', planId)
    next.set('billing', billingCycle)
    setSearchParams(next)
  }

  const handleCheckout = async (planOverride) => {
    const finalTierId = planOverride || tierId
    const plan = PLAN_CONFIG[finalTierId]

    if (!plan) {
      setError('Please choose a plan before continuing to payment.')
      return
    }

    setSubmittingPlan(finalTierId)
    setError('')

    try {
      const priceId = plan[billingCycle]
      if (!priceId) {
        throw new Error(`We could not find a Stripe Price ID for the ${finalTierId} plan.`)
      }

      const res = await api.post('/subscriptions/create-checkout-session', {
        priceId,
        charityId,
        tierId: finalTierId,
        billingCycle,
      })

      if (res.data.url) {
        await refreshUser().catch(() => {})
        window.location.replace(res.data.url)
      } else {
        throw new Error('Failed to generate checkout link')
      }
    } catch (err) {
      const serverError = err.response?.data?.error || err.message || 'Unknown error occurred'
      setError(`Server says: ${serverError}`)
      setSubmittingPlan('')
    }
  }

  if (authLoading) {
    return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>
  }

  if (!tierId) {
    return (
      <div className="section">
        <div className="container" style={{ maxWidth: 1100 }}>
          <div className="text-center" style={{ marginBottom: 'var(--space-8)' }}>
            <h1>Choose Your Plan</h1>
            <p style={{ color: 'var(--color-slate)', maxWidth: 680, margin: 'var(--space-3) auto 0' }}>
              Pick the membership you want before continuing to Stripe.
              {charity ? ` Your support will be linked to ${charity.name}.` : ''}
            </p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(220,53,69,0.1)',
              border: '1px solid rgba(220,53,69,0.3)',
              borderRadius: 10,
              padding: 'var(--space-3)',
              marginBottom: 'var(--space-6)',
              color: '#dc3545',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <div className="grid grid-3">
            {Object.entries(PLAN_CONFIG).map(([planId, plan]) => (
              <div className="card" key={planId} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <span className="badge badge-forest">{plan.name}</span>
                  <h3 style={{ marginTop: 'var(--space-3)' }}>{plan.name}</h3>
                  <p style={{ color: 'var(--color-slate)' }}>{plan.summary}</p>
                </div>
                <div>
                  <strong style={{ fontSize: 'var(--text-3xl)' }}>
                    {planId === 'birdie' ? '$29' : planId === 'eagle' ? '$59' : '$99'}
                  </strong>
                  <span style={{ color: 'var(--color-slate)' }}> / {billingCycle === 'annual' ? 'year' : 'month'}</span>
                </div>
                {charity ? (
                  <p style={{ margin: 0, color: 'var(--color-slate)' }}>
                    Supporting: <strong style={{ color: 'var(--color-forest)' }}>{charity.name}</strong>
                  </p>
                ) : null}
                <button className="btn btn-copper" onClick={() => handlePlanSelect(planId)}>
                  Continue with {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card text-center" style={{ maxWidth: 560, padding: 'var(--space-8)' }}>
        <h2>Complete Your Subscription</h2>

        {error ? (
          <>
            <div style={{ color: '#dc3545', margin: 'var(--space-4) 0' }}>{error}</div>
            <button onClick={() => handleCheckout()} className="btn btn-copper">Try Again</button>
          </>
        ) : (
          <>
            <p style={{ margin: 'var(--space-4) 0', color: 'var(--color-slate)' }}>
              We are securely transferring you to Stripe to complete your {selectedPlan?.name || tierId} membership.
            </p>
            {charity ? (
              <p style={{ margin: '0 0 var(--space-4)', color: 'var(--color-forest)' }}>
                Supported charity: <strong>{charity.name}</strong>
              </p>
            ) : null}
            <div style={{ margin: 'var(--space-6) auto', width: '40px', height: '40px', border: '4px solid var(--color-copper)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p className="text-sm">
              {submittingPlan ? `Preparing ${selectedPlan?.name || tierId} checkout...` : 'Please do not refresh the page...'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

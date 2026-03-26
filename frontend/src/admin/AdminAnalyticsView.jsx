import { useEffect, useState } from 'react'
import { adminApi, getErrorMessage } from './adminApi'
import { EmptyState, formatDate, formatMoney, LoadingBlock, Panel, StatusPill } from './AdminCommon'

export default function AdminAnalyticsView() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const { data } = await adminApi.getAnalytics()
        if (!cancelled) {
          setAnalytics(data)
          setError('')
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(getErrorMessage(requestError, 'Unable to load analytics.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <LoadingBlock label="Loading platform analytics..." />
  }

  if (error) {
    return <EmptyState title="Analytics unavailable" body={error} />
  }

  const metrics = [
    { label: 'Total users', value: analytics?.totalUsers ?? 0 },
    { label: 'Prize pool', value: formatMoney(analytics?.totalPrizePool) },
    { label: 'Charity contributions', value: formatMoney(analytics?.totalCharityContributions) },
    { label: 'Active subscribers', value: analytics?.activeSubscribers ?? 0 },
  ]

  return (
    <div className="admin-stack">
      <div className="admin-metric-grid">
        {metrics.map((metric, index) => (
          <article className="admin-metric-card" key={metric.label} style={{ animationDelay: `${index * 80}ms` }}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </div>

      <div className="admin-two-up">
        <Panel title="Operational pulse" subtitle="A fast read on the current admin workload.">
          <div className="admin-kpi-list">
            <div>
              <span>Published draws</span>
              <strong>{analytics?.publishedDraws ?? 0}</strong>
            </div>
            <div>
              <span>Pending draws</span>
              <strong>{analytics?.pendingDraws ?? 0}</strong>
            </div>
            <div>
              <span>Pending proof reviews</span>
              <strong>{analytics?.pendingProofs ?? 0}</strong>
            </div>
            <div>
              <span>Paid winners</span>
              <strong>{analytics?.paidWinners ?? 0}</strong>
            </div>
          </div>
        </Panel>

        <Panel title="Charity footprint" subtitle="How the partner program is trending.">
          <div className="admin-kpi-list">
            <div>
              <span>Active charities</span>
              <strong>{analytics?.activeCharities ?? 0}</strong>
            </div>
            <div>
              <span>Average prize pool per draw</span>
              <strong>
                {formatMoney(
                  analytics?.publishedDraws
                    ? Number(analytics.totalPrizePool || 0) / Number(analytics.publishedDraws || 1)
                    : 0
                )}
              </strong>
            </div>
            <div>
              <span>Average charity contribution</span>
              <strong>
                {formatMoney(
                  analytics?.publishedDraws
                    ? Number(analytics.totalCharityContributions || 0) / Number(analytics.publishedDraws || 1)
                    : 0
                )}
              </strong>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Recent winners" subtitle="Latest published outcomes and verification status.">
        {!analytics?.recentWinners?.length ? (
          <EmptyState title="No winners yet" body="Publish a draw to populate the operational feed." />
        ) : (
          <div className="admin-list">
            {analytics.recentWinners.map((winner) => (
              <article className="admin-list-card" key={winner.id}>
                <div className="admin-list-head">
                  <div>
                    <strong>{winner.user?.full_name || winner.user?.email || 'Unknown player'}</strong>
                    <span>{winner.draw?.title || formatDate(winner.published_at)}</span>
                  </div>
                  <StatusPill status={winner.proof_status}>{winner.proof_status}</StatusPill>
                </div>
                <div className="admin-list-meta">
                  <span>{formatMoney(winner.payout_amount)} payout</span>
                  <span>{formatMoney(winner.charity_contribution)} charity share</span>
                  <span>{winner.draw?.selection_mode || 'draw'} mode</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

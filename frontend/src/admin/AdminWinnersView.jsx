import { useEffect, useMemo, useState } from 'react'
import { adminApi, getErrorMessage } from './adminApi'
import {
  EmptyState,
  formatDate,
  formatMoney,
  LoadingBlock,
  Panel,
  payoutStatuses,
  proofStatuses,
  StatusPill,
} from './AdminCommon'

function coerceWinnerForm(winner) {
  return {
    proof_status: winner?.proof_status || 'pending',
    payout_status: winner?.payout_status || 'pending',
    proof_url: winner?.proof_url || '',
    notes: winner?.notes || '',
  }
}

export default function AdminWinnersView() {
  const [winners, setWinners] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedWinnerId, setSelectedWinnerId] = useState('')
  const [winnerForm, setWinnerForm] = useState(coerceWinnerForm(null))
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedWinner = useMemo(
    () => winners.find((winner) => winner.id === selectedWinnerId) || null,
    [selectedWinnerId, winners]
  )

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      try {
        const { data } = await adminApi.listWinners(statusFilter ? { status: statusFilter } : undefined)
        if (cancelled) return
        setWinners(data || [])
        setSelectedWinnerId((current) => {
          const nextList = data || []
          return nextList.some((winner) => winner.id === current) ? current : nextList[0]?.id || ''
        })
        setError('')
      } catch (requestError) {
        if (!cancelled) {
          setError(getErrorMessage(requestError, 'Unable to load winners.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [statusFilter])

  useEffect(() => {
    setWinnerForm(coerceWinnerForm(selectedWinner))
  }, [selectedWinner])

  async function handleSave() {
    if (!selectedWinnerId) return
    try {
      const { data } = await adminApi.updateWinner(selectedWinnerId, winnerForm)
      setWinners((current) => current.map((winner) => (winner.id === data.id ? data : winner)))
      setWinnerForm(coerceWinnerForm(data))
      setMessage('Winner record updated.')
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to update winner record.'))
    }
  }

  if (loading) {
    return <LoadingBlock label="Loading winner operations..." />
  }

  return (
    <div className="admin-two-up admin-two-up-wide">
      <Panel title="Winner queue" subtitle="Filter by proof status to focus the next actions.">
        <div className="admin-toolbar">
          <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All proof states</option>
            {proofStatuses.map((status) => (
              <option value={status} key={status}>{status}</option>
            ))}
          </select>
        </div>

        {!winners.length ? (
          <EmptyState title="No winners found" body="Publish a draw or change the filter to see more records." />
        ) : (
          <div className="admin-list">
            {winners.map((winner) => (
              <button
                type="button"
                key={winner.id}
                className={`admin-select-card${selectedWinnerId === winner.id ? ' active' : ''}`}
                onClick={() => setSelectedWinnerId(winner.id)}
              >
                <div className="admin-list-head">
                  <div>
                    <strong>{winner.user?.full_name || winner.user?.email || 'Unknown winner'}</strong>
                    <span>{winner.draw?.title || formatDate(winner.published_at)}</span>
                  </div>
                  <StatusPill status={winner.proof_status}>{winner.proof_status}</StatusPill>
                </div>
                <div className="admin-list-meta">
                  <span>{formatMoney(winner.payout_amount)} payout</span>
                  <span>{winner.payout_status}</span>
                  <span>{winner.score ? `${winner.score.stableford_points} pts` : 'no score linked'}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="Verification and payout"
        subtitle="Review proof, capture notes, and move the payout to paid when complete."
        actions={<button type="button" className="btn btn-primary" onClick={handleSave} disabled={!selectedWinnerId}>Save winner</button>}
      >
        {(message || error) && <div className={error ? 'admin-alert admin-alert-danger' : 'admin-alert'}>{error || message}</div>}
        {!selectedWinner ? (
          <EmptyState title="No winner selected" body="Pick a record from the queue to manage its verification and payout." />
        ) : (
          <>
            <div className="admin-kpi-list">
              <div>
                <span>Draw</span>
                <strong>{selectedWinner.draw?.title || 'Untitled draw'}</strong>
              </div>
              <div>
                <span>Score submitted</span>
                <strong>{selectedWinner.score ? `${selectedWinner.score.stableford_points} pts` : 'Awaiting proof'}</strong>
              </div>
              <div>
                <span>Prize</span>
                <strong>{formatMoney(selectedWinner.payout_amount)}</strong>
              </div>
              <div>
                <span>Published</span>
                <strong>{formatDate(selectedWinner.published_at)}</strong>
              </div>
            </div>

            <div className="admin-form-grid">
              <label>
                Proof status
                <select className="input" value={winnerForm.proof_status} onChange={(event) => setWinnerForm((current) => ({ ...current, proof_status: event.target.value }))}>
                  {proofStatuses.map((status) => (
                    <option value={status} key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label>
                Payout status
                <select className="input" value={winnerForm.payout_status} onChange={(event) => setWinnerForm((current) => ({ ...current, payout_status: event.target.value }))}>
                  {payoutStatuses.map((status) => (
                    <option value={status} key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label className="admin-form-span-2">
                Proof URL
                <input className="input" value={winnerForm.proof_url} onChange={(event) => setWinnerForm((current) => ({ ...current, proof_url: event.target.value }))} placeholder="https://..." />
              </label>
              <label className="admin-form-span-2">
                Admin notes
                <textarea className="input" value={winnerForm.notes} onChange={(event) => setWinnerForm((current) => ({ ...current, notes: event.target.value }))} />
              </label>
            </div>

            <div className="admin-inline-actions">
              {winnerForm.proof_url ? (
                <a className="btn btn-secondary" href={winnerForm.proof_url} target="_blank" rel="noreferrer">
                  Open proof
                </a>
              ) : null}
              <span className="admin-muted">
                Last reviewed {selectedWinner.reviewed_at ? formatDate(selectedWinner.reviewed_at) : 'not yet'}
              </span>
            </div>
          </>
        )}
      </Panel>
    </div>
  )
}

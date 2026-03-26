import { useEffect, useMemo, useState } from 'react'
import { adminApi, getErrorMessage } from './adminApi'
import {
  createEmptyDrawForm,
  drawModes,
  EmptyState,
  formatDate,
  formatMoney,
  LoadingBlock,
  Panel,
  StatusPill,
  toDateTimeInput,
} from './AdminCommon'

function coerceDrawForm(draw) {
  return {
    title: draw?.title || '',
    draw_date: toDateTimeInput(draw?.draw_date),
    prize_description: draw?.prize_description || '',
    prize_value: draw?.prize_value ?? 0,
    charity_donation: draw?.charity_donation ?? 0,
    selection_mode: draw?.selection_mode || 'random',
    winner_count: draw?.winner_count || 1,
    entry_window_start: toDateTimeInput(draw?.entry_window_start),
    entry_window_end: toDateTimeInput(draw?.entry_window_end),
    notes: draw?.notes || '',
  }
}

export default function AdminDrawsView() {
  const [draws, setDraws] = useState([])
  const [selectedDrawId, setSelectedDrawId] = useState('')
  const [drawForm, setDrawForm] = useState(createEmptyDrawForm())
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedDraw = useMemo(
    () => draws.find((draw) => draw.id === selectedDrawId) || null,
    [draws, selectedDrawId]
  )

  async function loadDraws(preferredId = null) {
    setLoading(true)
    try {
      const { data } = await adminApi.listDraws()
      setDraws(data || [])
      const nextSelectedId = preferredId || data?.[0]?.id || ''
      setSelectedDrawId(nextSelectedId)
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load draws.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDraws()
  }, [])

  useEffect(() => {
    setDrawForm(selectedDraw ? coerceDrawForm(selectedDraw) : createEmptyDrawForm())
  }, [selectedDraw])

  async function handleSaveDraw() {
    try {
      if (selectedDrawId) {
        const { data } = await adminApi.updateDraw(selectedDrawId, drawForm)
        setMessage('Draw updated.')
        await loadDraws(data.id)
      } else {
        const { data } = await adminApi.createDraw(drawForm)
        setMessage('Draw created.')
        await loadDraws(data.id)
      }
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to save draw settings.'))
    }
  }

  async function handleSimulate() {
    if (!selectedDrawId) return
    try {
      await adminApi.simulateDraw(selectedDrawId, { run_count: 250 })
      setMessage('Simulation refreshed.')
      await loadDraws(selectedDrawId)
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to simulate this draw.'))
    }
  }

  async function handlePublish() {
    if (!selectedDrawId || !window.confirm('Publish this draw and create winner records?')) return
    try {
      await adminApi.publishDraw(selectedDrawId)
      setMessage('Draw published and winner records created.')
      await loadDraws(selectedDrawId)
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to publish this draw.'))
    }
  }

  if (loading) {
    return <LoadingBlock label="Loading draw management..." />
  }

  return (
    <div className="admin-two-up admin-two-up-wide">
      <Panel
        title="Monthly draw lineup"
        subtitle="Draft, simulate, and publish from a single queue."
        actions={<button type="button" className="btn btn-secondary" onClick={() => { setSelectedDrawId(''); setDrawForm(createEmptyDrawForm()) }}>New draw</button>}
      >
        {!draws.length ? (
          <EmptyState title="No draws configured" body="Create the first monthly draw from the form on the right." />
        ) : (
          <div className="admin-list">
            {draws.map((draw) => (
              <button
                type="button"
                key={draw.id}
                className={`admin-select-card${selectedDrawId === draw.id ? ' active' : ''}`}
                onClick={() => setSelectedDrawId(draw.id)}
              >
                <div className="admin-list-head">
                  <div>
                    <strong>{draw.title || formatDate(draw.draw_date, { month: 'long', year: 'numeric' })}</strong>
                    <span>{formatDate(draw.draw_date)}</span>
                  </div>
                  <StatusPill status={draw.status}>{draw.status}</StatusPill>
                </div>
                <div className="admin-list-meta">
                  <span>{draw.selection_mode} mode</span>
                  <span>{formatMoney(draw.prize_value)} pool</span>
                  <span>{draw.winners?.length || 0} winners</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </Panel>

      <div className="admin-stack">
        <Panel
          title={selectedDrawId ? 'Draw configuration' : 'Create a draw'}
          subtitle="Random mode is even-weight. Algorithmic mode boosts stronger and more active score histories."
          actions={<button type="button" className="btn btn-primary" onClick={handleSaveDraw}>Save draw</button>}
        >
          {(message || error) && <div className={error ? 'admin-alert admin-alert-danger' : 'admin-alert'}>{error || message}</div>}
          <div className="admin-form-grid">
            <label>
              Title
              <input className="input" value={drawForm.title} onChange={(event) => setDrawForm((current) => ({ ...current, title: event.target.value }))} />
            </label>
            <label>
              Draw date
              <input className="input" type="datetime-local" value={drawForm.draw_date} onChange={(event) => setDrawForm((current) => ({ ...current, draw_date: event.target.value }))} />
            </label>
            <label>
              Prize pool
              <input className="input" type="number" min="0" value={drawForm.prize_value} onChange={(event) => setDrawForm((current) => ({ ...current, prize_value: event.target.value }))} />
            </label>
            <label>
              Charity contribution
              <input className="input" type="number" min="0" value={drawForm.charity_donation} onChange={(event) => setDrawForm((current) => ({ ...current, charity_donation: event.target.value }))} />
            </label>
            <label>
              Selection mode
              <select className="input" value={drawForm.selection_mode} onChange={(event) => setDrawForm((current) => ({ ...current, selection_mode: event.target.value }))}>
                {drawModes.map((mode) => (
                  <option value={mode} key={mode}>{mode}</option>
                ))}
              </select>
            </label>
            <label>
              Winner count
              <input className="input" type="number" min="1" value={drawForm.winner_count} onChange={(event) => setDrawForm((current) => ({ ...current, winner_count: event.target.value }))} />
            </label>
            <label>
              Entry window start
              <input className="input" type="datetime-local" value={drawForm.entry_window_start} onChange={(event) => setDrawForm((current) => ({ ...current, entry_window_start: event.target.value }))} />
            </label>
            <label>
              Entry window end
              <input className="input" type="datetime-local" value={drawForm.entry_window_end} onChange={(event) => setDrawForm((current) => ({ ...current, entry_window_end: event.target.value }))} />
            </label>
            <label className="admin-form-span-2">
              Prize description
              <input className="input" value={drawForm.prize_description} onChange={(event) => setDrawForm((current) => ({ ...current, prize_description: event.target.value }))} />
            </label>
            <label className="admin-form-span-2">
              Internal notes
              <textarea className="input" value={drawForm.notes} onChange={(event) => setDrawForm((current) => ({ ...current, notes: event.target.value }))} />
            </label>
          </div>

          {selectedDrawId && (
            <div className="admin-inline-actions">
              <button type="button" className="btn btn-secondary" onClick={handleSimulate}>Run simulation</button>
              <button type="button" className="btn btn-primary" onClick={handlePublish}>Publish results</button>
            </div>
          )}
        </Panel>

        <Panel title="Simulation snapshot" subtitle="Preview who is surfacing before you publish.">
          {!selectedDraw?.simulation_snapshot?.projected_leaders?.length ? (
            <EmptyState title="No simulation yet" body="Save the draw, then run a simulation to preview likely winners." />
          ) : (
            <div className="admin-list">
              {selectedDraw.simulation_snapshot.projected_leaders.map((entry) => (
                <article className="admin-list-card" key={entry.user_id}>
                  <div className="admin-list-head">
                    <div>
                      <strong>{entry.full_name || entry.email}</strong>
                      <span>{entry.projected_win_rate}% projected win rate</span>
                    </div>
                    <StatusPill status="pending">rank {entry.projected_rank}</StatusPill>
                  </div>
                  <div className="admin-list-meta">
                    <span>avg {entry.avg_score} Stableford</span>
                    <span>{entry.score_count} scores</span>
                    <span>weight {entry.weight}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { adminApi, getErrorMessage } from './adminApi'
import {
  createEmptyCharityForm,
  EmptyState,
  formatMoney,
  galleryArrayToText,
  galleryTextToArray,
  LoadingBlock,
  Panel,
  StatusPill,
} from './AdminCommon'

function coerceCharityForm(charity) {
  return {
    name: charity?.name || '',
    slug: charity?.slug || '',
    category: charity?.category || '',
    description: charity?.description || '',
    mission: charity?.mission || '',
    impact_summary: charity?.impact_summary || '',
    icon: charity?.icon || '',
    founded: charity?.founded || '',
    logo_url: charity?.logo_url || '',
    cover_url: charity?.cover_url || '',
    website: charity?.website || '',
    media_gallery: galleryArrayToText(charity?.media_gallery),
    total_raised: charity?.total_raised ?? 0,
    supporter_count: charity?.supporter_count ?? 0,
    featured: Boolean(charity?.featured),
    active: charity?.active ?? true,
    theme_color: charity?.theme_color || '#204e4a',
  }
}

export default function AdminCharitiesView() {
  const [charities, setCharities] = useState([])
  const [selectedCharityId, setSelectedCharityId] = useState('')
  const [charityForm, setCharityForm] = useState(createEmptyCharityForm())
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedCharity = useMemo(
    () => charities.find((charity) => charity.id === selectedCharityId) || null,
    [charities, selectedCharityId]
  )

  async function loadCharities(preferredId = null) {
    setLoading(true)
    try {
      const { data } = await adminApi.listCharities()
      setCharities(data || [])
      const nextSelectedId = preferredId || data?.[0]?.id || ''
      setSelectedCharityId(nextSelectedId)
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load charities.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCharities()
  }, [])

  useEffect(() => {
    setCharityForm(selectedCharity ? coerceCharityForm(selectedCharity) : createEmptyCharityForm())
  }, [selectedCharity])

  async function handleSave() {
    try {
      const payload = {
        ...charityForm,
        media_gallery: galleryTextToArray(charityForm.media_gallery),
        total_raised: Number(charityForm.total_raised || 0),
        supporter_count: Number(charityForm.supporter_count || 0),
      }

      if (selectedCharityId) {
        const { data } = await adminApi.updateCharity(selectedCharityId, payload)
        setMessage('Charity updated.')
        await loadCharities(data.id)
      } else {
        const { data } = await adminApi.createCharity(payload)
        setMessage('Charity created.')
        await loadCharities(data.id)
      }
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to save charity.'))
    }
  }

  async function handleDelete() {
    if (!selectedCharityId || !window.confirm('Delete or deactivate this charity?')) return
    try {
      const { data } = await adminApi.deleteCharity(selectedCharityId)
      setMessage(data.message)
      setSelectedCharityId('')
      setCharityForm(createEmptyCharityForm())
      await loadCharities()
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to delete charity.'))
    }
  }

  if (loading) {
    return <LoadingBlock label="Loading charity management..." />
  }

  return (
    <div className="admin-two-up admin-two-up-wide">
      <Panel
        title="Partner roster"
        subtitle="Keep charity content, availability, and media current."
        actions={<button type="button" className="btn btn-secondary" onClick={() => { setSelectedCharityId(''); setCharityForm(createEmptyCharityForm()) }}>New charity</button>}
      >
        {!charities.length ? (
          <EmptyState title="No charities yet" body="Create the first charity to start building the partner catalog." />
        ) : (
          <div className="admin-list">
            {charities.map((charity) => (
              <button
                type="button"
                key={charity.id}
                className={`admin-select-card${selectedCharityId === charity.id ? ' active' : ''}`}
                onClick={() => setSelectedCharityId(charity.id)}
              >
                <div className="admin-list-head">
                  <div>
                    <strong>{charity.name}</strong>
                    <span>{charity.category || 'Uncategorized'}</span>
                  </div>
                  <StatusPill status={charity.active ? 'active' : 'cancelled'}>{charity.active ? 'active' : 'inactive'}</StatusPill>
                </div>
                <div className="admin-list-meta">
                  <span>{formatMoney(charity.total_raised)} raised</span>
                  <span>{charity.supporter_count || 0} supporters</span>
                  <span>{charity.featured ? 'featured' : 'standard'}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title={selectedCharityId ? 'Charity editor' : 'Create charity'}
        subtitle="The public charity pages can reuse this content later without redesigning the admin flow."
        actions={
          <div className="admin-inline-actions">
            {selectedCharityId ? <button type="button" className="btn btn-secondary" onClick={handleDelete}>Delete</button> : null}
            <button type="button" className="btn btn-primary" onClick={handleSave}>Save charity</button>
          </div>
        }
      >
        {(message || error) && <div className={error ? 'admin-alert admin-alert-danger' : 'admin-alert'}>{error || message}</div>}
        <div className="admin-form-grid">
          <label>
            Name
            <input className="input" value={charityForm.name} onChange={(event) => setCharityForm((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label>
            Slug
            <input className="input" value={charityForm.slug} onChange={(event) => setCharityForm((current) => ({ ...current, slug: event.target.value }))} />
          </label>
          <label>
            Category
            <input className="input" value={charityForm.category} onChange={(event) => setCharityForm((current) => ({ ...current, category: event.target.value }))} />
          </label>
          <label>
            Icon / emoji
            <input className="input" value={charityForm.icon} onChange={(event) => setCharityForm((current) => ({ ...current, icon: event.target.value }))} />
          </label>
          <label>
            Theme color
            <input className="input" type="color" value={charityForm.theme_color} onChange={(event) => setCharityForm((current) => ({ ...current, theme_color: event.target.value }))} />
          </label>
          <label>
            Founded
            <input className="input" value={charityForm.founded} onChange={(event) => setCharityForm((current) => ({ ...current, founded: event.target.value }))} />
          </label>
          <label className="admin-form-span-2">
            Description
            <textarea className="input" value={charityForm.description} onChange={(event) => setCharityForm((current) => ({ ...current, description: event.target.value }))} />
          </label>
          <label className="admin-form-span-2">
            Mission
            <textarea className="input" value={charityForm.mission} onChange={(event) => setCharityForm((current) => ({ ...current, mission: event.target.value }))} />
          </label>
          <label className="admin-form-span-2">
            Impact summary
            <textarea className="input" value={charityForm.impact_summary} onChange={(event) => setCharityForm((current) => ({ ...current, impact_summary: event.target.value }))} />
          </label>
          <label>
            Website
            <input className="input" value={charityForm.website} onChange={(event) => setCharityForm((current) => ({ ...current, website: event.target.value }))} />
          </label>
          <label>
            Logo URL
            <input className="input" value={charityForm.logo_url} onChange={(event) => setCharityForm((current) => ({ ...current, logo_url: event.target.value }))} />
          </label>
          <label className="admin-form-span-2">
            Cover URL
            <input className="input" value={charityForm.cover_url} onChange={(event) => setCharityForm((current) => ({ ...current, cover_url: event.target.value }))} />
          </label>
          <label className="admin-form-span-2">
            Media gallery
            <textarea className="input" value={charityForm.media_gallery} onChange={(event) => setCharityForm((current) => ({ ...current, media_gallery: event.target.value }))} placeholder="Paste one media URL per line" />
          </label>
          <label>
            Total raised
            <input className="input" type="number" min="0" value={charityForm.total_raised} onChange={(event) => setCharityForm((current) => ({ ...current, total_raised: event.target.value }))} />
          </label>
          <label>
            Supporters
            <input className="input" type="number" min="0" value={charityForm.supporter_count} onChange={(event) => setCharityForm((current) => ({ ...current, supporter_count: event.target.value }))} />
          </label>
          <label className="admin-checkbox">
            <input type="checkbox" checked={charityForm.featured} onChange={(event) => setCharityForm((current) => ({ ...current, featured: event.target.checked }))} />
            <span>Feature this charity</span>
          </label>
          <label className="admin-checkbox">
            <input type="checkbox" checked={charityForm.active} onChange={(event) => setCharityForm((current) => ({ ...current, active: event.target.checked }))} />
            <span>Keep charity active</span>
          </label>
        </div>
      </Panel>
    </div>
  )
}

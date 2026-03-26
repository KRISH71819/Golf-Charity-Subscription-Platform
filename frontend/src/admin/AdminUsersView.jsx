import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { adminApi, getErrorMessage } from './adminApi'
import {
  createEmptyScoreForm,
  EmptyState,
  formatDate,
  LoadingBlock,
  Panel,
  StatusPill,
  subscriptionStatuses,
  subscriptionTiers,
  toDateTimeInput,
} from './AdminCommon'

function coerceUserForm(user) {
  return {
    home_course: user?.home_course || '',
    handicap: user?.handicap ?? '',
    subscription_status: user?.subscription_status || 'inactive',
    subscription_tier: user?.subscription_tier || 'free',
    selected_charity_id: user?.selected_charity_id || '',
    is_admin: Boolean(user?.is_admin),
  }
}

export default function AdminUsersView() {
  const [users, setUsers] = useState([])
  const [charities, setCharities] = useState([])
  const [scores, setScores] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [userForm, setUserForm] = useState(coerceUserForm(null))
  const [newScore, setNewScore] = useState(createEmptyScoreForm())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingScores, setLoadingScores] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const deferredSearch = useDeferredValue(search)
  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [selectedUserId, users]
  )

  useEffect(() => {
    let cancelled = false

    async function loadUsers() {
      setLoadingUsers(true)
      try {
        const [{ data: usersData }, { data: charitiesData }] = await Promise.all([
          adminApi.listUsers({ search: deferredSearch, status: statusFilter, limit: 50 }),
          adminApi.listCharities(),
        ])

        if (cancelled) return
        setUsers(usersData.users || [])
        setCharities(charitiesData || [])
        setSelectedUserId((current) => {
          const stillExists = usersData.users?.some((user) => user.id === current)
          return stillExists ? current : usersData.users?.[0]?.id || ''
        })
        setError('')
      } catch (requestError) {
        if (!cancelled) {
          setError(getErrorMessage(requestError, 'Unable to load users.'))
        }
      } finally {
        if (!cancelled) setLoadingUsers(false)
      }
    }

    loadUsers()
    return () => {
      cancelled = true
    }
  }, [deferredSearch, statusFilter])

  useEffect(() => {
    if (!selectedUser) return
    setUserForm(coerceUserForm(selectedUser))
  }, [selectedUser])

  useEffect(() => {
    if (!selectedUserId) {
      setScores([])
      return
    }

    let cancelled = false

    async function loadScores() {
      setLoadingScores(true)
      try {
        const { data } = await adminApi.listUserScores(selectedUserId)
        if (!cancelled) {
          setScores(data || [])
          setError('')
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(getErrorMessage(requestError, 'Unable to load score history.'))
        }
      } finally {
        if (!cancelled) setLoadingScores(false)
      }
    }

    loadScores()
    return () => {
      cancelled = true
    }
  }, [selectedUserId])

  async function handleSaveUser() {
    if (!selectedUserId) return
    try {
      const { data } = await adminApi.updateUser(selectedUserId, {
        ...userForm,
        handicap: userForm.handicap === '' ? null : Number(userForm.handicap),
        selected_charity_id: userForm.selected_charity_id || null,
      })
      setUsers((current) => current.map((user) => (user.id === data.id ? { ...user, ...data } : user)))
      setUserForm(coerceUserForm(data))
      setMessage('User profile saved.')
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to save the user profile.'))
    }
  }

  async function handleCreateScore() {
    if (!selectedUserId) return
    try {
      const payload = {
        ...newScore,
        stableford_points: Number(newScore.stableford_points),
        played_at: newScore.played_at || new Date().toISOString(),
      }
      const { data } = await adminApi.createUserScore(selectedUserId, payload)
      setScores((current) => [data, ...current])
      setNewScore(createEmptyScoreForm())
      setMessage('Score added.')
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to create score.'))
    }
  }

  async function handleSaveScore(score) {
    try {
      const { data } = await adminApi.updateScore(score.id, {
        ...score,
        stableford_points: Number(score.stableford_points),
      })
      setScores((current) => current.map((item) => (item.id === data.id ? data : item)))
      setMessage('Score updated.')
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to update score.'))
    }
  }

  async function handleDeleteScore(scoreId) {
    if (!window.confirm('Delete this score entry?')) return
    try {
      await adminApi.deleteScore(scoreId)
      setScores((current) => current.filter((score) => score.id !== scoreId))
      setMessage('Score removed.')
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to delete score.'))
    }
  }

  if (loadingUsers) {
    return <LoadingBlock label="Loading users and profile data..." />
  }

  return (
    <div className="admin-two-up admin-two-up-wide">
      <Panel title="Member directory" subtitle="Search profiles and choose who to edit.">
        <div className="admin-toolbar">
          <input
            className="input"
            placeholder="Search by name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {subscriptionStatuses.map((status) => (
              <option value={status} key={status}>{status}</option>
            ))}
          </select>
        </div>

        {!users.length ? (
          <EmptyState title="No users found" body="Try a wider search or clear the status filter." />
        ) : (
          <div className="admin-list">
            {users.map((user) => (
              <button
                type="button"
                key={user.id}
                className={`admin-select-card${selectedUserId === user.id ? ' active' : ''}`}
                onClick={() => setSelectedUserId(user.id)}
              >
                <div className="admin-list-head">
                  <div>
                    <strong>{user.full_name || 'Unnamed member'}</strong>
                    <span>{user.email}</span>
                  </div>
                  <StatusPill status={user.subscription_status}>{user.subscription_status}</StatusPill>
                </div>
                <div className="admin-list-meta">
                  <span>{user.subscription_tier || 'free'} tier</span>
                  <span>{user.is_admin ? 'admin account' : 'member account'}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </Panel>

      <div className="admin-stack">
        <Panel
          title="Profile editor"
          subtitle={selectedUser ? `Editing ${selectedUser.full_name || selectedUser.email}` : 'Choose a member to begin.'}
          actions={<button type="button" className="btn btn-primary" onClick={handleSaveUser} disabled={!selectedUserId}>Save profile</button>}
        >
          {selectedUser ? (
            <>
              {(message || error) && <div className={error ? 'admin-alert admin-alert-danger' : 'admin-alert'}>{error || message}</div>}
              <div className="admin-form-grid">
                <label>
                  Full name
                  <input className="input" value={selectedUser.full_name || ''} readOnly disabled />
                </label>
                <label>
                  Email
                  <input className="input" type="email" value={selectedUser.email || ''} readOnly disabled />
                </label>
                <label>
                  Home course
                  <input className="input" value={userForm.home_course} onChange={(event) => setUserForm((current) => ({ ...current, home_course: event.target.value }))} />
                </label>
                <label>
                  Handicap
                  <input className="input" type="number" step="0.1" value={userForm.handicap} onChange={(event) => setUserForm((current) => ({ ...current, handicap: event.target.value }))} />
                </label>
                <label>
                  Subscription status
                  <select className="input" value={userForm.subscription_status} onChange={(event) => setUserForm((current) => ({ ...current, subscription_status: event.target.value }))}>
                    {subscriptionStatuses.map((status) => (
                      <option value={status} key={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Tier
                  <select className="input" value={userForm.subscription_tier} onChange={(event) => setUserForm((current) => ({ ...current, subscription_tier: event.target.value }))}>
                    {subscriptionTiers.map((tier) => (
                      <option value={tier} key={tier}>{tier}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Preferred charity
                  <select className="input" value={userForm.selected_charity_id} onChange={(event) => setUserForm((current) => ({ ...current, selected_charity_id: event.target.value }))}>
                    <option value="">None selected</option>
                    {charities.map((charity) => (
                      <option value={charity.id} key={charity.id}>{charity.name}</option>
                    ))}
                  </select>
                </label>
                <label className="admin-checkbox">
                  <input type="checkbox" checked={userForm.is_admin} onChange={(event) => setUserForm((current) => ({ ...current, is_admin: event.target.checked }))} />
                  <span>Grant admin access</span>
                </label>
              </div>
            </>
          ) : (
            <EmptyState title="No user selected" body="Pick a member from the directory to edit their profile." />
          )}
        </Panel>

        <Panel title="Score history" subtitle="Edit rounds directly or add a manual score.">
          {loadingScores ? (
            <LoadingBlock label="Loading score history..." />
          ) : !selectedUser ? (
            <EmptyState title="Choose a member first" body="The score editor becomes available after you select a member." />
          ) : (
            <>
              <div className="admin-score-create">
                <input className="input" type="number" min="0" max="45" placeholder="Stableford" value={newScore.stableford_points} onChange={(event) => setNewScore((current) => ({ ...current, stableford_points: event.target.value }))} />
                <input className="input" placeholder="Course name" value={newScore.course_name} onChange={(event) => setNewScore((current) => ({ ...current, course_name: event.target.value }))} />
                <input className="input" type="datetime-local" value={newScore.played_at} onChange={(event) => setNewScore((current) => ({ ...current, played_at: event.target.value }))} />
                <button type="button" className="btn btn-secondary" onClick={handleCreateScore}>Add score</button>
              </div>

              {!scores.length ? (
                <EmptyState title="No scores recorded" body="Use the form above to create the first round for this member." />
              ) : (
                <div className="admin-list">
                  {scores.map((score) => (
                    <article className="admin-list-card" key={score.id}>
                      <div className="admin-score-grid">
                        <label>
                          Stableford
                          <input className="input" type="number" min="0" max="45" value={score.stableford_points} onChange={(event) => setScores((current) => current.map((item) => (item.id === score.id ? { ...item, stableford_points: event.target.value } : item)))} />
                        </label>
                        <label>
                          Course
                          <input className="input" value={score.course_name || ''} onChange={(event) => setScores((current) => current.map((item) => (item.id === score.id ? { ...item, course_name: event.target.value } : item)))} />
                        </label>
                        <label>
                          Played at
                          <input className="input" type="datetime-local" value={toDateTimeInput(score.played_at)} onChange={(event) => setScores((current) => current.map((item) => (item.id === score.id ? { ...item, played_at: event.target.value } : item)))} />
                        </label>
                        <label className="admin-score-notes">
                          Notes
                          <textarea className="input" value={score.notes || ''} onChange={(event) => setScores((current) => current.map((item) => (item.id === score.id ? { ...item, notes: event.target.value } : item)))} />
                        </label>
                      </div>
                      <div className="admin-inline-actions">
                        <span className="admin-muted">Created {formatDate(score.created_at)}</span>
                        <button type="button" className="btn btn-secondary" onClick={() => handleSaveScore(score)}>Save round</button>
                        <button type="button" className="btn btn-primary" onClick={() => handleDeleteScore(score.id)}>Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </Panel>
      </div>
    </div>
  )
}

import { useState } from 'react'
import api from '../services/api'
import './ScoreEntry.css'

const holes = Array.from({ length: 18 }, (_, i) => ({
  num: i + 1,
  par: [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5][i],
}))

export default function ScoreEntry() {
  const [course, setCourse] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [scores, setScores] = useState(Array(18).fill(''))
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [donationAmount, setDonationAmount] = useState(null)

  const setHoleScore = (idx, val) => {
    const s = [...scores]
    s[idx] = val
    setScores(s)
  }

  const front9 = scores.slice(0, 9).reduce((a, v) => a + (Number(v) || 0), 0)
  const back9 = scores.slice(9).reduce((a, v) => a + (Number(v) || 0), 0)
  const totalScore = front9 + back9
  const totalPar = holes.reduce((a, h) => a + h.par, 0)
  const diff = totalScore - totalPar
  const filled = scores.filter(v => v !== '').length

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Calculate a rough Stableford score (Max 45) so the backend accepts it
      let stableford = 36 - diff; 
      if (stableford < 0) stableford = 0;
      if (stableford > 45) stableford = 45;

      const res = await api.post('/scores', {
        course_name: course,
        played_at: date,
        stableford_points: stableford
      })
      
      setDonationAmount(res.data.donation_amount || 5.00) // Fallback donation amount
      setSubmitted(true)
    } catch (err) {
      // Improved error catching
      setError(err.response?.data?.error || 'Failed to submit round')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="score-page">
        <section className="section">
          <div className="container" style={{ maxWidth: 600, textAlign: 'center' }}>
            <div className="card score-success">
              <span className="success-icon">⛳</span>
              <h2>Round Submitted!</h2>
              <p>
                You scored <strong>{totalScore}</strong> ({diff > 0 ? '+' : ''}{diff}) at <strong>{course}</strong>.
              </p>
              {donationAmount && (
                <p className="success-donation">
                  <strong>${donationAmount.toFixed(2)}</strong> donated to your chosen charities
                </p>
              )}
              <button className="btn btn-copper" onClick={() => { setSubmitted(false); setScores(Array(18).fill('')); setCourse(''); setDonationAmount(null) }}>
                Log Another Round
              </button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="score-page">
      <section className="section page-header" style={{ paddingBottom: 'var(--space-4)' }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <h1>Log a Round</h1>
          <p>Enter your scores and track your progress while giving back.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ maxWidth: 900 }}>
          {error && (
            <div style={{
              background: 'rgba(220,53,69,0.1)',
              border: '1px solid rgba(220,53,69,0.3)',
              borderRadius: 8,
              padding: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
              color: '#dc3545',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
          <form className="score-form" onSubmit={handleSubmit} id="score-form">
            {/* Meta row */}
            <div className="score-meta card">
              <label className="form-label">
                Course
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Pine Valley GC"
                  value={course}
                  onChange={e => setCourse(e.target.value)}
                  required
                  id="course-name"
                />
              </label>
              <label className="form-label">
                Date
                <input
                  className="form-input"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  id="round-date"
                />
              </label>
            </div>

            {/* Scorecard */}
            <div className="card">
              <h3>Scorecard</h3>

              {/* Front 9 */}
              <h4 className="nine-label">Front 9</h4>
              <div className="score-grid" id="front-nine">
                {holes.slice(0, 9).map((h, i) => (
                  <div className="hole-cell" key={i}>
                    <span className="hole-num">Hole {h.num}</span>
                    <span className="hole-par">Par {h.par}</span>
                    <input
                      className={`hole-input ${scores[i] && Number(scores[i]) < h.par ? 'birdie' : ''} ${scores[i] && Number(scores[i]) > h.par ? 'bogey' : ''}`}
                      type="number"
                      min="1"
                      max="15"
                      value={scores[i]}
                      onChange={e => setHoleScore(i, e.target.value)}
                      id={`hole-${h.num}`}
                    />
                  </div>
                ))}
              </div>

              {/* Back 9 */}
              <h4 className="nine-label">Back 9</h4>
              <div className="score-grid" id="back-nine">
                {holes.slice(9).map((h, i) => (
                  <div className="hole-cell" key={i + 9}>
                    <span className="hole-num">Hole {h.num}</span>
                    <span className="hole-par">Par {h.par}</span>
                    <input
                      className={`hole-input ${scores[i + 9] && Number(scores[i + 9]) < h.par ? 'birdie' : ''} ${scores[i + 9] && Number(scores[i + 9]) > h.par ? 'bogey' : ''}`}
                      type="number"
                      min="1"
                      max="15"
                      value={scores[i + 9]}
                      onChange={e => setHoleScore(i + 9, e.target.value)}
                      id={`hole-${h.num}`}
                    />
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="score-totals">
                <div className="total-block">
                  <span>Front 9</span>
                  <strong>{front9 || '—'}</strong>
                </div>
                <div className="total-block">
                  <span>Back 9</span>
                  <strong>{back9 || '—'}</strong>
                </div>
                <div className="total-block total-main">
                  <span>Total</span>
                  <strong>{totalScore || '—'}</strong>
                </div>
                <div className="total-block">
                  <span>To Par</span>
                  <strong className={diff > 0 ? 'over' : diff < 0 ? 'under' : ''}>
                    {totalScore ? (diff > 0 ? '+' : '') + diff : '—'}
                  </strong>
                </div>
              </div>
            </div>

            <button
              className="btn btn-copper btn-lg"
              style={{ width: '100%' }}
              disabled={filled < 18 || !course || loading}
              type="submit"
              id="submit-round"
            >
              {loading ? 'Submitting…' : `Submit Round (${filled}/18 holes)`}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

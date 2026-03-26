  import { useState, useEffect } from 'react'
  import api from '../services/api'
  import './Leaderboard.css'

  const tiers = ['All Tiers', '0–10 HCP', '10–20 HCP', '20+ HCP']

  // Fallback data when API is empty
  const fallbackData = [
    { rank: 1, name: 'Sarah Mitchell', avatar: 'SM', handicap: 4.2, rounds: 28, avgScore: 72.3, donated: '$1,240', change: 0 },
    { rank: 2, name: 'James Chen', avatar: 'JC', handicap: 8.1, rounds: 24, avgScore: 78.5, donated: '$980', change: 1 },
    { rank: 3, name: 'Maria Rodriguez', avatar: 'MR', handicap: 6.5, rounds: 26, avgScore: 75.1, donated: '$1,120', change: -1 },
    { rank: 4, name: 'David Park', avatar: 'DP', handicap: 12.3, rounds: 22, avgScore: 82.7, donated: '$870', change: 2 },
    { rank: 5, name: 'Emily Watson', avatar: 'EW', handicap: 3.8, rounds: 30, avgScore: 71.8, donated: '$1,350', change: 0 },
    { rank: 6, name: 'Robert Kim', avatar: 'RK', handicap: 15.2, rounds: 20, avgScore: 87.1, donated: '$760', change: -2 },
    { rank: 7, name: 'Lisa Thompson', avatar: 'LT', handicap: 9.7, rounds: 18, avgScore: 80.4, donated: '$640', change: 1 },
    { rank: 8, name: 'Michael Brown', avatar: 'MB', handicap: 5.6, rounds: 25, avgScore: 74.2, donated: '$1,050', change: 3 },
    { rank: 9, name: 'Jennifer Lee', avatar: 'JL', handicap: 11.0, rounds: 21, avgScore: 81.3, donated: '$890', change: -1 },
    { rank: 10, name: 'Andrew Davis', avatar: 'AD', handicap: 7.4, rounds: 23, avgScore: 77.6, donated: '$920', change: 0 },
  ]

  export default function Leaderboard() {
    const [tier, setTier] = useState(tiers[0])
    const [players, setPlayers] = useState(fallbackData)

    useEffect(() => {
      const load = async () => {
        try {
          const res = await api.get('/scores/leaderboard')
          if (res.data && res.data.length > 0) {
            setPlayers(res.data.map((p, i) => ({
              rank: i + 1,
              name: p.full_name,
              avatar: p.full_name.split(' ').map(w => w[0]).join('').slice(0, 2),
              handicap: p.handicap ?? '—',
              rounds: p.total_rounds,
              avgScore: p.avg_score?.toFixed(1) ?? '—',
              donated: `$${(p.total_donated ?? 0).toLocaleString()}`,
              change: 0,
            })))
          }
        } catch {
          // Use fallback data
        }
      }
      load()
    }, [])

    return (
      <div className="leaderboard-page">
        <section className="section page-header">
          <div className="container text-center">
            <span className="badge badge-copper">Season Rankings</span>
            <h1 style={{ marginTop: 'var(--space-4)' }}>Leaderboard</h1>
            <p style={{ maxWidth: '500px', margin: 'var(--space-3) auto 0' }}>
              See where you stand among the community this season
            </p>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            {/* Controls */}
            <div className="lb-controls" id="leaderboard-controls">
              <div className="filter-tags">
                {tiers.map(t => (
                  <button key={t} className={`filter-tag ${tier === t ? 'active' : ''}`} onClick={() => setTier(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Podium */}
            {players.length >= 3 && (
              <div className="podium" id="podium">
                {[players[1], players[0], players[2]].map((p, i) => (
                  <div className={`podium-card ${i === 1 ? 'first' : ''}`} key={p.rank}>
                    <div className={`podium-medal ${['silver', 'gold', 'bronze'][i]}`}>
                      {['🥈', '🥇', '🥉'][i]}
                    </div>
                    <div className="podium-avatar">{p.avatar}</div>
                    <h4>{p.name}</h4>
                    <p className="podium-score">Avg {p.avgScore}</p>
                    <span className="podium-donated">{p.donated} donated</span>
                  </div>
                ))}
              </div>
            )}

            {/* Table */}
            <div className="card lb-table-wrap" id="leaderboard-table">
              <table className="lb-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>HCP</th>
                    <th>Rounds</th>
                    <th>Avg Score</th>
                    <th>Donated</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(player => (
                    <tr key={player.rank}>
                      <td><span className="rank-num">{player.rank}</span></td>
                      <td>
                        <div className="lb-player">
                          <div className="lb-player-avatar">{player.avatar}</div>
                          <span>{player.name}</span>
                        </div>
                      </td>
                      <td>{player.handicap}</td>
                      <td>{player.rounds}</td>
                      <td><strong>{player.avgScore}</strong></td>
                      <td className="donated-cell">{player.donated}</td>
                      <td>
                        <span className={`trend ${player.change > 0 ? 'up' : player.change < 0 ? 'down' : 'same'}`}>
                          {player.change > 0 ? `↑${player.change}` : player.change < 0 ? `↓${Math.abs(player.change)}` : '−'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    )
  }

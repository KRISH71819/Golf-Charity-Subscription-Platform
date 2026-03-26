import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import './Leaderboard.css'

const tiers = ['All Tiers', '0-10 HCP', '10-20 HCP', '20+ HCP']

const fallbackData = [
  { rank: 1, name: 'Sarah Mitchell', avatar: 'SM', handicap: 4.2, rounds: 3, avgScore: 38.7, donated: '$1,240', change: 0 },
  { rank: 2, name: 'Emily Watson', avatar: 'EW', handicap: 3.8, rounds: 3, avgScore: 41.0, donated: '$1,350', change: 0 },
  { rank: 3, name: 'Maria Rodriguez', avatar: 'MR', handicap: 6.5, rounds: 3, avgScore: 38.0, donated: '$1,120', change: 0 },
  { rank: 4, name: 'Michael Brown', avatar: 'MB', handicap: 5.6, rounds: 3, avgScore: 38.0, donated: '$1,050', change: 0 },
  { rank: 5, name: 'Andrew Davis', avatar: 'AD', handicap: 7.4, rounds: 3, avgScore: 37.0, donated: '$920', change: 0 },
  { rank: 6, name: 'James Chen', avatar: 'JC', handicap: 8.1, rounds: 3, avgScore: 35.0, donated: '$980', change: 0 },
  { rank: 7, name: 'Lisa Thompson', avatar: 'LT', handicap: 9.7, rounds: 3, avgScore: 35.0, donated: '$640', change: 0 },
  { rank: 8, name: 'Jennifer Lee', avatar: 'JL', handicap: 11.0, rounds: 3, avgScore: 34.0, donated: '$890', change: 0 },
  { rank: 9, name: 'David Park', avatar: 'DP', handicap: 12.3, rounds: 3, avgScore: 32.0, donated: '$870', change: 0 },
  { rank: 10, name: 'Robert Kim', avatar: 'RK', handicap: 15.2, rounds: 3, avgScore: 30.0, donated: '$760', change: 0 },
]

export default function Leaderboard() {
  const [tier, setTier] = useState(tiers[0])
  const [players, setPlayers] = useState(fallbackData)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/scores/leaderboard')
        if (res.data && res.data.length > 0) {
          setPlayers(
            res.data.map((player, index) => ({
              rank: player.rank || index + 1,
              name: player.full_name || 'Member',
              avatar: (player.full_name || 'Member').split(' ').map((word) => word[0]).join('').slice(0, 2),
              handicap: player.handicap ?? '—',
              rounds: player.total_rounds ?? 0,
              avgScore: player.avg_score ?? '—',
              donated: `$${Number(player.total_donated || 0).toLocaleString()}`,
              change: 0,
            }))
          )
        }
      } catch {
        // Keep fallback data
      }
    }

    load()
  }, [])

  const filteredPlayers = useMemo(() => {
    const next = players.filter((player) => {
      const handicap = Number(player.handicap)
      if (tier === 'All Tiers' || Number.isNaN(handicap)) return true
      if (tier === '0-10 HCP') return handicap >= 0 && handicap < 10
      if (tier === '10-20 HCP') return handicap >= 10 && handicap < 20
      return handicap >= 20
    })

    return next.map((player, index) => ({
      ...player,
      rank: index + 1,
    }))
  }, [players, tier])

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
          <div className="lb-controls" id="leaderboard-controls">
            <div className="filter-tags">
              {tiers.map((entry) => (
                <button key={entry} className={`filter-tag ${tier === entry ? 'active' : ''}`} onClick={() => setTier(entry)}>
                  {entry}
                </button>
              ))}
            </div>
          </div>

          {filteredPlayers.length >= 3 && (
            <div className="podium" id="podium">
              {[filteredPlayers[1], filteredPlayers[0], filteredPlayers[2]].map((player, index) => (
                <div className={`podium-card ${index === 1 ? 'first' : ''}`} key={player.name}>
                  <div className={`podium-medal ${['silver', 'gold', 'bronze'][index]}`}>
                    {['🥈', '🥇', '🥉'][index]}
                  </div>
                  <div className="podium-avatar">{player.avatar}</div>
                  <h4>{player.name}</h4>
                  <p className="podium-score">Avg {player.avgScore}</p>
                  <span className="podium-donated">{player.donated} donated</span>
                </div>
              ))}
            </div>
          )}

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
                {filteredPlayers.map((player) => (
                  <tr key={`${player.name}-${player.rank}`}>
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
                        {player.change > 0 ? `↑${player.change}` : player.change < 0 ? `↓${Math.abs(player.change)}` : '—'}
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

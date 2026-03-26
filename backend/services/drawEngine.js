import supabase from './supabase.js'

/**
 * Prize distribution tiers
 *   5-match: 40% of pool
 *   4-match: 35% of pool
 *   3-match: 25% of pool
 */
const TIERS = [
  { name: '5-Match', pct: 0.40, matchCount: 5 },
  { name: '4-Match', pct: 0.35, matchCount: 4 },
  { name: '3-Match', pct: 0.25, matchCount: 3 },
]

/**
 * Draw N random numbers from 1..maxNum (like lottery balls)
 */
function drawNumbers(count, maxNum = 45) {
  const pool = Array.from({ length: maxNum }, (_, i) => i + 1)
  const drawn = []
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    drawn.push(pool.splice(idx, 1)[0])
  }
  return drawn.sort((a, b) => a - b)
}

/**
 * Count how many of a user's numbers match the drawn numbers
 */
function countMatches(userNumbers, drawnNumbers) {
  const drawnSet = new Set(drawnNumbers)
  return userNumbers.filter(n => drawnSet.has(n)).length
}

/**
 * Execute a season draw
 *
 * 1. Fetch the active season
 * 2. Get all eligible subscribers (active subscription + ≥1 score)
 * 3. Draw 5 numbers
 * 4. Match each subscriber's registered numbers against draw
 * 5. Distribute prize pool per tier
 * 6. Record results and update season
 */
export async function executeDraw(seasonId) {
  // 1. Fetch season
  const { data: season, error: sErr } = await supabase
    .from('seasons')
    .select('*')
    .eq('id', seasonId)
    .single()

  if (sErr || !season) throw new Error('Season not found')
  if (season.status !== 'active') throw new Error('Season is not active')

  // 2. Fetch eligible participants
  const { data: participants } = await supabase
    .from('draw_entries')
    .select('*, users(id, email, full_name)')
    .eq('season_id', seasonId)

  if (!participants?.length) throw new Error('No participants for this draw')

  // 3. Draw numbers
  const drawnNumbers = drawNumbers(5)
  const prizePool = season.prize_pool || 0

  // 4. Match & distribute
  const results = []
  for (const tier of TIERS) {
    const tierPrize = prizePool * tier.pct
    const winners = participants.filter(p =>
      countMatches(p.numbers || [], drawnNumbers) >= tier.matchCount
    )

    if (winners.length > 0) {
      const perWinner = tierPrize / winners.length
      for (const w of winners) {
        results.push({
          season_id: seasonId,
          user_id: w.user_id,
          tier: tier.name,
          matches: countMatches(w.numbers || [], drawnNumbers),
          prize_amount: Math.round(perWinner * 100) / 100,
          drawn_numbers: drawnNumbers,
        })
      }
    }
  }

  // 5. Save draw results
  if (results.length > 0) {
    await supabase.from('draw_results').insert(results)
  }

  // 6. Update season
  await supabase
    .from('seasons')
    .update({
      status: 'completed',
      drawn_numbers: drawnNumbers,
      completed_at: new Date().toISOString(),
    })
    .eq('id', seasonId)

  return {
    seasonId,
    drawnNumbers,
    prizePool,
    totalWinners: results.length,
    results,
  }
}

/**
 * Get current active season
 */
export async function getActiveSeason() {
  const { data } = await supabase
    .from('seasons')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data
}

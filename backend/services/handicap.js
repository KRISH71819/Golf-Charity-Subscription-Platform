import supabase from './supabase.js'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function estimateHandicapFromScores(scores) {
  const rounds = (scores || [])
    .map((score) => Number(score.stableford_points || 0))
    .filter((score) => Number.isFinite(score))

  if (!rounds.length) return null

  const avgStableford = rounds.reduce((sum, score) => sum + score, 0) / rounds.length

  // Approximate handicap from recent Stableford form so the UI updates after each round.
  const estimated = 47 - (1.1 * avgStableford)
  return Number(clamp(estimated, 0, 36).toFixed(1))
}

export async function refreshUserHandicap(userId) {
  if (!userId) return null

  const { data: scores, error: scoresError } = await supabase
    .from('scores')
    .select('stableford_points')
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .limit(20)

  if (scoresError) throw scoresError

  const handicap = estimateHandicapFromScores(scores || [])

  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update({ handicap })
    .eq('id', userId)
    .select('id, handicap')
    .single()

  if (updateError) throw updateError

  return updatedUser?.handicap ?? handicap
}

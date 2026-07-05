import { supabase } from './supabaseClient'

const TABLE = 'leaderboard'

export async function submitScore(username, level, xp) {
  if (!username) return

  try {
    const { error } = await supabase.rpc('upsert_best_score', {
      p_username: username,
      p_level: level,
      p_xp: xp
    })

    if (error) throw error
  } catch (err) {
    console.error('submitScore failed:', err)
  }
}

export async function getTopPlayers(count = 10) {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('username, level, xp')
      .order('level', { ascending: false })
      .order('xp', { ascending: false })
      .limit(count)

    if (error) throw error

    return (data ?? []).map((row, i) => ({
      rank: i + 1,
      username: row.username,
      level: row.level
    }))
  } catch (err) {
    console.error('getTopPlayers failed:', err)
    return []
  }
}

export async function checkUsernameExists(username) {
  const trimmed = (username ?? '').trim()
  if (!trimmed) return false

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('username')
      .ilike('username', trimmed)
      .limit(1)

    if (error) throw error

    return (data ?? []).length > 0
  } catch (err) {
    console.error('checkUsernameExists failed:', err)
    return false
  }
}
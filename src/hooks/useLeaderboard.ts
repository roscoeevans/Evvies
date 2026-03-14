import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Participant, LeaderboardEntry } from '../lib/types'
import { useCategories } from './useCategories'
import { useResults } from './useResults'
import { useAllPredictions } from './usePredictions'
import { computeLeaderboard } from '../lib/scoring'

export function useLeaderboard() {
  const { categories } = useCategories()
  const { results, announcedCount } = useResults()
  const { predictions } = useAllPredictions()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const previousLeaderboard = useRef<LeaderboardEntry[]>([])

  // Fetch all participants
  useEffect(() => {
    const fetchParticipants = async () => {
      const { data } = await supabase
        .from('participants')
        .select('*')

      if (data) setParticipants(data as Participant[])
    }
    fetchParticipants()

    const channel = supabase
      .channel('participants-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        () => { fetchParticipants() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Recompute leaderboard when data changes
  useEffect(() => {
    if (categories.length === 0) return

    const newLeaderboard = computeLeaderboard(
      participants,
      predictions,
      results,
      categories,
      previousLeaderboard.current
    )

    previousLeaderboard.current = leaderboard
    setLeaderboard(newLeaderboard)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants, predictions, results, categories])

  return {
    leaderboard,
    announcedCount,
    totalCategories: categories.length,
    loading: categories.length === 0,
  }
}

import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { Participant, Nominee, LeaderboardEntry } from '../lib/types'
import { useCategories } from './useCategories'
import { useResults } from './useResults'
import { useAllPredictions } from './usePredictions'
import { computeLeaderboard } from '../lib/scoring'

export interface FilmWinCount {
  film: string
  wins: number
}

export interface LastAnnouncedInfo {
  categoryName: string
  winnerLabel: string
  winnerFilm: string | null
  categoryId: string
  correctParticipantIds: string[]
}

export interface PlayerStreak {
  participantId: string
  currentStreak: number
  isHot: boolean // 3+ correct in a row currently
  isCold: boolean // 0 for last 3+ announced
}

export function useLeaderboard() {
  const { categories, categoriesWithNominees } = useCategories()
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

  // Build nominee map for lookups
  const nomineeMap = useMemo(() => {
    const map = new Map<string, Nominee>()
    for (const cat of categoriesWithNominees) {
      for (const nom of cat.nominees) {
        map.set(nom.id, nom)
      }
    }
    return map
  }, [categoriesWithNominees])

  // Film win counts (Awards Race)
  const filmWins = useMemo((): FilmWinCount[] => {
    const counts: Record<string, number> = {}
    for (const result of results) {
      const nominee = nomineeMap.get(result.winning_nominee_id)
      if (nominee?.film) {
        counts[nominee.film] = (counts[nominee.film] ?? 0) + 1
      }
    }
    return Object.entries(counts)
      .map(([film, wins]) => ({ film, wins }))
      .sort((a, b) => b.wins - a.wins)
  }, [results, nomineeMap])

  // Last announced result
  const lastAnnounced = useMemo((): LastAnnouncedInfo | null => {
    if (results.length === 0) return null
    // Sort by announced_at descending to get the most recent
    const sorted = [...results].sort((a, b) =>
      new Date(b.announced_at).getTime() - new Date(a.announced_at).getTime()
    )
    const latest = sorted[0]
    const cat = categories.find(c => c.id === latest.category_id)
    const winner = nomineeMap.get(latest.winning_nominee_id)
    if (!cat || !winner) return null

    // Find who got it right
    const correctIds = predictions
      .filter(p => p.category_id === latest.category_id && p.nominee_id === latest.winning_nominee_id)
      .map(p => p.participant_id)

    return {
      categoryName: cat.name,
      winnerLabel: winner.label,
      winnerFilm: winner.film,
      categoryId: latest.category_id,
      correctParticipantIds: correctIds,
    }
  }, [results, categories, nomineeMap, predictions])

  // Player streaks
  const streaks = useMemo((): PlayerStreak[] => {
    const resultMap = new Map(results.map(r => [r.category_id, r]))
    const announcedCategories = categories
      .filter(c => resultMap.has(c.id))
      .sort((a, b) => a.sort_order - b.sort_order)

    const lockedParticipants = participants.filter(p => p.locked_at !== null)

    return lockedParticipants.map(participant => {
      const myPreds = predictions.filter(p => p.participant_id === participant.id)
      let currentStreak = 0
      let streakBroken = false

      // Walk backwards through announced categories to find current streak
      for (let i = announcedCategories.length - 1; i >= 0; i--) {
        const cat = announcedCategories[i]
        const result = resultMap.get(cat.id)!
        const pred = myPreds.find(p => p.category_id === cat.id)

        if (pred && result.winning_nominee_id === pred.nominee_id) {
          if (!streakBroken) currentStreak++
        } else {
          streakBroken = true
        }
      }

      // Count recent misses (from end)
      let recentMisses = 0
      for (let i = announcedCategories.length - 1; i >= 0; i--) {
        const cat = announcedCategories[i]
        const result = resultMap.get(cat.id)!
        const pred = myPreds.find(p => p.category_id === cat.id)
        if (!pred || result.winning_nominee_id !== pred.nominee_id) {
          recentMisses++
        } else {
          break
        }
      }

      return {
        participantId: participant.id,
        currentStreak,
        isHot: currentStreak >= 3,
        isCold: recentMisses >= 3 && announcedCategories.length >= 3,
      }
    })
  }, [participants, predictions, results, categories])

  // Live insight stats
  const liveInsights = useMemo(() => {
    const lockedParticipants = participants.filter(p => p.locked_at)

    if (results.length === 0 || lockedParticipants.length === 0) return null

    // Biggest upset: category where fewest players got it right
    let minCorrect = Infinity
    let upsetCategory = ''
    let upsetCorrectCount = 0

    // Safest pick: category where most players got it right
    let maxCorrect = 0
    let safeCategory = ''
    let safeCorrectCount = 0

    for (const result of results) {
      const cat = categories.find(c => c.id === result.category_id)
      if (!cat) continue

      const correctCount = predictions.filter(
        p => p.category_id === result.category_id
          && p.nominee_id === result.winning_nominee_id
          && lockedParticipants.some(lp => lp.id === p.participant_id)
      ).length

      if (correctCount < minCorrect) {
        minCorrect = correctCount
        upsetCategory = cat.name
        upsetCorrectCount = correctCount
      }
      if (correctCount > maxCorrect) {
        maxCorrect = correctCount
        safeCategory = cat.name
        safeCorrectCount = correctCount
      }
    }

    // Points still in play
    const totalPossible = categories.reduce((sum, c) => sum + c.point_value, 0)
    const announcedPoints = results.reduce((sum, r) => {
      const cat = categories.find(c => c.id === r.category_id)
      return sum + (cat?.point_value ?? 0)
    }, 0)
    const remaining = totalPossible - announcedPoints

    return {
      biggestUpset: upsetCategory
        ? { category: upsetCategory, correctCount: upsetCorrectCount, total: lockedParticipants.length }
        : null,
      safestPick: safeCategory
        ? { category: safeCategory, correctCount: safeCorrectCount, total: lockedParticipants.length }
        : null,
      pointsRemaining: remaining,
      totalPossible,
    }
  }, [results, categories, predictions, participants])

  return {
    leaderboard,
    announcedCount,
    totalCategories: categories.length,
    loading: categories.length === 0,
    filmWins,
    lastAnnounced,
    streaks,
    liveInsights,
    participants,
    predictions,
    results,
    categories,
    categoriesWithNominees,
    nomineeMap,
  }
}

import type {
  Participant,
  Category,
  Prediction,
  Result,
  Nominee,
  LeaderboardEntry,
  FunnyAward,
  InsightStat,
} from './types'

// ============================================
// Leaderboard Scoring
// ============================================

export function computeLeaderboard(
  participants: Participant[],
  predictions: Prediction[],
  results: Result[],
  categories: Category[],
  previousLeaderboard?: LeaderboardEntry[]
): LeaderboardEntry[] {
  const categoryMap = new Map(categories.map(c => [c.id, c]))
  const resultMap = new Map(results.map(r => [r.category_id, r]))

  const totalPossible = categories.reduce((sum, c) => sum + c.point_value, 0)
  const announcedPoints = results.reduce((sum, r) => {
    const cat = categoryMap.get(r.category_id)
    return sum + (cat?.point_value ?? 0)
  }, 0)
  const remainingPoints = totalPossible - announcedPoints

  const previousRankMap = new Map(
    previousLeaderboard?.map(e => [e.participant.id, e.rank]) ?? []
  )

  const entries: LeaderboardEntry[] = participants
    .filter(p => p.locked_at !== null)
    .map(participant => {
      const myPredictions = predictions.filter(p => p.participant_id === participant.id)
      let totalScore = 0
      let categoriesCorrect = 0
      const tagScores: Record<string, number> = {}

      for (const pred of myPredictions) {
        const result = resultMap.get(pred.category_id)
        if (result && result.winning_nominee_id === pred.nominee_id) {
          const cat = categoryMap.get(pred.category_id)
          if (cat) {
            totalScore += cat.point_value
            categoriesCorrect++
            for (const tag of cat.tags) {
              tagScores[tag] = (tagScores[tag] ?? 0) + cat.point_value
            }
          }
        }
      }

      return {
        participant,
        totalScore,
        categoriesCorrect,
        totalPossible,
        remainingPossible: remainingPoints,
        rank: 0,
        previousRank: previousRankMap.get(participant.id),
        tagScores,
      }
    })

  // Sort by score desc, then categories correct desc, then name asc
  entries.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
    if (b.categoriesCorrect !== a.categoriesCorrect) return b.categoriesCorrect - a.categoriesCorrect
    return a.participant.display_name.localeCompare(b.participant.display_name)
  })

  // Assign ranks (handle ties)
  let currentRank = 1
  for (let i = 0; i < entries.length; i++) {
    if (i > 0 && entries[i].totalScore === entries[i - 1].totalScore
      && entries[i].categoriesCorrect === entries[i - 1].categoriesCorrect) {
      entries[i].rank = entries[i - 1].rank
    } else {
      entries[i].rank = currentRank
    }
    currentRank++
  }

  return entries
}

// ============================================
// Pre-show Insights
// ============================================

export function computeInsights(
  predictions: Prediction[],
  categories: Category[],
  nominees: Nominee[],
  participantCount: number
): InsightStat[] {
  if (participantCount === 0) return []

  const stats: InsightStat[] = []
  const nomineeMap = new Map(nominees.map(n => [n.id, n]))
  const categoryMap = new Map(categories.map(c => [c.id, c]))

  // Per-category vote counts
  const categoryVotes: Record<string, Record<string, number>> = {}
  for (const pred of predictions) {
    if (!categoryVotes[pred.category_id]) categoryVotes[pred.category_id] = {}
    categoryVotes[pred.category_id][pred.nominee_id] =
      (categoryVotes[pred.category_id][pred.nominee_id] ?? 0) + 1
  }

  // Most predicted Best Picture
  const bestPictureCat = categories.find(c => c.slug === 'best-picture')
  if (bestPictureCat && categoryVotes[bestPictureCat.id]) {
    const topPick = getTopPick(categoryVotes[bestPictureCat.id], nomineeMap)
    if (topPick) {
      stats.push({
        label: 'Predicted Best Picture',
        value: topPick.name,
        sublabel: `${topPick.percentage}% of ballots`,
        icon: '🎬',
      })
    }
  }

  // Most predicted Best Actor
  const bestActorCat = categories.find(c => c.slug === 'best-actor')
  if (bestActorCat && categoryVotes[bestActorCat.id]) {
    const topPick = getTopPick(categoryVotes[bestActorCat.id], nomineeMap)
    if (topPick) {
      stats.push({
        label: 'Predicted Best Actor',
        value: topPick.name,
        sublabel: `${topPick.percentage}% of ballots`,
        icon: '🎭',
      })
    }
  }

  // Most predicted Best Actress
  const bestActressCat = categories.find(c => c.slug === 'best-actress')
  if (bestActressCat && categoryVotes[bestActressCat.id]) {
    const topPick = getTopPick(categoryVotes[bestActressCat.id], nomineeMap)
    if (topPick) {
      stats.push({
        label: 'Predicted Best Actress',
        value: topPick.name,
        sublabel: `${topPick.percentage}% of ballots`,
        icon: '🌟',
      })
    }
  }

  // Film predicted to win most categories
  const filmWins: Record<string, number> = {}
  for (const catId of Object.keys(categoryVotes)) {
    const votes = categoryVotes[catId]
    const topNomineeId = Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0]
    if (topNomineeId) {
      const nominee = nomineeMap.get(topNomineeId)
      if (nominee) {
        // Extract base film name (before comma for person-based nominees)
        const filmName = nominee.label.split(',')[0].replace(/"/g, '').trim()
        filmWins[filmName] = (filmWins[filmName] ?? 0) + 1
      }
    }
  }
  const topFilm = Object.entries(filmWins).sort((a, b) => b[1] - a[1])[0]
  if (topFilm) {
    stats.push({
      label: 'Predicted Sweep Leader',
      value: topFilm[0],
      sublabel: `Favored in ${topFilm[1]} categories`,
      icon: '🏆',
    })
  }

  // Strongest consensus
  let maxConsensus = 0
  let consensusCat = ''
  let consensusPick = ''
  for (const [catId, votes] of Object.entries(categoryVotes)) {
    const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0)
    const topVote = Math.max(...Object.values(votes))
    const consensus = topVote / totalVotes
    if (consensus > maxConsensus) {
      maxConsensus = consensus
      consensusCat = categoryMap.get(catId)?.name ?? ''
      const topNomineeId = Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0]
      consensusPick = topNomineeId ? (nomineeMap.get(topNomineeId)?.label ?? '') : ''
    }
  }
  if (consensusCat) {
    stats.push({
      label: 'Strongest Consensus',
      value: consensusCat,
      sublabel: `${Math.round(maxConsensus * 100)}% picked ${consensusPick.split(',')[0]}`,
      icon: '🤝',
    })
  }

  // Most divided
  let minConsensus = 1
  let dividedCat = ''
  for (const [catId, votes] of Object.entries(categoryVotes)) {
    const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0)
    const topVote = Math.max(...Object.values(votes))
    const consensus = topVote / totalVotes
    if (consensus < minConsensus && totalVotes > 1) {
      minConsensus = consensus
      dividedCat = categoryMap.get(catId)?.name ?? ''
    }
  }
  if (dividedCat) {
    stats.push({
      label: 'Most Divided',
      value: dividedCat,
      sublabel: 'No clear favorite',
      icon: '⚡',
    })
  }

  return stats
}

function getTopPick(
  votes: Record<string, number>,
  nomineeMap: Map<string, Nominee>
): { name: string; percentage: number } | null {
  const entries = Object.entries(votes).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return null
  const totalVotes = entries.reduce((sum, [, count]) => sum + count, 0)
  const topNominee = nomineeMap.get(entries[0][0])
  if (!topNominee) return null
  return {
    name: topNominee.label.split(',')[0].trim(),
    percentage: Math.round((entries[0][1] / totalVotes) * 100),
  }
}

// ============================================
// Funny Awards (Post-show)
// ============================================

export function computeFunnyAwards(
  participants: Participant[],
  predictions: Prediction[],
  results: Result[],
  categories: Category[],
  _nominees: Nominee[]
): FunnyAward[] {
  const awards: FunnyAward[] = []
  const resultMap = new Map(results.map(r => [r.category_id, r]))
  const lockedParticipants = participants.filter(p => p.locked_at !== null)

  if (lockedParticipants.length === 0) return awards

  // Compute per-participant stats
  const participantStats = lockedParticipants.map(participant => {
    const myPreds = predictions.filter(p => p.participant_id === participant.id)
    let correct = 0
    let totalScore = 0
    const tagScores: Record<string, number> = {}
    let streak = 0
    let maxStreak = 0
    let upsetCorrect = 0

    // Compute per-prediction vote popularity
    const allPredictionVotes: Record<string, Record<string, number>> = {}
    for (const pred of predictions) {
      if (!allPredictionVotes[pred.category_id]) allPredictionVotes[pred.category_id] = {}
      allPredictionVotes[pred.category_id][pred.nominee_id] =
        (allPredictionVotes[pred.category_id][pred.nominee_id] ?? 0) + 1
    }

    for (const cat of [...categories].sort((a, b) => a.sort_order - b.sort_order)) {
      const result = resultMap.get(cat.id)
      const pred = myPreds.find(p => p.category_id === cat.id)
      if (!result || !pred) {
        streak = 0
        continue
      }

      if (result.winning_nominee_id === pred.nominee_id) {
        correct++
        totalScore += cat.point_value
        streak++
        maxStreak = Math.max(maxStreak, streak)
        for (const tag of cat.tags) {
          tagScores[tag] = (tagScores[tag] ?? 0) + cat.point_value
        }

        // Check if this was an upset (least-picked winner)
        const votesForWinner = allPredictionVotes[cat.id]?.[result.winning_nominee_id] ?? 0
        const totalVotes = Object.values(allPredictionVotes[cat.id] ?? {}).reduce((a, b) => a + b, 0)
        if (totalVotes > 1 && votesForWinner / totalVotes < 0.3) {
          upsetCorrect++
        }
      } else {
        streak = 0
      }
    }

    return { participant, correct, totalScore, tagScores, maxStreak, upsetCorrect }
  })

  // Grand Winner
  const grandWinner = participantStats.sort((a, b) => b.totalScore - a.totalScore)[0]
  awards.push({
    title: 'Grand Winner',
    emoji: '🏆',
    description: 'Highest total score',
    winner: grandWinner?.participant ?? null,
    value: `${grandWinner?.totalScore ?? 0} pts`,
  })

  // The Academy Whisperer (most categories correct)
  const whisperer = [...participantStats].sort((a, b) => b.correct - a.correct)[0]
  awards.push({
    title: 'The Academy Whisperer',
    emoji: '🎯',
    description: 'Most categories correct',
    winner: whisperer?.participant ?? null,
    value: `${whisperer?.correct ?? 0} / 24`,
  })

  // The Tragic Favorite (fewest categories correct)
  const tragic = [...participantStats].sort((a, b) => a.correct - b.correct)[0]
  if (tragic && tragic.participant.id !== grandWinner?.participant.id) {
    awards.push({
      title: 'The Tragic Favorite',
      emoji: '💔',
      description: 'Fewest categories correct',
      winner: tragic.participant,
      value: `${tragic.correct} / 24`,
    })
  }

  // The Chaos Agent (most correct upset picks)
  const chaosAgent = [...participantStats].sort((a, b) => b.upsetCorrect - a.upsetCorrect)[0]
  if (chaosAgent && chaosAgent.upsetCorrect > 0) {
    awards.push({
      title: 'The Chaos Agent',
      emoji: '🃏',
      description: 'Called the most upset winners',
      winner: chaosAgent.participant,
      value: `${chaosAgent.upsetCorrect} upsets`,
    })
  }

  // The Streak (longest consecutive correct)
  const streaker = [...participantStats].sort((a, b) => b.maxStreak - a.maxStreak)[0]
  if (streaker && streaker.maxStreak >= 2) {
    awards.push({
      title: 'The Streak',
      emoji: '🔥',
      description: 'Longest consecutive correct picks',
      winner: streaker.participant,
      value: `${streaker.maxStreak} in a row`,
    })
  }

  // Craft Queen/King (best craft tag score)
  const craftChamp = [...participantStats].sort(
    (a, b) => (b.tagScores['craft'] ?? 0) - (a.tagScores['craft'] ?? 0)
  )[0]
  if (craftChamp && (craftChamp.tagScores['craft'] ?? 0) > 0) {
    awards.push({
      title: 'Craft Royalty',
      emoji: '🎨',
      description: 'Best performance in craft categories',
      winner: craftChamp.participant,
      value: `${craftChamp.tagScores['craft']} craft pts`,
    })
  }

  // The Above-the-Liner (best marquee tag score)
  const marqueeChamp = [...participantStats].sort(
    (a, b) => (b.tagScores['marquee'] ?? 0) - (a.tagScores['marquee'] ?? 0)
  )[0]
  if (marqueeChamp && (marqueeChamp.tagScores['marquee'] ?? 0) > 0) {
    awards.push({
      title: 'The Above-the-Liner',
      emoji: '⭐',
      description: 'Dominated the marquee categories',
      winner: marqueeChamp.participant,
      value: `${marqueeChamp.tagScores['marquee']} marquee pts`,
    })
  }

  // Short King/Queen (best shorts performance)
  const shortChamp = [...participantStats].sort(
    (a, b) => (b.tagScores['short'] ?? 0) - (a.tagScores['short'] ?? 0)
  )[0]
  if (shortChamp && (shortChamp.tagScores['short'] ?? 0) > 0) {
    awards.push({
      title: 'Short Royalty',
      emoji: '👑',
      description: 'Best shorts performance',
      winner: shortChamp.participant,
      value: `${shortChamp.tagScores['short']} short pts`,
    })
  }

  return awards
}

// ============================================
// Utility: derive participant progress
// ============================================

export function getParticipantProgress(
  participant: Participant | null,
  predictionCount: number
): 'new' | 'in_progress' | 'ready_to_lock' | 'submitted' {
  if (!participant) return 'new'
  if (participant.locked_at) return 'submitted'
  if (predictionCount >= 24) return 'ready_to_lock'
  return 'in_progress'
}

// ============================================
// Utility: get tag color class
// ============================================

export function getTagColorClass(tag: string): string {
  if (['marquee', 'picture', 'overall', 'prestige', 'directing'].includes(tag)) return 'tag-marquee'
  if (['acting', 'lead', 'supporting', 'performance'].includes(tag)) return 'tag-acting'
  if (['craft', 'image', 'post', 'design', 'tech', 'casting', 'cinematography', 'editing', 'production_design', 'costume', 'makeup', 'sound', 'visual_effects'].includes(tag)) return 'tag-craft'
  if (['short', 'live_action'].includes(tag)) return 'tag-shorts'
  if (['writing', 'screenplay'].includes(tag)) return 'tag-writing'
  if (['music', 'song', 'score'].includes(tag)) return 'tag-music'
  if (['feature', 'international', 'animation', 'documentary', 'specialty'].includes(tag)) return 'tag-feature'
  return 'tag-craft'
}

// ============================================
// Utility: UI group display names
// ============================================

export const UI_GROUP_LABELS: Record<string, string> = {
  marquee: 'Marquee',
  craft_music: 'Craft & Music',
  feature_races: 'Feature Races',
  shorts: 'Shorts',
}

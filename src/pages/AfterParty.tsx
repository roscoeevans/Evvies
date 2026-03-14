import { motion } from 'framer-motion'
import { useMemo, useState, useEffect } from 'react'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useCategories } from '../hooks/useCategories'
import { useResults } from '../hooks/useResults'
import { useAllPredictions } from '../hooks/usePredictions'
import { supabase } from '../lib/supabase'
import { computeFunnyAwards } from '../lib/scoring'
import NomineeLabel from '../components/NomineeLabel'
import type { Participant, Nominee } from '../lib/types'

export default function AfterParty() {
  const { leaderboard, announcedCount, filmWins, nomineeMap } = useLeaderboard()
  const { categories, categoriesWithNominees, nominees } = useCategories()
  const { results } = useResults()
  const { predictions } = useAllPredictions()
  const [allParticipants, setAllParticipants] = useState<Participant[]>([])

  useEffect(() => {
    supabase.from('participants').select('*').then(({ data }) => {
      if (data) setAllParticipants(data as Participant[])
    })
  }, [])

  const funnyAwards = computeFunnyAwards(allParticipants, predictions, results, categories, nominees)
  const grandWinner = leaderboard[0]

  // Build result map for category lookups
  const resultMap = useMemo(
    () => new Map(results.map(r => [r.category_id, r])),
    [results]
  )

  // Locked participants for "who got it right" avatars
  const lockedParticipants = useMemo(
    () => allParticipants.filter(p => p.locked_at !== null),
    [allParticipants]
  )

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="flex-1 flex flex-col">
      {/* Grand Winner Hero */}
      {grandWinner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-8 pt-6 pb-2"
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="text-6xl mb-4"
          >
            🏆
          </motion.div>
          <p className="text-crimson-light text-xs uppercase tracking-[0.25em] font-bold mb-2">
            Grand Winner
          </p>
          <h2 className="font-serif text-4xl font-bold shimmer mb-2">
            {grandWinner.participant.display_name}
          </h2>
          <div className="flex items-center justify-center gap-3 text-ivory-dim text-sm">
            <span className="font-bold text-gold text-2xl tabular-nums">{grandWinner.totalScore}</span>
            <span>points</span>
            <span className="text-charcoal-light">•</span>
            <span>{grandWinner.categoriesCorrect} of {announcedCount} correct</span>
          </div>
        </motion.div>
      )}

      {/* Final Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8"
      >
        <h3 className="text-xs uppercase tracking-[0.2em] text-gold-dim font-bold mb-3">
          Final Standings
        </h3>
        <div className="space-y-2">
          {leaderboard.map((entry, idx) => (
            <motion.div
              key={entry.participant.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + idx * 0.08 }}
              className={`glass-card p-3.5 flex items-center gap-3 ${idx === 0 ? 'gold-glow' : ''}`}
            >
              {/* Rank badge */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                idx === 0
                  ? 'bg-gradient-to-br from-gold to-gold-dim text-velvet'
                  : idx === 1
                    ? 'bg-charcoal-light text-ivory border border-ivory-dim/20'
                    : idx === 2
                      ? 'bg-charcoal-light text-bronze border border-bronze/20'
                      : 'bg-charcoal text-ivory-dim'
              }`}>
                {entry.rank}
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-charcoal-light flex items-center justify-center text-base shrink-0 border border-charcoal-light">
                {entry.participant.photo_url ? (
                  <img src={entry.participant.photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <span className="text-gold-dim">{getInitials(entry.participant.display_name)}</span>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${idx === 0 ? 'text-gold-light' : 'text-ivory'}`}>
                  {entry.participant.display_name}
                </p>
                <p className="text-ivory-dim text-xs">{entry.categoriesCorrect} correct</p>
              </div>

              {/* Score */}
              <p className={`font-bold text-lg tabular-nums ${idx === 0 ? 'text-gold' : 'text-ivory'}`}>
                {entry.totalScore}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Awards Race — Film of the Night */}
      {filmWins.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mb-8"
        >
          <h3 className="text-xs uppercase tracking-[0.2em] text-gold-dim font-bold mb-3">
            Film of the Night
          </h3>
          <div className="glass-card p-4 space-y-2.5">
            {filmWins.slice(0, 6).map((fw, idx) => {
              const maxWins = filmWins[0].wins
              const pct = (fw.wins / maxWins) * 100
              return (
                <div key={fw.film}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`font-medium truncate mr-2 ${idx === 0 ? 'text-gold-light' : 'text-ivory'}`}>
                      <em>{fw.film}</em>
                    </span>
                    <span className={`font-bold tabular-nums shrink-0 ${idx === 0 ? 'text-gold' : 'text-ivory-dim'}`}>
                      {fw.wins} {fw.wins === 1 ? 'win' : 'wins'}
                    </span>
                  </div>
                  <div className="h-2 bg-charcoal rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        idx === 0
                          ? 'bg-gradient-to-r from-crimson via-crimson to-gold'
                          : 'bg-gradient-to-r from-charcoal-light to-ivory-dim/30'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 1.4 + idx * 0.05 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Special Awards */}
      {funnyAwards.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="mb-8"
        >
          <h3 className="text-xs uppercase tracking-[0.2em] text-crimson-light font-bold mb-3">
            The Evvies
          </h3>
          <div className="space-y-2.5">
            {funnyAwards.slice(1).map((award, idx) => (
              <motion.div
                key={award.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8 + idx * 0.1 }}
                className="glass-card p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">{award.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gold-light text-[10px] font-bold uppercase tracking-wider">
                      {award.title}
                    </p>
                    <p className="font-serif text-base font-bold text-ivory mt-0.5">
                      {award.winner?.display_name ?? 'N/A'}
                    </p>
                    <p className="text-ivory-dim text-xs mt-0.5">
                      {award.description}
                      {award.value && (
                        <span className="text-crimson-light ml-1.5 font-medium">
                          {award.value}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Category-by-Category Results */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        className="mb-8"
      >
        <h3 className="text-xs uppercase tracking-[0.2em] text-gold-dim font-bold mb-3">
          Complete Results
        </h3>
        <div className="space-y-2">
          {[...categoriesWithNominees].reverse().map((cat, idx) => {
            const result = resultMap.get(cat.id)
            const winner = result ? nomineeMap.get(result.winning_nominee_id) : null
            if (!winner) return null

            // Who got it right
            const correctPredictions = predictions.filter(
              p => p.category_id === cat.id && p.nominee_id === result!.winning_nominee_id
            )
            const correctParticipants = correctPredictions
              .map(p => lockedParticipants.find(lp => lp.id === p.participant_id))
              .filter(Boolean) as Participant[]

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2 + idx * 0.03 }}
                className="glass-card p-3.5"
              >
                <div className="flex items-start gap-3">
                  <span className="text-gold text-base mt-0.5 shrink-0">🏆</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-ivory-dim text-[10px] uppercase tracking-wider font-medium">
                      {cat.name}
                    </p>
                    <p className="font-serif text-sm font-bold text-ivory mt-0.5 leading-snug">
                      <NomineeLabel label={winner.label} tags={cat.tags} />
                    </p>
                    {/* Who got it right */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="flex -space-x-1">
                        {correctParticipants.slice(0, 7).map(p => (
                          <div
                            key={p.id}
                            className="w-5 h-5 rounded-full border border-charcoal bg-charcoal-light flex items-center justify-center"
                            title={p.display_name}
                          >
                            <span className="text-[7px] font-bold text-gold-dim">
                              {getInitials(p.display_name)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <span className="text-ivory-dim/50 text-[10px]">
                        {correctParticipants.length} of {lockedParticipants.length}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
        className="text-center py-8"
      >
        <p className="text-ivory-dim/20 text-xs font-serif">
          The Evvies 2026 ✦ Thanks for playing
        </p>
      </motion.div>
    </div>
  )
}

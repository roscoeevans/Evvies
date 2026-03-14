import { motion } from 'framer-motion'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useCategories } from '../hooks/useCategories'
import { useResults } from '../hooks/useResults'
import { useAllPredictions } from '../hooks/usePredictions'
import { supabase } from '../lib/supabase'
import { computeFunnyAwards } from '../lib/scoring'
import { useState, useEffect } from 'react'
import type { Participant } from '../lib/types'

export default function AfterParty() {
  const { leaderboard, announcedCount } = useLeaderboard()
  const { categories, nominees } = useCategories()
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

  return (
    <div className="flex-1 flex flex-col">
      {/* Grand Winner */}
      {grandWinner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-8 pt-4"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="text-5xl mb-3">🏆</motion.div>
          <p className="text-gold-dim text-xs uppercase tracking-widest mb-2">Grand Winner</p>
          <h2 className="font-serif text-3xl font-bold shimmer mb-2">
            {grandWinner.participant.display_name}
          </h2>
          <p className="text-ivory-dim text-sm">
            {grandWinner.totalScore} points • {grandWinner.categoriesCorrect} of {announcedCount} correct
          </p>
        </motion.div>
      )}

      {/* Final Leaderboard */}
      <div className="mb-6">
        <h3 className="text-xs uppercase tracking-widest text-gold-dim font-semibold mb-3">
          Final Standings
        </h3>
        <div className="space-y-2">
          {leaderboard.map((entry, idx) => (
            <motion.div key={entry.participant.id}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + idx * 0.1 }}
              className={`glass-card p-3 flex items-center gap-3 ${idx === 0 ? 'gold-glow' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                idx === 0 ? 'bg-gradient-to-br from-gold to-gold-dim text-velvet'
                : idx === 1 ? 'bg-charcoal-light text-ivory' : 'bg-charcoal text-ivory-dim'
              }`}>{entry.rank}</div>
              <div className="w-8 h-8 rounded-full bg-charcoal-light flex items-center justify-center text-sm">
                {entry.participant.display_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-ivory text-sm font-medium truncate">{entry.participant.display_name}</p>
                <p className="text-ivory-dim text-xs">{entry.categoriesCorrect} correct</p>
              </div>
              <p className="font-bold text-lg text-ivory tabular-nums">{entry.totalScore}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Funny Awards */}
      {funnyAwards.length > 1 && (
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-widest text-gold-dim font-semibold mb-3">
            Special Awards
          </h3>
          <div className="space-y-2.5">
            {funnyAwards.slice(1).map((award, idx) => (
              <motion.div key={award.title}
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + idx * 0.12 }}
                className="glass-card p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{award.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gold-light text-xs font-semibold uppercase tracking-wider">
                      {award.title}
                    </p>
                    <p className="font-serif text-base font-bold text-ivory mt-0.5">
                      {award.winner?.display_name ?? 'N/A'}
                    </p>
                    <p className="text-ivory-dim text-xs mt-0.5">
                      {award.description} {award.value && `• ${award.value}`}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
        className="text-center py-6">
        <p className="text-ivory-dim/30 text-xs">The Evvies 2026 ✦ Thanks for playing</p>
      </motion.div>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useParticipant } from '../hooks/useParticipant'
import NomineeLabel from '../components/NomineeLabel'

export default function Leaderboard() {
  const {
    leaderboard, announcedCount, totalCategories, loading,
    filmWins, lastAnnounced, streaks, liveInsights,
    participants, predictions, results, categoriesWithNominees, nomineeMap,
  } = useLeaderboard()

  const { participant } = useParticipant()
  const navigate = useNavigate()
  const isAdmin = participant?.is_admin ?? false
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null)

  const streakMap = useMemo(
    () => new Map(streaks.map(s => [s.participantId, s])),
    [streaks]
  )

  const resultMap = useMemo(
    () => new Map(results.map(r => [r.category_id, r])),
    [results]
  )

  const lockedParticipants = useMemo(
    () => participants.filter(p => p.locked_at !== null),
    [participants]
  )

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="shimmer font-serif text-lg">Loading leaderboard...</span>
      </div>
    )
  }

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="flex-1 flex flex-col gap-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="font-serif text-2xl font-bold text-ivory mb-1">
          Live Leaderboard
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-charcoal rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-crimson to-gold rounded-full"
              animate={{ width: `${totalCategories > 0 ? (announcedCount / totalCategories) * 100 : 0}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <span className="text-ivory-dim text-xs font-medium shrink-0">
            {announcedCount} / {totalCategories}
          </span>
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate('/admin/results')}
            className="mt-2 w-full py-2.5 rounded-xl text-center font-semibold text-xs bg-gradient-to-r from-crimson-dim via-crimson to-crimson-dim text-ivory shadow-lg shadow-crimson/20 touch-target"
          >
            🎬 Log Winner →
          </button>
        )}
      </motion.div>

      {/* Just Announced Splash */}
      <AnimatePresence mode="wait">
        {lastAnnounced && (
          <motion.div
            key={lastAnnounced.categoryId}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative overflow-hidden rounded-2xl border border-crimson/30"
            style={{
              background: 'linear-gradient(135deg, rgba(139,0,0,0.15) 0%, rgba(30,30,30,0.9) 50%, rgba(139,0,0,0.1) 100%)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-crimson/5 via-transparent to-gold/5" />
            <div className="relative p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🏆</span>
                <p className="text-crimson-light text-xs uppercase tracking-widest font-bold">
                  Just Announced
                </p>
              </div>
              <p className="text-ivory-dim text-xs mb-0.5">{lastAnnounced.categoryName}</p>
              <p className="font-serif text-lg font-bold text-ivory leading-snug">
                {lastAnnounced.winnerLabel.split(',')[0]}
              </p>
              {/* Who got it right */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-charcoal-light/50">
                {lastAnnounced.correctParticipantIds.length > 0 ? (
                  <>
                    <div className="flex -space-x-1.5">
                      {lastAnnounced.correctParticipantIds.map(pid => {
                        const p = participants.find(pp => pp.id === pid)
                        if (!p) return null
                        return (
                          <div
                            key={pid}
                            className="w-6 h-6 rounded-full border-2 border-charcoal bg-gradient-to-br from-charcoal to-velvet flex items-center justify-center"
                            title={p.display_name}
                          >
                            <span className="text-[8px] font-bold text-gold">
                              {getInitials(p.display_name)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    <span className="text-ivory-dim text-xs">
                      {lastAnnounced.correctParticipantIds.length} of {lockedParticipants.length} got it ✓
                    </span>
                  </>
                ) : (
                  <span className="text-crimson-light text-xs font-medium">
                    Nobody called it! 😱
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard Rankings */}
      {leaderboard.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-ivory-dim text-sm">No ballots locked yet</p>
        </div>
      ) : (
        <LayoutGroup>
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {leaderboard.map((entry) => {
                const rankDelta = entry.previousRank !== undefined
                  ? entry.previousRank - entry.rank
                  : 0
                const streak = streakMap.get(entry.participant.id)
                const isExpanded = expandedPlayerId === entry.participant.id

                return (
                  <motion.div
                    key={entry.participant.id}
                    layoutId={entry.participant.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{
                      layout: { type: 'spring', stiffness: 300, damping: 30 },
                      duration: 0.3,
                    }}
                  >
                    {/* Main Row */}
                    <button
                      onClick={() => setExpandedPlayerId(isExpanded ? null : entry.participant.id)}
                      className={`w-full glass-card p-4 flex items-center gap-3 text-left transition-all ${
                        entry.rank === 1 ? 'gold-glow' : ''
                      } ${isExpanded ? 'rounded-b-none border-b-0' : ''}`}
                    >
                      {/* Rank */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        entry.rank === 1
                          ? 'bg-gradient-to-br from-gold to-gold-dim text-velvet'
                          : entry.rank === 2
                            ? 'bg-charcoal-light text-ivory border border-ivory-dim/20'
                            : entry.rank === 3
                              ? 'bg-charcoal-light text-bronze border border-bronze/20'
                              : 'bg-charcoal text-ivory-dim'
                      }`}>
                        {entry.rank}
                      </div>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-charcoal-light flex items-center justify-center text-lg shrink-0 border border-charcoal-light">
                        {entry.participant.photo_url ? (
                          <img
                            src={entry.participant.photo_url}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span>{entry.participant.display_name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>

                      {/* Name + Stats + Streak */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-ivory font-medium text-sm truncate">
                            {entry.participant.display_name}
                          </p>
                          {streak?.isHot && (
                            <span className="text-xs" title={`${streak.currentStreak} in a row!`}>🔥</span>
                          )}
                          {streak?.isCold && (
                            <span className="text-xs" title="Cold streak">🧊</span>
                          )}
                        </div>
                        <p className="text-ivory-dim text-xs">
                          {entry.categoriesCorrect} correct
                          {streak?.isHot && (
                            <span className="text-crimson-light ml-1.5 font-medium">
                              {streak.currentStreak} streak
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Score + Rank Change */}
                      <div className="text-right shrink-0">
                        <motion.p
                          key={entry.totalScore}
                          initial={{ scale: 1.3, color: '#e8c76a' }}
                          animate={{ scale: 1, color: '#f5f0e8' }}
                          transition={{ duration: 0.5 }}
                          className="font-bold text-lg tabular-nums"
                        >
                          {entry.totalScore}
                        </motion.p>
                        {rankDelta !== 0 && (
                          <motion.span
                            initial={{ opacity: 0, y: rankDelta > 0 ? 5 : -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`text-xs font-medium ${
                              rankDelta > 0 ? 'text-green-400' : 'text-crimson-light'
                            }`}
                          >
                            {rankDelta > 0 ? `↑${rankDelta}` : `↓${Math.abs(rankDelta)}`}
                          </motion.span>
                        )}
                      </div>
                    </button>

                    {/* Expanded Ballot Card */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="glass-card rounded-t-none border-t-0 p-4 pt-2 space-y-1.5 max-h-64 overflow-y-auto">
                            {categoriesWithNominees.map(cat => {
                              const pred = predictions.find(
                                p => p.participant_id === entry.participant.id && p.category_id === cat.id
                              )
                              const result = resultMap.get(cat.id)
                              const pickedNominee = pred ? nomineeMap.get(pred.nominee_id) : null

                              let status: 'correct' | 'wrong' | 'pending' = 'pending'
                              if (result && pred) {
                                status = result.winning_nominee_id === pred.nominee_id ? 'correct' : 'wrong'
                              }

                              return (
                                <div
                                  key={cat.id}
                                  className="flex items-center gap-2 py-1 text-xs"
                                >
                                  <span className={`shrink-0 ${
                                    status === 'correct' ? 'text-green-400' :
                                    status === 'wrong' ? 'text-crimson-light' :
                                    'text-ivory-dim/30'
                                  }`}>
                                    {status === 'correct' ? '✅' : status === 'wrong' ? '❌' : '⏳'}
                                  </span>
                                  <span className="text-ivory-dim truncate flex-1">
                                    {cat.name}
                                  </span>
                                  <span className={`truncate max-w-[140px] text-right ${
                                    status === 'correct' ? 'text-gold font-medium' :
                                    status === 'wrong' ? 'text-ivory-dim/50 line-through' :
                                    'text-ivory-dim/70'
                                  }`}>
                                    {pickedNominee ? pickedNominee.label.split(',')[0].replace(/"/g, '').trim() : '—'}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      )}

      {/* Awards Race Bar Chart */}
      {filmWins.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-serif text-base font-bold text-ivory mb-3 flex items-center gap-2">
            <span>🎬</span> Awards Race
          </h3>
          <div className="glass-card p-4 space-y-2.5">
            {filmWins.slice(0, 8).map((fw, idx) => {
              const maxWins = filmWins[0].wins
              const pct = (fw.wins / maxWins) * 100
              return (
                <div key={fw.film}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`font-medium truncate mr-2 ${idx === 0 ? 'text-gold-light' : 'text-ivory'}`}>
                      {fw.film}
                    </span>
                    <span className={`font-bold tabular-nums shrink-0 ${idx === 0 ? 'text-gold' : 'text-ivory-dim'}`}>
                      {fw.wins}
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
                      transition={{ duration: 0.6, delay: idx * 0.05 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Live Insight Cards */}
      {liveInsights && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-2.5"
        >
          {/* Biggest Upset */}
          {liveInsights.biggestUpset && (
            <div className="glass-card p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-base">😱</span>
                <p className="text-crimson-light text-[10px] uppercase tracking-wider font-bold">Biggest Upset</p>
              </div>
              <p className="font-serif text-xs font-bold text-ivory leading-snug">
                {liveInsights.biggestUpset.category}
              </p>
              <p className="text-ivory-dim text-[10px] mt-0.5">
                Only {liveInsights.biggestUpset.correctCount} of {liveInsights.biggestUpset.total} called it
              </p>
            </div>
          )}

          {/* Safest Pick */}
          {liveInsights.safestPick && (
            <div className="glass-card p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-base">🎯</span>
                <p className="text-gold-dim text-[10px] uppercase tracking-wider font-bold">Safest Pick</p>
              </div>
              <p className="font-serif text-xs font-bold text-ivory leading-snug">
                {liveInsights.safestPick.category}
              </p>
              <p className="text-ivory-dim text-[10px] mt-0.5">
                {liveInsights.safestPick.correctCount} of {liveInsights.safestPick.total} nailed it
              </p>
            </div>
          )}

          {/* Points Still in Play */}
          <div className="glass-card p-3.5 col-span-2"
            style={{
              background: 'linear-gradient(135deg, rgba(139,0,0,0.08) 0%, rgba(30,30,30,0.9) 100%)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base">⚡</span>
                <p className="text-crimson-light text-[10px] uppercase tracking-wider font-bold">Points in Play</p>
              </div>
              <p className="font-serif text-xl font-bold text-ivory tabular-nums">
                {liveInsights.pointsRemaining}
                <span className="text-ivory-dim text-xs font-normal ml-1">
                  of {liveInsights.totalPossible}
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Pre-results spacer */}
      {announcedCount === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-8"
        >
          <p className="text-ivory-dim/40 text-sm font-serif">
            Waiting for the first winner to be announced...
          </p>
          <p className="text-ivory-dim/25 text-xs mt-1">
            The admin enters results at /admin/results
          </p>
        </motion.div>
      )}
    </div>
  )
}

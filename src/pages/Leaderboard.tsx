import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { useLeaderboard } from '../hooks/useLeaderboard'

export default function Leaderboard() {
  const { leaderboard, announcedCount, totalCategories, loading } = useLeaderboard()

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="shimmer font-serif text-lg">Loading leaderboard...</span>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
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
      </motion.div>

      {/* Leaderboard */}
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
                    className={`glass-card p-4 flex items-center gap-3 ${
                      entry.rank === 1 ? 'gold-glow' : ''
                    }`}
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

                    {/* Name + Stats */}
                    <div className="flex-1 min-w-0">
                      <p className="text-ivory font-medium text-sm truncate">
                        {entry.participant.display_name}
                      </p>
                      <p className="text-ivory-dim text-xs">
                        {entry.categoriesCorrect} correct
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
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      )}
    </div>
  )
}

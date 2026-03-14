import { motion } from 'framer-motion'
import { useInsights } from '../hooks/useInsights'

export default function Insights() {
  const { insights, loading, participantCount } = useInsights()

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="shimmer font-serif text-lg">Loading insights...</span>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="font-serif text-2xl font-bold text-ivory mb-1">
          The Room Before the Show
        </h2>
        <p className="text-ivory-dim text-sm">
          {participantCount} ballot{participantCount !== 1 ? 's' : ''} locked in
        </p>
      </motion.div>

      {insights.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-ivory-dim text-sm text-center">
            Waiting for more ballots to generate insights...
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              className="glass-card p-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{stat.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-ivory-dim text-xs uppercase tracking-wider mb-0.5">
                    {stat.label}
                  </p>
                  <p className="font-serif text-lg font-bold text-ivory leading-snug">
                    {stat.value}
                  </p>
                  {stat.sublabel && (
                    <p className="text-gold-dim text-xs mt-0.5">
                      {stat.sublabel}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Waiting message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-auto pt-6 text-center"
      >
        <p className="text-ivory-dim/40 text-xs">
          The show hasn't started yet. When it does,<br />
          this screen will become the live leaderboard.
        </p>
      </motion.div>
    </div>
  )
}

import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInsights } from '../hooks/useInsights'
import { useCategories } from '../hooks/useCategories'
import { useParticipant } from '../hooks/useParticipant'
import { supabase } from '../lib/supabase'
import NomineeLabel from '../components/NomineeLabel'

export default function Insights() {
  const { insights, loading, participantCount, lockedParticipants, allPredictions } = useInsights()
  const { categoriesWithNominees: categories } = useCategories()
  const { participant } = useParticipant()
  const navigate = useNavigate()

  const isAdmin = participant?.is_admin ?? false
  const lockedCount = lockedParticipants.length
  const [showConfirm, setShowConfirm] = useState(false)
  const [starting, setStarting] = useState(false)

  const handleStartShow = async () => {
    setStarting(true)
    await supabase
      .from('settings')
      .update({ value: JSON.stringify('live'), updated_at: new Date().toISOString() })
      .eq('key', 'app_phase')
    // The route guard will redirect to /leaderboard
    navigate('/leaderboard')
  }
  // Build a lookup: categoryId -> nomineeId -> list of participants who picked it
  const breakdown = useMemo(() => {
    const participantMap = new Map(lockedParticipants.map(p => [p.id, p]))
    const result = new Map<string, Map<string, typeof lockedParticipants>>()

    for (const pred of allPredictions) {
      const participant = participantMap.get(pred.participant_id)
      if (!participant) continue // skip unlocked participants

      if (!result.has(pred.category_id)) {
        result.set(pred.category_id, new Map())
      }
      const catMap = result.get(pred.category_id)!
      if (!catMap.has(pred.nominee_id)) {
        catMap.set(pred.nominee_id, [])
      }
      catMap.get(pred.nominee_id)!.push(participant)
    }
    return result
  }, [allPredictions, lockedParticipants])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="shimmer font-serif text-lg">Loading insights...</span>
      </div>
    )
  }

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="flex-1 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h2 className="font-serif text-2xl font-bold text-ivory mb-1">
          The Pre-Show
        </h2>
        <p className="text-ivory-dim text-sm">
          {participantCount} ballot{participantCount !== 1 ? 's' : ''} locked in
        </p>
      </motion.div>

      {/* Participant Cards */}
      {lockedParticipants.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 -mx-5 px-5"
        >
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {lockedParticipants.map((p, idx) => {
              const initials = getInitials(p.display_name)
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + idx * 0.1, type: 'spring', stiffness: 300 }}
                  className="flex flex-col items-center gap-1.5 shrink-0"
                >
                  <div className="w-14 h-14 rounded-full border-2 border-gold/50 bg-gradient-to-br from-charcoal to-velvet flex items-center justify-center overflow-hidden shadow-lg shadow-gold/10">
                    {p.photo_url ? (
                      <img
                        src={p.photo_url}
                        alt={p.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-serif text-base font-bold text-gold">
                        {initials}
                      </span>
                    )}
                  </div>
                  <span className="text-ivory-dim text-[11px] font-medium text-center leading-tight max-w-16 truncate">
                    {p.display_name}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Insight Stats */}
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

      {/* Category-by-Category Breakdown */}
      {categories.length > 0 && lockedParticipants.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <h3 className="font-serif text-lg font-bold text-ivory mb-4 flex items-center gap-2">
            <span className="text-gold">📋</span> How Everyone Voted
          </h3>
          <div className="space-y-4">
            {categories.map(cat => {
              const catVotes = breakdown.get(cat.id)
              if (!catVotes) return null

              return (
                <div key={cat.id} className="glass-card p-4">
                  {/* Category header */}
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-serif text-sm font-bold text-ivory">
                      {cat.name}
                    </h4>
                    <span className="text-gold-dim text-xs font-medium">
                      {cat.point_value} pts
                    </span>
                  </div>

                  {/* Nominees with voters */}
                  <div className="space-y-2">
                    {cat.nominees.map(nom => {
                      const voters = catVotes.get(nom.id) ?? []
                      if (voters.length === 0) return null

                      return (
                        <div
                          key={nom.id}
                          className="flex items-center justify-between gap-2 py-1.5 border-t border-charcoal-light/50 first:border-t-0 first:pt-0"
                        >
                          <div className="flex-1 min-w-0">
                            <NomineeLabel
                              label={nom.label}
                              tags={cat.tags}
                              isSelected={false}
                            />
                          </div>
                          {/* Voter avatars */}
                          <div className="flex -space-x-1.5 shrink-0">
                            {voters.map(v => (
                              <div
                                key={v.id}
                                className="w-7 h-7 rounded-full border-2 border-velvet bg-gradient-to-br from-charcoal to-velvet flex items-center justify-center"
                                title={v.display_name}
                              >
                                {v.photo_url ? (
                                  <img
                                    src={v.photo_url}
                                    alt={v.display_name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[9px] font-bold text-gold">
                                    {getInitials(v.display_name)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Footer — Admin Start Show / Non-admin waiting */}
      {isAdmin ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-auto pt-6"
        >
          <div className="glass-card p-4 space-y-3">
            <p className="text-ivory-dim text-xs uppercase tracking-wider font-semibold">
              🎬 Host Controls
            </p>
            <div className="flex items-center justify-between">
              <span className="text-ivory text-sm">Ballots submitted</span>
              <span className={`text-sm font-bold ${
                lockedCount === participantCount && participantCount > 0
                  ? 'text-green-400' : 'text-gold'
              }`}>
                {lockedCount} of {participantCount}
                {lockedCount === participantCount && participantCount > 0 && ' ✓'}
              </span>
            </div>
            {lockedCount < participantCount && (
              <p className="text-crimson-light text-xs">
                ⚠ {participantCount - lockedCount} {participantCount - lockedCount === 1 ? 'person hasn\'t' : 'people haven\'t'} submitted yet. Starting the show will lock everyone out.
              </p>
            )}

            {!showConfirm ? (
              <motion.button
                onClick={() => setShowConfirm(true)}
                className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-crimson-dim via-crimson to-crimson-dim text-ivory shadow-lg shadow-crimson/20 touch-target"
                whileTap={{ scale: 0.97 }}
              >
                Start the Show 🎬
              </motion.button>
            ) : (
              <div className="space-y-2">
                <p className="text-ivory text-sm text-center font-medium">
                  Are you sure? No new ballots can be submitted after this.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-medium bg-charcoal text-ivory-dim"
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleStartShow}
                    disabled={starting}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-crimson-dim via-crimson to-crimson-dim text-ivory"
                    whileTap={{ scale: 0.97 }}
                  >
                    {starting ? 'Starting...' : 'Confirm'}
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
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
      )}
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCategories } from '../hooks/useCategories'
import { usePredictions } from '../hooks/usePredictions'
import { useParticipant } from '../hooks/useParticipant'
import { UI_GROUP_LABELS } from '../lib/scoring'
import type { Participant } from '../lib/types'

interface BallotReviewProps {
  participant: Participant
}

export default function BallotReview({ participant }: BallotReviewProps) {
  const navigate = useNavigate()
  const { categoriesWithNominees } = useCategories()
  const { getPredictionForCategory, completedCount } = usePredictions(participant.id)
  const { updateParticipant } = useParticipant()
  const [showConfirm, setShowConfirm] = useState(false)
  const [locking, setLocking] = useState(false)
  const [locked, setLocked] = useState(false)

  const allComplete = completedCount >= 24

  // Group by ui_group
  const groups = categoriesWithNominees.reduce((acc, cat) => {
    if (!acc[cat.ui_group]) acc[cat.ui_group] = []
    acc[cat.ui_group].push(cat)
    return acc
  }, {} as Record<string, typeof categoriesWithNominees>)

  const groupOrder = ['marquee', 'craft_music', 'feature_races', 'shorts']

  const handleLock = async () => {
    setLocking(true)
    const now = new Date().toISOString()
    const success = await updateParticipant({
      locked_at: now,
      ballot_completed_at: now,
    })
    if (success) {
      setLocked(true)
      setTimeout(() => {
        navigate('/insights')
      }, 2500)
    }
    setLocking(false)
  }

  // Lock animation screen
  if (locked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mb-6"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center shadow-2xl shadow-gold/30">
            <svg className="w-12 h-12 text-velvet" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="font-serif text-2xl font-bold text-gold-light mb-2"
        >
          Ballot Locked
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-ivory-dim text-sm"
        >
          Official Entry Recorded ✦
        </motion.p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="font-serif text-2xl font-bold text-ivory mb-1">Review Your Ballot</h2>
        <p className="text-ivory-dim text-sm mb-4">
          {completedCount} of 24 categories selected
        </p>
      </motion.div>

      {/* Scrollable picks */}
      <div className="flex-1 overflow-y-auto space-y-5 pb-4 -mx-1 px-1">
        {groupOrder.map(group => {
          const cats = groups[group]
          if (!cats) return null
          return (
            <div key={group}>
              <h3 className="text-xs uppercase tracking-widest text-gold-dim font-semibold mb-2">
                {UI_GROUP_LABELS[group]}
              </h3>
              <div className="space-y-1.5">
                {cats.map(cat => {
                  const selectedId = getPredictionForCategory(cat.id)
                  const selectedNominee = cat.nominees.find(n => n.id === selectedId)
                  return (
                    <motion.button
                      key={cat.id}
                      onClick={() => navigate(`/ballot/${cat.slug}`)}
                      className="w-full glass-card p-3 flex items-center justify-between text-left"
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-ivory text-sm font-medium truncate">{cat.name}</p>
                        <p className={`text-xs truncate mt-0.5 ${selectedNominee ? 'text-gold' : 'text-crimson-light'}`}>
                          {selectedNominee ? selectedNominee.label : 'No selection'}
                        </p>
                      </div>
                      <div className="text-ivory-dim/30 ml-2 shrink-0">
                        <span className="text-xs font-bold text-gold-dim">{cat.point_value}</span>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Lock Button */}
      <div className="bottom-bar pt-3">
        {!allComplete && (
          <p className="text-crimson-light text-xs text-center mb-2">
            Complete all 24 categories before locking
          </p>
        )}
        <motion.button
          onClick={() => setShowConfirm(true)}
          disabled={!allComplete}
          className={`w-full py-4 rounded-xl font-semibold text-base touch-target transition-all ${
            allComplete
              ? 'bg-gradient-to-r from-gold-dim via-gold to-gold-dim text-velvet shadow-lg shadow-gold/20'
              : 'bg-charcoal text-ivory-dim/40 cursor-not-allowed'
          }`}
          whileTap={allComplete ? { scale: 0.97 } : {}}
        >
          🔒 Lock Ballot
        </motion.button>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-velvet/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card gold-glow p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-serif text-xl font-bold text-gold-light mb-3 text-center">
                Lock Your Predictions?
              </h3>
              <p className="text-ivory-dim text-sm text-center mb-6">
                Once locked, your Evvies ballot cannot be changed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-charcoal text-ivory text-sm font-medium border border-charcoal-light"
                >
                  Go Back
                </button>
                <button
                  onClick={() => { setShowConfirm(false); handleLock() }}
                  disabled={locking}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-gold-dim via-gold to-gold-dim text-velvet text-sm font-bold shadow-lg shadow-gold/20"
                >
                  {locking ? 'Locking...' : 'Lock It In'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

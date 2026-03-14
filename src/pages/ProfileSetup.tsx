import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useParticipant } from '../hooks/useParticipant'
import { useCategories } from '../hooks/useCategories'

export default function ProfileSetup() {
  const navigate = useNavigate()
  const { createParticipant, restoreByPin } = useParticipant()
  const { categories } = useCategories()
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showRestore, setShowRestore] = useState(false)
  const [restoreName, setRestoreName] = useState('')
  const [restorePin, setRestorePin] = useState('')
  const [restoreError, setRestoreError] = useState(false)

  const canSubmit = name.trim().length >= 2

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)

    const participant = await createParticipant(
      name.trim(),
      null,
      pin.trim() || null,
    )

    if (participant) {
      const slug = categories[0]?.slug ?? 'best-picture'
      // Use window.location to avoid React re-render swallowing the navigate
      window.location.href = `/ballot/${slug}`
    } else {
      setSubmitting(false)
    }
  }

  const handleRestore = async () => {
    if (!restoreName.trim() || !restorePin.trim()) return
    setRestoreError(false)
    const p = await restoreByPin(restoreName.trim(), restorePin.trim())
    if (p) {
      if (p.locked_at) {
        navigate('/insights')
      } else {
        navigate(`/ballot/${categories[0]?.slug ?? 'best-picture'}`)
      }
    } else {
      setRestoreError(true)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center">
      {/* Hero Title */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <h1 className="font-serif text-5xl font-bold shimmer mb-3 leading-tight">
          The Evvies
        </h1>
        <p className="text-ivory-dim text-sm tracking-widest uppercase">
          The Evans Family Oscar Ballot 2026
        </p>
      </motion.div>

      {/* Profile Form */}
      <motion.div
        className="w-full max-w-sm space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {/* Name Input */}
        <div>
          <label className="block text-ivory-dim text-xs uppercase tracking-wider mb-2 font-medium">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-charcoal border border-charcoal-light rounded-xl px-4 py-3.5 text-ivory placeholder-ivory-dim/40 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-colors text-base"
            autoComplete="off"
            maxLength={30}
          />
        </div>

        {/* PIN Input */}
        <div>
          <label className="block text-ivory-dim text-xs uppercase tracking-wider mb-2 font-medium">
            Recovery PIN <span className="text-ivory-dim/40">(optional)</span>
          </label>
          <input
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="4-digit PIN"
            inputMode="numeric"
            className="w-full bg-charcoal border border-charcoal-light rounded-xl px-4 py-3.5 text-ivory placeholder-ivory-dim/40 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-colors text-base"
            maxLength={4}
          />
          <p className="text-ivory-dim/40 text-xs mt-1.5">
            Use this to recover your ballot on another device
          </p>
        </div>

        {/* Submit Button */}
        <motion.button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={`w-full py-4 rounded-xl font-semibold text-base tracking-wide transition-all touch-target ${
            canSubmit
              ? 'bg-gradient-to-r from-gold-dim via-gold to-gold-dim text-velvet shadow-lg shadow-gold/20'
              : 'bg-charcoal text-ivory-dim/40 cursor-not-allowed'
          }`}
          whileTap={canSubmit ? { scale: 0.97 } : {}}
        >
          {submitting ? (
            <span className="shimmer">Creating Profile...</span>
          ) : (
            'Enter the Ballot →'
          )}
        </motion.button>

        {/* Restore Link */}
        <div className="text-center pt-2">
          <button
            onClick={() => setShowRestore(!showRestore)}
            className="text-ivory-dim/50 text-xs underline underline-offset-2"
          >
            Returning on a new device?
          </button>
        </div>

        {/* Restore Form */}
        <AnimatePresence>
          {showRestore && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-3"
            >
              <div className="glass-card p-4 space-y-3">
                <p className="text-ivory-dim text-xs">Enter your name and PIN to restore your ballot.</p>
                <input
                  type="text"
                  value={restoreName}
                  onChange={(e) => setRestoreName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-velvet border border-charcoal-light rounded-lg px-3 py-2.5 text-ivory text-sm placeholder-ivory-dim/40 focus:outline-none focus:border-gold/50"
                />
                <input
                  type="text"
                  value={restorePin}
                  onChange={(e) => setRestorePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="4-digit PIN"
                  inputMode="numeric"
                  className="w-full bg-velvet border border-charcoal-light rounded-lg px-3 py-2.5 text-ivory text-sm placeholder-ivory-dim/40 focus:outline-none focus:border-gold/50"
                  maxLength={4}
                />
                {restoreError && (
                  <p className="text-crimson-light text-xs">No match found. Check your name and PIN.</p>
                )}
                <button
                  onClick={handleRestore}
                  className="w-full py-2.5 rounded-lg bg-charcoal-light text-ivory text-sm font-medium"
                >
                  Restore Ballot
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useSettings } from '../hooks/useSettings'
import type { AppPhase } from '../lib/types'

export default function AdminControl() {
  const { appPhase, predictionsLockAt } = useSettings()
  const [updating, setUpdating] = useState(false)

  const setPhase = async (phase: AppPhase) => {
    setUpdating(true)
    await supabase
      .from('settings')
      .update({ value: JSON.stringify(phase), updated_at: new Date().toISOString() })
      .eq('key', 'app_phase')
    setUpdating(false)
  }

  const phases: { phase: AppPhase; label: string; description: string; emoji: string }[] = [
    { phase: 'setup', label: 'Setup', description: 'Ballots open for editing', emoji: '📝' },
    { phase: 'locked', label: 'Locked', description: 'Ballots frozen, pre-show insights', emoji: '🔒' },
    { phase: 'live', label: 'Live', description: 'Ceremony in progress, leaderboard active', emoji: '🎬' },
    { phase: 'final', label: 'Final', description: 'Show complete, after party report', emoji: '🏆' },
  ]

  return (
    <div className="flex-1 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="font-serif text-2xl font-bold text-ivory mb-1">Admin Control</h2>
        <p className="text-ivory-dim text-sm mb-6">Manage the event phase</p>
      </motion.div>

      {/* Current Phase */}
      <div className="glass-card gold-glow p-4 mb-6">
        <p className="text-ivory-dim text-xs uppercase tracking-wider mb-1">Current Phase</p>
        <p className="font-serif text-xl font-bold text-gold-light capitalize">{appPhase}</p>
        {predictionsLockAt && (
          <p className="text-ivory-dim text-xs mt-1">
            Auto-lock: {new Date(predictionsLockAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Phase Buttons */}
      <div className="space-y-3">
        {phases.map(({ phase, label, description, emoji }) => {
          const isCurrent = appPhase === phase
          return (
            <motion.button
              key={phase}
              onClick={() => !isCurrent && setPhase(phase)}
              disabled={updating || isCurrent}
              className={`w-full p-4 rounded-xl text-left flex items-center gap-3 touch-target transition-all ${
                isCurrent
                  ? 'bg-gold/10 border border-gold/40'
                  : 'glass-card glass-card-hover'
              }`}
              whileTap={!isCurrent ? { scale: 0.98 } : {}}
            >
              <span className="text-2xl">{emoji}</span>
              <div className="flex-1">
                <p className={`font-medium text-sm ${isCurrent ? 'text-gold-light' : 'text-ivory'}`}>
                  {label}
                </p>
                <p className="text-ivory-dim text-xs">{description}</p>
              </div>
              {isCurrent && (
                <span className="text-gold text-xs font-semibold">Active</span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Quick Link to Results */}
      <div className="mt-6">
        <a
          href="/admin/results"
          className="block w-full py-4 rounded-xl text-center font-semibold text-sm bg-gradient-to-r from-crimson-dim via-crimson to-crimson-dim text-ivory shadow-lg shadow-crimson/20 touch-target"
        >
          Enter Winners →
        </a>
      </div>
    </div>
  )
}

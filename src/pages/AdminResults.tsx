import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useCategories } from '../hooks/useCategories'
import { useResults } from '../hooks/useResults'

export default function AdminResults() {
  const { categoriesWithNominees } = useCategories()
  const { results, setResult, announcedCount } = useResults()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const resultMap = new Map(results.map(r => [r.category_id, r]))
  const selectedCategory = categoriesWithNominees.find(c => c.id === selectedCategoryId)

  const handleSelectWinner = async (nomineeId: string) => {
    if (!selectedCategoryId) return
    setSaving(true)
    await setResult(selectedCategoryId, nomineeId)
    setSaving(false)
    setSelectedCategoryId(null)
  }

  return (
    <div className="flex-1 flex flex-col">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <button
          onClick={() => navigate('/leaderboard')}
          className="text-gold-dim text-xs font-medium mb-2 flex items-center gap-1"
        >
          ← Back to Leaderboard
        </button>
        <h2 className="font-serif text-2xl font-bold text-ivory mb-1">Enter Winners</h2>
        <p className="text-ivory-dim text-sm">{announcedCount} of {categoriesWithNominees.length} announced</p>
      </motion.div>
      <div className="h-1.5 bg-charcoal rounded-full overflow-hidden mb-4">
        <motion.div className="h-full bg-gradient-to-r from-crimson to-gold rounded-full"
          animate={{ width: `${categoriesWithNominees.length > 0 ? (announcedCount / categoriesWithNominees.length) * 100 : 0}%` }}
          transition={{ duration: 0.6 }} />
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pb-4">
        {categoriesWithNominees.map((cat, idx) => {
          const result = resultMap.get(cat.id)
          const winner = result ? cat.nominees.find(n => n.id === result.winning_nominee_id) : null
          return (
            <motion.button key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }} onClick={() => setSelectedCategoryId(cat.id)}
              className={`w-full p-3.5 rounded-xl text-left flex items-center gap-3 touch-target transition-all ${result ? 'bg-gold/5 border border-gold/20' : 'glass-card glass-card-hover'}`}
              whileTap={{ scale: 0.98 }}>
              <div className={`w-3 h-3 rounded-full shrink-0 ${result ? 'bg-gold' : 'bg-charcoal-light border border-ivory-dim/20'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-ivory text-sm font-medium truncate">{cat.name}</p>
                <p className={`text-xs truncate mt-0.5 ${winner ? 'text-gold' : 'text-ivory-dim/40'}`}>
                  {winner ? `🏆 ${winner.label}` : 'Pending'}
                </p>
              </div>
              <span className="text-gold-dim text-xs font-bold shrink-0">{cat.point_value}</span>
            </motion.button>
          )
        })}
      </div>
      <AnimatePresence>
        {selectedCategory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-velvet/85 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={() => setSelectedCategoryId(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-lg bg-charcoal rounded-t-2xl p-5 pb-[calc(20px+var(--safe-bottom))]"
              onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 bg-ivory-dim/20 rounded-full mx-auto mb-4" />
              <h3 className="font-serif text-lg font-bold text-ivory mb-1">{selectedCategory.name}</h3>
              <p className="text-ivory-dim text-xs mb-4">Select the actual winner • {selectedCategory.point_value} pts</p>
              <div className="space-y-2">
                {selectedCategory.nominees.map(nominee => {
                  const isCurrent = resultMap.get(selectedCategory.id)?.winning_nominee_id === nominee.id
                  return (
                    <button key={nominee.id} onClick={() => handleSelectWinner(nominee.id)} disabled={saving}
                      className={`w-full p-4 rounded-xl text-left text-sm font-medium touch-target transition-all ${isCurrent ? 'bg-gold/15 border border-gold/50 text-gold-light' : 'bg-velvet-light border border-charcoal-light text-ivory active:bg-charcoal-light'}`}>
                      {isCurrent && '🏆 '}{nominee.label}
                    </button>
                  )
                })}
              </div>
              <button onClick={() => setSelectedCategoryId(null)} className="w-full mt-4 py-3 rounded-xl bg-charcoal-light text-ivory-dim text-sm font-medium">Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

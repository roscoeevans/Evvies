import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCategories } from '../hooks/useCategories'
import { usePredictions } from '../hooks/usePredictions'
import { getTagColorClass, UI_GROUP_LABELS } from '../lib/scoring'
import NomineeLabel from '../components/NomineeLabel'
import type { Participant } from '../lib/types'

interface BallotProps {
  participant: Participant
}

export default function Ballot({ participant }: BallotProps) {
  const { categorySlug } = useParams<{ categorySlug: string }>()
  const navigate = useNavigate()
  const {
    getCategoryBySlug,
    getAdjacentSlugs,
    getCategoryIndex,
    totalCategories,
  } = useCategories()
  const {
    setPrediction,
    getPredictionForCategory,
    completedCount,
  } = usePredictions(participant.id)

  const category = getCategoryBySlug(categorySlug ?? '')
  const { prev, next } = getAdjacentSlugs(categorySlug ?? '')
  const categoryIndex = getCategoryIndex(categorySlug ?? '')
  const selectedNomineeId = category ? getPredictionForCategory(category.id) : null

  if (!category) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-ivory-dim">Category not found</p>
      </div>
    )
  }

  const handleSelect = async (nomineeId: string) => {
    await setPrediction(category.id, nomineeId)
  }

  const handleNext = () => {
    if (next) {
      navigate(`/ballot/${next}`)
    } else {
      navigate('/ballot/review')
    }
  }

  const handlePrev = () => {
    if (prev) {
      navigate(`/ballot/${prev}`)
    }
  }

  // Point badge size based on importance tier
  const pointBadgeClass = category.importance_tier === 1
    ? 'text-2xl px-4 py-2'
    : category.importance_tier === 2
      ? 'text-lg px-3 py-1.5'
      : 'text-sm px-2.5 py-1'

  return (
    <div className="flex-1 flex flex-col">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-ivory-dim text-xs font-medium">
            {categoryIndex} of {totalCategories}
          </span>
          <span className="text-ivory-dim text-xs">
            {completedCount} picked
          </span>
        </div>
        <div className="h-1 bg-charcoal rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-gold-dim to-gold rounded-full"
            initial={false}
            animate={{ width: `${(categoryIndex / totalCategories) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Category Header */}
      <AnimatePresence mode="wait">
        <motion.div
          key={category.slug}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col"
        >
          {/* UI Group Label */}
          <p className="text-ivory-dim/50 text-xs uppercase tracking-widest mb-1">
            {UI_GROUP_LABELS[category.ui_group] ?? category.ui_group}
          </p>

          {/* Category Name + Points */}
          <div className="flex items-start justify-between mb-2">
            <h2 className="font-serif text-2xl font-bold text-ivory leading-tight flex-1 pr-3">
              {category.name}
            </h2>
            <div className={`bg-gradient-to-br from-gold/20 to-gold-dim/10 border border-gold/30 rounded-xl font-bold text-gold-light shrink-0 ${pointBadgeClass}`}>
              {category.point_value}
              <span className="text-gold-dim text-[0.6em] ml-0.5">pts</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {category.tags.map(tag => (
              <span
                key={tag}
                className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ${getTagColorClass(tag)}`}
              >
                {tag.replace('_', ' ')}
              </span>
            ))}
          </div>

          {/* Nominees */}
          <div className="space-y-2.5 flex-1">
            {category.nominees.map((nominee, idx) => {
              const isSelected = selectedNomineeId === nominee.id
              return (
                <motion.button
                  key={nominee.id}
                  onClick={() => handleSelect(nominee.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all touch-target ${
                    isSelected
                      ? 'bg-gold/10 border-gold/50 gold-glow'
                      : 'glass-card glass-card-hover border-transparent'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'border-gold bg-gold' : 'border-charcoal-light'
                    }`}>
                      {isSelected && (
                        <motion.svg
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-3 h-3 text-velvet"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </motion.svg>
                      )}
                    </div>
                    <NomineeLabel
                      label={nominee.label}
                      tags={category.tags}
                      isSelected={isSelected}
                    />
                  </div>
                </motion.button>
              )
            })}
          </div>


        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 mt-4 bottom-bar pt-3">
        <button
          onClick={handlePrev}
          disabled={!prev}
          className={`flex-1 py-3.5 rounded-xl text-sm font-medium touch-target transition-colors ${
            prev
              ? 'bg-charcoal text-ivory border border-charcoal-light active:bg-charcoal-light'
              : 'bg-charcoal/50 text-ivory-dim/30 cursor-not-allowed'
          }`}
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="flex-1 py-3.5 rounded-xl text-sm font-semibold touch-target bg-gradient-to-r from-gold-dim via-gold to-gold-dim text-velvet shadow-lg shadow-gold/15 active:shadow-gold/5"
        >
          {next ? 'Next →' : 'Review Ballot →'}
        </button>
      </div>
    </div>
  )
}

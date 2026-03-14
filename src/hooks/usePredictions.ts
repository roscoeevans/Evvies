import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Prediction } from '../lib/types'

export function usePredictions(participantId: string | null) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!participantId) {
      setLoading(false)
      return
    }

    const fetchPredictions = async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('participant_id', participantId)

      if (!error && data) {
        setPredictions(data as Prediction[])
      }
      setLoading(false)
    }
    fetchPredictions()
  }, [participantId])

  const setPrediction = useCallback(async (
    categoryId: string,
    nomineeId: string
  ): Promise<boolean> => {
    if (!participantId) return false
    setSaving(true)

    const existing = predictions.find(p => p.category_id === categoryId)

    if (existing) {
      // Update
      const { data, error } = await supabase
        .from('predictions')
        .update({
          nominee_id: nomineeId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (!error && data) {
        setPredictions(prev =>
          prev.map(p => p.id === existing.id ? (data as Prediction) : p)
        )
      }
      setSaving(false)
      return !error
    } else {
      // Insert
      const { data, error } = await supabase
        .from('predictions')
        .insert({
          participant_id: participantId,
          category_id: categoryId,
          nominee_id: nomineeId,
        })
        .select()
        .single()

      if (!error && data) {
        setPredictions(prev => [...prev, data as Prediction])
      }
      setSaving(false)
      return !error
    }
  }, [participantId, predictions])

  const getPredictionForCategory = useCallback((categoryId: string): string | null => {
    const pred = predictions.find(p => p.category_id === categoryId)
    return pred?.nominee_id ?? null
  }, [predictions])

  // Find the first category without a prediction
  const getFirstIncompleteCategoryIndex = useCallback((
    categoryIds: string[]
  ): number => {
    for (let i = 0; i < categoryIds.length; i++) {
      if (!predictions.find(p => p.category_id === categoryIds[i])) {
        return i
      }
    }
    return categoryIds.length // All complete
  }, [predictions])

  return {
    predictions,
    loading,
    saving,
    setPrediction,
    getPredictionForCategory,
    getFirstIncompleteCategoryIndex,
    completedCount: predictions.length,
  }
}

// Hook for ALL predictions (for insights/leaderboard)
export function useAllPredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')

      if (!error && data) {
        setPredictions(data as Prediction[])
      }
      setLoading(false)
    }
    fetchAll()

    // Realtime subscription for predictions
    const channel = supabase
      .channel('all-predictions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'predictions' },
        () => {
          // Refetch all on any change
          fetchAll()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { predictions, loading }
}

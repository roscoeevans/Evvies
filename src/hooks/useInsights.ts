import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Prediction, InsightStat } from '../lib/types'
import { useCategories } from './useCategories'
import { computeInsights } from '../lib/scoring'

export function useInsights() {
  const { categories, nominees } = useCategories()
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([])
  const [participantCount, setParticipantCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [predResult, partResult] = await Promise.all([
        supabase.from('predictions').select('*'),
        supabase.from('participants').select('id').not('locked_at', 'is', null),
      ])

      if (predResult.data) setAllPredictions(predResult.data as Prediction[])
      if (partResult.data) setParticipantCount(partResult.data.length)
      setLoading(false)
    }
    fetchData()
  }, [])

  const insights: InsightStat[] = categories.length > 0
    ? computeInsights(allPredictions, categories, nominees, participantCount)
    : []

  return { insights, loading, participantCount }
}

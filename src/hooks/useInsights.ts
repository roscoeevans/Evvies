import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Prediction, InsightStat } from '../lib/types'
import { useCategories } from './useCategories'
import { computeInsights } from '../lib/scoring'

export interface LockedParticipant {
  id: string
  display_name: string
  photo_url: string | null
}

export function useInsights() {
  const { categories, nominees } = useCategories()
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([])
  const [participantCount, setParticipantCount] = useState(0)
  const [lockedParticipants, setLockedParticipants] = useState<LockedParticipant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [predResult, partResult] = await Promise.all([
        supabase.from('predictions').select('*'),
        supabase.from('participants').select('id, display_name, photo_url').not('locked_at', 'is', null),
      ])

      if (predResult.data) setAllPredictions(predResult.data as Prediction[])
      if (partResult.data) {
        setParticipantCount(partResult.data.length)
        setLockedParticipants(partResult.data as LockedParticipant[])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const insights: InsightStat[] = categories.length > 0
    ? computeInsights(allPredictions, categories, nominees, participantCount)
    : []

  return { insights, loading, participantCount, lockedParticipants, allPredictions }
}

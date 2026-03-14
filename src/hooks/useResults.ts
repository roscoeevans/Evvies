import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Result } from '../lib/types'

export function useResults() {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      const { data, error } = await supabase
        .from('results')
        .select('*')

      if (!error && data) {
        setResults(data as Result[])
      }
      setLoading(false)
    }
    fetchResults()

    // Realtime subscription for live updates
    const channel = supabase
      .channel('results-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'results' },
        (payload) => {
          setResults(prev => [...prev, payload.new as Result])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'results' },
        (payload) => {
          setResults(prev =>
            prev.map(r => r.id === (payload.new as Result).id ? (payload.new as Result) : r)
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'results' },
        (payload) => {
          setResults(prev => prev.filter(r => r.id !== (payload.old as Result).id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const setResult = useCallback(async (
    categoryId: string,
    winningNomineeId: string
  ): Promise<boolean> => {
    const existing = results.find(r => r.category_id === categoryId)

    if (existing) {
      const { error } = await supabase
        .from('results')
        .update({
          winning_nominee_id: winningNomineeId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      return !error
    } else {
      const { error } = await supabase
        .from('results')
        .insert({
          category_id: categoryId,
          winning_nominee_id: winningNomineeId,
        })

      return !error
    }
  }, [results])

  const removeResult = useCallback(async (categoryId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('results')
      .delete()
      .eq('category_id', categoryId)

    return !error
  }, [])

  return {
    results,
    loading,
    setResult,
    removeResult,
    announcedCount: results.length,
  }
}

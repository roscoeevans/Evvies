import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { AppPhase } from '../lib/types'

interface Settings {
  appPhase: AppPhase
  predictionsLockAt: string | null
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({
    appPhase: 'setup',
    predictionsLockAt: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial fetch
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')

      if (!error && data) {
        const map: Record<string, string> = {}
        for (const row of data) {
          map[row.key] = row.value
        }
        setSettings({
          appPhase: (JSON.parse(map['app_phase'] ?? '"setup"')) as AppPhase,
          predictionsLockAt: map['predictions_lock_at']
            ? JSON.parse(map['predictions_lock_at'])
            : null,
        })
      }
      setLoading(false)
    }
    fetchSettings()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('settings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        (payload) => {
          const row = payload.new as { key: string; value: string }
          if (row.key === 'app_phase') {
            setSettings(prev => ({
              ...prev,
              appPhase: JSON.parse(row.value) as AppPhase,
            }))
          }
          if (row.key === 'predictions_lock_at') {
            setSettings(prev => ({
              ...prev,
              predictionsLockAt: JSON.parse(row.value),
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Check if predictions are currently locked (by time)
  const isPredictionTimeLocked = settings.predictionsLockAt
    ? new Date() >= new Date(settings.predictionsLockAt)
    : false

  const isLocked = settings.appPhase !== 'setup' || isPredictionTimeLocked

  return {
    ...settings,
    loading,
    isPredictionTimeLocked,
    isLocked,
  }
}

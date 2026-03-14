import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Participant } from '../lib/types'
import { v4 as uuidv4 } from 'uuid'

const SESSION_TOKEN_KEY = 'evvies_session_token'
const PARTICIPANT_ID_KEY = 'evvies_participant_id'

function generateSessionToken(): string {
  return crypto.randomUUID?.() ?? uuidv4()
}

export function useParticipant() {
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem(SESSION_TOKEN_KEY)
      if (!token) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('session_token', token)
        .single()

      if (!error && data) {
        setParticipant(data as Participant)
      } else {
        // Token invalid, clear it
        localStorage.removeItem(SESSION_TOKEN_KEY)
        localStorage.removeItem(PARTICIPANT_ID_KEY)
      }
      setLoading(false)
    }
    restore()
  }, [])

  const createParticipant = useCallback(async (
    displayName: string,
    photoUrl?: string | null,
    pin?: string | null,
    isAdmin?: boolean
  ): Promise<Participant | null> => {
    const sessionToken = generateSessionToken()

    const { data, error } = await supabase
      .from('participants')
      .insert({
        display_name: displayName,
        photo_url: photoUrl ?? null,
        pin: pin ?? null,
        session_token: sessionToken,
        is_admin: isAdmin ?? false,
        ballot_completed_at: null,
        locked_at: null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating participant:', error)
      return null
    }

    const p = data as Participant
    localStorage.setItem(SESSION_TOKEN_KEY, sessionToken)
    localStorage.setItem(PARTICIPANT_ID_KEY, p.id)
    setParticipant(p)
    return p
  }, [])

  const updateParticipant = useCallback(async (
    updates: Partial<Pick<Participant, 'display_name' | 'photo_url' | 'pin' | 'ballot_completed_at' | 'locked_at'>>
  ): Promise<boolean> => {
    if (!participant) return false

    const { data, error } = await supabase
      .from('participants')
      .update(updates)
      .eq('id', participant.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating participant:', error)
      return false
    }

    setParticipant(data as Participant)
    return true
  }, [participant])

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_TOKEN_KEY)
    localStorage.removeItem(PARTICIPANT_ID_KEY)
    setParticipant(null)
  }, [])

  const restoreByPin = useCallback(async (
    name: string,
    pin: string
  ): Promise<Participant | null> => {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('display_name', name)
      .eq('pin', pin)
      .single()

    if (error || !data) return null

    const p = data as Participant
    localStorage.setItem(SESSION_TOKEN_KEY, p.session_token)
    localStorage.setItem(PARTICIPANT_ID_KEY, p.id)
    setParticipant(p)
    return p
  }, [])

  return {
    participant,
    loading,
    createParticipant,
    updateParticipant,
    clearSession,
    restoreByPin,
    sessionToken: localStorage.getItem(SESSION_TOKEN_KEY),
  }
}

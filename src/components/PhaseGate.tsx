import { Navigate } from 'react-router-dom'
import type { AppPhase, Participant } from '../lib/types'
import { getParticipantProgress } from '../lib/scoring'

interface PhaseGateProps {
  appPhase: AppPhase
  participant: Participant | null
  predictionCount: number
  isAdmin?: boolean
  categories?: { slug: string; id: string }[]
  children: React.ReactNode
  /** The type of page trying to render */
  page: 'profile' | 'ballot' | 'review' | 'insights' | 'leaderboard' | 'report' | 'admin' | 'admin-results'
}

export default function PhaseGate({
  appPhase,
  participant,
  predictionCount,
  isAdmin,
  categories = [],
  children,
  page,
}: PhaseGateProps) {
  const progress = getParticipantProgress(participant, predictionCount)

  // Admin pages always accessible to admins
  if ((page === 'admin' || page === 'admin-results') && isAdmin) {
    return <>{children}</>
  }

  // Final phase: everyone goes to report
  if (appPhase === 'final' && page !== 'report' && page !== 'admin' && page !== 'admin-results') {
    return <Navigate to="/report" replace />
  }

  // Live phase: everyone goes to leaderboard (except admin)
  if (appPhase === 'live' && page !== 'leaderboard' && page !== 'admin' && page !== 'admin-results') {
    return <Navigate to="/leaderboard" replace />
  }

  // Locked phase: submitted users see insights, others get locked out
  if (appPhase === 'locked') {
    if (page === 'insights' && progress === 'submitted') return <>{children}</>
    if (page === 'insights' && progress !== 'submitted') return <Navigate to="/" replace />
    if (page !== 'insights' && page !== 'admin' && page !== 'admin-results') {
      if (progress === 'submitted') return <Navigate to="/insights" replace />
      return <Navigate to="/" replace />
    }
  }

  // Setup phase routing
  if (appPhase === 'setup') {
    switch (page) {
      case 'profile':
        // If already has participant with predictions, go to ballot
        if (progress === 'in_progress' || progress === 'ready_to_lock') {
          return categories.length > 0
            ? <Navigate to={`/ballot/${categories[0]?.slug}`} replace />
            : <>{children}</>
        }
        if (progress === 'submitted') return <Navigate to="/insights" replace />
        return <>{children}</> // new users

      case 'ballot':
        if (progress === 'new') return <Navigate to="/" replace />
        if (progress === 'submitted') return <Navigate to="/insights" replace />
        return <>{children}</>

      case 'review':
        if (progress === 'new') return <Navigate to="/" replace />
        if (progress === 'submitted') return <Navigate to="/insights" replace />
        return <>{children}</>

      case 'insights':
        if (progress === 'submitted') return <>{children}</>
        return <Navigate to="/" replace />

      case 'leaderboard':
        return <Navigate to="/" replace />

      case 'report':
        return <Navigate to="/" replace />

      default:
        return <>{children}</>
    }
  }

  return <>{children}</>
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useParticipant } from './hooks/useParticipant'
import { useSettings } from './hooks/useSettings'
import { usePredictions } from './hooks/usePredictions'
import Layout from './components/Layout'
import ProfileSetup from './pages/ProfileSetup'
import Ballot from './pages/Ballot'
import BallotReview from './pages/BallotReview'
import Insights from './pages/Insights'
import Leaderboard from './pages/Leaderboard'
import AdminControl from './pages/AdminControl'
import AdminResults from './pages/AdminResults'
import AfterParty from './pages/AfterParty'
import { getParticipantProgress } from './lib/scoring'

function AppRoutes() {
  const { participant, loading: pLoading } = useParticipant()
  const { appPhase, loading: sLoading, isLocked } = useSettings()
  const { completedCount, loading: predLoading } = usePredictions(participant?.id ?? null)

  if (pLoading || sLoading || predLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="shimmer font-serif text-xl">The Evvies</span>
      </div>
    )
  }

  const progress = getParticipantProgress(participant, completedCount)

  // Determine default redirect based on phase + progress
  const getDefaultRoute = () => {
    if (appPhase === 'final') return '/report'
    if (appPhase === 'live') return '/leaderboard'
    if (appPhase === 'locked' || isLocked) {
      return progress === 'submitted' ? '/insights' : '/'
    }
    // setup phase
    if (progress === 'new') return '/'
    if (progress === 'submitted') return '/insights'
    return '/'
  }

  return (
    <Routes>
      {/* Profile Setup */}
      <Route path="/" element={
        appPhase === 'final' ? <Navigate to="/report" replace /> :
        appPhase === 'live' ? <Navigate to="/leaderboard" replace /> :
        (progress === 'submitted') ? <Navigate to="/insights" replace /> :
        (progress === 'in_progress' || progress === 'ready_to_lock') ? <Navigate to="/ballot/best-picture" replace /> :
        <ProfileSetup />
      } />

      {/* Ballot */}
      <Route path="/ballot/:categorySlug" element={
        appPhase === 'final' ? <Navigate to="/report" replace /> :
        appPhase === 'live' ? <Navigate to="/leaderboard" replace /> :
        (isLocked && progress !== 'submitted') ? <Navigate to="/" replace /> :
        progress === 'submitted' ? <Navigate to="/insights" replace /> :
        progress === 'new' ? <Navigate to="/" replace /> :
        participant ? <Ballot participant={participant} /> : <Navigate to="/" replace />
      } />

      {/* Ballot Review */}
      <Route path="/ballot/review" element={
        appPhase === 'final' ? <Navigate to="/report" replace /> :
        appPhase === 'live' ? <Navigate to="/leaderboard" replace /> :
        progress === 'submitted' ? <Navigate to="/insights" replace /> :
        progress === 'new' ? <Navigate to="/" replace /> :
        participant ? <BallotReview participant={participant} /> : <Navigate to="/" replace />
      } />

      {/* Insights */}
      <Route path="/insights" element={
        appPhase === 'final' ? <Navigate to="/report" replace /> :
        appPhase === 'live' ? <Navigate to="/leaderboard" replace /> :
        <Insights />
      } />

      {/* Leaderboard */}
      <Route path="/leaderboard" element={
        appPhase === 'final' ? <Navigate to="/report" replace /> :
        <Leaderboard />
      } />

      {/* After Party Report */}
      <Route path="/report" element={<AfterParty />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminControl />} />
      <Route path="/admin/results" element={<AdminResults />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <AppRoutes />
      </Layout>
    </BrowserRouter>
  )
}

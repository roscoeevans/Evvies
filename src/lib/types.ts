/* ============================================
   Evvies Type Definitions
   ============================================ */

// App phase states
export type AppPhase = 'setup' | 'locked' | 'live' | 'final'

// Participant progress (derived, not stored)
export type ParticipantProgress = 'new' | 'in_progress' | 'ready_to_lock' | 'submitted'

// UI groups for categories
export type UIGroup = 'marquee' | 'craft_music' | 'feature_races' | 'shorts'

// Importance tiers
export type ImportanceTier = 1 | 2 | 3 | 4

// Tag types
export type PrimaryTag = 'marquee' | 'acting' | 'writing' | 'craft' | 'music' | 'feature' | 'short' | 'specialty'

// ============================================
// Database row types
// ============================================

export interface Participant {
  id: string
  display_name: string
  photo_url: string | null
  pin: string | null
  session_token: string
  is_admin: boolean
  ballot_completed_at: string | null
  locked_at: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  point_value: number
  sort_order: number
  ui_group: UIGroup
  importance_tier: ImportanceTier
  tags: string[]
}

export interface Nominee {
  id: string
  category_id: string
  label: string
  sort_order: number
}

export interface Prediction {
  id: string
  participant_id: string
  category_id: string
  nominee_id: string
  created_at: string
  updated_at: string
}

export interface Result {
  id: string
  category_id: string
  winning_nominee_id: string
  announced_at: string
  updated_at: string
}

export interface Setting {
  key: string
  value: string
  updated_at: string
}

// ============================================
// Computed types (client-side)
// ============================================

export interface LeaderboardEntry {
  participant: Participant
  totalScore: number
  categoriesCorrect: number
  totalPossible: number
  remainingPossible: number
  rank: number
  previousRank?: number
  tagScores: Record<string, number>
}

export interface CategoryWithNominees extends Category {
  nominees: Nominee[]
}

export interface CategoryResult extends Category {
  result: Result | null
  winningNominee: Nominee | null
}

export interface BallotEntry {
  category: Category
  nominees: Nominee[]
  selectedNomineeId: string | null
}

export interface InsightStat {
  label: string
  value: string
  sublabel?: string
  icon?: string
}

export interface FunnyAward {
  title: string
  emoji: string
  description: string
  winner: Participant | null
  value?: string | number
}

// ============================================
// Supabase Database type (for client generic)
// ============================================

export interface Database {
  public: {
    Tables: {
      participants: {
        Row: Participant
        Insert: Omit<Participant, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Participant, 'id'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id'> & { id?: string }
        Update: Partial<Omit<Category, 'id'>>
      }
      nominees: {
        Row: Nominee
        Insert: Omit<Nominee, 'id'> & { id?: string }
        Update: Partial<Omit<Nominee, 'id'>>
      }
      predictions: {
        Row: Prediction
        Insert: Omit<Prediction, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Prediction, 'id'>>
      }
      results: {
        Row: Result
        Insert: Omit<Result, 'id' | 'announced_at' | 'updated_at'> & { id?: string; announced_at?: string; updated_at?: string }
        Update: Partial<Omit<Result, 'id'>>
      }
      settings: {
        Row: Setting
        Insert: Setting
        Update: Partial<Setting>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

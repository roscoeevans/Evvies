import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Category, Nominee, CategoryWithNominees } from '../lib/types'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [nominees, setNominees] = useState<Nominee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [catResult, nomResult] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('nominees').select('*').order('sort_order'),
      ])

      if (catResult.data) setCategories(catResult.data as Category[])
      if (nomResult.data) setNominees(nomResult.data as Nominee[])
      setLoading(false)
    }
    fetchData()
  }, [])

  // Combine categories with their nominees
  const categoriesWithNominees: CategoryWithNominees[] = categories.map(cat => ({
    ...cat,
    nominees: nominees.filter(n => n.category_id === cat.id),
  }))

  // Get by slug
  const getCategoryBySlug = (slug: string): CategoryWithNominees | undefined => {
    return categoriesWithNominees.find(c => c.slug === slug)
  }

  // Get next/prev slugs for navigation
  const getAdjacentSlugs = (slug: string): { prev: string | null; next: string | null } => {
    const idx = categories.findIndex(c => c.slug === slug)
    return {
      prev: idx > 0 ? categories[idx - 1].slug : null,
      next: idx < categories.length - 1 ? categories[idx + 1].slug : null,
    }
  }

  // Get current index (1-based)
  const getCategoryIndex = (slug: string): number => {
    return categories.findIndex(c => c.slug === slug) + 1
  }

  return {
    categories,
    nominees,
    categoriesWithNominees,
    loading,
    getCategoryBySlug,
    getAdjacentSlugs,
    getCategoryIndex,
    totalCategories: categories.length,
  }
}

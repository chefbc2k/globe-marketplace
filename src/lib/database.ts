import { createClient } from '@supabase/supabase-js'
import { VoiceTalent, Language, VoiceCategory } from '../types'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Client for public operations
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false
    }
  }
)

// Admin client for database initialization
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
)

// Database helper functions
export async function initializeDatabase() {
  try {
    // Test the connection first
    const { data, error } = await supabase.from('languages').select('count')
    if (error) throw error

    // If we get here, connection is successful
    return true
  } catch (error) {
    console.error('Database initialization error:', error)
    // Add more specific error handling based on error type
    if (error.code === 'PGRST301') {
      console.error('Authentication failed. Check your Supabase credentials.')
    } else if (error.code === 'PGRST302') {
      console.error('Database connection failed. Check if Supabase is running.')
    }
    return false
  }
}

export async function getVoiceTalents(params?: {
  lat?: number
  lng?: number
  radius?: number
  language?: string
  category?: string
  maxPrice?: number
  minRating?: number
}) {
  try {
    if (params?.lat && params?.lng) {
      // Use edge function for location-based queries
      const queryParams = new URLSearchParams({
        lat: params.lat.toString(),
        lng: params.lng.toString(),
        radius: (params.radius || 50).toString(),
        ...(params.language && { language: params.language }),
        ...(params.category && { category: params.category }),
        ...(params.maxPrice && { maxPrice: params.maxPrice.toString() }),
        ...(params.minRating && { minRating: params.minRating.toString() })
      })

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/voice-talents?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          }
        }
      )

      const result = await response.json()
      return result.data || []
    } else {
      // Use standard query for non-location-based queries
      const { data, error } = await supabase
        .from('voice_talents')
        .select(`
          *,
          language:languages(*),
          category:voice_categories(*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching voice talents:', error)
        return []
      }

      return data
    }
  } catch (error) {
    console.error('Error fetching voice talents:', error)
    return []
  }
}

export async function getVoiceTalentById(id: string) {
  const { data, error } = await supabase
    .from('voice_talents')
    .select(`
      *,
      language:languages(*),
      category:voice_categories(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching voice talent:', error)
    return null
  }

  return data
}

export async function createVoiceTalent(talent: Omit<VoiceTalent, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('voice_talents')
    .insert(talent)
    .select(`
      *,
      language:languages(*),
      category:voice_categories(*)
    `)
    .single()

  if (error) {
    console.error('Error creating voice talent:', error)
    return null
  }

  return data
}

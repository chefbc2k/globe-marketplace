import { createClient } from '@supabase/supabase-js'
import { VoiceTalent, Language, VoiceCategory } from '../types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for public operations
export const supabase = createClient(supabaseUrl, supabaseKey)

// Admin client for database initialization
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Database helper functions
export async function initializeDatabase() {
  try {
    // Create languages table
    const { error: langError } = await supabaseAdmin.from('languages').insert([
      { name: 'English', code: 'en' },
      { name: 'Spanish', code: 'es' },
      { name: 'French', code: 'fr' },
      { name: 'German', code: 'de' },
      { name: 'Japanese', code: 'ja' },
      { name: 'Mandarin', code: 'zh' },
      { name: 'Russian', code: 'ru' }
    ])

    if (langError) {
      console.error('Error adding languages:', langError)
      return false
    }

    // Create voice categories
    const { error: catError } = await supabaseAdmin.from('voice_categories').insert([
      { name: 'Commercial', description: 'Voice overs for commercials and advertisements' },
      { name: 'Narration', description: 'Documentary and educational content narration' },
      { name: 'Character', description: 'Character voices for animation and games' },
      { name: 'Audiobook', description: 'Audiobook narration' },
      { name: 'Corporate', description: 'Corporate training and presentations' },
      { name: 'IVR', description: 'Interactive Voice Response systems' }
    ])

    if (catError) {
      console.error('Error adding categories:', catError)
      return false
    }

    // Get the IDs of the inserted languages and categories
    const { data: languages } = await supabaseAdmin.from('languages').select('*')
    const { data: categories } = await supabaseAdmin.from('voice_categories').select('*')

    if (!languages || !categories) {
      console.error('Error fetching languages or categories')
      return false
    }

    // Add test voice talents
    const testTalents = [
      {
        name: 'Sarah Johnson',
        language_id: languages.find(l => l.name === 'English')?.id,
        category_id: categories.find(c => c.name === 'Commercial')?.id,
        accent: 'American',
        description: 'Professional voice artist with 10 years experience',
        sample_url: 'https://example.com/sample1.mp3',
        hourly_rate: 150,
        lat: 40.7128,
        lng: -74.0060
      },
      {
        name: 'Jean Dupont',
        language_id: languages.find(l => l.name === 'French')?.id,
        category_id: categories.find(c => c.name === 'Narration')?.id,
        accent: 'Parisian',
        description: 'Experienced narrator and voice actor',
        sample_url: 'https://example.com/sample2.mp3',
        hourly_rate: 130,
        lat: 48.8566,
        lng: 2.3522
      },
      {
        name: 'Yuki Tanaka',
        language_id: languages.find(l => l.name === 'Japanese')?.id,
        category_id: categories.find(c => c.name === 'Character')?.id,
        accent: 'Tokyo',
        description: 'Specialized in anime and game voiceovers',
        sample_url: 'https://example.com/sample3.mp3',
        hourly_rate: 140,
        lat: 35.6762,
        lng: 139.6503
      }
    ]

    const { error: talentsError } = await supabaseAdmin
      .from('voice_talents')
      .insert(testTalents)

    if (talentsError) {
      console.error('Error adding test talents:', talentsError)
      return false
    }

    return true
  } catch (error) {
    console.error('Error initializing database:', error)
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
        `${supabaseUrl}/functions/v1/voice-talents?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${supabaseKey}`
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

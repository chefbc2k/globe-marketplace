import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

interface VoiceTalent {
  id: string
  name: string
  language_name: string
  category_name: string
  accent: string
  hourly_rate: number
  distance_km: number
}

interface Review {
  voice_talent_id: string
  rating: number
}

interface QueryParams {
  lat?: number
  lng?: number
  radius?: number
  language?: string
  category?: string
  maxPrice?: number
  minRating?: number
}

interface RatingAccumulator {
  [key: string]: { sum: number; count: number }
}

serve(async (req: Request) => {
  try {
    const url = new URL(req.url)
    const queryParams: QueryParams = {
      lat: parseFloat(url.searchParams.get('lat') || '0'),
      lng: parseFloat(url.searchParams.get('lng') || '0'),
      radius: parseFloat(url.searchParams.get('radius') || '50'),
      language: url.searchParams.get('language') || undefined,
      category: url.searchParams.get('category') || undefined,
      maxPrice: parseFloat(url.searchParams.get('maxPrice') || '1000'),
      minRating: parseFloat(url.searchParams.get('minRating') || '0')
    }

    // Create Supabase client
    const supabaseClient: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false
        }
      }
    )

    // Build query
    let query = supabaseClient
      .rpc('find_voice_talents_within_radius', {
        center_lat: queryParams.lat,
        center_lng: queryParams.lng,
        radius_km: queryParams.radius
      })

    // Add filters
    if (queryParams.language) {
      query = query.eq('language_name', queryParams.language)
    }
    if (queryParams.category) {
      query = query.eq('category_name', queryParams.category)
    }
    if (queryParams.maxPrice) {
      query = query.lte('hourly_rate', queryParams.maxPrice)
    }

    // Execute query
    const { data, error } = await query

    if (error) {
      throw error
    }

    // Filter by rating if needed
    let results = data as VoiceTalent[]
    if (queryParams.minRating) {
      const { data: reviewData } = await supabaseClient
        .from('reviews')
        .select('voice_talent_id, rating')

      if (reviewData) {
        // Calculate average ratings
        const avgRatings = (reviewData as Review[]).reduce((acc: RatingAccumulator, review: Review) => {
          if (!acc[review.voice_talent_id]) {
            acc[review.voice_talent_id] = { sum: 0, count: 0 }
          }
          acc[review.voice_talent_id].sum += review.rating
          acc[review.voice_talent_id].count++
          return acc
        }, {})

        // Filter results by minimum rating
        results = results.filter((talent: VoiceTalent) => {
          const rating = avgRatings[talent.id]
          return rating && (rating.sum / rating.count) >= (queryParams.minRating || 0)
        })
      }
    }

    // Return results
    return new Response(
      JSON.stringify({
        success: true,
        data: results
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60'
        }
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})

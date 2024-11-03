import { NextResponse } from 'next/server'
import { getVoiceTalents, initializeDatabase } from '@/lib/database'

export async function GET() {
  try {
    // First try to get voice talents
    let voiceTalents = await getVoiceTalents()
    
    // If no voice talents exist, initialize the database
    if (!voiceTalents || voiceTalents.length === 0) {
      console.log('Initializing database with test data...')
      const initialized = await initializeDatabase()
      if (initialized) {
        // Fetch voice talents again after initialization
        voiceTalents = await getVoiceTalents()
      }
    }
    
    return NextResponse.json(voiceTalents)
  } catch (error) {
    console.error('Error in voice-talents route:', error)
    return NextResponse.json(
      { error: 'Error fetching voice talents' },
      { status: 500 }
    )
  }
}

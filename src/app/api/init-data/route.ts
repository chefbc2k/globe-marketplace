import { NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/database'

export async function POST() {
  try {
    const success = await initializeDatabase()
    if (success) {
      return NextResponse.json({ message: 'Database initialized successfully' })
    } else {
      return NextResponse.json(
        { error: 'Failed to initialize database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in init-data route:', error)
    return NextResponse.json(
      { error: 'Error initializing database' },
      { status: 500 }
    )
  }
}

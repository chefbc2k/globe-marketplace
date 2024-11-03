import { Subject } from 'rxjs'
import * as THREE from 'three'

export interface VoiceTalent {
  id: string
  name: string
  language_id: string
  category_id: string
  accent: string
  description: string
  sample_url: string
  hourly_rate: number
  lat: number
  lng: number
  created_at: string
  updated_at: string
  // Add new properties for filtering
  pattern: string
  emotion: string
  region: string
  timeSlot: string
  // Include related data
  language?: Language
  category?: VoiceCategory
}

export interface Language {
  id: string
  name: string
  code: string
  created_at: string
}

export interface VoiceCategory {
  id: string
  name: string
  description: string
  created_at: string
}

export interface MarketTransaction {
  id: string
  value: number
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  timestamp: Date
}

export interface VoiceDataListing {
  id: string
  price: number
  talentId: string
  paymentIntentId?: string
}

export interface AnalyticsDataPoint {
  lat: number
  lng: number
  value: number
  weight: number
}

export interface VolumeMetric {
  region: string
  volume: number
  change: number
}

export interface VoiceAnalysis {
  talentId: string
  metrics: {
    clarity: number
    emotion: string
    confidence: number
  }
}

export interface MarketUpdate {
  type: 'listing' | 'transaction' | 'analytics'
  data: any
}

export interface SystemAlert {
  type: 'info' | 'warning' | 'error'
  message: string
}

export interface GlobeScene extends THREE.Scene {
  add(obj: THREE.Object3D): this
  remove(obj: THREE.Object3D): this
}

// Extend the GlobeInstance type
declare module 'globe.gl' {
  interface GlobeInstance {
    scene(): GlobeScene
  }
}

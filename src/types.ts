export interface Transaction {
  id: string
  amount: number
  source: {
    lat: number
    lng: number
  }
  destination: {
    lat: number
    lng: number
  }
  timestamp: Date
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

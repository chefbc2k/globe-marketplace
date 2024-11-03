import { supabase } from './supabase'
import { Subject } from 'rxjs'
import * as THREE from 'three'
import { interpolateYlOrRd } from 'd3-scale-chromatic'

export interface Transaction {
  id: string
  talentId: string
  buyerId: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  paymentIntentId: string
  createdAt: Date
  metadata: {
    startLat: number
    startLng: number
    endLat: number
    endLng: number
  }
}

export const transactionEvents = new Subject<Transaction>()
export const arcAnimations = new Map<string, THREE.Mesh>()

export class TransactionProcessor {
  static instance: TransactionProcessor

  static getInstance() {
    if (!this.instance) {
      this.instance = new TransactionProcessor()
    }
    return this.instance
  }

  async processTransaction(transaction: Transaction) {
    // Create arc visualization data
    const arc = {
      startLat: transaction.metadata.startLat,
      startLng: transaction.metadata.startLng,
      endLat: transaction.metadata.endLat,
      endLng: transaction.metadata.endLng,
      color: this.getTransactionColor(transaction.amount),
      altitude: this.calculateArcHeight(transaction)
    }

    // Store for analytics
    await this.storeTransactionData(transaction)

    // Broadcast event
    transactionEvents.next(transaction)

    return arc
  }

  private calculateArcHeight(transaction: Transaction) {
    // Dynamic arc height based on transaction value and distance
    const distance = this.calculateDistance(
      transaction.metadata.startLat,
      transaction.metadata.startLng,
      transaction.metadata.endLat,
      transaction.metadata.endLng
    )
    return Math.min(0.5 + (distance * 0.1), 2)
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
    // Haversine formula for great-circle distance
    const R = 6371 // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1)
    const dLng = this.toRad(lng2 - lng1)
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private toRad(value: number) {
    return value * Math.PI / 180
  }

  private getTransactionColor(amount: number) {
    // Color scale based on transaction amount
    return interpolateYlOrRd(Math.min(amount / 1000, 1))
  }

  private async storeTransactionData(transaction: Transaction) {
    await supabase
      .from('transaction_analytics')
      .insert({
        transaction_id: transaction.id,
        amount: transaction.amount,
        location_start: `POINT(${transaction.metadata.startLng} ${transaction.metadata.startLat})`,
        location_end: `POINT(${transaction.metadata.endLng} ${transaction.metadata.endLat})`,
        timestamp: new Date().toISOString()
      })
  }
} 
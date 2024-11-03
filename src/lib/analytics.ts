import { supabase } from './supabase'
import { Subject } from 'rxjs'

export interface AnalyticsData {
  type: 'market' | 'activity' | 'performance'
  data: any
  timestamp: Date
}

export const analyticsEvents = new Subject<AnalyticsData>()

export class AnalyticsProcessor {
  private static instance: AnalyticsProcessor
  private processingQueue: AnalyticsData[] = []
  private isProcessing = false
  private updateInterval = 5000 // 5 seconds

  static getInstance() {
    if (!this.instance) {
      this.instance = new AnalyticsProcessor()
      this.instance.startProcessingLoop()
    }
    return this.instance
  }

  private startProcessingLoop() {
    setInterval(() => {
      if (!this.isProcessing && this.processingQueue.length > 0) {
        this.processNextBatch()
      }
    }, this.updateInterval)
  }

  private async processNextBatch() {
    this.isProcessing = true
    const batch = this.processingQueue.splice(0, 10)

    try {
      const results = await Promise.all(batch.map(data => {
        switch (data.type) {
          case 'market':
            return this.processMarketData(data.data)
          case 'activity':
            return this.processActivityData(data.data)
          case 'performance':
            return this.processPerformanceData(data.data)
        }
      }))

      // Broadcast processed results
      results.forEach(result => {
        if (result) analyticsEvents.next(result)
      })
    } catch (error) {
      console.error('Error processing analytics batch:', error)
    } finally {
      this.isProcessing = false
    }
  }

  async queueAnalytics(data: Omit<AnalyticsData, 'timestamp'>) {
    this.processingQueue.push({
      ...data,
      timestamp: new Date()
    })
  }

  private async processMarketData(data: any) {
    const processed = {
      type: 'market' as const,
      data: {
        volumeByRegion: this.calculateVolumeByRegion(data),
        priceHeatmap: await this.generatePriceHeatmap(data),
        activityHotspots: await this.identifyActivityHotspots(data)
      },
      timestamp: new Date()
    }

    await this.saveAnalytics(processed)
    return processed
  }

  // ... rest of the analytics processing methods ...
} 
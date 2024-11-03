'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import createGlobe, { GlobeInstance } from 'globe.gl'
import { 
  VoiceTalent, 
  MarketTransaction, 
  VoiceDataListing, 
  AnalyticsDataPoint,
  VolumeMetric,
  VoiceAnalysis,
  MarketUpdate,
  SystemAlert
} from '../types'
import * as THREE from 'three'
import * as d3 from 'd3'
import { supabase } from '../lib/supabase'
import { useStripe } from '@stripe/react-stripe-js'
import { Subject } from 'rxjs'
import { VoiceTalentModal } from './VoiceTalentModal'
import { transactionEvents, arcAnimations, TransactionProcessor } from '@/lib/transactions'
import { analyticsEvents, AnalyticsProcessor } from '@/lib/analytics'
import { FilterState, FilterStateUpdate } from '../types/filters'
import { FilterCategories } from './FilterCategories'
import { ActiveFiltersDisplay } from '@/components/ActiveFiltersDisplay'

// Use a single instance of Three.js
if (typeof window !== 'undefined') {
  (window as any).THREE = THREE
}

interface GlobeData {
  points: VoiceTalent[]
  hexbins: any[]
  heatmap: any[]
  paths: any[]
  bars: any[]
  labels: any[]
  realtime: {
    points: VoiceTalent[]
    lastUpdate: Date
  }
  market: {
    transactions: MarketTransaction[]
    listings: VoiceDataListing[]
  }
  analytics: {
    heatmap: AnalyticsDataPoint[]
    volume: VolumeMetric[]
  }
}

interface GlobeState {
  activeFilters: {
    languages: Set<string>
    categories: Set<string>
    priceRange: [number, number]
    rating: number
  }
  displayModes: {
    hexbins: boolean
    heatmap: boolean
    paths: boolean
    bars: boolean
    labels: boolean
  }
  timeRange: [Date, Date]
}

interface HexbinData {
  points: VoiceTalent[]
  sumWeight: number
  x: number
  y: number
  lat: number
  lng: number
}

interface BarData {
  lat: number
  lng: number
  height: number
  color: string
}

interface LabelData {
  lat: number
  lng: number
  text: string
  size: number
  radius: number
  color: string
}

const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
  .domain([0, 100])

export function Globe() {
  const containerRef = useRef<HTMLDivElement>(null)
  // Dynamic arc height based on distance
  const globeRef = useRef<GlobeInstance | null>(null)
  const [data, setData] = useState<GlobeData>({
    points: [],
    hexbins: [],
    heatmap: [],
    paths: [],
    bars: [],
    labels: [],
    realtime: {
      points: [],
      lastUpdate: new Date()
    },
    market: {
      transactions: [],
      listings: []
    },
    analytics: {
      heatmap: [],
      volume: []
    }
  })
  const [state, setState] = useState<GlobeState>({
    activeFilters: {
      languages: new Set(),
      categories: new Set(),
      priceRange: [0, 500],
      rating: 0
    },
    displayModes: {
      hexbins: true,
      heatmap: true,
      paths: true,
      bars: true,
      labels: true
    },
    timeRange: [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()]
  })
  const stripe = useStripe()
  const [marketData, setMarketData] = useState<GlobeData['market']>({
    transactions: [],
    listings: []
  })
  const [selectedTalent, setSelectedTalent] = useState<VoiceTalent | null>(null)

  // Set up data channels
  const channels = useMemo(() => ({
    voiceAnalysis: new Subject<VoiceAnalysis>(),
    marketUpdates: new Subject<MarketUpdate>(),
    systemAlerts: new Subject<SystemAlert>()
  }), [])

  const [filterState, setFilterState] = useState<FilterState>({
    selectedPatterns: new Set(),
    selectedEmotions: new Set(),
    selectedRegions: new Set(),
    selectedTimes: new Set()
  })

  // Handle filter updates from the FilterCategories component
  const handleFilterUpdate = (update: FilterStateUpdate) => {
    setFilterState(prev => ({
      ...prev,
      [update.type === 'patterns' ? 'selectedPatterns' :
       update.type === 'emotions' ? 'selectedEmotions' :
       update.type === 'regions' ? 'selectedRegions' : 'selectedTimes']: update.value
    }))
  }

  // Handle real-time data updates
  useEffect(() => {
    const subscription = transactionEvents.subscribe(async transaction => {
      // Update transaction arcs
      const arc = await TransactionProcessor.getInstance().processTransaction(transaction)
      
      // Convert the transaction to MarketTransaction type before updating state
      const marketTransaction: MarketTransaction = {
        id: transaction.id,
        value: transaction.amount,
        startLat: transaction.metadata.startLat,
        startLng: transaction.metadata.startLng,
        endLat: transaction.metadata.endLat,
        endLng: transaction.metadata.endLng,
        timestamp: transaction.createdAt
      }
      
      setData(prev => ({
        ...prev,
        market: {
          ...prev.market,
          transactions: [...prev.market.transactions, marketTransaction]
        }
      }))

      // Update globe visualization with new arc
      if (globeRef.current) {
        const mesh = createTransactionArc(marketTransaction)
        arcAnimations.set(transaction.id, mesh)
        globeRef.current.scene().add(mesh)
        
        // Animate arc
        animateArc(mesh, arc)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Handle analytics updates
  useEffect(() => {
    const subscription = analyticsEvents.subscribe(analytics => {
      switch (analytics.type) {
        case 'market':
          updateMarketVisualization(analytics.data)
          break
        case 'activity':
          updateActivityVisualization(analytics.data)
          break
        case 'performance':
          updatePerformanceMetrics(analytics.data)
          break
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Animation helper
  const animateArc = (mesh: THREE.Mesh, arc: any) => {
    const duration = 2000 // 2 seconds
    const start = Date.now()

    const animate = () => {
      const progress = (Date.now() - start) / duration
      if (progress < 1) {
        mesh.scale.setScalar(progress)
        if (mesh.material instanceof THREE.Material) {
          (mesh.material as THREE.MeshPhongMaterial).opacity = Math.min(progress * 2, 1)
        } else if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => {
            if (mat instanceof THREE.MeshPhongMaterial) {
              mat.opacity = Math.min(progress * 2, 1)
            }
          })
        }
        requestAnimationFrame(animate)
      } else {
        mesh.scale.setScalar(1)
        if (mesh.material instanceof THREE.Material) {
          (mesh.material as THREE.MeshPhongMaterial).opacity = 1
        } else if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => {
            if (mat instanceof THREE.MeshPhongMaterial) {
              mat.opacity = 1
            }
          })
        }
      }
    }

    animate()
  }

  // Process data for different visualizations
  const processedData = useMemo(() => {
    if (!data.points.length) return data

    // Generate hexbins for talent density
    const hexData = generateHexbinData(data.points, state.activeFilters)

    // Generate heatmap for pricing trends
    const heatmapData = generateHeatmapData(data.points, state.activeFilters)

    // Generate paths for recent connections
    const pathData = generatePathData(data.points, state.timeRange)

    // Generate 3D bars for ratings/activity
    const barData = generateBarData(data.points, state.activeFilters)

    // Generate labels for detailed information
    const labelData = generateLabelData(data.points, state.activeFilters)

    return {
      ...data,
      hexbins: hexData,
      heatmap: heatmapData,
      paths: pathData,
      bars: barData,
      labels: labelData
    }
  }, [data.points, state])

  // Fetch and update data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/voice-talents')
        const talents = await response.json()
        setData(prev => ({ ...prev, points: talents }))
      } catch (error) {
        console.error('Error fetching voice talents:', error)
      }
    }

    fetchData()
    // Set up real-time subscription
    const subscription = supabase
      .channel('voice_talents_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voice_talents' },
        (payload: any) => {
          fetchData() // Refresh data on any change
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Initialize and update globe
  useEffect(() => {
    if (!containerRef.current || !data.points.length) return

    const globe = createGlobe()(containerRef.current)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .backgroundColor('rgba(0,0,0,0)')
      .width(containerRef.current.clientWidth)
      .height(containerRef.current.clientHeight)

      // Hexbin layer
      .hexBinPointsData(state.displayModes.hexbins ? processedData.hexbins : [])
      .hexBinPointWeight('weight')
      .hexBinResolution(4)
      .hexMargin(0.2)
      .hexBinColor((d: HexbinData) => colorScale(d.sumWeight / d.points.length))

      // Heatmap layer
      .heatmapsData(state.displayModes.heatmap ? processedData.heatmap : [])
      .heatmapWeight('weight')
      .heatmapColorScale(d3.interpolateYlOrRd)

      // Custom 3D bars
      .customLayerData(state.displayModes.bars ? processedData.bars : [])
      .customThreeObject((d: BarData) => new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, d.height),
        new THREE.MeshPhongMaterial({ color: d.color })
      ))
      .customThreeObjectUpdate((obj: THREE.Mesh, d: BarData) => {
        if (!globe) return
        const coords = globe.getCoords(d.lat, d.lng, d.height / 2)
        obj.position.set(coords.x, coords.y, coords.z)
        
        const lookAtCoords = globe.getCoords(d.lat, d.lng, 0)
        obj.lookAt(new THREE.Vector3(lookAtCoords.x, lookAtCoords.y, lookAtCoords.z))
      })

      // Arc paths
      .arcsData(state.displayModes.paths ? processedData.paths : [])
      .arcColor((d: { color: string }) => d.color)
      .arcDashLength(0.4)
      .arcDashGap(0.2)
      .arcDashAnimateTime(1500)
      .arcStroke(1)

      // Labels
      .labelsData(state.displayModes.labels ? processedData.labels : [])
      .labelLat((d: LabelData) => d.lat)
      .labelLng((d: LabelData) => d.lng)
      .labelText((d: LabelData) => d.text)
      .labelSize((d: LabelData) => d.size)
      .labelDotRadius((d: LabelData) => d.radius)
      .labelColor((d: LabelData) => d.color)
      .labelResolution(6)

      // Atmosphere
      .showAtmosphere(true)
      .atmosphereColor('rgb(30,136,229)')
      .atmosphereAltitude(0.1)

      // Add market visualization layers
      .customLayerData(marketData.transactions)
      .customThreeObject((d: MarketTransaction) => createTransactionArc(d))
      .customThreeObjectUpdate((obj, d) => updateTransactionArc(obj, d))

    // Add interaction handlers
    globe
      .onHexBinHover(hoverHexbin)
      .onHexBinClick(clickHexbin)
      .onCustomLayerHover(hoverBar)
      .onCustomLayerClick(clickBar)
      .onLabelHover(hoverLabel)
      .onLabelClick(clickLabel)

    globeRef.current = globe

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && globe) {
        globe
          .width(containerRef.current.clientWidth)
          .height(containerRef.current.clientHeight)
      }
    }
    window.addEventListener('resize', handleResize)

    // Set initial position
    globe.pointOfView({ lat: 0, lng: 0, altitude: 2.5 })

    // Add rotation animation
    if (globe.controls) {
      globe.controls().autoRotate = true
      globe.controls().autoRotateSpeed = 0.5

      const animate = () => {
        if (globe.controls()) {
          globe.controls().update()
        }
        requestAnimationFrame(animate)
      }
      animate()
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (globeRef.current && containerRef.current) {
        containerRef.current.innerHTML = ''
        globeRef.current = null
      }
    }
  }, [processedData, marketData, state.displayModes])

  // Market operation handlers
  const handleNewListing = async (listing: VoiceDataListing) => {
    try {
      // Create payment intent through API endpoint
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: listing.price * 100, // Convert to cents
          listingId: listing.id
        }),
      });

      const { clientSecret, paymentIntentId } = await response.json();

      if (!clientSecret || !paymentIntentId) {
        throw new Error('Failed to create payment intent');
      }

      setMarketData(prev => ({
        ...prev,
        listings: [...prev.listings, { ...listing, paymentIntentId }]
      }));

      channels.systemAlerts.next({
        type: 'info',
        message: 'New listing created successfully'
      });

      return clientSecret;

    } catch (error) {
      console.error('Error creating listing:', error);
      channels.systemAlerts.next({
        type: 'error',
        message: 'Failed to create listing'
      });
      throw error;
    }
  };

  // Update the clickLabel handler
  const clickLabel = (label: LabelData | null) => {
    if (label) {
      const talent = data.points.find(p => p.lat === label.lat && p.lng === label.lng)
      if (talent) {
        setSelectedTalent(talent)
      }
    }
  }

  // Update visualization methods
  const updateMarketVisualization = (data: any) => {
    setData(prev => ({
      ...prev,
      heatmap: data.priceHeatmap,
      hexbins: data.activityHotspots
    }))
  }

  const updateActivityVisualization = (data: any) => {
    // Update activity-based visualizations
  }

  const updatePerformanceMetrics = (data: any) => {
    // Update performance-related visualizations
  }

  // Update visualization based on filter state
  useEffect(() => {
    if (!globeRef.current) return

    const filteredData = processedData.points.filter(point => {
      return (
        (filterState.selectedPatterns.size === 0 || filterState.selectedPatterns.has(point.pattern)) &&
        (filterState.selectedEmotions.size === 0 || filterState.selectedEmotions.has(point.emotion)) &&
        (filterState.selectedRegions.size === 0 || filterState.selectedRegions.has(point.region)) &&
        (filterState.selectedTimes.size === 0 || filterState.selectedTimes.has(point.timeSlot))
      )
    })

    // Update globe visualization with filtered data
    globeRef.current.pointsData(filteredData)
  }, [filterState, processedData])

  return (
    <div className="relative w-full h-full">
      <FilterCategories onFilterUpdate={handleFilterUpdate} />
      <div ref={containerRef} className="w-full h-full" />
      <ActiveFiltersDisplay filterState={filterState} />
    </div>
  )
}

// Data processing functions
function generateHexbinData(points: VoiceTalent[], filters: GlobeState['activeFilters']) {
  // Implementation for hexbin data generation
  return points.map(p => ({
    lat: p.lat,
    lng: p.lng,
    weight: calculateWeight(p, filters)
  }))
}

function generateHeatmapData(points: VoiceTalent[], filters: GlobeState['activeFilters']) {
  // Implementation for heatmap data generation
  return points.map(p => ({
    lat: p.lat,
    lng: p.lng,
    weight: p.hourly_rate
  }))
}

function generatePathData(points: VoiceTalent[], timeRange: [Date, Date]) {
  // Implementation for path data generation
  return points.reduce((acc, p1, i) => {
    if (i === points.length - 1) return acc
    const p2 = points[i + 1]
    return [...acc, {
      startLat: p1.lat,
      startLng: p1.lng,
      endLat: p2.lat,
      endLng: p2.lng,
      color: getLanguageColor(p1.language?.name)
    }]
  }, [] as any[])
}

function generateBarData(points: VoiceTalent[], filters: GlobeState['activeFilters']) {
  // Implementation for 3D bar data generation
  return points.map(p => ({
    lat: p.lat,
    lng: p.lng,
    height: p.hourly_rate / 10,
    color: getLanguageColor(p.language?.name)
  }))
}

function generateLabelData(points: VoiceTalent[], filters: GlobeState['activeFilters']) {
  // Implementation for label data generation
  return points.map(p => ({
    lat: p.lat,
    lng: p.lng,
    text: p.name,
    size: 1,
    radius: 0.5,
    color: getLanguageColor(p.language?.name)
  }))
}

// Helper functions
function calculateWeight(point: VoiceTalent, filters: GlobeState['activeFilters']) {
  // Implementation for weight calculation based on filters
  return 1
}

function getLanguageColor(language?: string) {
  const colors: { [key: string]: string } = {
    'English': '#ff5722',
    'Spanish': '#2196f3',
    'French': '#4caf50',
    'German': '#9c27b0',
    'Japanese': '#ff9800',
    'Mandarin': '#f44336',
    'Russian': '#00bcd4'
  }
  return colors[language || ''] || '#999999'
}

// Event handlers
function hoverHexbin(hex: HexbinData | null) {
  // Implementation for hexbin hover
}

function clickHexbin(hex: HexbinData | null) {
  // Implementation for hexbin click
}

function hoverBar(bar: BarData | null) {
  // Implementation for bar hover
}

function clickBar(bar: BarData | null) {
  // Implementation for bar click
}

function hoverLabel(label: LabelData | null) {
  // Implementation for label hover
}

function clickLabel(label: LabelData | null) {
  // Implementation for label click
}

// Helper functions for market visualization
function createTransactionArc(transaction: MarketTransaction): THREE.Mesh {
  const material = new THREE.MeshPhongMaterial({
    color: getTransactionColor(transaction.value),
    transparent: true,
    opacity: 0.8
  });
  
  const geometry = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(transaction.startLat, 0, transaction.startLng),
      new THREE.Vector3(transaction.endLat, 1, transaction.endLng)
    ]),
    20,
    0.1,
    8,
    false
  );

  return new THREE.Mesh(geometry, material);
}

function getTransactionColor(value: number): string {
  // Implement color scale based on transaction value
  return d3.interpolateYlOrRd(value / 1000) // Scale to max expected value
}

// Add the missing updateTransactionArc function
function updateTransactionArc(obj: THREE.Mesh, d: MarketTransaction) {
  // Check if material is an array
  if (Array.isArray(obj.material)) {
    // Handle array of materials
    obj.material.forEach(mat => {
      if (mat instanceof THREE.Material) {
        (mat as THREE.MeshPhongMaterial).opacity = 0.8;
      }
    });
  } else if (obj.material instanceof THREE.Material) {
    // Handle single material
    (obj.material as THREE.MeshPhongMaterial).opacity = 0.8;
  }
}

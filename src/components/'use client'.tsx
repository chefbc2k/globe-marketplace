'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import createGlobe, { GlobeInstance } from 'globe.gl'
import { VoiceTalent } from '../types'
import * as THREE from 'three'
import * as d3 from 'd3'
import { supabase } from '@/lib/database'

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
        // Dynamic arc height based on distance
  const containerRef = useRef<HTMLDivElement | null>(null)
  const globeRef = useRef<GlobeInstance | null>(null)
  const [data, setData] = useState<GlobeData>({
    points: [],
    hexbins: [],
    heatmap: [],
    paths: [],
    bars: [],
    labels: []
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
    if (!containerRef.current || !processedData.points.length) return

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
        obj.lookAt(lookAtCoords.x, lookAtCoords.y, lookAtCoords.z)
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
  }, [processedData, state.displayModes])

  return (
    <div
      ref={containerRef} 
      className="w-full h-full"
      style={{ background: 'transparent' }}
    />
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

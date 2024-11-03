'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/database'

interface GlobeControlsProps {
  onStateChange: (state: GlobeState) => void
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

export function GlobeControls({ onStateChange }: GlobeControlsProps) {
  // State for available options
  const [languages, setLanguages] = useState<{ id: string; name: string }[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  
  // State for active filters and display modes
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

  // Fetch available options
  useEffect(() => {
    const fetchOptions = async () => {
      // Fetch languages with counts
      const { data: languagesData } = await supabase
        .from('languages')
        .select(`
          id,
          name,
          voice_talents:voice_talents(count)
        `)
        .order('name')

      if (languagesData) {
        setLanguages(languagesData)
      }

      // Fetch categories with counts
      const { data: categoriesData } = await supabase
        .from('voice_categories')
        .select(`
          id,
          name,
          voice_talents:voice_talents(count)
        `)
        .order('name')

      if (categoriesData) {
        setCategories(categoriesData)
      }
    }

    fetchOptions()
  }, [])

  // Update parent when state changes
  useEffect(() => {
    onStateChange(state)
  }, [state, onStateChange])

  return (
    <div className="absolute top-4 right-4 bg-black/80 p-4 rounded-lg shadow-lg w-80 z-10">
      <div className="space-y-6">
        {/* Visualization Layers */}
        <section>
          <h3 className="text-lg font-semibold mb-2">Visualization Layers</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(state.displayModes).map(([mode, enabled]) => (
              <button
                key={mode}
                onClick={() => setState(prev => ({
                  ...prev,
                  displayModes: {
                    ...prev.displayModes,
                    [mode]: !enabled
                  }
                }))}
                className={`px-3 py-1 rounded ${
                  enabled 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Language Filter */}
        <section>
          <h3 className="text-lg font-semibold mb-2">Languages</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {languages.map(lang => (
              <label key={lang.id} className="flex items-center justify-between p-1 hover:bg-gray-700 rounded">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={state.activeFilters.languages.has(lang.name)}
                    onChange={(e) => {
                      const newLanguages = new Set(state.activeFilters.languages)
                      if (e.target.checked) {
                        newLanguages.add(lang.name)
                      } else {
                        newLanguages.delete(lang.name)
                      }
                      setState(prev => ({
                        ...prev,
                        activeFilters: {
                          ...prev.activeFilters,
                          languages: newLanguages
                        }
                      }))
                    }}
                    className="mr-2"
                  />
                  <span>{lang.name}</span>
                </div>
                <span className="text-sm text-gray-400">
                  {(lang as any).voice_talents_aggregate?.count || 0}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Category Filter */}
        <section>
          <h3 className="text-lg font-semibold mb-2">Categories</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {categories.map(cat => (
              <label key={cat.id} className="flex items-center justify-between p-1 hover:bg-gray-700 rounded">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={state.activeFilters.categories.has(cat.name)}
                    onChange={(e) => {
                      const newCategories = new Set(state.activeFilters.categories)
                      if (e.target.checked) {
                        newCategories.add(cat.name)
                      } else {
                        newCategories.delete(cat.name)
                      }
                      setState(prev => ({
                        ...prev,
                        activeFilters: {
                          ...prev.activeFilters,
                          categories: newCategories
                        }
                      }))
                    }}
                    className="mr-2"
                  />
                  <span>{cat.name}</span>
                </div>
                <span className="text-sm text-gray-400">
                  {(cat as any).voice_talents_aggregate?.count || 0}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Price Range */}
        <section>
          <h3 className="text-lg font-semibold mb-2">Price Range</h3>
          <div className="px-2">
            <div className="flex justify-between mb-2">
              <span>${state.activeFilters.priceRange[0]}</span>
              <span>${state.activeFilters.priceRange[1]}</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={state.activeFilters.priceRange[1]}
              onChange={(e) => setState(prev => ({
                ...prev,
                activeFilters: {
                  ...prev.activeFilters,
                  priceRange: [prev.activeFilters.priceRange[0], Number(e.target.value)]
                }
              }))}
              className="w-full"
              aria-label="Maximum price range"
              title="Price range slider"
            />
          </div>
        </section>

        {/* Time Range */}
        <section>
          <h3 className="text-lg font-semibold mb-2">Time Range</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="date-from" className="text-sm text-gray-400">From</label>
              <input
                id="date-from"
                type="date"
                value={state.timeRange[0].toISOString().split('T')[0]}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  timeRange: [new Date(e.target.value), prev.timeRange[1]]
                }))}
                className="w-full bg-gray-700 rounded px-2 py-1"
                aria-label="Start date"
              />
            </div>
            <div>
              <label htmlFor="date-to" className="text-sm text-gray-400">To</label>
              <input
                id="date-to"
                type="date"
                value={state.timeRange[1].toISOString().split('T')[0]}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  timeRange: [prev.timeRange[0], new Date(e.target.value)]
                }))}
                className="w-full bg-gray-700 rounded px-2 py-1"
                aria-label="End date"
              />
            </div>
          </div>
        </section>

        {/* Legend */}
        <section>
          <h3 className="text-lg font-semibold mb-2">Legend</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
              <span>Active Talents</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
              <span>Recent Bookings</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
              <span>High Demand</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
              <span>Premium Rates</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

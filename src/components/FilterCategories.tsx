import { FilterStateUpdate } from '@/types/filters'
import { useState } from 'react'

interface FilterCategoriesProps {
  onFilterUpdate: (update: FilterStateUpdate) => void
}

// Add interfaces for the child component props
interface ChipsProps {
  onSelect: (selected: Set<string>) => void
}

// Create the missing components
function VoicePatternChips({ onSelect }: ChipsProps) {
  const patterns = ['Conversational', 'Professional', 'Energetic', 'Calm', 'Authoritative']
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const handleSelect = (pattern: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(pattern)) {
      newSelected.delete(pattern)
    } else {
      newSelected.add(pattern)
    }
    setSelected(newSelected)
    onSelect(newSelected)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {patterns.map(pattern => (
        <button
          key={pattern}
          onClick={() => handleSelect(pattern)}
          className={`px-3 py-1 rounded-full text-sm ${
            selected.has(pattern) 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {pattern}
        </button>
      ))}
    </div>
  )
}

function EmotionTags({ onSelect }: ChipsProps) {
  const emotions = ['Happy', 'Serious', 'Empathetic', 'Excited', 'Neutral']
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const handleSelect = (emotion: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(emotion)) {
      newSelected.delete(emotion)
    } else {
      newSelected.add(emotion)
    }
    setSelected(newSelected)
    onSelect(newSelected)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {emotions.map(emotion => (
        <button
          key={emotion}
          onClick={() => handleSelect(emotion)}
          className={`px-3 py-1 rounded-full text-sm ${
            selected.has(emotion) 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {emotion}
        </button>
      ))}
    </div>
  )
}

function LocationSelection({ onSelect }: ChipsProps) {
  const regions = ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania']
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const handleSelect = (region: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(region)) {
      newSelected.delete(region)
    } else {
      newSelected.add(region)
    }
    setSelected(newSelected)
    onSelect(newSelected)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {regions.map(region => (
        <button
          key={region}
          onClick={() => handleSelect(region)}
          className={`px-3 py-1 rounded-full text-sm ${
            selected.has(region) 
              ? 'bg-purple-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {region}
        </button>
      ))}
    </div>
  )
}

function TimeSlots({ onSelect }: ChipsProps) {
  const timeSlots = ['Morning', 'Afternoon', 'Evening', 'Night']
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const handleSelect = (slot: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(slot)) {
      newSelected.delete(slot)
    } else {
      newSelected.add(slot)
    }
    setSelected(newSelected)
    onSelect(newSelected)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {timeSlots.map(slot => (
        <button
          key={slot}
          onClick={() => handleSelect(slot)}
          className={`px-3 py-1 rounded-full text-sm ${
            selected.has(slot) 
              ? 'bg-orange-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {slot}
        </button>
      ))}
    </div>
  )
}

export function FilterCategories({ onFilterUpdate }: FilterCategoriesProps) {
  const [activeCategory, setActiveCategory] = useState<string>('patterns')

  return (
    <div className="filter-categories">
      <button 
        className={`filter-btn ${activeCategory === 'patterns' ? 'active' : ''}`}
        onClick={() => setActiveCategory('patterns')}
      >
        Voice Patterns
      </button>
      <button 
        className={`filter-btn ${activeCategory === 'emotions' ? 'active' : ''}`}
        onClick={() => setActiveCategory('emotions')}
      >
        Emotional Context
      </button>
      <button 
        className={`filter-btn ${activeCategory === 'regions' ? 'active' : ''}`}
        onClick={() => setActiveCategory('regions')}
      >
        Geographic Regions
      </button>
      <button 
        className={`filter-btn ${activeCategory === 'times' ? 'active' : ''}`}
        onClick={() => setActiveCategory('times')}
      >
        Time Patterns
      </button>

      <div className="dynamic-filter-content">
        {activeCategory === 'patterns' && (
          <VoicePatternChips 
            onSelect={(patterns) => onFilterUpdate({ type: 'patterns', value: patterns })} 
          />
        )}
        {activeCategory === 'emotions' && (
          <EmotionTags 
            onSelect={(emotions) => onFilterUpdate({ type: 'emotions', value: emotions })} 
          />
        )}
        {activeCategory === 'regions' && (
          <LocationSelection 
            onSelect={(regions) => onFilterUpdate({ type: 'regions', value: regions })} 
          />
        )}
        {activeCategory === 'times' && (
          <TimeSlots 
            onSelect={(times) => onFilterUpdate({ type: 'times', value: times })} 
          />
        )}
      </div>
    </div>
  )
}

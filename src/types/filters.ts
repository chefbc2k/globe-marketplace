export interface FilterState {
  selectedPatterns: Set<string>
  selectedEmotions: Set<string>
  selectedRegions: Set<string>
  selectedTimes: Set<string>
}

export interface FilterStateUpdate {
  type: 'patterns' | 'emotions' | 'regions' | 'times'
  value: Set<string>
}

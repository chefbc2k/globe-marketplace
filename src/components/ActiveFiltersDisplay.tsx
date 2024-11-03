import { FilterState } from "@/types/filters"

interface ActiveFiltersDisplayProps {
  filterState: FilterState
}

export function ActiveFiltersDisplay({ filterState }: ActiveFiltersDisplayProps) {
  return (
    <div className="active-filters-display">
      {filterState.selectedPatterns.size > 0 && (
        <div className="filter-group">
          <h4>Voice Patterns:</h4>
          {Array.from(filterState.selectedPatterns).map(pattern => (
            <span key={pattern} className="filter-tag">{pattern}</span>
          ))}
        </div>
      )}
      {/* Similar sections for emotions, regions, and times */}
    </div>
  )
}

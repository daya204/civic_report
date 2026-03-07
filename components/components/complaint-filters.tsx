"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { regions, categoryLabels } from "@/lib/mock-data"

interface ComplaintFiltersProps {
  selectedRegion: string
  onRegionChange: (region: string) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

export function ComplaintFilters({
  selectedRegion,
  onRegionChange,
  selectedCategory,
  onCategoryChange,
}: ComplaintFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={selectedRegion} onValueChange={onRegionChange}>
        <SelectTrigger className="w-[160px] h-9 text-sm">
          <SelectValue placeholder="Region" />
        </SelectTrigger>
        <SelectContent>
          {regions.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[160px] h-9 text-sm">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

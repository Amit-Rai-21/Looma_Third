"use client"

import type { School } from "@/lib/types" // Import the type

// Define the interface to match what Dashboard is passing
interface NepalMapProps {
  schools: School[];
  onSchoolSelect: (school: School | null) => void;
}

export function NepalMap({ schools, onSchoolSelect }: NepalMapProps) {
  return (
    <div className="w-full bg-card rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-orange-500">
          Looma School Locations Map
        </h2>
        <p className="text-sm text-muted-foreground">
          Discover schools using Looma devices throughout Nepal
        </p>
      </div>

      {/* Google My Maps Embed */}
      <div className="w-full h-[600px]">
        <div className="w-full h-[600px] overflow-hidden rounded-lg shadow-lg">
          <iframe 
            src="https://www.google.com/maps/d/u/0/embed?mid=1Q8VyoKNEFL4avhpo0sLgUUqC_-j73kA&ehbc=2E312F" 
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    </div>
  )
}
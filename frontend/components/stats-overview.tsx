"use client"

import type { School } from "@/lib/types"

interface StatsOverviewProps {
  schools: School[]
}

// This component is now hidden/empty as per user request
// Simply don't render this component in your dashboard page
// Or you can keep it but return null

export function StatsOverview({ schools }: StatsOverviewProps) {
  // Component is intentionally empty - stats cards removed
  return null
}
'use client'
import { differenceInHours, parseISO } from 'date-fns'

export default function NewBadge({ createdAt }) {
  if (!createdAt) return null

  const now = new Date()
  const created = typeof createdAt === 'string' ? parseISO(createdAt) : createdAt
  const hoursAgo = differenceInHours(now, created)

  if (hoursAgo < 24) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-300 whitespace-nowrap">
        New - {hoursAgo}h ago
      </span>
    )
  }

  if (hoursAgo < 48) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 border border-amber-300 whitespace-nowrap">
        New - {hoursAgo}h ago
      </span>
    )
  }

  return null
}

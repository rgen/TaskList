'use client'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'

function formatWeek(dateStr) {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr)
    return `Week of ${format(d, 'MM-dd-yyyy')}`
  } catch {
    return String(dateStr)
  }
}

export default function WeeklyHoursReport() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['goals', 'weekly-hours'],
    queryFn: () => fetch('/api/goals/weekly-hours').then((r) => r.json()),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading…</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500 text-sm">Error: {error.message}</div>
  }

  if (!data?.weeks?.length) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No hours logged yet. Log hours on tasks to see the weekly breakdown.
      </div>
    )
  }

  const { categories, weeks, totals, weekCount } = data

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        {/* Category headers */}
        <thead>
          <tr style={{ backgroundColor: 'var(--bg-table-header, #f9fafb)' }}>
            <th
              className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider"
              style={{ color: 'var(--text-secondary, #6b7280)', borderBottom: '2px solid var(--border-card, #e5e7eb)' }}
            >
              Week
            </th>
            {categories.map((cat) => (
              <th
                key={cat.name}
                className="text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-wider"
                style={{ color: 'var(--text-secondary, #6b7280)', borderBottom: '2px solid var(--border-card, #e5e7eb)' }}
              >
                {cat.name}
              </th>
            ))}
            <th
              className="text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-wider"
              style={{ color: 'var(--text-primary, #111827)', borderBottom: '2px solid var(--border-card, #e5e7eb)' }}
            >
              Totals
            </th>
          </tr>
        </thead>

        <tbody>
          {weeks.map((week, i) => (
            <tr
              key={week.week_start}
              className="transition-colors"
              style={{
                borderBottom: '1px solid var(--border-card, #f3f4f6)',
                backgroundColor: i % 2 === 0 ? undefined : 'var(--bg-body, #f9fafb)',
              }}
            >
              <td className="px-4 py-2.5 font-medium whitespace-nowrap" style={{ color: 'var(--accent, #2563eb)' }}>
                {formatWeek(week.week_start)}
              </td>
              {categories.map((cat) => {
                const hours = week.categories[cat.name] || 0
                return (
                  <td
                    key={cat.name}
                    className="px-4 py-2.5 text-right tabular-nums"
                    style={{ color: hours > 0 ? 'var(--text-primary, #111827)' : 'var(--text-muted, #d1d5db)' }}
                  >
                    {hours > 0 ? hours.toFixed(2) : '-'}
                  </td>
                )
              })}
              <td className="px-4 py-2.5 text-right font-semibold tabular-nums" style={{ color: 'var(--text-primary, #111827)' }}>
                {week.total.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>

        {/* Totals footer */}
        <tfoot>
          <tr style={{ borderTop: '2px solid var(--border-card, #e5e7eb)', backgroundColor: 'var(--bg-table-header, #f9fafb)' }}>
            <td className="px-4 py-2.5 font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
              Totals ({weekCount} weeks)
            </td>
            {categories.map((cat) => (
              <td key={cat.name} className="px-4 py-2.5 text-right font-semibold tabular-nums" style={{ color: 'var(--text-primary, #111827)' }}>
                {totals.categories[cat.name]?.toFixed(2) || '0.00'}
              </td>
            ))}
            <td className="px-4 py-2.5 text-right font-bold tabular-nums" style={{ color: 'var(--text-primary, #111827)' }}>
              {totals.total.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

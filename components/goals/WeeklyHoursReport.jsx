'use client'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import clsx from 'clsx'

function formatWeek(dateStr) {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr)
    return `Week of ${format(d, 'MM-dd-yyyy')}`
  } catch {
    return String(dateStr)
  }
}

function PctBadge({ pct }) {
  if (pct === null || pct === undefined) return null
  return (
    <span className={clsx(
      'text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1',
      pct >= 100 ? 'bg-green-100 text-green-700' :
      pct >= 75 ? 'bg-blue-100 text-blue-700' :
      pct >= 50 ? 'bg-yellow-100 text-yellow-700' :
      'bg-red-100 text-red-700'
    )}>
      {pct}%
    </span>
  )
}

function HoursCell({ logged, goal, pct }) {
  const hasValue = logged > 0
  return (
    <td className="px-4 py-2.5 text-right whitespace-nowrap" style={{ color: hasValue ? 'var(--text-primary, #111827)' : 'var(--text-muted, #d1d5db)' }}>
      {hasValue ? (
        <span className="tabular-nums">
          {logged.toFixed(2)}
          {goal !== null && (
            <span className="text-xs" style={{ color: 'var(--text-secondary, #6b7280)' }}>
              /{goal.toFixed(0)}h
            </span>
          )}
          <PctBadge pct={pct} />
        </span>
      ) : '-'}
    </td>
  )
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
                const cell = week.categories[cat.name] || { logged: 0, goal: null, pct: null }
                return (
                  <HoursCell
                    key={cat.name}
                    logged={cell.logged}
                    goal={cell.goal}
                    pct={cell.pct}
                  />
                )
              })}
              <td className="px-4 py-2.5 text-right font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary, #111827)' }}>
                <span className="tabular-nums">
                  {week.totalLogged.toFixed(2)}
                  {week.totalGoal !== null && (
                    <span className="text-xs" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                      /{week.totalGoal.toFixed(0)}h
                    </span>
                  )}
                  <PctBadge pct={week.totalPct} />
                </span>
              </td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr style={{ borderTop: '2px solid var(--border-card, #e5e7eb)', backgroundColor: 'var(--bg-table-header, #f9fafb)' }}>
            <td className="px-4 py-2.5 font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
              Totals ({weekCount} weeks)
            </td>
            {categories.map((cat) => {
              const cell = totals.categories[cat.name] || { logged: 0, goal: null, pct: null }
              return (
                <td key={cat.name} className="px-4 py-2.5 text-right font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary, #111827)' }}>
                  <span className="tabular-nums">
                    {cell.logged.toFixed(2)}
                    {cell.goal !== null && (
                      <span className="text-xs" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                        /{cell.goal.toFixed(0)}h
                      </span>
                    )}
                    <PctBadge pct={cell.pct} />
                  </span>
                </td>
              )
            })}
            <td className="px-4 py-2.5 text-right font-bold whitespace-nowrap" style={{ color: 'var(--text-primary, #111827)' }}>
              <span className="tabular-nums">
                {totals.totalLogged.toFixed(2)}
                {totals.totalGoal !== null && (
                  <span className="text-xs" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                    /{totals.totalGoal.toFixed(0)}h
                  </span>
                )}
                <PctBadge pct={totals.totalPct} />
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

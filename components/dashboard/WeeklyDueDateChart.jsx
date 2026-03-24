'use client'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'

const BUCKETS = [
  { key: 'overdue',   label: 'Overdue',    color: '#ef4444', nav: '/tasks?overdue=true' },
  { key: 'this_week', label: 'This Week',  color: '#10b981', nav: null },
  { key: 'next_week', label: 'Next Week',  color: '#3b82f6', nav: null },
  { key: 'week_3',    label: 'Week 3',     color: '#8b5cf6', nav: null },
  { key: 'week_4',    label: 'Week 4',     color: '#f59e0b', nav: null },
  { key: 'week_5plus',label: 'Week 5+',    color: '#6366f1', nav: null },
]

function getWeekStart(weekOffset) {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7)
  return monday.toISOString().slice(0, 10)
}

function CustomXAxisTick({ x, y, payload }) {
  const isOverdue = payload.value === 'Overdue'
  return (
    <text x={x} y={y + 10} textAnchor="middle" fontSize={11} fill={isOverdue ? '#ef4444' : '#6b7280'} fontWeight={isOverdue ? 600 : 400}>
      {payload.value}
    </text>
  )
}

export default function WeeklyDueDateChart({ data }) {
  const router = useRouter()

  const bucketMap = Object.fromEntries((data ?? []).map((r) => [r.bucket, r.count]))

  const weekOffsets = { this_week: 0, next_week: 1, week_3: 2, week_4: 3 }
  const chartData = BUCKETS.map((b) => {
    let nav = b.nav
    if (!nav) {
      if (b.key === 'week_5plus') {
        nav = `/tasks?due_date_from=${getWeekStart(4)}`
      } else {
        nav = `/tasks?week_start=${getWeekStart(weekOffsets[b.key])}`
      }
    }
    return { ...b, count: bucketMap[b.key] ?? 0, nav }
  })

  const hasData = chartData.some((d) => d.count > 0)
  if (!hasData) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No upcoming tasks with due dates</div>
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        onClick={(e) => {
          if (e?.activePayload?.[0]) {
            const { nav } = e.activePayload[0].payload
            if (nav) router.push(nav)
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={<CustomXAxisTick />} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
          formatter={(value) => [value, 'Tasks']}
        />
        <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

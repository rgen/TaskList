'use client'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'

function formatWeek(weekStart) {
  const date = new Date(weekStart + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function WeeklyDueDateChart({ data }) {
  const router = useRouter()

  if (!data?.length) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No due date data</div>
  }

  const chartData = data.map((row) => ({ ...row, label: formatWeek(row.week_start) }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        onClick={(e) => {
          if (e?.activePayload?.[0]) {
            const { week_start } = e.activePayload[0].payload
            if (week_start) router.push(`/tasks?due_date=${week_start}`)
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
          formatter={(value) => [value, 'Tasks']}
          labelFormatter={(label) => `Week of ${label}`}
        />
        <Bar dataKey="count" name="Tasks" fill="#3b82f6" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={entry.week_start} fill={index % 2 === 0 ? '#3b82f6' : '#6366f1'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

'use client'
import { useRouter } from 'next/navigation'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

const STATUS_COLORS = {
  completed: '#22c55e',
  pending: '#f59e0b',
  in_progress: '#3b82f6',
}

const FALLBACK_COLORS = ['#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#64748b']

function getColor(status, index) {
  return STATUS_COLORS[status] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

function capitalize(str) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function StatusDonutChart({ summary }) {
  const router = useRouter()

  if (!summary?.byStatus) return null

  const data = summary.byStatus
    .filter((s) => s.count > 0)
    .map((s) => ({ name: capitalize(s.status), status: s.status, value: s.count }))

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data yet</div>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
          onClick={(entry) => router.push(`/tasks?status=${entry.status}`)}
          style={{ cursor: 'pointer' }}
        >
          {data.map((entry, index) => (
            <Cell key={entry.status} fill={getColor(entry.status, index)} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [value, name]}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

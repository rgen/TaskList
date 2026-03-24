'use client'
import { useRouter } from 'next/navigation'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = {
  Completed: '#22c55e',
  Pending: '#f59e0b',
  Overdue: '#ef4444',
}

const LINKS = {
  Completed: '/tasks?status=completed',
  Pending: '/tasks?status=pending',
  Overdue: '/tasks?overdue=true',
}

export default function StatusDonutChart({ summary }) {
  const router = useRouter()

  if (!summary) return null

  const data = [
    { name: 'Completed', value: summary.completed },
    { name: 'Pending', value: summary.pending - summary.overdue },
    { name: 'Overdue', value: summary.overdue },
  ].filter((d) => d.value > 0)

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
          onClick={(entry) => router.push(LINKS[entry.name])}
          style={{ cursor: 'pointer' }}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] || '#94a3b8'} />
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

'use client'
import { useRouter } from 'next/navigation'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = {
  high: '#f43f5e',
  medium: '#e879f9',
  low: '#a3e635',
}

export default function PriorityBarChart({ byPriority }) {
  const router = useRouter()

  if (!byPriority) return null

  const data = [
    { name: 'High', key: 'high', value: byPriority.high },
    { name: 'Medium', key: 'medium', value: byPriority.medium },
    { name: 'Low', key: 'low', value: byPriority.low },
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
          onClick={(entry) => router.push(`/tasks?priority=${entry.key}`)}
          style={{ cursor: 'pointer' }}
        >
          {data.map((entry) => (
            <Cell key={entry.key} fill={COLORS[entry.key]} />
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

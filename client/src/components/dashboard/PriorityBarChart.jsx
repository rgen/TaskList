import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'

const COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#94a3b8',
}

export default function PriorityBarChart({ byPriority }) {
  if (!byPriority) return null

  const data = [
    { name: 'High', value: byPriority.high, key: 'high' },
    { name: 'Medium', value: byPriority.medium, key: 'medium' },
    { name: 'Low', value: byPriority.low, key: 'low' },
  ]

  if (data.every((d) => d.value === 0)) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} width={55} />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
          formatter={(value) => [value, 'Tasks']}
        />
        <Bar dataKey="value" name="Tasks" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell key={entry.key} fill={COLORS[entry.key]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

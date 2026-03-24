'use client'
import { useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'

export default function CompletionLineChart({ data = [] }) {
  const router = useRouter()

  if (!data.length) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data yet</div>
  }

  const formatted = data.map((d) => ({
    ...d,
    label: (() => {
      try { return format(parseISO(d.date), 'MMM d') } catch { return d.date }
    })(),
  }))

  const tickFormatter = (value, index) => (index % 5 === 0 ? value : '')

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart
        data={formatted}
        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
        onClick={(e) => { if (e?.activePayload?.[0]) router.push(`/tasks?status=completed`) }}
        style={{ cursor: 'pointer' }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={tickFormatter} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
          labelFormatter={(label) => label}
          formatter={(value) => [value, 'Completed']}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, style: { cursor: 'pointer' } }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

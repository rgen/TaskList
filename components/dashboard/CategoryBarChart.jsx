'use client'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#f43f5e', '#a3e635']

export default function CategoryBarChart({ byCategory }) {
  const router = useRouter()

  if (!byCategory?.length) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data yet</div>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={byCategory}
        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
        onClick={(e) => {
          if (e?.activePayload?.[0]) {
            const { category_id } = e.activePayload[0].payload
            if (category_id) router.push(`/tasks?category_id=${category_id}`)
            else router.push('/tasks')
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
          formatter={(value) => [value, 'Tasks']}
        />
        <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
          {byCategory.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

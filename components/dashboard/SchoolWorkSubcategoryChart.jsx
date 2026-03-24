'use client'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#f43f5e', '#14b8a6']

export default function SchoolWorkSubcategoryChart({ data }) {
  const router = useRouter()

  if (!data?.length) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No subcategory data for School Work</div>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
        onClick={(e) => {
          if (e?.activePayload?.[0]) {
            const { subcategory_id } = e.activePayload[0].payload
            if (subcategory_id) router.push(`/tasks?subcategory_id=${subcategory_id}`)
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
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

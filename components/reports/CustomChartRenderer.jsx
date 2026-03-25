'use client'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'

const COLOR_SCHEMES = {
  default: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f43f5e', '#84cc16', '#a855f7', '#14b8a6'],
  warm:    ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#f43f5e', '#e11d48', '#dc2626', '#d97706', '#b91c1c', '#a16207'],
  cool:    ['#3b82f6', '#06b6d4', '#8b5cf6', '#6366f1', '#0ea5e9', '#14b8a6', '#2563eb', '#7c3aed', '#0891b2', '#4f46e5'],
  pastel:  ['#93c5fd', '#c4b5fd', '#86efac', '#fcd34d', '#fca5a5', '#67e8f9', '#fda4af', '#d9f99d', '#d8b4fe', '#99f6e4'],
}

const STATUS_LABELS = { pending: 'Pending', completed: 'Completed', in_progress: 'In Progress', archived: 'Archived' }
const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' }

// Reverse lookup: label → raw key
const STATUS_KEYS = Object.fromEntries(Object.entries(STATUS_LABELS).map(([k, v]) => [v, k]))
const PRIORITY_KEYS = Object.fromEntries(Object.entries(PRIORITY_LABELS).map(([k, v]) => [v, k]))

function computeChartData(tasks, dataSource, config) {
  const filtered = tasks.filter((t) => {
    if (config.filter_status && t.status !== config.filter_status) return false
    if (config.filter_priority && t.priority !== config.filter_priority) return false
    if (config.filter_category_id && t.category_id !== Number(config.filter_category_id)) return false
    if (config.filter_category_name && (t.category_name || '').toLowerCase() !== config.filter_category_name.toLowerCase()) return false
    if (config.exclude_archived !== false && t.status === 'archived') return false
    if (config.exclude_completed && t.status === 'completed') return false
    return true
  })

  switch (dataSource) {
    case 'status': {
      const counts = {}
      filtered.forEach((t) => {
        const key = t.status || 'unknown'
        counts[key] = (counts[key] || 0) + 1
      })
      return Object.entries(counts).map(([key, value]) => ({
        name: STATUS_LABELS[key] || key,
        value,
        _key: key,
      }))
    }

    case 'priority': {
      const counts = { high: 0, medium: 0, low: 0 }
      filtered.forEach((t) => {
        if (counts[t.priority] !== undefined) counts[t.priority]++
      })
      return Object.entries(counts).map(([key, value]) => ({
        name: PRIORITY_LABELS[key],
        value,
        _key: key,
      }))
    }

    case 'category': {
      const groups = {}
      filtered.forEach((t) => {
        const name = t.category_name || 'Uncategorized'
        if (!groups[name]) groups[name] = { count: 0, id: t.category_id }
        groups[name].count++
      })
      return Object.entries(groups)
        .map(([name, { count, id }]) => ({ name, value: count, _key: id }))
        .sort((a, b) => b.value - a.value)
    }

    case 'subcategory': {
      const groups = {}
      filtered.forEach((t) => {
        const name = t.subcategory_name || 'None'
        if (!groups[name]) groups[name] = { count: 0, id: t.subcategory_id }
        groups[name].count++
      })
      return Object.entries(groups)
        .map(([name, { count, id }]) => ({ name, value: count, _key: id }))
        .sort((a, b) => b.value - a.value)
    }

    case 'due_date': {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const buckets = { Overdue: 0, Today: 0, 'This Week': 0, 'Next Week': 0, 'Later': 0, 'No Date': 0 }

      filtered.forEach((t) => {
        if (!t.due_date) { buckets['No Date']++; return }
        const d = new Date(t.due_date)
        const diff = Math.floor((d - today) / 86400000)
        if (diff < 0) buckets['Overdue']++
        else if (diff === 0) buckets['Today']++
        else if (diff <= 7) buckets['This Week']++
        else if (diff <= 14) buckets['Next Week']++
        else buckets['Later']++
      })

      return Object.entries(buckets)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value, _key: name }))
    }

    case 'duration': {
      const buckets = { 'No Duration': 0, '< 30 min': 0, '30-60 min': 0, '1-2 hours': 0, '2+ hours': 0 }
      filtered.forEach((t) => {
        if (!t.duration) { buckets['No Duration']++; return }
        if (t.duration < 30) buckets['< 30 min']++
        else if (t.duration <= 60) buckets['30-60 min']++
        else if (t.duration <= 120) buckets['1-2 hours']++
        else buckets['2+ hours']++
      })
      return Object.entries(buckets)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    }

    case 'created_trend': {
      const days = config.trend_days || 14
      const counts = {}
      const now = new Date()
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        counts[d.toISOString().slice(0, 10)] = 0
      }
      filtered.forEach((t) => {
        if (!t.created_at) return
        const day = t.created_at.slice(0, 10)
        if (counts[day] !== undefined) counts[day]++
      })
      return Object.entries(counts).map(([date, value]) => ({
        name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value,
      }))
    }

    case 'completion_rate': {
      const counts = { Completed: 0, Incomplete: 0 }
      filtered.forEach((t) => {
        if (t.status === 'completed') counts['Completed']++
        else counts['Incomplete']++
      })
      return Object.entries(counts).map(([name, value]) => ({
        name,
        value,
        _key: name === 'Completed' ? 'completed' : 'pending',
      }))
    }

    case 'due_this_week': {
      const now = new Date()
      const days = []
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      for (let i = 0; i < 7; i++) {
        const d = new Date(now)
        d.setDate(d.getDate() + i)
        const dateStr = d.toISOString().slice(0, 10)
        const count = filtered.filter((t) => t.due_date === dateStr).length
        days.push({ name: dayNames[d.getDay()], value: count, _key: dateStr })
      }
      return days
    }

    case 'due_by_week': {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const dayOfWeek = today.getDay()
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - dayOfWeek)

      const buckets = [
        { name: 'Overdue', value: 0, _key: 'overdue' },
        { name: 'This Week', value: 0, _key: 'this_week' },
        { name: 'Next Week', value: 0, _key: 'next_week' },
        { name: 'Week 3', value: 0, _key: 'week_3' },
        { name: 'Week 4', value: 0, _key: 'week_4' },
        { name: 'Week 5+', value: 0, _key: 'week_5plus' },
      ]

      filtered.forEach((t) => {
        if (!t.due_date || t.status === 'completed') return
        const d = new Date(t.due_date)
        const diffDays = Math.floor((d - weekStart) / 86400000)
        if (diffDays < 0) buckets[0].value++
        else if (diffDays < 7) buckets[1].value++
        else if (diffDays < 14) buckets[2].value++
        else if (diffDays < 21) buckets[3].value++
        else if (diffDays < 28) buckets[4].value++
        else buckets[5].value++
      })

      return buckets
    }

    default:
      return []
  }
}

function getWeekStartDate(weekOffset) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayOfWeek = today.getDay()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - dayOfWeek + weekOffset * 7)
  return weekStart.toISOString().slice(0, 10)
}

function getNavUrl(dataSource, entry) {
  if (!entry?._key && entry?._key !== 0) return null

  switch (dataSource) {
    case 'status':
      return `/tasks?status=${entry._key}`
    case 'priority':
      return `/tasks?priority=${entry._key}`
    case 'category':
      return entry._key ? `/tasks?category_id=${entry._key}` : '/tasks'
    case 'subcategory':
      return entry._key ? `/tasks?subcategory_id=${entry._key}` : '/tasks'
    case 'completion_rate':
      return `/tasks?status=${entry._key}`
    case 'due_this_week':
      return `/tasks?due_date=${entry._key}`
    case 'due_date': {
      if (entry._key === 'Overdue') return '/tasks?overdue=true'
      if (entry._key === 'Today') return `/tasks?due_date=${new Date().toISOString().slice(0, 10)}`
      if (entry._key === 'This Week') return `/tasks?week_start=${getWeekStartDate(0)}`
      if (entry._key === 'Next Week') return `/tasks?week_start=${getWeekStartDate(1)}`
      if (entry._key === 'Later') return `/tasks?due_date_from=${getWeekStartDate(2)}`
      return '/tasks'
    }
    case 'due_by_week': {
      if (entry._key === 'overdue') return '/tasks?overdue=true'
      if (entry._key === 'this_week') return `/tasks?week_start=${getWeekStartDate(0)}`
      if (entry._key === 'next_week') return `/tasks?week_start=${getWeekStartDate(1)}`
      if (entry._key === 'week_3') return `/tasks?week_start=${getWeekStartDate(2)}`
      if (entry._key === 'week_4') return `/tasks?week_start=${getWeekStartDate(3)}`
      if (entry._key === 'week_5plus') return `/tasks?due_date_from=${getWeekStartDate(4)}`
      return '/tasks'
    }
    default:
      return null
  }
}

const RADIAN = Math.PI / 180
function renderDonutLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <g>
      <text x={x} y={y - 7} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
        {value}
      </text>
      <text x={x} y={y + 7} fill="rgba(255,255,255,0.85)" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={500}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  )
}

function donutTooltipFormatter(value, name, props) {
  const percent = props?.payload?.percent
    ? `${(props.payload.percent * 100).toFixed(1)}%`
    : ''
  return [`${value} (${percent})`, name]
}

export default function CustomChartRenderer({ chart, tasks }) {
  const router = useRouter()
  const colors = COLOR_SCHEMES[chart.config?.color_scheme] || COLOR_SCHEMES.default

  const data = useMemo(
    () => computeChartData(tasks, chart.data_source, chart.config || {}),
    [tasks, chart.data_source, chart.config]
  )

  function handleClick(entry) {
    const url = getNavUrl(chart.data_source, entry)
    if (url) router.push(url)
  }

  function handleBarClick(chartEvent) {
    if (chartEvent?.activePayload?.[0]) {
      handleClick(chartEvent.activePayload[0].payload)
    }
  }

  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        No data available
      </div>
    )
  }

  const hasNav = data.some((d) => getNavUrl(chart.data_source, d))
  const cursorStyle = hasNav ? { cursor: 'pointer' } : {}

  switch (chart.chart_type) {
    case 'donut':
      return (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={100}
              paddingAngle={2}
              labelLine={false}
              label={renderDonutLabel}
              onClick={handleClick}
              style={cursorStyle}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={donutTooltipFormatter} />
            <Legend formatter={(value, entry) => {
              const item = data.find((d) => d.name === value)
              return item ? `${value} (${item.value})` : value
            }} />
          </PieChart>
        </ResponsiveContainer>
      )

    case 'bar_vertical':
      return (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }} onClick={handleBarClick} style={cursorStyle}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )

    case 'bar_horizontal':
      return (
        <ResponsiveContainer width="100%" height={Math.max(260, data.length * 40 + 40)}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 80 }} onClick={handleBarClick} style={cursorStyle}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={75} />
            <Tooltip />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )

    default:
      return <div className="text-gray-400 text-sm text-center py-8">Unknown chart type</div>
  }
}

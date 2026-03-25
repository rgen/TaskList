'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDashboardSummary, useDashboardWeek } from '@/hooks/useDashboard'
import { useCustomCharts } from '@/hooks/useCustomCharts'
import { useTasks } from '@/hooks/useTasks'
import CustomChartRenderer from '@/components/reports/CustomChartRenderer'
import StatusDonutChart from './StatusDonutChart'
import WeeklyBarChart from './WeeklyBarChart'
import PriorityBarChart from './PriorityBarChart'
import CategoryBarChart from './CategoryBarChart'
import SchoolWorkSubcategoryChart from './SchoolWorkSubcategoryChart'
import WeeklyDueDateChart from './WeeklyDueDateChart'

const STORAGE_KEY = 'dashboard_chart_order'

const DEFAULT_CHARTS = [
  { id: 'status',      title: 'Task Status Breakdown',              span: 'half' },
  { id: 'weekly',      title: 'Tasks Due This Week',                span: 'half' },
  { id: 'priority',    title: 'Tasks by Priority',                  span: 'half' },
  { id: 'category',    title: 'Tasks by Category',                  span: 'half' },
  { id: 'schoolwork',  title: 'School Work — Tasks by Subcategory', span: 'full' },
  { id: 'weeklydue',   title: 'Tasks Due by Week',                  span: 'full' },
]

function StatCard({ label, value, colorClass = 'text-gray-900', href }) {
  const content = (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 transition-colors ${href ? 'hover:border-blue-300 hover:shadow-md cursor-pointer' : ''}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colorClass}`}>{value ?? '—'}</p>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

function SortableChartCard({ chart, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chart.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    gridColumn: chart.span === 'full' ? 'span 2 / span 2' : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-5 pt-4 pb-0">
        <h3 className="text-sm font-semibold text-gray-700">{chart.title}</h3>
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1 rounded touch-none"
          title="Drag to reorder"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="4" r="1.5" /><circle cx="11" cy="4" r="1.5" />
            <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="12" r="1.5" /><circle cx="11" cy="12" r="1.5" />
          </svg>
        </button>
      </div>
      <div className="px-5 pb-5 pt-3">{children}</div>
    </div>
  )
}

export default function DashboardGrid() {
  const { data: summary, isLoading: sumLoading } = useDashboardSummary()
  const { data: week, isLoading: weekLoading } = useDashboardWeek()
  const { data: customCharts = [] } = useCustomCharts()
  const { data: allTasks = [] } = useTasks()

  // Custom charts that should show on dashboard
  const dashboardCustomCharts = customCharts.filter((c) => c.show_on_dashboard)

  const [charts, setCharts] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_CHARTS
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      if (!saved.length) return DEFAULT_CHARTS
      const savedIds = saved.map((c) => c.id)
      const newCharts = DEFAULT_CHARTS.filter((c) => !savedIds.includes(c.id))
      return [...saved.map((s) => DEFAULT_CHARTS.find((d) => d.id === s.id)).filter(Boolean), ...newCharts]
    } catch {
      return DEFAULT_CHARTS
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(charts.map((c) => ({ id: c.id }))))
  }, [charts])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setCharts((prev) => {
        const oldIndex = prev.findIndex((c) => c.id === active.id)
        const newIndex = prev.findIndex((c) => c.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }, [])

  const loading = <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading…</div>

  function renderChart(chart) {
    switch (chart.id) {
      case 'status':     return sumLoading  ? loading : <StatusDonutChart summary={summary} />
      case 'weekly':     return weekLoading ? loading : <WeeklyBarChart data={week} />
      case 'priority':   return sumLoading  ? loading : <PriorityBarChart byPriority={summary?.byPriority} />
      case 'category':   return sumLoading  ? loading : <CategoryBarChart byCategory={summary?.byCategory} />
      case 'schoolwork': return sumLoading  ? loading : <SchoolWorkSubcategoryChart data={summary?.schoolWorkSubcategories} />
      case 'weeklydue':  return sumLoading  ? loading : <WeeklyDueDateChart data={summary?.byWeek} />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Tasks"  value={sumLoading ? '…' : summary?.total}     href="/tasks" />
        <StatCard label="Completed"    value={sumLoading ? '…' : summary?.completed} colorClass="text-green-600"  href="/tasks?status=completed" />
        <StatCard label="Pending"      value={sumLoading ? '…' : summary?.pending}   colorClass="text-amber-600"  href="/tasks?status=pending" />
        <StatCard label="Overdue"      value={sumLoading ? '…' : summary?.overdue}   colorClass="text-red-600"    href="/tasks?overdue=true" />
      </div>

      {/* Draggable charts */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={charts.map((c) => c.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {charts.map((chart) => (
              <SortableChartCard key={chart.id} chart={chart}>
                {renderChart(chart)}
              </SortableChartCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Custom charts from Reports */}
      {dashboardCustomCharts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Custom Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardCustomCharts.map((chart) => (
              <div
                key={chart.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm"
                style={{ gridColumn: chart.span === 'full' ? 'span 2 / span 2' : undefined }}
              >
                <div className="px-5 pt-4 pb-0">
                  <h3 className="text-sm font-semibold text-gray-700">{chart.name}</h3>
                </div>
                <div className="px-5 pb-5 pt-3">
                  <CustomChartRenderer chart={chart} tasks={allTasks} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

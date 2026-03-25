'use client'
import { useState, useCallback, useEffect } from 'react'
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
import { useDashboardSummary } from '@/hooks/useDashboard'
import { useCustomCharts } from '@/hooks/useCustomCharts'
import { useTasks } from '@/hooks/useTasks'
import { customChartsApi } from '@/lib/api/tasks'
import CustomChartRenderer from '@/components/reports/CustomChartRenderer'

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
        <h3 className="text-sm font-semibold text-gray-700">{chart.name}</h3>
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
  const { data: customCharts = [], isLoading: chartsLoading } = useCustomCharts()
  const { data: allTasks = [] } = useTasks()

  const [orderedCharts, setOrderedCharts] = useState([])

  // Sync ordered charts when data loads or changes
  useEffect(() => {
    const dashboard = customCharts.filter((c) => c.show_on_dashboard)
    setOrderedCharts(dashboard)
  }, [customCharts])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setOrderedCharts((prev) => {
      const oldIndex = prev.findIndex((c) => c.id === active.id)
      const newIndex = prev.findIndex((c) => c.id === over.id)
      const reordered = arrayMove(prev, oldIndex, newIndex)

      // Persist new positions to the database
      reordered.forEach((chart, i) => {
        if (chart.position !== i) {
          customChartsApi.update(chart.id, {
            name: chart.name,
            chart_type: chart.chart_type,
            data_source: chart.data_source,
            config: chart.config,
            span: chart.span,
            show_on_dashboard: chart.show_on_dashboard,
            position: i,
          }).catch(() => {})
        }
      })

      return reordered
    })
  }, [])

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Tasks"  value={sumLoading ? '…' : summary?.total}     href="/tasks" />
        <StatCard label="Completed"    value={sumLoading ? '…' : summary?.completed} colorClass="text-green-600"  href="/tasks?status=completed" />
        <StatCard label="Pending"      value={sumLoading ? '…' : summary?.pending}   colorClass="text-amber-600"  href="/tasks?status=pending" />
        <StatCard label="Overdue"      value={sumLoading ? '…' : summary?.overdue}   colorClass="text-red-600"    href="/tasks?overdue=true" />
      </div>

      {/* Custom charts */}
      {chartsLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading charts…</div>
      ) : orderedCharts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-500 text-sm">No charts to display</p>
          <p className="text-gray-400 text-xs mt-1">
            Create charts in <Link href="/customization/reports" className="text-blue-600 hover:underline">Customization &rarr; Reports</Link>
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedCharts.map((c) => c.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orderedCharts.map((chart) => (
                <SortableChartCard key={chart.id} chart={chart}>
                  <CustomChartRenderer chart={chart} tasks={allTasks} />
                </SortableChartCard>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

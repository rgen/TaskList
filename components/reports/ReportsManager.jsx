'use client'
import { useState } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useCustomCharts, useCreateCustomChart, useUpdateCustomChart, useDeleteCustomChart } from '@/hooks/useCustomCharts'
import CustomChartRenderer from './CustomChartRenderer'
import ChartFormModal from './ChartFormModal'
import clsx from 'clsx'

const CHART_TYPE_LABELS = {
  donut: 'Donut',
  bar_vertical: 'Vertical Bar',
  bar_horizontal: 'Horizontal Bar',
}

const DATA_SOURCE_LABELS = {
  status: 'Status',
  priority: 'Priority',
  category: 'Category',
  subcategory: 'Subcategory',
  due_date: 'Due Date',
  duration: 'Duration',
  created_trend: 'Creation Trend',
  completion_rate: 'Completion Rate',
}

export default function ReportsManager() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingChart, setEditingChart] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: charts = [], isLoading } = useCustomCharts()
  const { data: tasks = [] } = useTasks()
  const createMutation = useCreateCustomChart()
  const updateMutation = useUpdateCustomChart()
  const deleteMutation = useDeleteCustomChart()

  function openCreate() {
    setEditingChart(null)
    setModalOpen(true)
  }

  function openEdit(chart) {
    setEditingChart(chart)
    setModalOpen(true)
  }

  function handleSave(formData) {
    if (editingChart) {
      updateMutation.mutate(
        { id: editingChart.id, data: formData },
        { onSuccess: () => { setModalOpen(false); setEditingChart(null) } }
      )
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => { setModalOpen(false) },
      })
    }
  }

  function handleDelete(id) {
    deleteMutation.mutate(id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">
            Create custom charts and graphs that appear on your Dashboard.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chart
        </button>
      </div>

      {/* Chart list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Loading…</div>
      ) : charts.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-500 text-sm mb-1">No custom charts yet</p>
          <p className="text-gray-400 text-xs mb-4">Create your first chart to visualize your task data</p>
          <button
            onClick={openCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Create Your First Chart
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {charts.map((chart) => (
            <div
              key={chart.id}
              className={clsx(
                'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden',
                chart.span === 'full' && 'md:col-span-2'
              )}
            >
              {/* Chart header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-0">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">{chart.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase">
                      {CHART_TYPE_LABELS[chart.chart_type] || chart.chart_type}
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase">
                      {DATA_SOURCE_LABELS[chart.data_source] || chart.data_source}
                    </span>
                    {chart.show_on_dashboard && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 uppercase">
                        Dashboard
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(chart)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                    title="Edit chart"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(chart)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    title="Delete chart"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Chart content */}
              <div className="px-5 pb-5 pt-3">
                <CustomChartRenderer chart={chart} tasks={tasks} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <ChartFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingChart(null) }}
        onSave={handleSave}
        editingChart={editingChart}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Chart</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This will also remove it from your Dashboard.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

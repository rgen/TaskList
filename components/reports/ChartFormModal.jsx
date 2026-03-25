'use client'
import { useState, useEffect } from 'react'
import { useCategories } from '@/hooks/useCategories'
import CustomChartRenderer from './CustomChartRenderer'
import { useTasks } from '@/hooks/useTasks'
import clsx from 'clsx'

const CHART_TYPES = [
  { value: 'donut', label: 'Donut Chart', icon: '◐' },
  { value: 'bar_vertical', label: 'Vertical Bar', icon: '▮' },
  { value: 'bar_horizontal', label: 'Horizontal Bar', icon: '▬' },
]

const DATA_SOURCES = [
  { value: 'status', label: 'Status', desc: 'Group tasks by status' },
  { value: 'priority', label: 'Priority', desc: 'Group tasks by priority level' },
  { value: 'category', label: 'Category', desc: 'Group tasks by category' },
  { value: 'subcategory', label: 'Subcategory', desc: 'Group tasks by subcategory' },
  { value: 'due_date', label: 'Due Date', desc: 'Group tasks by due date range' },
  { value: 'duration', label: 'Duration', desc: 'Group tasks by estimated duration' },
  { value: 'created_trend', label: 'Creation Trend', desc: 'Tasks created per day' },
  { value: 'completion_rate', label: 'Completion Rate', desc: 'Completed vs incomplete' },
  { value: 'due_this_week', label: 'Due This Week', desc: 'Tasks due each day this week' },
  { value: 'due_by_week', label: 'Due by Week', desc: 'Tasks grouped by week buckets' },
]

const COLOR_SCHEMES = [
  { value: 'default', label: 'Default', colors: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'] },
  { value: 'warm', label: 'Warm', colors: ['#ef4444', '#f97316', '#f59e0b', '#eab308'] },
  { value: 'cool', label: 'Cool', colors: ['#3b82f6', '#06b6d4', '#8b5cf6', '#6366f1'] },
  { value: 'pastel', label: 'Pastel', colors: ['#93c5fd', '#c4b5fd', '#86efac', '#fcd34d'] },
]

const SPAN_OPTIONS = [
  { value: 'half', label: 'Half Width' },
  { value: 'full', label: 'Full Width' },
]

const EMPTY_FORM = {
  name: '',
  chart_type: 'donut',
  data_source: 'status',
  span: 'half',
  show_on_dashboard: true,
  config: {
    color_scheme: 'default',
    filter_status: '',
    filter_priority: '',
    filter_category_id: '',
    exclude_archived: true,
    exclude_completed: false,
    trend_days: 14,
  },
}

export default function ChartFormModal({ isOpen, onClose, onSave, editingChart, isPending }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const { data: categories = [] } = useCategories()
  const { data: tasks = [] } = useTasks()

  useEffect(() => {
    if (editingChart) {
      setForm({
        name: editingChart.name,
        chart_type: editingChart.chart_type,
        data_source: editingChart.data_source,
        span: editingChart.span || 'half',
        show_on_dashboard: editingChart.show_on_dashboard !== false,
        config: {
          color_scheme: 'default',
          filter_status: '',
          filter_priority: '',
          filter_category_id: '',
          exclude_archived: true,
          exclude_completed: false,
          trend_days: 14,
          ...editingChart.config,
        },
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [editingChart, isOpen])

  if (!isOpen) return null

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function updateConfig(field, value) {
    setForm((f) => ({ ...f, config: { ...f.config, [field]: value } }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave(form)
  }

  // Build preview chart object
  const previewChart = {
    chart_type: form.chart_type,
    data_source: form.data_source,
    config: form.config,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingChart ? 'Edit Chart' : 'Create New Chart'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x lg:divide-gray-200">
            {/* Left: Form */}
            <div className="p-6 space-y-5">
              {/* Chart Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chart Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. Tasks by Status"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Chart Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {CHART_TYPES.map((ct) => (
                    <button
                      key={ct.value}
                      type="button"
                      onClick={() => updateField('chart_type', ct.value)}
                      className={clsx(
                        'flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-sm font-medium transition-colors',
                        form.chart_type === ct.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      <span className="text-xl">{ct.icon}</span>
                      {ct.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Source</label>
                <div className="grid grid-cols-2 gap-2">
                  {DATA_SOURCES.map((ds) => (
                    <button
                      key={ds.value}
                      type="button"
                      onClick={() => updateField('data_source', ds.value)}
                      className={clsx(
                        'text-left p-2.5 rounded-lg border-2 transition-colors',
                        form.data_source === ds.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      <p className={clsx('text-sm font-medium', form.data_source === ds.value ? 'text-blue-700' : 'text-gray-700')}>
                        {ds.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{ds.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Scheme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color Scheme</label>
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_SCHEMES.map((cs) => (
                    <button
                      key={cs.value}
                      type="button"
                      onClick={() => updateConfig('color_scheme', cs.value)}
                      className={clsx(
                        'flex items-center gap-2 p-2.5 rounded-lg border-2 transition-colors',
                        form.config.color_scheme === cs.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex gap-1">
                        {cs.colors.map((c, i) => (
                          <span key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{cs.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dashboard Size</label>
                <div className="flex gap-2">
                  {SPAN_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => updateField('span', s.value)}
                      className={clsx(
                        'flex-1 py-2 text-sm font-medium rounded-lg border-2 transition-colors',
                        form.span === s.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filters (optional)</label>
                <div className="space-y-2">
                  <select
                    value={form.config.filter_status}
                    onChange={(e) => updateConfig('filter_status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>

                  <select
                    value={form.config.filter_priority}
                    onChange={(e) => updateConfig('filter_priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                  <select
                    value={form.config.filter_category_id}
                    onChange={(e) => updateConfig('filter_category_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Additional Options */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.config.exclude_archived}
                    onChange={(e) => updateConfig('exclude_archived', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  Exclude archived tasks
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.config.exclude_completed}
                    onChange={(e) => updateConfig('exclude_completed', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  Exclude completed tasks
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.show_on_dashboard}
                    onChange={(e) => updateField('show_on_dashboard', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  Show on Dashboard
                </label>
              </div>

              {/* Trend days (only for created_trend) */}
              {form.data_source === 'created_trend' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days to Show</label>
                  <select
                    value={form.config.trend_days}
                    onChange={(e) => updateConfig('trend_days', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value={7}>Last 7 days</option>
                    <option value={14}>Last 14 days</option>
                    <option value={30}>Last 30 days</option>
                  </select>
                </div>
              )}
            </div>

            {/* Right: Preview */}
            <div className="p-6 bg-gray-50">
              <p className="text-sm font-medium text-gray-500 mb-3">Live Preview</p>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 pt-4 pb-0">
                  <h3 className="text-sm font-semibold text-gray-700">{form.name || 'Untitled Chart'}</h3>
                </div>
                <div className="px-5 pb-5 pt-3">
                  <CustomChartRenderer chart={previewChart} tasks={tasks} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !form.name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Saving…' : editingChart ? 'Save Changes' : 'Create Chart'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'
import { useStatuses } from '@/hooks/useStatuses'
import { useCategories } from '@/hooks/useCategories'

export default function TaskFilters({ filters, onChange }) {
  const { data: customStatuses = [] } = useStatuses()
  const { data: categories = [] } = useCategories()

  function update(key, value) {
    const next = { ...filters, [key]: value || undefined }
    // Reset subcategory when category changes
    if (key === 'category_id') next.subcategory_id = undefined
    onChange(next)
  }

  const selectedCategory = categories.find((c) => String(c.id) === String(filters.category_id))
  const subcategories = selectedCategory?.subcategories || []

  const hasActiveFilters = filters.status || filters.priority || filters.category_id || filters.subcategory_id || filters.overdue || filters.due_date || filters.hide_goal_tasks

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Status filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600">Status</label>
        <select
          value={filters.status || ''}
          onChange={(e) => update('status', e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
          {customStatuses.map(s => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Priority filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600">Priority</label>
        <select
          value={filters.priority || ''}
          onChange={(e) => update('priority', e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Category</label>
          <select
            value={filters.category_id || ''}
            onChange={(e) => update('category_id', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Subcategory filter — only shown when a category with subcategories is selected */}
      {subcategories.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Subcategory</label>
          <select
            value={filters.subcategory_id || ''}
            onChange={(e) => update('subcategory_id', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            {subcategories.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Sort */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600">Sort</label>
        <select
          value={filters.sort || 'created_at'}
          onChange={(e) => update('sort', e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="created_at">Created</option>
          <option value="due_date">Due Date</option>
          <option value="priority">Priority</option>
          <option value="name">Name</option>
          <option value="updated_at">Updated</option>
        </select>
        <select
          value={filters.order || 'desc'}
          onChange={(e) => update('order', e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>

      {/* Goal Tasks toggle */}
      <button
        onClick={() => update('hide_goal_tasks', filters.hide_goal_tasks ? '' : 'true')}
        className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
          filters.hide_goal_tasks
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {filters.hide_goal_tasks ? 'Goal Tasks Hidden' : 'Hide Goal Tasks'}
      </button>

      {/* Show Archived toggle */}
      <button
        onClick={() => update('show_archived', filters.show_archived ? '' : 'true')}
        className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
          filters.show_archived
            ? 'bg-gray-700 text-white border-gray-700'
            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        {filters.show_archived ? 'Hide Archived' : 'Show Archived'}
      </button>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={() => onChange({ sort: filters.sort, order: filters.order })}
          className="text-sm text-blue-600 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

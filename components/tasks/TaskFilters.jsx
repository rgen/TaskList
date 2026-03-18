'use client'
import { useStatuses } from '@/hooks/useStatuses'

export default function TaskFilters({ filters, onChange }) {
  const { data: customStatuses = [] } = useStatuses()
  function update(key, value) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Status filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600">Status</label>
        <select
          value={filters.status || ''}
          onChange={(e) => update('status', e.target.value || undefined)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
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
          onChange={(e) => update('priority', e.target.value || undefined)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

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

      {/* Clear */}
      {(filters.status || filters.priority) && (
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

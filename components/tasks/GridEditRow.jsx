'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { useUpdateTask } from '@/hooks/useTasks'
import { useCategories } from '@/hooks/useCategories'
import { useStatuses } from '@/hooks/useStatuses'

export default function GridEditRow({ task, onDelete, onArchive }) {
  const updateMutation = useUpdateTask()
  const { data: categories = [] } = useCategories()
  const { data: customStatuses = [] } = useStatuses()

  const [fields, setFields] = useState({
    name: task.name || '',
    priority: task.priority || 'medium',
    status: task.status || 'pending',
    due_date: task.due_date || '',
    category_id: task.category_id ? String(task.category_id) : '',
    subcategory_id: task.subcategory_id ? String(task.subcategory_id) : '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const selectedCategory = categories.find((c) => String(c.id) === fields.category_id)
  const subcategories = selectedCategory?.subcategories || []

  function buildPayload(overrides = {}) {
    const f = { ...fields, ...overrides }
    const due = f.due_date || null
    return {
      name: f.name || task.name,
      priority: f.priority,
      status: f.status,
      due_date: due,
      duration: due
        ? Math.ceil((new Date(due) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24))
        : null,
      category_id: f.category_id ? Number(f.category_id) : null,
      subcategory_id: f.subcategory_id ? Number(f.subcategory_id) : null,
      source: task.source || null,
      notes: task.notes || null,
    }
  }

  function save(overrides = {}) {
    const payload = buildPayload(overrides)
    setSaving(true)
    updateMutation.mutate({ id: task.id, data: payload }, {
      onSuccess: () => {
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
      },
      onError: () => setSaving(false),
    })
  }

  function handleChange(key, value) {
    const update = { [key]: value }
    if (key === 'category_id') update.subcategory_id = ''
    setFields((f) => ({ ...f, ...update }))
    save({ ...fields, ...update })
  }

  function handleBlur(key) {
    save({ [key]: fields[key] })
  }

  const inputCls = 'w-full text-sm border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent'
  const selectCls = 'text-sm border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 w-full'

  const duration = fields.due_date
    ? (() => {
        const days = Math.ceil((new Date(fields.due_date) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24))
        if (days === 0) return 'Due today'
        if (days > 0) return `${days}d remaining`
        return `${Math.abs(days)}d overdue`
      })()
    : '—'

  return (
    <tr className={clsx('border-b border-gray-100 transition-colors', saving ? 'bg-blue-50' : 'bg-yellow-50/40')}>
      {/* Checkbox placeholder */}
      <td className="pl-4 pr-2 py-2 w-10">
        {saved && (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </td>

      {/* Name */}
      <td className="px-3 py-2 min-w-[160px]">
        <input
          type="text"
          value={fields.name}
          onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
          onBlur={() => handleBlur('name')}
          className={inputCls}
        />
      </td>

      {/* Priority */}
      <td className="px-3 py-2 whitespace-nowrap">
        <select value={fields.priority} onChange={(e) => handleChange('priority', e.target.value)} className={selectCls}>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </td>

      {/* Due Date */}
      <td className="px-3 py-2 whitespace-nowrap">
        <input
          type="date"
          value={fields.due_date}
          onChange={(e) => handleChange('due_date', e.target.value)}
          className={inputCls}
        />
      </td>

      {/* Status */}
      <td className="px-3 py-2 whitespace-nowrap">
        <select value={fields.status} onChange={(e) => handleChange('status', e.target.value)} className={selectCls}>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
          {customStatuses.map((s) => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>
      </td>

      {/* Duration (read-only, computed) */}
      <td className="px-3 py-2 whitespace-nowrap">
        <span className="text-sm text-gray-500">{duration}</span>
      </td>

      {/* Category */}
      <td className="px-3 py-2 whitespace-nowrap min-w-[120px]">
        {categories.length > 0 ? (
          <select value={fields.category_id} onChange={(e) => handleChange('category_id', e.target.value)} className={selectCls}>
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </td>

      {/* Subcategory */}
      <td className="px-3 py-2 whitespace-nowrap min-w-[120px]">
        {subcategories.length > 0 ? (
          <select value={fields.subcategory_id} onChange={(e) => handleChange('subcategory_id', e.target.value)} className={selectCls}>
            <option value="">— None —</option>
            {subcategories.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </td>


      {/* Actions */}
      <td className="pl-3 pr-4 py-2 whitespace-nowrap">
        <div className="flex items-center gap-1">
          {task.status !== 'archived' && (
            <button
              onClick={() => onArchive(task)}
              className="p-1.5 text-gray-400 hover:text-yellow-600 rounded-md hover:bg-yellow-50 transition-colors"
              aria-label="Archive task"
              title="Archive task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onDelete(task)}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
            aria-label="Delete task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  )
}

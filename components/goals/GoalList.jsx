'use client'
import { useState } from 'react'
import { useGoals, useDeleteGoal, useUpdateGoal } from '@/hooks/useGoals'
import { useCategories } from '@/hooks/useCategories'
import { format, parseISO } from 'date-fns'

function formatDate(d) {
  try { return format(typeof d === 'string' ? parseISO(d) : new Date(d), 'MMM d, yyyy') } catch { return d }
}

function toInputDate(d) {
  try { return format(typeof d === 'string' ? parseISO(d) : new Date(d), 'yyyy-MM-dd') } catch { return '' }
}

function EditForm({ goal, onCancel }) {
  const { data: categories = [] } = useCategories()
  const updateGoal = useUpdateGoal()
  const [form, setForm] = useState({
    name: goal.name,
    category_id: goal.category_id ?? '',
    subcategory_id: goal.subcategory_id ?? '',
    tasks_per_week: goal.tasks_per_week,
    hours_per_week: goal.hours_per_week,
    start_date: toInputDate(goal.start_date),
    end_date: toInputDate(goal.end_date),
  })
  const [error, setError] = useState(null)

  const selectedCategory = categories.find(c => String(c.id) === String(form.category_id))
  const subcategories = selectedCategory?.subcategories ?? []

  function set(field, value) {
    setForm(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'category_id' ? { subcategory_id: '' } : {}),
    }))
  }

  async function handleSave() {
    setError(null)
    try {
      await updateGoal.mutateAsync({ id: goal.id, data: form })
      onCancel()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save')
    }
  }

  return (
    <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
      {error && <p className="text-xs text-red-600">{error}</p>}

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
        <input
          value={form.name}
          onChange={e => set('name', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
          <select
            value={form.category_id}
            onChange={e => set('category_id', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select…</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Subcategory</label>
          <select
            value={form.subcategory_id}
            onChange={e => set('subcategory_id', e.target.value)}
            disabled={!subcategories.length}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">Any</option>
            {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tasks/wk</label>
          <input
            type="number" min="1" value={form.tasks_per_week}
            onChange={e => set('tasks_per_week', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Hours/wk</label>
          <input
            type="number" min="0.25" step="0.25" value={form.hours_per_week}
            onChange={e => set('hours_per_week', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
          <input
            type="date" value={form.start_date}
            onChange={e => set('start_date', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
          <input
            type="date" value={form.end_date}
            onChange={e => set('end_date', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={updateGoal.isPending}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium py-1.5 rounded-lg transition-colors"
        >
          {updateGoal.isPending ? 'Saving…' : 'Save Changes'}
        </button>
        <button
          onClick={onCancel}
          className="px-3 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function GoalList() {
  const { data: goals = [], isLoading } = useGoals()
  const deleteGoal = useDeleteGoal()
  const [confirmId, setConfirmId] = useState(null)
  const [editId, setEditId] = useState(null)

  if (isLoading) return <p className="text-sm text-gray-400">Loading…</p>
  if (!goals.length) return (
    <p className="text-sm text-gray-400 text-center py-8">No goals yet. Create one above.</p>
  )

  return (
    <div className="space-y-3">
      {goals.map(goal => (
        <div key={goal.id} className="border border-gray-200 rounded-xl p-4 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{goal.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {goal.category_name}{goal.subcategory_name ? ` › ${goal.subcategory_name}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => { setEditId(editId === goal.id ? null : goal.id); setConfirmId(null) }}
                className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                title="Edit goal"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => { setConfirmId(confirmId === goal.id ? null : goal.id); setEditId(null) }}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                title="Delete goal"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {goal.tasks_per_week} task{goal.tasks_per_week !== 1 ? 's' : ''}/wk
            </span>
            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
              {goal.hours_per_week}h/wk
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {formatDate(goal.start_date)} → {formatDate(goal.end_date)}
            </span>
          </div>

          {editId === goal.id && (
            <EditForm goal={goal} onCancel={() => setEditId(null)} />
          )}

          {confirmId === goal.id && (
            <div className="mt-3 flex items-center gap-2 bg-red-50 rounded-lg p-2">
              <p className="text-xs text-red-700 flex-1">Delete this goal? Tasks will remain but be unlinked.</p>
              <button
                onClick={async () => { await deleteGoal.mutateAsync(goal.id); setConfirmId(null) }}
                className="text-xs bg-red-600 text-white px-2.5 py-1 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
              <button onClick={() => setConfirmId(null)} className="text-xs text-gray-500 hover:text-gray-700 px-2">
                Cancel
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

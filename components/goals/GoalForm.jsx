'use client'
import { useState } from 'react'
import { useCategories } from '@/hooks/useCategories'
import { useCreateGoal } from '@/hooks/useGoals'

const EMPTY = {
  name: '',
  category_id: '',
  subcategory_id: '',
  tasks_per_week: 1,
  hours_per_week: '',
  start_date: '',
  end_date: '',
}

export default function GoalForm({ onSuccess }) {
  const { data: categories = [] } = useCategories()
  const createGoal = useCreateGoal()
  const [form, setForm] = useState(EMPTY)
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

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      await createGoal.mutateAsync({
        ...form,
        category_id: Number(form.category_id),
        subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : null,
        tasks_per_week: Number(form.tasks_per_week),
        hours_per_week: Number(form.hours_per_week),
      })
      setForm(EMPTY)
      onSuccess?.()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create goal')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Goal Name</label>
        <input
          value={form.name}
          onChange={e => set('name', e.target.value)}
          required
          placeholder="e.g. Math Homework"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <select
            value={form.category_id}
            onChange={e => set('category_id', e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Select…</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Subcategory</label>
          <select
            value={form.subcategory_id}
            onChange={e => set('subcategory_id', e.target.value)}
            disabled={!subcategories.length}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">Any</option>
            {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Hours per Week</label>
          <input
            type="number"
            min="0.25"
            step="0.25"
            value={form.hours_per_week}
            onChange={e => set('hours_per_week', e.target.value)}
            required
            placeholder="e.g. 5"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tasks per Week</label>
          <input
            type="number"
            min="1"
            max="21"
            value={form.tasks_per_week}
            onChange={e => set('tasks_per_week', e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {form.tasks_per_week > 0 && form.hours_per_week > 0 && (
        <p className="text-xs text-gray-400">
          Each task will have a goal of <span className="font-medium text-gray-600">
            {Math.round(form.hours_per_week / form.tasks_per_week * 100) / 100}h
          </span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
          <input
            type="date"
            value={form.start_date}
            onChange={e => set('start_date', e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
          <input
            type="date"
            value={form.end_date}
            onChange={e => set('end_date', e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={createGoal.isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
      >
        {createGoal.isPending ? 'Creating…' : 'Create Goal & Generate Tasks'}
      </button>
    </form>
  )
}

'use client'
import { useState, useRef, useEffect } from 'react'
import { useStatuses, useCreateStatus } from '@/hooks/useStatuses'

const BUILT_IN = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
]

/**
 * A <select>-like control that lists built-in statuses, custom statuses,
 * and an "Add Status" option at the bottom. When "Add Status" is picked,
 * an inline input appears so the user can name and save a new status.
 *
 * Props:
 *   value     – current status string (controlled)
 *   onChange  – called with the new status string
 *   className – extra classes for the select element
 */
export default function StatusSelect({ value, onChange, className = '' }) {
  const { data: customStatuses = [] } = useStatuses()
  const createStatus = useCreateStatus()

  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus()
  }, [adding])

  function handleSelectChange(e) {
    if (e.target.value === '__add__') {
      setAdding(true)
      setNewName('')
      setError('')
    } else {
      onChange(e.target.value)
    }
  }

  async function handleSave() {
    const trimmed = newName.trim()
    if (!trimmed) {
      setError('Status name is required')
      return
    }
    try {
      const created = await createStatus.mutateAsync({ name: trimmed })
      onChange(created.name)
      setAdding(false)
      setNewName('')
      setError('')
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Could not save status')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      setAdding(false)
      setNewName('')
      setError('')
    }
  }

  if (adding) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={e => { setNewName(e.target.value); setError('') }}
            onKeyDown={handleKeyDown}
            placeholder="New status name…"
            className="flex-1 border border-blue-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={createStatus.isPending}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {createStatus.isPending ? '…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setNewName(''); setError('') }}
            className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <select
      value={value}
      onChange={handleSelectChange}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      {BUILT_IN.map(s => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
      {customStatuses.length > 0 && (
        <optgroup label="Custom">
          {customStatuses.map(s => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </optgroup>
      )}
      <option disabled>──────────</option>
      <option value="__add__">+ Add Status…</option>
    </select>
  )
}

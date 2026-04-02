'use client'
import { useState } from 'react'
import { useStatuses, useCreateStatus, useUpdateStatus, useDeleteStatus } from '@/hooks/useStatuses'

const PRESET_COLORS = [
  '#6b7280', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e',
]

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="w-6 h-6 rounded-full border-2 transition-all shrink-0"
          style={{
            backgroundColor: c,
            borderColor: value === c ? '#1d4ed8' : 'transparent',
            transform: value === c ? 'scale(1.15)' : 'scale(1)',
          }}
        />
      ))}
    </div>
  )
}

function StatusForm({ defaultName = '', defaultColor = '#6b7280', onSave, onCancel }) {
  const [name, setName] = useState(defaultName)
  const [color, setColor] = useState(defaultColor)

  return (
    <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); if (name.trim()) onSave(name.trim(), color) }
          if (e.key === 'Escape') onCancel()
        }}
        placeholder="Status name…"
        className="w-full text-sm border border-blue-400 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex gap-2">
        <button type="button" onClick={() => { if (name.trim()) onSave(name.trim(), color) }}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
          Save
        </button>
        <button type="button" onClick={onCancel}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function StatusManager() {
  const { data: statuses = [], isLoading } = useStatuses()
  const createStatus = useCreateStatus()
  const updateStatus = useUpdateStatus()
  const deleteStatus = useDeleteStatus()

  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  if (isLoading) return <div className="text-sm text-gray-400">Loading…</div>

  return (
    <div className="max-w-md">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Custom Statuses</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Built-in: <span className="font-medium text-gray-600">pending</span>, <span className="font-medium text-gray-600">completed</span>
            </p>
          </div>
          {!adding && (
            <button type="button" onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          )}
        </div>

        <ul className="space-y-1">
          {statuses.length === 0 && !adding && (
            <li className="text-sm text-gray-400 italic">No custom statuses yet</li>
          )}
          {statuses.map((s) => (
            <li key={s.id}>
              {editingId === s.id ? (
                <StatusForm
                  defaultName={s.name}
                  defaultColor={s.color}
                  onSave={(name, color) => updateStatus.mutate({ id: s.id, name, color }, { onSuccess: () => setEditingId(null) })}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="flex-1 text-sm font-medium text-gray-700 truncate">{s.name}</span>
                  <button type="button" onClick={() => setEditingId(s.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-blue-600 rounded"
                    aria-label="Edit">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => deleteStatus.mutate(s.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-600 rounded"
                    aria-label="Delete">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </li>
          ))}
          {adding && (
            <li>
              <StatusForm
                onSave={(name, color) => createStatus.mutate({ name, color }, { onSuccess: () => setAdding(false) })}
                onCancel={() => setAdding(false)}
              />
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

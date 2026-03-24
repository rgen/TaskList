'use client'
import { useState } from 'react'

export default function LogHoursModal({ task, onConfirm, onSkip, onClose }) {
  const [hours, setHours] = useState(task.hours_goal ?? '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Log Hours</h2>
        <p className="text-sm text-gray-500 mb-4 truncate">"{task.name}"</p>

        {task.hours_goal && (
          <p className="text-xs text-gray-400 mb-3">
            Goal: <span className="font-medium text-gray-700">{task.hours_goal}h</span>
          </p>
        )}

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Actual hours completed
        </label>
        <input
          type="number"
          min="0"
          step="0.25"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 1.5"
          autoFocus
        />

        <div className="flex gap-2 mt-5">
          <button
            onClick={() => onConfirm(Number(hours) || 0)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            Save & Complete
          </button>
          <button
            onClick={onSkip}
            className="px-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={onClose}
            className="px-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

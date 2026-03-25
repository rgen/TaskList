'use client'
import { useState } from 'react'

function goalToHrMin(decimal) {
  if (!decimal) return { h: '', m: '' }
  const total = Math.round(Number(decimal) * 60)
  return { h: String(Math.floor(total / 60)), m: String(total % 60) }
}

function toDecimal(h, m) {
  return Math.round(((Number(h) || 0) * 60 + (Number(m) || 0)) / 60 * 100) / 100
}

export default function LogHoursModal({ task, onConfirm, onSkip, onClose }) {
  const init = goalToHrMin(task.hours_goal)
  const [hrs, setHrs] = useState(init.h)
  const [mins, setMins] = useState(init.m)

  const decimal = toDecimal(hrs, mins)

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

        <label className="block text-sm font-medium text-gray-700 mb-2">
          Actual time completed
        </label>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <input
              type="number"
              min="0"
              value={hrs}
              onChange={e => setHrs(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              placeholder="0"
              autoFocus
            />
            <p className="text-xs text-gray-400 text-center mt-1">Hours</p>
          </div>
          <span className="text-gray-400 font-medium pb-4">:</span>
          <div className="flex-1">
            <input
              type="number"
              min="0"
              max="59"
              value={mins}
              onChange={e => setMins(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              placeholder="0"
            />
            <p className="text-xs text-gray-400 text-center mt-1">Minutes</p>
          </div>
        </div>

        {(hrs || mins) && (
          <p className="text-xs text-gray-400 text-center mt-2">
            = <span className="font-medium text-gray-600">{decimal}h</span> decimal
          </p>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={() => onConfirm(decimal)}
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

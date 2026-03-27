'use client'
import { useState } from 'react'
import LinkedText from './LinkedText'

export default function NotesModal({ notes, onSave, onClose }) {
  const [editing, setEditing] = useState(!notes)
  const [value, setValue] = useState(notes || '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">{editing ? 'Edit Notes' : 'Notes'}</h3>
          <div className="flex items-center gap-2">
            {!editing && notes && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-5">
          {editing ? (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={12}
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[200px]"
              placeholder="Add notes…"
            />
          ) : (
            <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-[400px] overflow-y-auto leading-relaxed">
              <LinkedText text={notes} />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          {editing ? (
            <>
              <button
                onClick={() => { if (notes) setEditing(false); else onClose() }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => onSave(value)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Save Notes
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

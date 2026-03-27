'use client'
import { useState } from 'react'

const URL_REGEX = /https?:\/\/[^\s<]+/g

function extractLinks(text) {
  if (!text) return []
  const matches = text.match(URL_REGEX)
  return matches || []
}

function getLinkLabel(url) {
  if (url.includes('mail.google.com')) return 'Open Original Email'
  try {
    const u = new URL(url)
    return u.hostname.replace('www.', '')
  } catch {
    return url.slice(0, 40)
  }
}

export default function NotesModal({ notes, onSave, onClose }) {
  const [value, setValue] = useState(notes || '')
  const links = extractLinks(value)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Notes</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* Clickable links extracted from notes */}
          {links.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {links.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {getLinkLabel(url)}
                </a>
              ))}
            </div>
          )}

          {/* Editable textarea */}
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={10}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[180px]"
            placeholder="Add notes…"
          />
        </div>

        <div className="flex justify-end gap-3 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
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
        </div>
      </div>
    </div>
  )
}

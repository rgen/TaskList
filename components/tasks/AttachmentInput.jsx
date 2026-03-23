'use client'
import { useRef, useState } from 'react'
import axios from 'axios'

export default function AttachmentInput({ onAdd, disabled }) {
  const [tab, setTab] = useState('url') // 'url' | 'file'
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const fileRef = useRef(null)

  function handleAddUrl() {
    if (!url.trim()) return
    onAdd({ url: url.trim(), label: label.trim() || null })
    setUrl('')
    setLabel('')
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await axios.post('/api/upload', formData)
      onAdd({ url: data.url, label: data.label })
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-2">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit text-xs font-medium">
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`px-3 py-1 rounded-md transition-colors ${tab === 'url' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          URL
        </button>
        <button
          type="button"
          onClick={() => setTab('file')}
          className={`px-3 py-1 rounded-md transition-colors ${tab === 'file' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Upload File
        </button>
      </div>

      {tab === 'url' ? (
        <>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (optional)"
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddUrl}
              disabled={disabled || !url.trim()}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Add
            </button>
          </div>
        </>
      ) : (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || disabled}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 disabled:opacity-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {uploading ? 'Uploading…' : 'Click to choose a file or image'}
          </button>
          {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
        </div>
      )}
    </div>
  )
}

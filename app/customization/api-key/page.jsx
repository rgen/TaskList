'use client'
import { useState, useEffect } from 'react'

export default function ApiKeyPage() {
  const [apiKey, setApiKey] = useState(null)
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/apikey')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setApiKey(data.apiKey) })
      .catch(() => {})
  }, [])

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/apikey', { method: 'POST' })
      const data = await res.json()
      setApiKey(data.apiKey)
      setShowKey(true)
    } catch {}
    setLoading(false)
  }

  const handleCopy = () => {
    if (apiKey) navigator.clipboard.writeText(apiKey)
  }

  const maskedKey = apiKey ? 'tl_' + '•'.repeat(32) : null

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">API Key</h1>
      <p className="text-sm text-gray-500 mb-8">Use this key to access the TaskList API programmatically.</p>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        {apiKey ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your API Key</label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="flex-1 font-mono text-sm text-gray-800 break-all">
                  {showKey ? apiKey : maskedKey}
                </span>
                <button
                  onClick={() => setShowKey((v) => !v)}
                  className="shrink-0 p-1.5 text-gray-400 hover:text-gray-700 rounded transition-colors"
                  title={showKey ? 'Hide' : 'Show'}
                >
                  {showKey ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Regenerate
              </button>
            </div>
            <p className="text-xs text-gray-400">Regenerating will invalidate your current key.</p>
          </>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">You don't have an API key yet.</p>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Generating…' : 'Generate API Key'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

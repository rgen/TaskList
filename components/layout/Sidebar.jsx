'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { useState, useEffect } from 'react'

const navItems = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/tasks',
    label: 'Tasks',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    to: '/calendar',
    label: 'Calendar',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [apiKey, setApiKey] = useState(null)
  const [showKey, setShowKey] = useState(false)
  const [loadingKey, setLoadingKey] = useState(false)
  const [showApiSection, setShowApiSection] = useState(false)

  useEffect(() => {
    fetch('/api/auth/apikey')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setApiKey(data.apiKey) })
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const handleGenerate = async () => {
    setLoadingKey(true)
    try {
      const res = await fetch('/api/auth/apikey', { method: 'POST' })
      const data = await res.json()
      setApiKey(data.apiKey)
      setShowKey(true)
    } catch {}
    setLoadingKey(false)
  }

  const handleCopy = () => {
    if (apiKey) navigator.clipboard.writeText(apiKey)
  }

  const maskedKey = apiKey ? 'tl_' + '\u2022'.repeat(8) : null

  return (
    <aside className="w-56 min-h-screen bg-gray-100 border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <span className="text-lg font-bold text-gray-800 tracking-tight">TaskList</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              href={item.to}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}

        {/* API Key Section */}
        <div className="pt-1">
          <button
            onClick={() => setShowApiSection((v) => !v)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:bg-gray-200 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            API Key
          </button>

          {showApiSection && (
            <div className="mt-1 mx-1 p-3 bg-white rounded-lg border border-gray-200 text-xs space-y-2">
              {apiKey ? (
                <>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-gray-700 truncate flex-1">
                      {showKey ? apiKey : maskedKey}
                    </span>
                    <button
                      onClick={() => setShowKey((v) => !v)}
                      className="text-gray-400 hover:text-gray-700 shrink-0"
                      title={showKey ? 'Hide' : 'Show'}
                    >
                      {showKey ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                    >
                      Copy
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={loadingKey}
                      className="flex-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors disabled:opacity-50"
                    >
                      {loadingKey ? '...' : 'Regenerate'}
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={loadingKey}
                  className="w-full px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors disabled:opacity-50"
                >
                  {loadingKey ? 'Generating...' : 'Generate API Key'}
                </button>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:bg-gray-200 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">TaskList v1.0</p>
      </div>
    </aside>
  )
}

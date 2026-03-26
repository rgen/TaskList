'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useGmailStatus, useImportEmails, useDisconnectGmail } from '@/hooks/useGmail'
import clsx from 'clsx'

function GmailContent() {
  const searchParams = useSearchParams()
  const connectedParam = searchParams.get('connected')
  const errorParam = searchParams.get('error')
  const gmailErrorParam = searchParams.get('gmail_error')

  const { data: status, isLoading } = useGmailStatus()
  const importMutation = useImportEmails()
  const disconnectMutation = useDisconnectGmail()

  const [connecting, setConnecting] = useState(false)
  const [message, setMessage] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
  const [autoImport, setAutoImport] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('gmail_auto_import') === 'true'
  })
  const [lastAutoImport, setLastAutoImport] = useState(null)

  // Auto-import polling
  useEffect(() => {
    if (!autoImport || !status?.hasGmailScope) return

    // Import immediately on enable
    importMutation.mutate(undefined, {
      onSuccess: (data) => {
        setLastAutoImport(new Date())
        if (data.imported > 0) setImportResult(data)
      },
    })

    const interval = setInterval(() => {
      importMutation.mutate(undefined, {
        onSuccess: (data) => {
          setLastAutoImport(new Date())
          if (data.imported > 0) setImportResult(data)
        },
      })
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [autoImport, status?.hasGmailScope])

  function toggleAutoImport() {
    const next = !autoImport
    setAutoImport(next)
    localStorage.setItem('gmail_auto_import', String(next))
  }

  useEffect(() => {
    if (connectedParam === 'true' && gmailErrorParam) {
      setMessage({ type: 'error', text: `Gmail connected but label creation failed: ${gmailErrorParam}` })
    } else if (connectedParam === 'true') {
      setMessage({ type: 'success', text: 'Gmail connected successfully! The "TaskList" label has been created in your Gmail.' })
    } else if (errorParam) {
      setMessage({ type: 'error', text: `Connection failed: ${errorParam}` })
    }
  }, [connectedParam, errorParam, gmailErrorParam])

  async function handleConnect() {
    setConnecting(true)
    try {
      const res = await fetch('/api/gmail/connect')
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to connect' })
        setConnecting(false)
      }
    } catch (e) {
      setMessage({ type: 'error', text: e.message })
      setConnecting(false)
    }
  }

  function handleImport() {
    setImportResult(null)
    importMutation.mutate(undefined, {
      onSuccess: (data) => setImportResult(data),
      onError: (err) => setMessage({ type: 'error', text: err.response?.data?.message || err.message }),
    })
  }

  const isGmailActive = status?.hasGmailScope

  return (
    <>
      {message && (
        <div className={clsx(
          'mb-6 p-4 rounded-lg text-sm',
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        )}>
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right text-current opacity-60 hover:opacity-100">&times;</button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>
      ) : !isGmailActive ? (
        /* Not Connected State */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Gmail</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Turn any email into a task by dragging it into the "TaskList" folder in Gmail.
            The app creates the folder for you automatically.
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {connecting ? 'Redirecting…' : 'Connect Gmail'}
          </button>
          {status?.connected && (
            <p className="text-xs text-gray-400 mt-3">
              Your Google account is connected for Calendar but Gmail access needs to be granted separately.
            </p>
          )}
        </div>
      ) : (
        /* Connected State */
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Gmail Connected</p>
                <p className="text-xs text-gray-500">
                  The <strong>"{status.labelName}"</strong> label is ready in your Gmail
                </p>
              </div>
            </div>

            {/* Import Controls */}
            <div className="border-t border-gray-100 pt-4 space-y-4">
              {/* Manual Import */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleImport}
                  disabled={importMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {importMutation.isPending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Importing…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Import Now
                    </>
                  )}
                </button>
                {importResult && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-green-600">{importResult.imported} imported</span>
                    {importResult.skipped > 0 && (
                      <span className="text-gray-400"> · {importResult.skipped} already imported</span>
                    )}
                  </p>
                )}
              </div>

              {/* Auto-Import Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Auto-import</p>
                  <p className="text-xs text-gray-500">Automatically check for new emails every 5 minutes while the app is open</p>
                  {autoImport && lastAutoImport && (
                    <p className="text-xs text-green-600 mt-1">
                      Last checked: {lastAutoImport.toLocaleTimeString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={toggleAutoImport}
                  className={clsx(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0',
                    autoImport ? 'bg-blue-600' : 'bg-gray-300'
                  )}
                >
                  <span
                    className={clsx(
                      'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                      autoImport ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">How It Works</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Label an email in Gmail</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Drag any email into the <strong>"TaskList"</strong> folder in Gmail's sidebar, or apply the label manually
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Click "Import Now"</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Come back here and click the import button to pull in new emails as tasks
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-blue-600">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Tasks are created automatically</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Email subject becomes the task name, and the email body becomes the notes. Each email is only imported once.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Tips</h3>
            <ul className="text-xs text-gray-500 space-y-1.5">
              <li>Works from Gmail web, the Gmail mobile app, or any email client that supports Gmail labels</li>
              <li>You can label multiple emails at once for batch import</li>
              <li>Removing the label from an email won't delete the task — it's already been created</li>
              <li>Tasks from emails show up with all other tasks in the Tasks page</li>
            </ul>
          </div>

          {/* Disconnect */}
          <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Disconnect Gmail Import</p>
                <p className="text-xs text-gray-500 mt-0.5">Stop importing emails as tasks. Your Google Calendar connection will not be affected.</p>
              </div>
              <button
                onClick={() => setShowDisconnectConfirm(true)}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>

          {/* Disconnect confirmation */}
          {showDisconnectConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Disconnect Gmail Import?</h3>
                <p className="text-sm text-gray-600 mb-6">
                  This will disable Gmail import. Tasks already imported will remain, but new emails won't be pulled in. Your Google Calendar connection stays active.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDisconnectConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      disconnectMutation.mutate(undefined, {
                        onSuccess: () => {
                          setShowDisconnectConfirm(false)
                          setAutoImport(false)
                          localStorage.removeItem('gmail_auto_import')
                          setMessage({ type: 'success', text: 'Gmail import disconnected.' })
                        },
                      })
                    }}
                    disabled={disconnectMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {disconnectMutation.isPending ? 'Disconnecting…' : 'Disconnect'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default function GmailPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gmail Import</h1>
        <p className="text-sm text-gray-500 mt-1">Turn emails into tasks by labeling them in Gmail</p>
      </div>
      <Suspense fallback={<div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>}>
        <GmailContent />
      </Suspense>
    </div>
  )
}

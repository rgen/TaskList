'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useGcalStatus, useGcalCalendars, useSelectCalendar, useDisconnectGcal } from '@/hooks/useGoogleCalendar'
import clsx from 'clsx'

function GoogleCalendarContent() {
  const searchParams = useSearchParams()
  const connectedParam = searchParams.get('connected')
  const errorParam = searchParams.get('error')

  const { data: status, isLoading: statusLoading } = useGcalStatus()
  const { data: calData, isLoading: calsLoading, refetch: fetchCalendars } = useGcalCalendars(false)
  const selectMutation = useSelectCalendar()
  const disconnectMutation = useDisconnectGcal()

  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [message, setMessage] = useState(null)

  const connected = status?.connected
  const calendars = calData?.calendars || []

  useEffect(() => {
    if (connectedParam === 'true') {
      setMessage({ type: 'success', text: 'Google Calendar connected successfully!' })
    } else if (errorParam) {
      setMessage({ type: 'error', text: `Connection failed: ${errorParam}` })
    }
  }, [connectedParam, errorParam])

  useEffect(() => {
    if (connected) fetchCalendars()
  }, [connected, fetchCalendars])

  async function handleConnect() {
    setConnecting(true)
    try {
      const res = await fetch('/api/gcal/connect')
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setMessage({ type: 'error', text: 'Failed to generate authorization URL. Make sure Google OAuth credentials are configured.' })
        setConnecting(false)
      }
    } catch (e) {
      setMessage({ type: 'error', text: e.message })
      setConnecting(false)
    }
  }

  function handleSelectCalendar(e) {
    const calId = e.target.value
    const cal = calendars.find((c) => c.id === calId)
    selectMutation.mutate({
      calendarId: calId,
      calendarName: cal?.summary || calId,
    })
  }

  function handleDisconnect() {
    disconnectMutation.mutate(undefined, {
      onSuccess: () => {
        setShowDisconnectConfirm(false)
        setMessage({ type: 'success', text: 'Google Calendar disconnected.' })
      },
    })
  }

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

      {statusLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>
      ) : !connected ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Google Calendar</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Link your Google account to sync tasks with due dates to your Google Calendar as all-day events.
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {connecting ? 'Redirecting…' : 'Connect Google Calendar'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Google Calendar Connected</p>
                <p className="text-xs text-gray-500">Your account is linked and ready to sync</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Calendar</label>
              {calsLoading ? (
                <p className="text-sm text-gray-400">Loading calendars…</p>
              ) : calendars.length === 0 ? (
                <p className="text-sm text-gray-400">No calendars found. Try refreshing.</p>
              ) : (
                <select
                  value={status.selectedCalendar?.id || ''}
                  onChange={handleSelectCalendar}
                  disabled={selectMutation.isPending}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a calendar…</option>
                  {calendars.map((cal) => (
                    <option key={cal.id} value={cal.id}>
                      {cal.summary}{cal.primary ? ' (Primary)' : ''}
                    </option>
                  ))}
                </select>
              )}
              {status.selectedCalendar && (
                <p className="text-xs text-green-600 mt-2">
                  Syncing to: <strong>{status.selectedCalendar.name}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">How Sync Works</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">1.</span>
                Select your preferred Google Calendar above
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">2.</span>
                On any task with a due date, click the calendar sync icon in the actions column
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">3.</span>
                The task will appear as an all-day event on your Google Calendar
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">4.</span>
                Re-syncing an already synced task updates the event if the name or date changed
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Disconnect Google Calendar</p>
                <p className="text-xs text-gray-500 mt-0.5">This will remove the connection and unlink all synced events</p>
              </div>
              <button
                onClick={() => setShowDisconnectConfirm(true)}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>

          {showDisconnectConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Disconnect Google Calendar?</h3>
                <p className="text-sm text-gray-600 mb-6">
                  This will remove your Google Calendar connection. Synced events will remain on your calendar but will no longer be linked to tasks.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDisconnectConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDisconnect}
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

export default function GoogleCalendarPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Google Calendar</h1>
        <p className="text-sm text-gray-500 mt-1">Sync your tasks to Google Calendar as events</p>
      </div>
      <Suspense fallback={<div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>}>
        <GoogleCalendarContent />
      </Suspense>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import TaskTable from '@/components/tasks/TaskTable'
import TaskScheduleView from '@/components/tasks/TaskScheduleView'
import clsx from 'clsx'

function TasksContent() {
  const searchParams = useSearchParams()
  const initialFilters = Object.fromEntries(searchParams.entries())

  const [view, setView] = useState(() => {
    if (typeof window === 'undefined') return 'list'
    return localStorage.getItem('tasks_page_view') || 'list'
  })

  function switchView(v) {
    setView(v)
    localStorage.setItem('tasks_page_view', v)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track all your tasks</p>
        </div>
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => switchView('list')}
            className={clsx(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            Task List
          </button>
          <button
            onClick={() => switchView('schedule')}
            className={clsx(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              view === 'schedule' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            Schedule
          </button>
        </div>
      </div>
      {view === 'list' ? (
        <TaskTable initialFilters={initialFilters} />
      ) : (
        <TaskScheduleView />
      )}
    </div>
  )
}

export default function TaskListPage() {
  return (
    <Suspense fallback={<div className="p-6"><div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div></div>}>
      <TasksContent />
    </Suspense>
  )
}

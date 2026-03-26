'use client'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import clsx from 'clsx'
import { useToggleTask, useArchiveTask } from '@/hooks/useTasks'
import { useSubtasks, useUpdateSubtask } from '@/hooks/useSubtasks'
import { tasksApi } from '@/lib/api/tasks'
import { useQueryClient } from '@tanstack/react-query'
import PriorityBadge from './PriorityBadge'
import OverdueBadge from './OverdueBadge'
import NewBadge from './NewBadge'
import LogHoursModal from '@/components/goals/LogHoursModal'
import { useSyncTaskToGcal } from '@/hooks/useGoogleCalendar'

function InlineSubtasks({ taskId }) {
  const { data: subtasks = [], isLoading } = useSubtasks(taskId)
  const updateMutation = useUpdateSubtask(taskId)

  if (isLoading) return <p className="text-xs text-gray-400 mt-2">Loading…</p>

  return (
    <ul className="mt-2 space-y-1.5">
      {subtasks.map((subtask) => (
        <li key={subtask.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={subtask.completed}
            onChange={() => updateMutation.mutate({ id: subtask.id, data: { completed: !subtask.completed } })}
            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span className={clsx('text-xs', subtask.completed ? 'line-through text-gray-400' : 'text-gray-600')}>
            {subtask.name}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function TaskRow({ task, onEdit, onDelete, onArchive }) {
  const toggleMutation = useToggleTask()
  const syncGcal = useSyncTaskToGcal()
  const [subtasksOpen, setSubtasksOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [showLogHours, setShowLogHours] = useState(false)
  const qc = useQueryClient()

  function handleToggle() {
    // If a goal task is being marked complete, show log hours modal
    if (task.goal_id && task.status !== 'completed') {
      setShowLogHours(true)
    } else {
      toggleMutation.mutate(task.id)
    }
  }

  async function handleLogHoursConfirm(hours) {
    await tasksApi.patch(task.id, { status: 'completed', hours_logged: hours })
    qc.invalidateQueries({ queryKey: ['tasks'] })
    qc.invalidateQueries({ queryKey: ['goals-progress'] })
    setShowLogHours(false)
  }

  async function handleLogHoursSkip() {
    toggleMutation.mutate(task.id)
    setShowLogHours(false)
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    try {
      return format(parseISO(dateStr), 'EEE, MMM d, yyyy')
    } catch {
      return dateStr
    }
  }

  return (
    <>
    <tr className={clsx('border-b border-gray-100 hover:bg-gray-50 transition-colors', task.status === 'completed' && 'text-gray-400')} style={task.status === 'completed' ? { textDecoration: 'line-through', textDecorationThickness: '2px' } : {}}>
      {/* Checkbox */}
      <td className="pl-4 pr-2 py-3 w-10">
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          onChange={handleToggle}
          disabled={toggleMutation.isPending}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-wait"
          aria-label="Toggle task completion"
        />
      </td>

      {/* Name */}
      <td className="px-3 py-3">
        <div className="flex flex-col gap-1">
          <span
            className={clsx(
              'text-sm font-medium',
              task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'
            )}
          >
            {task.name}
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {task.is_overdue && <OverdueBadge />}
            <NewBadge createdAt={task.created_at} />
            {task.goal_id && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium">
                {task.hours_logged != null
                  ? `${task.hours_logged}h / ${task.hours_goal ?? '?'}h`
                  : task.hours_goal != null ? `Goal: ${task.hours_goal}h` : 'Goal task'}
              </span>
            )}
          </div>
          {(task.notes || task.subtask_count > 0) && (
            <>
              <div className="flex items-center gap-3 mt-0.5">
                {task.notes && (
                  <button
                    type="button"
                    onClick={() => setNotesOpen((o) => !o)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <svg
                      className={clsx('w-3 h-3 transition-transform duration-150', notesOpen && 'rotate-90')}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {notesOpen ? 'Hide Notes' : 'Read Notes'}
                  </button>
                )}
                {task.subtask_count > 0 && (
                  <button
                    type="button"
                    onClick={() => setSubtasksOpen((o) => !o)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <svg
                      className={clsx('w-3 h-3 transition-transform duration-150', subtasksOpen && 'rotate-90')}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {subtasksOpen ? 'Hide Subtasks' : `Open Subtasks (${task.subtask_count})`}
                  </button>
                )}
              </div>
              {notesOpen && task.notes && (
                <div className="text-xs text-gray-500 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 max-w-md max-h-60 overflow-y-auto">
                  {task.notes}
                </div>
              )}
              {subtasksOpen && task.subtask_count > 0 && <InlineSubtasks taskId={task.id} />}
            </>
          )}
        </div>
      </td>

      {/* Priority */}
      <td className="px-3 py-3 whitespace-nowrap">
        <PriorityBadge priority={task.priority} />
      </td>

      {/* Due Date */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className={clsx('text-sm', task.is_overdue ? 'text-red-600 font-medium' : 'text-gray-600')}>
          {formatDate(task.due_date)}
        </span>
      </td>

      {/* Status */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span
          className={clsx(
            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize',
            task.status === 'completed'
              ? 'bg-green-100 text-green-700'
              : task.status === 'pending'
              ? 'bg-yellow-100 text-yellow-700'
              : task.status === 'archived'
              ? 'bg-gray-100 text-gray-500'
              : 'bg-blue-100 text-blue-700'
          )}
        >
          {task.status}
        </span>
      </td>

      {/* Duration */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className="text-sm text-gray-600">
          {!task.due_date
            ? '—'
            : (() => {
                const days = Math.ceil((new Date(task.due_date) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24))
                if (days === 0) return 'Due today'
                if (days > 0) return `${days}d remaining`
                return `${Math.abs(days)}d overdue`
              })()}
        </span>
      </td>

      {/* Category */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className="text-sm text-gray-600">{task.category_name || '—'}</span>
      </td>

      {/* Subcategory */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className="text-sm text-gray-600">{task.subcategory_name || '—'}</span>
      </td>


      {/* Actions */}
      <td className="pl-3 pr-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1">
          {task.status !== 'archived' && (
            <div className="relative group">
              <button
                onClick={() => onArchive(task)}
                className="p-1.5 text-gray-400 hover:text-yellow-600 rounded-md hover:bg-yellow-50 transition-colors"
                aria-label="Archive task"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </button>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] font-medium text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Archive
              </span>
            </div>
          )}
          {task.due_date && (
            <div className="relative group">
              <button
                onClick={() => syncGcal.mutate(task.id)}
                disabled={syncGcal.isPending}
                className={`p-1.5 rounded-md transition-colors ${
                  task.gcal_event_id
                    ? 'text-green-500 hover:text-green-700 hover:bg-green-50'
                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                }`}
                aria-label={task.gcal_event_id ? 'Re-sync to Google Calendar' : 'Sync to Google Calendar'}
              >
                {syncGcal.isPending ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    {task.gcal_event_id && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    )}
                  </svg>
                )}
              </button>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] font-medium text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {task.gcal_event_id ? 'Synced — click to update' : 'Sync to Google Calendar'}
              </span>
            </div>
          )}
          <div className="relative group">
            <button
              onClick={() => onEdit(task.id)}
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
              aria-label="Edit task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] font-medium text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Edit
            </span>
          </div>
          <div className="relative group">
            <button
              onClick={() => onDelete(task)}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
              aria-label="Delete task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] font-medium text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Delete
            </span>
          </div>
        </div>
      </td>
    </tr>
    {showLogHours && (
      <LogHoursModal
        task={task}
        onConfirm={handleLogHoursConfirm}
        onSkip={handleLogHoursSkip}
        onClose={() => setShowLogHours(false)}
      />
    )}
  </>
  )
}

'use client'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import clsx from 'clsx'
import { useToggleTask } from '@/hooks/useTasks'
import { useSubtasks, useUpdateSubtask } from '@/hooks/useSubtasks'
import PriorityBadge from './PriorityBadge'
import OverdueBadge from './OverdueBadge'

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

export default function TaskRow({ task, onEdit, onDelete }) {
  const toggleMutation = useToggleTask()
  const [subtasksOpen, setSubtasksOpen] = useState(false)

  function handleToggle() {
    toggleMutation.mutate(task.id)
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy')
    } catch {
      return dateStr
    }
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
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
          {task.notes && (
            <span className="text-xs text-gray-400 truncate max-w-xs">{task.notes}</span>
          )}
          <div className="flex gap-1.5 flex-wrap">
            {task.is_overdue && <OverdueBadge />}
          </div>
          {task.subtask_count > 0 && (
            <>
              <button
                type="button"
                onClick={() => setSubtasksOpen((o) => !o)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium w-fit mt-0.5"
              >
                <svg
                  className={clsx('w-3 h-3 transition-transform duration-150', subtasksOpen && 'rotate-90')}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {subtasksOpen ? 'Hide Subtasks' : `Open Subtasks (${task.subtask_count})`}
              </button>
              {subtasksOpen && <InlineSubtasks taskId={task.id} />}
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

      {/* Date Created */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className="text-sm text-gray-600">
          {task.created_at ? new Date(task.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
        </span>
      </td>

      {/* Actions */}
      <td className="pl-3 pr-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1">
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
        </div>
      </td>
    </tr>
  )
}

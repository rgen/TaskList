'use client'
import clsx from 'clsx'
import { useToggleTask } from '@/hooks/useTasks'

export default function SlimTaskRow({ task, onEdit, onDelete }) {
  const toggleMutation = useToggleTask()

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td className="pl-4 pr-2 py-1.5 w-8">
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          onChange={() => toggleMutation.mutate(task.id)}
          disabled={toggleMutation.isPending}
          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-wait"
        />
      </td>
      <td className="px-3 py-1.5">
        <span
          className={clsx(
            'text-sm',
            task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'
          )}
        >
          {task.name}
        </span>
      </td>
      <td className="px-3 py-1.5 whitespace-nowrap">
        <span className={clsx(
          'text-xs font-medium',
          task.priority === 'high' ? 'text-red-600' : task.priority === 'low' ? 'text-green-600' : 'text-yellow-600'
        )}>
          {task.priority}
        </span>
      </td>
      <td className="px-3 py-1.5 whitespace-nowrap">
        <span className="text-xs text-gray-500">{task.due_date || '—'}</span>
      </td>
      <td className="px-3 py-1.5 whitespace-nowrap">
        <span className={clsx(
          'text-xs capitalize',
          task.status === 'completed' ? 'text-green-600' : task.status === 'pending' ? 'text-yellow-600' : 'text-blue-600'
        )}>
          {task.status}
        </span>
      </td>
      <td className="pl-3 pr-4 py-1.5 whitespace-nowrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(task.id)}
            className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task)}
            className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  )
}

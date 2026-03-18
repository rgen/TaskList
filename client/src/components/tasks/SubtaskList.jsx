import { useState } from 'react'
import { useCreateSubtask, useUpdateSubtask, useDeleteSubtask } from '../../hooks/useSubtasks.js'

export default function SubtaskList({ taskId, subtasks = [] }) {
  const [newName, setNewName] = useState('')
  const createMutation = useCreateSubtask(taskId)
  const updateMutation = useUpdateSubtask(taskId)
  const deleteMutation = useDeleteSubtask(taskId)

  function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    createMutation.mutate({ name: newName.trim() }, {
      onSuccess: () => setNewName(''),
    })
  }

  function toggleSubtask(subtask) {
    updateMutation.mutate({ id: subtask.id, data: { completed: !subtask.completed } })
  }

  function handleDelete(id) {
    deleteMutation.mutate(id)
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Subtasks</h3>
      <ul className="space-y-2 mb-3">
        {subtasks.map((subtask) => (
          <li key={subtask.id} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              checked={subtask.completed}
              onChange={() => toggleSubtask(subtask)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {subtask.name}
            </span>
            <button
              onClick={() => handleDelete(subtask.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
              aria-label="Delete subtask"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
        {subtasks.length === 0 && (
          <li className="text-sm text-gray-400 italic">No subtasks yet</li>
        )}
      </ul>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add a subtask…"
          className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={createMutation.isPending || !newName.trim()}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  )
}

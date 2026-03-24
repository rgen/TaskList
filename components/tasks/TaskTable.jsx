'use client'
import { useState } from 'react'
import { useTasks } from '@/hooks/useTasks'
import TaskRow from './TaskRow'
import TaskModal from './TaskModal'
import TaskFilters from './TaskFilters'
import DeleteConfirm from './DeleteConfirm'

export default function TaskTable() {
  const [filters, setFilters] = useState({ sort: 'created_at', order: 'desc' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editTaskId, setEditTaskId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: tasks = [], isLoading, isError, error } = useTasks(filters)

  function openCreate() {
    setEditTaskId(null)
    setModalOpen(true)
  }

  function openEdit(id) {
    setEditTaskId(id)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditTaskId(null)
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <TaskFilters filters={filters} onChange={setFilters} />
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading tasks…
        </div>
      ) : isError ? (
        <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg">
          Error: {error?.message}
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500 text-sm">No tasks found. Create your first task!</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full bg-white">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="pl-4 pr-2 py-3 w-10" />
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date Created
                </th>
                <th className="pl-3 pr-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <TaskModal
        isOpen={modalOpen}
        taskId={editTaskId}
        onClose={closeModal}
      />

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteConfirm
          taskId={deleteTarget.id}
          taskName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

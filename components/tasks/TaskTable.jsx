'use client'
import { useState, useEffect, useRef } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useCategories } from '@/hooks/useCategories'
import TaskRow from './TaskRow'
import GridEditRow from './GridEditRow'
import TaskModal from './TaskModal'
import TaskFilters from './TaskFilters'
import DeleteConfirm from './DeleteConfirm'
import ArchiveConfirm from './ArchiveConfirm'

const STORAGE_KEY = 'task_filters'
const BASE_FILTERS = { sort: 'created_at', order: 'desc' }

function initFilters(initialFilters) {
  // If navigated here from dashboard with specific filters, respect those
  const hasSpecific = Object.keys(initialFilters).some(k => !['sort', 'order'].includes(k))
  if (hasSpecific) return { ...BASE_FILTERS, ...initialFilters }
  // Otherwise load from localStorage
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
  }
  return BASE_FILTERS
}

export default function TaskTable({ initialFilters = {} }) {
  const [filters, setFilters] = useState(() => initFilters(initialFilters))
  const { data: categories = [] } = useCategories()
  const schoolWorkSet = useRef(false)

  // Auto-default to School Work category on first ever load (no saved preference)
  useEffect(() => {
    if (schoolWorkSet.current) return
    if (filters.category_id) { schoolWorkSet.current = true; return }
    if (!categories.length) return
    const schoolWork = categories.find(c => c.name.toLowerCase() === 'school work')
    if (schoolWork) {
      const updated = { ...filters, category_id: String(schoolWork.id) }
      setFilters(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    }
    schoolWorkSet.current = true
  }, [categories])

  // Persist filters to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
    }
  }, [filters])
  const [modalOpen, setModalOpen] = useState(false)
  const [editTaskId, setEditTaskId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [gridEditMode, setGridEditMode] = useState(false)

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGridEditMode((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm ${
              gridEditMode
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 10h18M3 6h18M3 14h18M3 18h18" />
            </svg>
            {gridEditMode ? 'Done Editing' : 'Grid Edit'}
          </button>
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
                  Category
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Subcategory
                </th>
                <th className="pl-3 pr-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => gridEditMode ? (
                <GridEditRow
                  key={task.id}
                  task={task}
                  onDelete={setDeleteTarget}
                  onArchive={setArchiveTarget}
                />
              ) : (
                <TaskRow
                  key={task.id}
                  task={task}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                  onArchive={setArchiveTarget}
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

      {/* Archive confirmation */}
      {archiveTarget && (
        <ArchiveConfirm
          taskId={archiveTarget.id}
          taskName={archiveTarget.name}
          onClose={() => setArchiveTarget(null)}
        />
      )}
    </div>
  )
}

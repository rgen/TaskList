'use client'
import { useState, useEffect, useRef } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useCategories } from '@/hooks/useCategories'
import TaskRow from './TaskRow'
import SlimTaskRow from './SlimTaskRow'
import GridEditRow from './GridEditRow'
import TaskModal from './TaskModal'
import TaskFilters from './TaskFilters'
import DeleteConfirm from './DeleteConfirm'
import ArchiveConfirm from './ArchiveConfirm'
import { useCreateTask } from '@/hooks/useTasks'

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

  // When URL params change (e.g. clicking a chart or goal card), update filters
  const initialFiltersKey = JSON.stringify(initialFilters)
  useEffect(() => {
    const hasSpecific = Object.keys(initialFilters).some(k => !['sort', 'order'].includes(k))
    if (hasSpecific) {
      setFilters({ ...BASE_FILTERS, ...initialFilters })
      schoolWorkSet.current = true // Skip auto-default since we have explicit params
    }
  }, [initialFiltersKey])

  // Auto-default to School Work category on first ever load (no saved preference)
  useEffect(() => {
    if (schoolWorkSet.current) return
    // Don't override if URL has specific filters
    const hasSpecific = Object.keys(initialFilters).some(k => !['sort', 'order'].includes(k))
    if (hasSpecific) { schoolWorkSet.current = true; return }
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
  const [quickAddName, setQuickAddName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const quickAddRef = useRef(null)
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === 'undefined') return 'traditional'
    return localStorage.getItem('task_view_mode') || 'traditional'
  })

  const { data: rawTasks = [], isLoading, isError, error } = useTasks(filters)
  const createTask = useCreateTask()

  // Client-side search filtering
  const tasks = searchQuery.trim()
    ? rawTasks.filter((t) => {
        const q = searchQuery.toLowerCase()
        return (
          (t.name || '').toLowerCase().includes(q) ||
          (t.notes || '').toLowerCase().includes(q) ||
          (t.category_name || '').toLowerCase().includes(q) ||
          (t.subcategory_name || '').toLowerCase().includes(q) ||
          (t.status || '').toLowerCase().includes(q) ||
          (t.priority || '').toLowerCase().includes(q) ||
          (t.due_date || '').includes(q)
        )
      })
    : rawTasks

  function handleQuickAdd() {
    if (!quickAddName.trim()) return
    const quickCat = categories.find(c => c.name.toLowerCase() === 'quick tasks')
    setQuickAddName('')
    createTask.mutate({
      name: quickAddName.trim(),
      category_id: quickCat?.id || null,
    })
  }

  function handleQuickAddKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); handleQuickAdd() }
  }

  function toggleViewMode() {
    const next = viewMode === 'traditional' ? 'slim' : 'traditional'
    setViewMode(next)
    localStorage.setItem('task_view_mode', next)
  }

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
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setViewMode('traditional'); localStorage.setItem('task_view_mode', 'traditional') }}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'traditional' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title="Traditional view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => { setViewMode('slim'); localStorage.setItem('task_view_mode', 'slim') }}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'slim' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title="Slim view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
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

      {/* Search */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by name, notes, category, status, priority…"
            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-gray-400 hover:text-gray-600 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <span className="text-xs text-gray-500 shrink-0">{tasks.length} result{tasks.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Quick Add */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <input
            ref={quickAddRef}
            type="text"
            value={quickAddName}
            onChange={(e) => setQuickAddName(e.target.value)}
            onKeyDown={handleQuickAddKeyDown}
            placeholder="Type a task name and press Enter to add…"
            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
          />
          {createTask.isPending && (
            <svg className="w-4 h-4 text-blue-500 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
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
          {gridEditMode ? (
            <table className="w-full bg-white">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="pl-4 pr-2 py-2 w-10" />
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: '300px' }}>Task</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: '60px' }}>Notes</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: '60px' }}>Subtasks</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: '85px' }}>Priority</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: '125px' }}>Due Date</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: '95px' }}>Status</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: '105px' }}>Category</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: '105px' }}>Subcategory</th>
                  <th className="pl-2 pr-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <GridEditRow
                    key={task.id}
                    task={task}
                    onDelete={setDeleteTarget}
                    onArchive={setArchiveTarget}
                  />
                ))}
              </tbody>
            </table>
          ) : viewMode === 'slim' ? (
            <table className="w-full bg-white">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="pl-4 pr-2 py-2 w-8" />
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subtasks</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Due</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="pl-3 pr-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <SlimTaskRow
                    key={task.id}
                    task={task}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                    onArchive={setArchiveTarget}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full bg-white">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="pl-4 pr-2 py-3 w-10" />
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subtasks</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subcategory</th>
                  <th className="pl-3 pr-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
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
          )}
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

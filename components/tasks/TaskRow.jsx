'use client'
import { useState, useRef, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import clsx from 'clsx'
import { useToggleTask, useArchiveTask, useUpdateTask } from '@/hooks/useTasks'
import { useSubtasks, useUpdateSubtask, useCreateSubtask, useDeleteSubtask, useReorderSubtasks } from '@/hooks/useSubtasks'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { tasksApi } from '@/lib/api/tasks'
import { useQueryClient } from '@tanstack/react-query'
import PriorityBadge from './PriorityBadge'
import OverdueBadge from './OverdueBadge'
import NewBadge from './NewBadge'
import LogHoursModal from '@/components/goals/LogHoursModal'
import { useSyncTaskToGcal } from '@/hooks/useGoogleCalendar'

import NotesModal from './NotesModal'

function SortableSubItem({ subtask, editingId, editValue, setEditValue, editRef, onEditStart, onEditSave, onToggle, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: subtask.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  return (
    <li ref={setNodeRef} style={style} className="flex items-center gap-2 group">
      <button type="button" {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 shrink-0 touch-none">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zM8 14a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zM8 22a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </button>
      <input type="checkbox" checked={subtask.completed} onChange={() => onToggle(subtask)}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0" />
      {editingId === subtask.id ? (
        <input ref={editRef} type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => onEditSave(subtask)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onEditSave(subtask) }; if (e.key === 'Escape') onEditStart(null) }}
          className="flex-1 text-sm border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      ) : (
        <span className={clsx('flex-1 text-sm cursor-pointer hover:text-blue-600', subtask.completed ? 'line-through text-gray-400' : 'text-gray-700')}
          onClick={() => { onEditStart(subtask.id); setEditValue(subtask.name) }}>{subtask.name}</span>
      )}
      <button onClick={() => onDelete(subtask.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity shrink-0">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </li>
  )
}

function SubtasksPopup({ taskId, onClose }) {
  const { data: subtasks = [], isLoading } = useSubtasks(taskId)
  const createMutation = useCreateSubtask(taskId)
  const updateMutation = useUpdateSubtask(taskId)
  const deleteMutation = useDeleteSubtask(taskId)
  const reorderMutation = useReorderSubtasks(taskId)
  const [items, setItems] = useState([])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const editRef = useRef(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => { setItems(subtasks) }, [subtasks])
  useEffect(() => { if (editingId && editRef.current) editRef.current.focus() }, [editingId])

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const reordered = arrayMove(items, items.findIndex((s) => s.id === active.id), items.findIndex((s) => s.id === over.id))
    setItems(reordered)
    reorderMutation.mutate(reordered.map((s) => s.id))
  }
  function handleAdd() {
    if (!newName.trim()) return
    createMutation.mutate({ name: newName.trim() }, { onSuccess: () => setNewName('') })
  }
  function handleEditSave(subtask) {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== subtask.name) updateMutation.mutate({ id: subtask.id, data: { name: trimmed } })
    setEditingId(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Subtasks</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">
          {isLoading ? <p className="text-sm text-gray-400 text-center py-4">Loading…</p> : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-2 mb-4 max-h-[350px] overflow-y-auto">
                  {items.map((sub) => (
                    <SortableSubItem key={sub.id} subtask={sub} editingId={editingId} editValue={editValue}
                      setEditValue={setEditValue} editRef={editRef} onEditStart={setEditingId} onEditSave={handleEditSave}
                      onToggle={(s) => updateMutation.mutate({ id: s.id, data: { completed: !s.completed } })}
                      onDelete={(id) => deleteMutation.mutate(id)} />
                  ))}
                  {items.length === 0 && <li className="text-sm text-gray-400 italic text-center py-2">No subtasks yet</li>}
                </ul>
              </SortableContext>
            </DndContext>
          )}
          <div className="flex gap-2">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
              placeholder="Add a subtask…" className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={handleAdd} disabled={createMutation.isPending || !newName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">Add</button>
          </div>
        </div>
        <div className="flex justify-end px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Done</button>
        </div>
      </div>
    </div>
  )
}

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
  const updateTask = useUpdateTask()
  const [subtasksOpen, setSubtasksOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [notesPopupOpen, setNotesPopupOpen] = useState(false)
  const [subtasksPopupOpen, setSubtasksPopupOpen] = useState(false)
  const [localNotes, setLocalNotes] = useState(task.notes || '')
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
        </div>
      </td>

      {/* Notes popup */}
      <td className="px-2 py-3 whitespace-nowrap">
        <button type="button" onClick={() => setNotesPopupOpen(true)} className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline">
          {localNotes ? 'View' : 'Add'}
        </button>
      </td>

      {/* Subtasks popup */}
      <td className="px-2 py-3 whitespace-nowrap">
        <button type="button" onClick={() => setSubtasksPopupOpen(true)} className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline">
          {task.subtask_count > 0 ? `View (${task.subtask_count})` : 'Add'}
        </button>
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
    {notesPopupOpen && (
      <NotesModal
        notes={localNotes}
        onSave={(newNotes) => {
          setLocalNotes(newNotes)
          updateTask.mutate({ id: task.id, data: { name: task.name, notes: newNotes || null, status: task.status, priority: task.priority, due_date: task.due_date || null, category_id: task.category_id, subcategory_id: task.subcategory_id } })
          setNotesPopupOpen(false)
        }}
        onClose={() => setNotesPopupOpen(false)}
      />
    )}
    {subtasksPopupOpen && (
      <SubtasksPopup taskId={task.id} onClose={() => setSubtasksPopupOpen(false)} />
    )}
  </>
  )
}

'use client'
import { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useToggleTask, useUpdateTask } from '@/hooks/useTasks'
import { useSubtasks, useCreateSubtask, useUpdateSubtask, useDeleteSubtask, useReorderSubtasks } from '@/hooks/useSubtasks'

function NotesModal({ notes, onSave, onClose }) {
  const [value, setValue] = useState(notes || '')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Edit Notes</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">
          <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={12}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[200px]"
            placeholder="Add notes…" autoFocus />
        </div>
        <div className="flex justify-end gap-3 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave(value)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save Notes</button>
        </div>
      </div>
    </div>
  )
}

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

function SubtasksModal({ taskId, onClose }) {
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
          {isLoading ? (
            <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
          ) : (
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

export default function SlimTaskRow({ task, onEdit, onDelete }) {
  const toggleMutation = useToggleTask()
  const updateTask = useUpdateTask()
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [subtasksModalOpen, setSubtasksModalOpen] = useState(false)
  const [notes, setNotes] = useState(task.notes || '')

  const done = task.status === 'completed'
  const strikeClass = done ? 'line-through text-gray-400' : ''

  function handleNotesSave(newNotes) {
    setNotes(newNotes)
    updateTask.mutate({
      id: task.id,
      data: { name: task.name, notes: newNotes || null, status: task.status, priority: task.priority, due_date: task.due_date || null, category_id: task.category_id, subcategory_id: task.subcategory_id },
    })
    setNotesModalOpen(false)
  }

  return (
    <>
    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td className="pl-4 pr-2 py-1.5 w-8">
        <input type="checkbox" checked={done} onChange={() => toggleMutation.mutate(task.id)}
          disabled={toggleMutation.isPending}
          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-wait" />
      </td>
      <td className={clsx('px-3 py-1.5 text-sm', done ? 'line-through text-gray-400' : 'text-gray-900')}>
        {task.name}
      </td>
      <td className="px-2 py-1.5 whitespace-nowrap">
        <button type="button" onClick={() => setNotesModalOpen(true)} className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline">
          {notes ? 'View' : 'Add'}
        </button>
      </td>
      <td className="px-2 py-1.5 whitespace-nowrap">
        <button type="button" onClick={() => setSubtasksModalOpen(true)} className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline">
          {task.subtask_count > 0 ? `View (${task.subtask_count})` : 'Add'}
        </button>
      </td>
      <td className={clsx('px-3 py-1.5 whitespace-nowrap text-xs font-medium', strikeClass, !done && (task.priority === 'high' ? 'text-red-600' : task.priority === 'low' ? 'text-green-600' : 'text-yellow-600'))}>
        {task.priority}
      </td>
      <td className={clsx('px-3 py-1.5 whitespace-nowrap text-xs', strikeClass, !done && 'text-gray-500')}>
        {task.due_date || '—'}
      </td>
      <td className={clsx('px-3 py-1.5 whitespace-nowrap text-xs capitalize', strikeClass, !done && (task.status === 'pending' ? 'text-yellow-600' : 'text-blue-600'))}>
        {task.status}
      </td>
      <td className={clsx('px-3 py-1.5 whitespace-nowrap text-xs', strikeClass, !done && 'text-gray-500')}>
        {!task.due_date ? '—' : (() => {
          const days = Math.ceil((new Date(task.due_date) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24))
          if (days === 0) return 'Due today'
          if (days > 0) return `${days}d`
          return `${Math.abs(days)}d over`
        })()}
      </td>
      <td className={clsx('px-3 py-1.5 whitespace-nowrap text-xs', strikeClass, !done && 'text-gray-500')}>
        {task.category_name || '—'}
      </td>
      <td className="pl-3 pr-4 py-1.5 whitespace-nowrap">
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(task.id)} className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button onClick={() => onDelete(task)} className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
    {notesModalOpen && <NotesModal notes={notes} onSave={handleNotesSave} onClose={() => setNotesModalOpen(false)} />}
    {subtasksModalOpen && <SubtasksModal taskId={task.id} onClose={() => setSubtasksModalOpen(false)} />}
    </>
  )
}

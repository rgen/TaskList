'use client'
import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCreateSubtask, useUpdateSubtask, useDeleteSubtask, useReorderSubtasks } from '@/hooks/useSubtasks'

function SortableSubtask({ subtask, onToggle, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: subtask.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li ref={setNodeRef} style={style} className="flex items-center gap-2 group">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-300 hover:text-gray-400 flex-shrink-0"
        aria-label="Drag to reorder"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zM8 14a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zM8 22a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </button>
      <input
        type="checkbox"
        checked={subtask.completed}
        onChange={() => onToggle(subtask)}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
      />
      <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
        {subtask.name}
      </span>
      <button
        type="button"
        onClick={() => onDelete(subtask.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
        aria-label="Delete subtask"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </li>
  )
}

export default function SubtaskList({ taskId, subtasks = [] }) {
  const [newName, setNewName] = useState('')
  const [items, setItems] = useState(subtasks)
  const createMutation = useCreateSubtask(taskId)
  const updateMutation = useUpdateSubtask(taskId)
  const deleteMutation = useDeleteSubtask(taskId)
  const reorderMutation = useReorderSubtasks(taskId)

  // Keep local items in sync when subtasks prop changes
  if (subtasks.length !== items.length || subtasks.some((s, i) => s.id !== items[i]?.id || s.completed !== items[i]?.completed)) {
    setItems(subtasks)
  }

  const sensors = useSensors(useSensor(PointerSensor))

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((s) => s.id === active.id)
    const newIndex = items.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)
    reorderMutation.mutate(reordered.map((s) => s.id))
  }

  function handleAdd() {
    if (!newName.trim()) return
    createMutation.mutate({ name: newName.trim() }, {
      onSuccess: () => setNewName(''),
    })
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2 mb-3">
            {items.map((subtask) => (
              <SortableSubtask
                key={subtask.id}
                subtask={subtask}
                onToggle={toggleSubtask}
                onDelete={handleDelete}
              />
            ))}
            {items.length === 0 && (
              <li className="text-sm text-gray-400 italic">No subtasks yet</li>
            )}
          </ul>
        </SortableContext>
      </DndContext>
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a subtask…"
          className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={createMutation.isPending || !newName.trim()}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  )
}

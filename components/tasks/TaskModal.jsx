'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useQueryClient } from '@tanstack/react-query'
import { useTask, useCreateTask, useUpdateTask, TASKS_KEY } from '@/hooks/useTasks'
import { useCategories } from '@/hooks/useCategories'
import { subtasksApi, attachmentsApi } from '@/lib/api/subtasks'
import SubtaskList from './SubtaskList'
import AttachmentList from './AttachmentList'
import AttachmentInput from './AttachmentInput'
import StatusSelect from './StatusSelect'

function SortablePendingItem({ item, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <li ref={setNodeRef} style={style} className="flex items-center gap-2 group">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none p-0.5"
        tabIndex={-1}
      >
        <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
          <circle cx="3" cy="3" r="1.5"/><circle cx="9" cy="3" r="1.5"/>
          <circle cx="3" cy="8" r="1.5"/><circle cx="9" cy="8" r="1.5"/>
          <circle cx="3" cy="13" r="1.5"/><circle cx="9" cy="13" r="1.5"/>
        </svg>
      </button>
      <span className="flex-1 text-sm text-gray-700">{item.name}</span>
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
        aria-label="Remove subtask"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </li>
  )
}

function PendingSubtaskList({ items, onAdd, onRemove, onReorder }) {
  const [newName, setNewName] = useState('')
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleAdd() {
    if (!newName.trim()) return
    onAdd(newName.trim())
    setNewName('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id)
      const newIndex = items.findIndex(i => i.id === over.id)
      onReorder(arrayMove(items, oldIndex, newIndex))
    }
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Subtasks</h3>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2 mb-3">
            {items.map(item => (
              <SortablePendingItem key={item.id} item={item} onRemove={onRemove} />
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
          disabled={!newName.trim()}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  )
}

function PendingAttachmentList({ items, onAdd, onRemove }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Attachments</h3>
      <ul className="space-y-2 mb-3">
        {items.map((att, i) => (
          <li key={i} className="flex items-center gap-2 group">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="flex-1 text-sm text-blue-600 truncate">{att.label || att.url}</span>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
              aria-label="Remove attachment"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-sm text-gray-400 italic">No attachments yet</li>
        )}
      </ul>
      <AttachmentInput onAdd={onAdd} />
    </div>
  )
}

export default function TaskModal({ isOpen, taskId, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!taskId
  const { data: task, isLoading } = useTask(taskId)

  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask()

  const { data: categories = [] } = useCategories()
  const [statusValue, setStatusValue] = useState('pending')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [isSchoologyTask, setIsSchoologyTask] = useState(false)
  const [pendingSubtasks, setPendingSubtasks] = useState([])
  const [pendingAttachments, setPendingAttachments] = useState([])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: '', notes: '', priority: 'medium', due_date: '' },
  })

  const dueDateValue = watch('due_date')
  const computedDuration = dueDateValue
    ? Math.ceil((new Date(dueDateValue) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24))
    : null

  useEffect(() => {
    if (isEdit && task) {
      reset({ name: task.name || '', notes: task.notes || '', priority: task.priority || 'medium', due_date: task.due_date || '' })
      setStatusValue(task.status || 'pending')
      setCategoryId(task.category_id ? String(task.category_id) : '')
      setSubcategoryId(task.subcategory_id ? String(task.subcategory_id) : '')
      setIsSchoologyTask(task.source === 'schoology')
    } else if (!isEdit) {
      reset({ name: '', notes: '', priority: 'medium', due_date: '' })
      setStatusValue('pending')
      setCategoryId('')
      setSubcategoryId('')
      setIsSchoologyTask(false)
      setPendingSubtasks([])
      setPendingAttachments([])
    }
  }, [isOpen, isEdit, task, reset])

  if (!isOpen) return null

  async function onSubmit(data) {
    const payload = {
      name: data.name,
      notes: data.notes || null,
      status: statusValue,
      priority: data.priority,
      due_date: data.due_date || null,
      duration: data.due_date
        ? Math.ceil((new Date(data.due_date) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24))
        : null,
      source: isSchoologyTask ? 'schoology' : null,
      category_id: categoryId ? Number(categoryId) : null,
      subcategory_id: subcategoryId ? Number(subcategoryId) : null,
    }

    if (isEdit) {
      await updateMutation.mutateAsync({ id: taskId, data: payload })
    } else {
      const newTask = await createMutation.mutateAsync(payload)
      await Promise.all([
        ...pendingSubtasks.map((item, i) => subtasksApi.create(newTask.id, { name: item.name, position: i })),
        ...pendingAttachments.map((att) => attachmentsApi.create(newTask.id, att)),
      ])
      // Refetch task list now that subtasks exist so subtask_count is correct
      await qc.invalidateQueries({ queryKey: [TASKS_KEY] })
    }
    onClose()
  }

  const mutationError = (isEdit ? updateMutation : createMutation).error

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-10 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close modal">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isEdit && isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading…</div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-5">
              {/* Basic Info */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Basic Info</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      {...register('name', { required: 'Name is required' })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Task name"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px]"
                      placeholder="Optional notes…"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <StatusSelect value={statusValue} onChange={setStatusValue} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        {...register('priority')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>

                  {categories.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          value={categoryId}
                          onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId('') }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">— None —</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                        <select
                          value={subcategoryId}
                          onChange={(e) => setSubcategoryId(e.target.value)}
                          disabled={!categoryId}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                        >
                          <option value="">— None —</option>
                          {(categories.find((c) => String(c.id) === categoryId)?.subcategories || []).map((sub) => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                      <input
                        type="date"
                        {...register('due_date')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                      <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500">
                        {computedDuration === null ? 'Set a due date'
                          : computedDuration === 0 ? 'Due today'
                          : computedDuration > 0 ? `${computedDuration} day${computedDuration !== 1 ? 's' : ''} remaining`
                          : `${Math.abs(computedDuration)} day${Math.abs(computedDuration) !== 1 ? 's' : ''} overdue`}
                      </div>
                    </div>
                  </div>

                  {isEdit && task?.created_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Created</label>
                      <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500">
                        {new Date(task.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsSchoologyTask((v) => !v)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSchoologyTask ? 'bg-blue-600' : 'bg-gray-200'}`}
                      role="switch"
                      aria-checked={isSchoologyTask}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${isSchoologyTask ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <label className="text-sm font-medium text-gray-700">Schoology task</label>
                  </div>
                </div>
              </div>

              {/* Subtasks */}
              <div className="border-t border-gray-100 pt-5">
                {isEdit ? (
                  <SubtaskList taskId={taskId} subtasks={task?.subtasks || []} />
                ) : (
                  <PendingSubtaskList
                    items={pendingSubtasks}
                    onAdd={(name) => setPendingSubtasks((p) => [...p, { id: `${Date.now()}-${Math.random()}`, name }])}
                    onRemove={(id) => setPendingSubtasks((p) => p.filter(item => item.id !== id))}
                    onReorder={(reordered) => setPendingSubtasks(reordered)}
                  />
                )}
              </div>

              {/* Attachments */}
              <div className="border-t border-gray-100 pt-5">
                {isEdit ? (
                  <AttachmentList taskId={taskId} attachments={task?.attachments || []} />
                ) : (
                  <PendingAttachmentList
                    items={pendingAttachments}
                    onAdd={(att) => setPendingAttachments((p) => [...p, att])}
                    onRemove={(i) => setPendingAttachments((p) => p.filter((_, idx) => idx !== i))}
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              {mutationError ? <p className="text-xs text-red-600">{mutationError.message}</p> : <span />}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

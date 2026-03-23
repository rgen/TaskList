'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTask, useCreateTask, useUpdateTask } from '@/hooks/useTasks'
import { subtasksApi, attachmentsApi } from '@/lib/api/subtasks'
import SubtaskList from './SubtaskList'
import AttachmentList from './AttachmentList'
import AttachmentInput from './AttachmentInput'
import StatusSelect from './StatusSelect'

function PendingSubtaskList({ items, onAdd, onRemove }) {
  const [newName, setNewName] = useState('')

  function handleAdd() {
    if (!newName.trim()) return
    onAdd(newName.trim())
    setNewName('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Subtasks</h3>
      <ul className="space-y-2 mb-3">
        {items.map((name, i) => (
          <li key={i} className="flex items-center gap-2 group">
            <span className="flex-1 text-sm text-gray-700">{name}</span>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
              aria-label="Remove subtask"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-sm text-gray-400 italic">No subtasks yet</li>
        )}
      </ul>
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
  const isEdit = !!taskId
  const { data: task, isLoading } = useTask(taskId)

  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask()

  const [statusValue, setStatusValue] = useState('pending')
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
    } else if (!isEdit) {
      reset({ name: '', notes: '', priority: 'medium', due_date: '' })
      setStatusValue('pending')
      setPendingSubtasks([])
      setPendingAttachments([])
    }
  }, [isEdit, task, reset])

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
    }

    if (isEdit) {
      await updateMutation.mutateAsync({ id: taskId, data: payload })
    } else {
      const newTask = await createMutation.mutateAsync(payload)
      await Promise.all([
        ...pendingSubtasks.map((name, i) => subtasksApi.create(newTask.id, { name, position: i })),
        ...pendingAttachments.map((att) => attachmentsApi.create(newTask.id, att)),
      ])
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                </div>
              </div>

              {/* Subtasks */}
              <div className="border-t border-gray-100 pt-5">
                {isEdit ? (
                  <SubtaskList taskId={taskId} subtasks={task?.subtasks || []} />
                ) : (
                  <PendingSubtaskList
                    items={pendingSubtasks}
                    onAdd={(name) => setPendingSubtasks((p) => [...p, name])}
                    onRemove={(i) => setPendingSubtasks((p) => p.filter((_, idx) => idx !== i))}
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

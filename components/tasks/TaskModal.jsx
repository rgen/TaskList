'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTask, useCreateTask, useUpdateTask } from '@/hooks/useTasks'
import SubtaskList from './SubtaskList'
import AttachmentList from './AttachmentList'
import StatusSelect from './StatusSelect'

export default function TaskModal({ isOpen, taskId, onClose }) {
  const isEdit = !!taskId
  const { data: task, isLoading } = useTask(taskId)

  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask()

  // status is controlled outside react-hook-form so StatusSelect can drive it
  const [statusValue, setStatusValue] = useState('pending')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      notes: '',
      priority: 'medium',
      due_date: '',
      duration: '',
    },
  })

  useEffect(() => {
    if (isEdit && task) {
      reset({
        name: task.name || '',
        notes: task.notes || '',
        priority: task.priority || 'medium',
        due_date: task.due_date || '',
        duration: task.duration || '',
      })
      setStatusValue(task.status || 'pending')
    } else if (!isEdit) {
      reset({
        name: '',
        notes: '',
        priority: 'medium',
        due_date: '',
        duration: '',
      })
      setStatusValue('pending')
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
      duration: data.duration ? parseInt(data.duration, 10) : null,
    }

    if (isEdit) {
      await updateMutation.mutateAsync({ id: taskId, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    onClose()
  }

  const mutationError = (isEdit ? updateMutation : createMutation).error

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-10 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
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
              {/* Basic Info Section */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
                  Basic Info
                </h3>
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('name', { required: 'Name is required' })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Task name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Optional notes…"
                    />
                  </div>

                  {/* Status & Priority */}
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

                  {/* Due Date & Duration */}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (min)
                      </label>
                      <input
                        type="number"
                        {...register('duration', { min: 1 })}
                        min={1}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. 30"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtasks Section — only in edit mode */}
              {isEdit && task && (
                <div className="border-t border-gray-100 pt-5">
                  <SubtaskList taskId={taskId} subtasks={task.subtasks || []} />
                </div>
              )}

              {/* Attachments Section — only in edit mode */}
              {isEdit && task && (
                <div className="border-t border-gray-100 pt-5">
                  <AttachmentList taskId={taskId} attachments={task.attachments || []} />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              {mutationError ? (
                <p className="text-xs text-red-600">{mutationError.message}</p>
              ) : (
                <span />
              )}
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

'use client'
import { useDeleteTask } from '@/hooks/useTasks'

export default function DeleteConfirm({ taskId, taskName, taskSource, onClose }) {
  const deleteMutation = useDeleteTask()

  if (taskSource === 'schoology') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Cannot Delete Task</h2>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium text-gray-900">"{taskName}"</span> is a Schoology task and cannot be deleted.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            To hide it, open the task and change its status to <span className="font-medium text-gray-700">Archived</span>.
          </p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    )
  }

  function handleDelete() {
    deleteMutation.mutate(taskId, {
      onSuccess: () => onClose(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Task</h2>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete{' '}
          <span className="font-medium text-gray-900">"{taskName}"</span>?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
        {deleteMutation.isError && (
          <p className="mt-3 text-xs text-red-600">{deleteMutation.error?.message}</p>
        )}
      </div>
    </div>
  )
}

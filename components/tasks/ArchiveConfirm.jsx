'use client'
import { useArchiveTask } from '@/hooks/useTasks'

export default function ArchiveConfirm({ taskId, taskName, onClose }) {
  const archiveMutation = useArchiveTask()

  function handleArchive() {
    archiveMutation.mutate(taskId, {
      onSuccess: () => onClose(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Archive Task</h2>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to archive{' '}
          <span className="font-medium text-gray-900">"{taskName}"</span>?
          It will be hidden from the main view but can be restored by changing its status.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleArchive}
            disabled={archiveMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
          >
            {archiveMutation.isPending ? 'Archiving…' : 'Archive'}
          </button>
        </div>
        {archiveMutation.isError && (
          <p className="mt-3 text-xs text-red-600">{archiveMutation.error?.message}</p>
        )}
      </div>
    </div>
  )
}

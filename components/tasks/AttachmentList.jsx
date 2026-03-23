'use client'
import { useCreateAttachment, useDeleteAttachment } from '@/hooks/useSubtasks'
import AttachmentInput from './AttachmentInput'

export default function AttachmentList({ taskId, attachments = [] }) {
  const createMutation = useCreateAttachment(taskId)
  const deleteMutation = useDeleteAttachment(taskId)

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Attachments</h3>
      <ul className="space-y-2 mb-3">
        {attachments.map((att) => (
          <li key={att.id} className="flex items-center gap-2 group">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <a href={att.url} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-sm text-blue-600 hover:underline truncate">
              {att.label || att.url}
            </a>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(att.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
              aria-label="Delete attachment"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
        {attachments.length === 0 && (
          <li className="text-sm text-gray-400 italic">No attachments yet</li>
        )}
      </ul>
      <AttachmentInput
        onAdd={(att) => createMutation.mutate(att)}
        disabled={createMutation.isPending}
      />
    </div>
  )
}

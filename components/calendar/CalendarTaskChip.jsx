'use client'
import clsx from 'clsx'
import NewBadge from '@/components/tasks/NewBadge'

const STATUS_STRIKE = 'line-through opacity-50'

export default function CalendarTaskChip({
  task,
  color,
  hexToRgb,
  onDragStart,
  onDragEnd,
  onClick,
  size = 'sm',
  showNewBadge = false,
}) {
  const isSmall = size === 'sm'

  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(task.id)}
      className={clsx(
        'w-full text-left rounded font-medium transition-opacity hover:opacity-80 cursor-grab active:cursor-grabbing',
        isSmall ? 'text-xs px-1.5 py-0.5 truncate' : 'text-sm px-3 py-2',
        task.status === 'completed' && STATUS_STRIKE
      )}
      style={{
        backgroundColor: `rgba(${hexToRgb(color)}, 0.15)`,
        color,
        borderLeft: `3px solid ${color}`,
      }}
      title={task.name}
    >
      {isSmall ? (
        task.name
      ) : (
        <span className="flex items-center gap-2 flex-wrap">
          <span className="truncate">{task.name}</span>
          {showNewBadge && <NewBadge createdAt={task.created_at} />}
        </span>
      )}
    </button>
  )
}

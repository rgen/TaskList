'use client'
import clsx from 'clsx'

const STATUS_STRIKE = 'line-through opacity-50'

export default function CalendarTaskChip({
  task,
  color,
  hexToRgb,
  onDragStart,
  onDragEnd,
  onClick,
  size = 'sm',
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
        'w-full text-left rounded font-medium truncate transition-opacity hover:opacity-80 cursor-grab active:cursor-grabbing',
        isSmall ? 'text-xs px-1.5 py-0.5' : 'text-sm px-3 py-2',
        task.status === 'completed' && STATUS_STRIKE
      )}
      style={{
        backgroundColor: `rgba(${hexToRgb(color)}, 0.15)`,
        color,
        borderLeft: `3px solid ${color}`,
      }}
      title={task.name}
    >
      {task.name}
    </button>
  )
}

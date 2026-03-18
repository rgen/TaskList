import clsx from 'clsx'

const config = {
  high:   { label: 'High',   classes: 'bg-red-100 text-red-700 border-red-200' },
  medium: { label: 'Medium', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  low:    { label: 'Low',    classes: 'bg-slate-100 text-slate-600 border-slate-200' },
}

export default function PriorityBadge({ priority }) {
  const { label, classes } = config[priority] || config.medium
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', classes)}>
      {label}
    </span>
  )
}

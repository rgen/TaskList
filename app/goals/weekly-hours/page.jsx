import WeeklyHoursReport from '@/components/goals/WeeklyHoursReport'

export default function WeeklyHoursPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary, #111827)' }}>
          Work Week Hour Progress
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary, #6b7280)' }}>
          Hours logged per week by category
        </p>
      </div>
      <div className="rounded-xl border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--bg-card, #ffffff)', borderColor: 'var(--border-card, #e5e7eb)' }}>
        <WeeklyHoursReport />
      </div>
    </div>
  )
}

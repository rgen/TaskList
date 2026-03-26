import GoalProgress from '@/components/goals/GoalProgress'
import WeeklyHoursReport from '@/components/goals/WeeklyHoursReport'

export default function ProgressPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary, #111827)' }}>Goal Progress</h1>
      <GoalProgress />

      <div className="mt-10">
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary, #111827)' }}>
          Work Week Hour Progress
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary, #6b7280)' }}>
          Hours logged per week by category
        </p>
        <div className="rounded-xl border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--bg-card, #ffffff)', borderColor: 'var(--border-card, #e5e7eb)' }}>
          <WeeklyHoursReport />
        </div>
      </div>
    </div>
  )
}

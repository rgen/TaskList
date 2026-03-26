import GoalProgress from '@/components/goals/GoalProgress'

export default function ProgressPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary, #111827)' }}>Goal Progress</h1>
      <GoalProgress />
    </div>
  )
}

import GoalForm from '@/components/goals/GoalForm'
import GoalList from '@/components/goals/GoalList'

export default function ManageGoalsPage() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Manage Goals</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">New Goal</h2>
        <GoalForm />
      </div>

      <h2 className="text-sm font-semibold text-gray-700 mb-3">Your Goals</h2>
      <GoalList />
    </div>
  )
}

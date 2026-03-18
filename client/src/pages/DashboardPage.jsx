import DashboardGrid from '../components/dashboard/DashboardGrid.jsx'

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your tasks and progress</p>
      </div>
      <DashboardGrid />
    </div>
  )
}

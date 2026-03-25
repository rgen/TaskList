import ReportsManager from '@/components/reports/ReportsManager'

export default function ReportsPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      </div>
      <ReportsManager />
    </div>
  )
}

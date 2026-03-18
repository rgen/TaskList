'use client'
import { useDashboardSummary, useDashboardWeek, useDashboardTrend } from '@/hooks/useDashboard'
import StatusDonutChart from './StatusDonutChart'
import WeeklyBarChart from './WeeklyBarChart'
import CompletionLineChart from './CompletionLineChart'
import PriorityBarChart from './PriorityBarChart'

function StatCard({ label, value, colorClass = 'text-gray-900', bg = 'bg-white' }) {
  return (
    <div className={`${bg} rounded-xl border border-gray-200 shadow-sm p-5`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colorClass}`}>{value ?? '—'}</p>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  )
}

export default function DashboardGrid() {
  const { data: summary, isLoading: sumLoading } = useDashboardSummary()
  const { data: week, isLoading: weekLoading } = useDashboardWeek()
  const { data: trend, isLoading: trendLoading } = useDashboardTrend()

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={sumLoading ? '…' : summary?.total} />
        <StatCard
          label="Completed"
          value={sumLoading ? '…' : summary?.completed}
          colorClass="text-green-600"
        />
        <StatCard
          label="Pending"
          value={sumLoading ? '…' : summary?.pending}
          colorClass="text-amber-600"
        />
        <StatCard
          label="Overdue"
          value={sumLoading ? '…' : summary?.overdue}
          colorClass="text-red-600"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Task Status Breakdown">
          {sumLoading ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
          ) : (
            <StatusDonutChart summary={summary} />
          )}
        </ChartCard>

        <ChartCard title="Tasks Due This Week">
          {weekLoading ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
          ) : (
            <WeeklyBarChart data={week} />
          )}
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Completion Trend (Last 30 Days)">
          {trendLoading ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
          ) : (
            <CompletionLineChart data={trend} />
          )}
        </ChartCard>

        <ChartCard title="Tasks by Priority">
          {sumLoading ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
          ) : (
            <PriorityBarChart byPriority={summary?.byPriority} />
          )}
        </ChartCard>
      </div>
    </div>
  )
}

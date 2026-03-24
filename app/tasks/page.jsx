import TaskTable from '@/components/tasks/TaskTable'

export default function TaskListPage({ searchParams }) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and track all your tasks</p>
      </div>
      <TaskTable initialFilters={searchParams} />
    </div>
  )
}

import CalendarView from '@/components/calendar/CalendarView'

export default function CalendarPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-sm text-gray-500 mt-1">Tasks organized by due date</p>
      </div>
      <CalendarView />
    </div>
  )
}

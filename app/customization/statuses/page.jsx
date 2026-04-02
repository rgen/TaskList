import StatusManager from '@/components/customization/StatusManager'

export default function StatusesPage() {
  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Statuses</h1>
      <p className="text-sm text-gray-500 mb-8">Manage your custom task statuses and their colors.</p>
      <StatusManager />
    </div>
  )
}

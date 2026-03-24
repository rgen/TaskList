import CategoryManager from '@/components/customization/CategoryManager'

export default function CategoriesPage() {
  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Categories</h1>
      <p className="text-sm text-gray-500 mb-8">Manage your categories and subcategories for tasks.</p>
      <CategoryManager />
    </div>
  )
}

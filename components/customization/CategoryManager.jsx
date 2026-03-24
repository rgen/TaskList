'use client'
import { useState } from 'react'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateSubcategory,
  useUpdateSubcategory,
  useDeleteSubcategory,
} from '@/hooks/useCategories'

function InlineInput({ defaultValue = '', onSave, onCancel, placeholder = 'Name…' }) {
  const [value, setValue] = useState(defaultValue)
  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); if (value.trim()) onSave(value.trim()) }
          if (e.key === 'Escape') onCancel()
        }}
        placeholder={placeholder}
        className="flex-1 text-sm border border-blue-400 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="button"
        onClick={() => { if (value.trim()) onSave(value.trim()) }}
        className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}

function SubcategoryPanel({ category }) {
  const createSub = useCreateSubcategory()
  const updateSub = useUpdateSubcategory()
  const deleteSub = useDeleteSubcategory()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  return (
    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Subcategories</h2>
          <p className="text-xs text-gray-500 mt-0.5">Under: <span className="font-medium text-gray-700">{category.name}</span></p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        )}
      </div>

      <ul className="space-y-2">
        {category.subcategories.length === 0 && !adding && (
          <li className="text-sm text-gray-400 italic">No subcategories yet</li>
        )}
        {category.subcategories.map((sub) => (
          <li key={sub.id} className="group flex items-center gap-2">
            {editingId === sub.id ? (
              <InlineInput
                defaultValue={sub.name}
                onSave={(name) => {
                  updateSub.mutate({ id: sub.id, name }, { onSuccess: () => setEditingId(null) })
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-700">{sub.name}</span>
                <button
                  type="button"
                  onClick={() => setEditingId(sub.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-blue-600 rounded"
                  aria-label="Edit subcategory"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => deleteSub.mutate(sub.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-600 rounded"
                  aria-label="Delete subcategory"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            )}
          </li>
        ))}
        {adding && (
          <li>
            <InlineInput
              placeholder="Subcategory name…"
              onSave={(name) => {
                createSub.mutate({ categoryId: category.id, name }, { onSuccess: () => setAdding(false) })
              }}
              onCancel={() => setAdding(false)}
            />
          </li>
        )}
      </ul>
    </div>
  )
}

export default function CategoryManager() {
  const { data: categories = [], isLoading } = useCategories()
  const createCat = useCreateCategory()
  const updateCat = useUpdateCategory()
  const deleteCat = useDeleteCategory()

  const [selectedId, setSelectedId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const selected = categories.find((c) => c.id === selectedId) || null

  if (isLoading) return <div className="text-sm text-gray-400">Loading…</div>

  return (
    <div className="flex gap-6 items-start">
      {/* Categories panel */}
      <div className="w-72 bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Categories</h2>
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          )}
        </div>

        <ul className="space-y-1">
          {categories.length === 0 && !adding && (
            <li className="text-sm text-gray-400 italic">No categories yet</li>
          )}
          {categories.map((cat) => (
            <li key={cat.id} className="group">
              {editingId === cat.id ? (
                <InlineInput
                  defaultValue={cat.name}
                  onSave={(name) => {
                    updateCat.mutate({ id: cat.id, name }, { onSuccess: () => setEditingId(null) })
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selectedId === cat.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                  onClick={() => setSelectedId(cat.id)}
                >
                  <span className="flex-1 text-sm font-medium truncate">{cat.name}</span>
                  <span className="text-xs text-gray-400">{cat.subcategories.length}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setEditingId(cat.id) }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-blue-600 rounded"
                    aria-label="Edit category"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteCat.mutate(cat.id, {
                        onSuccess: () => { if (selectedId === cat.id) setSelectedId(null) },
                      })
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-600 rounded"
                    aria-label="Delete category"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </li>
          ))}
          {adding && (
            <li>
              <InlineInput
                placeholder="Category name…"
                onSave={(name) => {
                  createCat.mutate(name, {
                    onSuccess: (cat) => { setAdding(false); setSelectedId(cat.id) },
                  })
                }}
                onCancel={() => setAdding(false)}
              />
            </li>
          )}
        </ul>
      </div>

      {/* Subcategories panel */}
      {selected ? (
        <SubcategoryPanel category={selected} />
      ) : (
        <div className="flex-1 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center h-48">
          <p className="text-sm text-gray-400">Select a category to manage its subcategories</p>
        </div>
      )}
    </div>
  )
}

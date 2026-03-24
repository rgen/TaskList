'use client'
import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateSubcategory,
  useUpdateSubcategory,
  useDeleteSubcategory,
  useReorderCategories,
  useReorderSubcategories,
} from '@/hooks/useCategories'

function InlineInput({ defaultValue = '', onSave, onCancel, placeholder = 'Name…' }) {
  const [value, setValue] = useState(defaultValue)
  return (
    <div className="space-y-2">
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
        className="w-full text-sm border border-blue-400 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-2">
        <button type="button" onClick={() => { if (value.trim()) onSave(value.trim()) }}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
          Save
        </button>
        <button type="button" onClick={onCancel}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

function SortableCategoryItem({ cat, selectedId, onSelect, onEdit, onDelete, editingId, onSaveEdit, onCancelEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <li ref={setNodeRef} style={style}>
      {editingId === cat.id ? (
        <InlineInput
          defaultValue={cat.name}
          onSave={(name) => onSaveEdit(cat.id, name)}
          onCancel={onCancelEdit}
        />
      ) : (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors group ${
            selectedId === cat.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
          }`}
          onClick={() => onSelect(cat.id)}
        >
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab text-gray-300 hover:text-gray-500 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </span>
          <span className="flex-1 text-sm font-medium truncate">{cat.name}</span>
          <span className="text-xs text-gray-400">{cat.subcategories.length}</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(cat.id) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-blue-600 rounded"
            aria-label="Edit">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(cat.id) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-600 rounded"
            aria-label="Delete">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </li>
  )
}

function SortableSubItem({ sub, onEdit, onDelete, editingId, onSaveEdit, onCancelEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sub.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <li ref={setNodeRef} style={style} className="group flex items-center gap-2">
      {editingId === sub.id ? (
        <InlineInput
          defaultValue={sub.name}
          onSave={(name) => onSaveEdit(sub.id, name)}
          onCancel={onCancelEdit}
        />
      ) : (
        <>
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab text-gray-300 hover:text-gray-500 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </span>
          <span className="flex-1 text-sm text-gray-700">{sub.name}</span>
          <button type="button" onClick={() => onEdit(sub.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-blue-600 rounded"
            aria-label="Edit">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button type="button" onClick={() => onDelete(sub.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-600 rounded"
            aria-label="Delete">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </>
      )}
    </li>
  )
}

function SubcategoryPanel({ category, allCategories, setCategories }) {
  const createSub = useCreateSubcategory()
  const updateSub = useUpdateSubcategory()
  const deleteSub = useDeleteSubcategory()
  const reorderSubs = useReorderSubcategories()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = category.subcategories.findIndex((s) => s.id === active.id)
    const newIndex = category.subcategories.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(category.subcategories, oldIndex, newIndex)
    setCategories((prev) =>
      prev.map((c) => c.id === category.id ? { ...c, subcategories: reordered } : c)
    )
    reorderSubs.mutate(reordered.map((s) => s.id))
  }

  function sortAlpha() {
    const sorted = [...category.subcategories].sort((a, b) => a.name.localeCompare(b.name))
    setCategories((prev) =>
      prev.map((c) => c.id === category.id ? { ...c, subcategories: sorted } : c)
    )
    reorderSubs.mutate(sorted.map((s) => s.id))
  }

  return (
    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Subcategories</h2>
          <p className="text-xs text-gray-500 mt-0.5">Under: <span className="font-medium text-gray-700">{category.name}</span></p>
        </div>
        <div className="flex items-center gap-2">
          {category.subcategories.length > 1 && (
            <button type="button" onClick={sortAlpha}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              A–Z
            </button>
          )}
          {!adding && (
            <button type="button" onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          )}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={category.subcategories.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {category.subcategories.length === 0 && !adding && (
              <li className="text-sm text-gray-400 italic">No subcategories yet</li>
            )}
            {category.subcategories.map((sub) => (
              <SortableSubItem
                key={sub.id}
                sub={sub}
                editingId={editingId}
                onEdit={setEditingId}
                onDelete={(id) => deleteSub.mutate(id)}
                onSaveEdit={(id, name) => updateSub.mutate({ id, name }, { onSuccess: () => setEditingId(null) })}
                onCancelEdit={() => setEditingId(null)}
              />
            ))}
            {adding && (
              <li>
                <InlineInput
                  placeholder="Subcategory name…"
                  onSave={(name) => createSub.mutate({ categoryId: category.id, name }, { onSuccess: () => setAdding(false) })}
                  onCancel={() => setAdding(false)}
                />
              </li>
            )}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  )
}

export default function CategoryManager() {
  const { data: serverCategories = [], isLoading } = useCategories()
  const [localCategories, setLocalCategories] = useState(null)
  const categories = localCategories ?? serverCategories

  const createCat = useCreateCategory()
  const updateCat = useUpdateCategory()
  const deleteCat = useDeleteCategory()
  const reorderCats = useReorderCategories()

  const [selectedId, setSelectedId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // Sync local state when server data changes
  if (!isLoading && localCategories === null && serverCategories.length > 0) {
    setLocalCategories(serverCategories)
  }

  const selected = categories.find((c) => c.id === selectedId) || null

  function handleCatDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = categories.findIndex((c) => c.id === active.id)
    const newIndex = categories.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(categories, oldIndex, newIndex)
    setLocalCategories(reordered)
    reorderCats.mutate(reordered.map((c) => c.id))
  }

  function sortAlpha() {
    const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name))
    setLocalCategories(sorted)
    reorderCats.mutate(sorted.map((c) => c.id))
  }

  if (isLoading) return <div className="text-sm text-gray-400">Loading…</div>

  return (
    <div className="flex gap-6 items-start">
      {/* Categories panel */}
      <div className="w-72 bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Categories</h2>
          <div className="flex items-center gap-2">
            {categories.length > 1 && (
              <button type="button" onClick={sortAlpha}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                A–Z
              </button>
            )}
            {!adding && (
              <button type="button" onClick={() => setAdding(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            )}
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCatDragEnd}>
          <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-1">
              {categories.length === 0 && !adding && (
                <li className="text-sm text-gray-400 italic">No categories yet</li>
              )}
              {categories.map((cat) => (
                <SortableCategoryItem
                  key={cat.id}
                  cat={cat}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  editingId={editingId}
                  onEdit={setEditingId}
                  onDelete={(id) => deleteCat.mutate(id, {
                    onSuccess: () => { if (selectedId === id) setSelectedId(null) },
                  })}
                  onSaveEdit={(id, name) => updateCat.mutate({ id, name }, { onSuccess: () => setEditingId(null) })}
                  onCancelEdit={() => setEditingId(null)}
                />
              ))}
              {adding && (
                <li>
                  <InlineInput
                    placeholder="Category name…"
                    onSave={(name) => createCat.mutate(name, {
                      onSuccess: (cat) => { setAdding(false); setSelectedId(cat.id); setLocalCategories(null) },
                    })}
                    onCancel={() => setAdding(false)}
                  />
                </li>
              )}
            </ul>
          </SortableContext>
        </DndContext>
      </div>

      {/* Subcategories panel */}
      {selected ? (
        <SubcategoryPanel
          category={selected}
          allCategories={categories}
          setCategories={setLocalCategories}
        />
      ) : (
        <div className="flex-1 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center h-48">
          <p className="text-sm text-gray-400">Select a category to manage its subcategories</p>
        </div>
      )}
    </div>
  )
}

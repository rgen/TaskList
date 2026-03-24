'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriesApi } from '@/lib/api/categories'

const KEY = 'categories'

export function useCategories() {
  return useQuery({ queryKey: [KEY], queryFn: categoriesApi.getAll })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name) => categoriesApi.create(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }) => categoriesApi.update(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => categoriesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useCreateSubcategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ categoryId, name }) => categoriesApi.createSubcategory(categoryId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateSubcategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }) => categoriesApi.updateSubcategory(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useDeleteSubcategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => categoriesApi.deleteSubcategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

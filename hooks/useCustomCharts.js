'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customChartsApi } from '@/lib/api/tasks'

const KEY = 'custom-charts'

export function useCustomCharts() {
  return useQuery({
    queryKey: [KEY],
    queryFn: customChartsApi.getAll,
  })
}

export function useCreateCustomChart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => customChartsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

export function useUpdateCustomChart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => customChartsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

export function useDeleteCustomChart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => customChartsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

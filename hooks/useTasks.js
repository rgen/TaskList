'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/lib/api/tasks'

export const TASKS_KEY = 'tasks'

export function useTasks(filters = {}) {
  return useQuery({
    queryKey: [TASKS_KEY, filters],
    queryFn: () => tasksApi.getAll(filters),
  })
}

export function useTask(id) {
  return useQuery({
    queryKey: [TASKS_KEY, id],
    queryFn: () => tasksApi.getOne(id),
    enabled: !!id,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => tasksApi.create(data),
    onSuccess: (newTask) => {
      qc.setQueryData([TASKS_KEY, newTask.id], newTask)
      qc.invalidateQueries({ queryKey: [TASKS_KEY] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => tasksApi.update(id, data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: [TASKS_KEY] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useToggleTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => tasksApi.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TASKS_KEY] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => tasksApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TASKS_KEY] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subtasksApi, attachmentsApi } from '@/lib/api/subtasks'
import { TASKS_KEY } from './useTasks'

export function useSubtasks(taskId) {
  return useQuery({
    queryKey: [TASKS_KEY, taskId, 'subtasks'],
    queryFn: () => subtasksApi.getAll(taskId),
    enabled: !!taskId,
  })
}

export function useCreateSubtask(taskId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => subtasksApi.create(taskId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TASKS_KEY, taskId] })
    },
  })
}

export function useUpdateSubtask(taskId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => subtasksApi.update(taskId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TASKS_KEY, taskId] })
    },
  })
}

export function useDeleteSubtask(taskId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => subtasksApi.delete(taskId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TASKS_KEY, taskId] })
    },
  })
}

export function useCreateAttachment(taskId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => attachmentsApi.create(taskId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TASKS_KEY, taskId] })
    },
  })
}

export function useDeleteAttachment(taskId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => attachmentsApi.delete(taskId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TASKS_KEY, taskId] })
    },
  })
}

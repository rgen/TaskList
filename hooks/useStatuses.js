'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStatuses, createStatus, updateStatus, deleteStatus } from '@/lib/api/statuses'

export function useStatuses() {
  return useQuery({ queryKey: ['statuses'], queryFn: getStatuses })
}

export function useCreateStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['statuses'] }),
  })
}

export function useUpdateStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['statuses'] }),
  })
}

export function useDeleteStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['statuses'] }),
  })
}

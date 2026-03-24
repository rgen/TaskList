'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { goalsApi } from '@/lib/api/goals'

const KEY = 'goals'
const PROG_KEY = 'goals-progress'

export function useGoals() {
  return useQuery({ queryKey: [KEY], queryFn: goalsApi.getAll })
}

export function useGoalProgress() {
  return useQuery({ queryKey: [PROG_KEY], queryFn: goalsApi.getProgress })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: goalsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      qc.invalidateQueries({ queryKey: [PROG_KEY] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => goalsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: goalsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      qc.invalidateQueries({ queryKey: [PROG_KEY] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

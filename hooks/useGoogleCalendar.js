'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gcalApi } from '@/lib/api/gcal'

export function useGcalStatus() {
  return useQuery({
    queryKey: ['gcal-status'],
    queryFn: gcalApi.getStatus,
  })
}

export function useGcalCalendars(enabled = false) {
  return useQuery({
    queryKey: ['gcal-calendars'],
    queryFn: gcalApi.getCalendars,
    enabled,
  })
}

export function useSelectCalendar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => gcalApi.selectCalendar(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gcal-status'] })
    },
  })
}

export function useSyncTaskToGcal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId) => gcalApi.syncTask(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUnsyncTaskFromGcal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId) => gcalApi.unsyncTask(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useDisconnectGcal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => gcalApi.disconnect(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gcal-status'] })
      qc.invalidateQueries({ queryKey: ['gcal-calendars'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

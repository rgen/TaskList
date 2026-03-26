'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gmailApi } from '@/lib/api/gmail'

export function useGmailStatus() {
  return useQuery({
    queryKey: ['gmail-status'],
    queryFn: gmailApi.getStatus,
  })
}

export function useImportEmails() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => gmailApi.importEmails(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useDisconnectGmail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => gmailApi.disconnect(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gmail-status'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

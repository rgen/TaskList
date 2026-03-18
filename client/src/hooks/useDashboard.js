import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/tasks.js'

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.summary,
  })
}

export function useDashboardWeek() {
  return useQuery({
    queryKey: ['dashboard', 'week'],
    queryFn: dashboardApi.week,
  })
}

export function useDashboardTrend() {
  return useQuery({
    queryKey: ['dashboard', 'trend'],
    queryFn: dashboardApi.trend,
  })
}

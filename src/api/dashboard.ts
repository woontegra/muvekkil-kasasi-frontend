import type { QueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { DashboardSummaryResponse } from '../types/dashboard'
import { SMM_BEKLEYEN_QUERY_KEY } from './smm'

export const DASHBOARD_SUMMARY_QUERY_KEY = ['dashboard-summary'] as const

export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  return apiFetch<DashboardSummaryResponse>('/api/v1/dashboard/summary')
}

export function invalidateDashboardSummary(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_QUERY_KEY })
  void queryClient.invalidateQueries({ queryKey: SMM_BEKLEYEN_QUERY_KEY })
}

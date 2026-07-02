import type { QueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { DashboardSummaryResponse } from '../types/dashboard'
import type { TaksitUyarilariResponse } from '../types/taksitUyari'
import { SMM_BEKLEYEN_QUERY_KEY } from './smm'

export const DASHBOARD_SUMMARY_QUERY_KEY = ['dashboard-summary'] as const
export const TAKSIT_UYARILARI_QUERY_KEY = ['dashboard-taksit-uyarilari'] as const

export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  return apiFetch<DashboardSummaryResponse>('/api/v1/dashboard/summary')
}

export async function getTaksitUyarilari(): Promise<TaksitUyarilariResponse> {
  return apiFetch<TaksitUyarilariResponse>('/api/v1/dashboard/taksit-uyarilari')
}

export function invalidateDashboardSummary(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_QUERY_KEY })
  void queryClient.invalidateQueries({ queryKey: TAKSIT_UYARILARI_QUERY_KEY })
  void queryClient.invalidateQueries({ queryKey: SMM_BEKLEYEN_QUERY_KEY })
}

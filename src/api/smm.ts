import type { QueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { SmmBekleyenlerResponse } from '../types/smm'

export const SMM_BEKLEYEN_QUERY_KEY = ['smm-bekleyen'] as const

export async function listSmmBekleyenler(): Promise<SmmBekleyenlerResponse> {
  return apiFetch<SmmBekleyenlerResponse>('/api/v1/smm/bekleyenler')
}

export function invalidateSmmBekleyen(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: SMM_BEKLEYEN_QUERY_KEY })
}

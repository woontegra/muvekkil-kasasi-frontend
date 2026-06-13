import { apiFetchMultipart } from './client'
import type { DesktopImportCommitResponse, DesktopImportPreviewResponse } from '../types/desktopImport'

export async function previewDesktopImport(file: File): Promise<DesktopImportPreviewResponse> {
  const fd = new FormData()
  fd.set('file', file)
  return apiFetchMultipart<DesktopImportPreviewResponse>('/api/v1/import/desktop/preview', fd)
}

export async function commitDesktopImport(importBatchId: string, file: File): Promise<DesktopImportCommitResponse> {
  const fd = new FormData()
  fd.set('file', file)
  fd.set('importBatchId', importBatchId)
  return apiFetchMultipart<DesktopImportCommitResponse>('/api/v1/import/desktop/commit', fd)
}

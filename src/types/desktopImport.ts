export type DesktopImportCounts = Record<string, number>

export type DesktopImportPreviewResponse = {
  ok: true
  importBatchId: string
  sourceFingerprint: string
  counts: DesktopImportCounts
  warnings: string[]
  errors: string[]
  canCommit: boolean
}

export type DesktopImportCommitResponse = {
  ok: true
  importBatchId: string
  inserted: DesktopImportCounts
  warnings: string[]
}

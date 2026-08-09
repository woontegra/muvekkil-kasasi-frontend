import { useQuery } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useState } from 'react'
import { listAuditLogs } from '../../api/audit'
import { formatDateTimeTR } from '../../utils/formatters'
import { Button, Table, TBody, TD, TH, THead, TR } from '../ui'

type Props = {
  onClose: () => void
}

export function DenetimKayitlariModal({ onClose }: Props): ReactElement {
  const [page, setPage] = useState(1)
  const limit = 25

  const q = useQuery({
    queryKey: ['audit-logs', page, limit],
    queryFn: () => listAuditLogs({ page, limit }),
    staleTime: 15_000
  })

  const items = q.data?.items ?? []
  const total = q.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-border bg-white shadow-xl dark:bg-surface-elevated">
        <div className="flex items-start justify-between gap-2 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-ink">Denetim kayıtları</h2>
            <p className="mt-0.5 text-xs text-ink-muted">Son işlemler ve sistem olayları</p>
          </div>
          <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-3 py-3 sm:px-5">
          {q.isLoading ? <p className="text-sm text-ink-muted">Yükleniyor…</p> : null}
          {q.isError ? (
            <p className="text-sm text-danger">{q.error instanceof Error ? q.error.message : 'Kayıtlar alınamadı.'}</p>
          ) : null}
          {!q.isLoading && !q.isError ? (
            <Table>
              <THead>
                <TR>
                  <TH>Tarih</TH>
                  <TH>İşlem</TH>
                  <TH>Kullanıcı</TH>
                  <TH>IP</TH>
                </TR>
              </THead>
              <TBody>
                {items.length === 0 ? (
                  <TR>
                    <TD colSpan={4} className="py-6 text-center text-sm text-ink-muted">
                      Kayıt bulunamadı.
                    </TD>
                  </TR>
                ) : (
                  items.map((row) => (
                    <TR key={row.id}>
                      <TD className="whitespace-nowrap text-xs tabular-nums">{formatDateTimeTR(row.createdAt)}</TD>
                      <TD className="text-xs font-medium text-ink">{row.action}</TD>
                      <TD className="text-xs text-ink-muted">
                        {row.userAdSoyad ?? row.userKullaniciAdi ?? '—'}
                      </TD>
                      <TD className="font-mono text-[11px] text-ink-subtle">{row.ipAddress ?? '—'}</TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3">
          <span className="text-xs text-ink-muted">
            Toplam {total} kayıt · Sayfa {page}/{totalPages}
          </span>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Önceki
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sonraki
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

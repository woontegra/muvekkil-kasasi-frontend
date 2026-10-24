import type {
  TahsilatBildirimPlanAtlamaNedeni,
  TahsilatBildirimPlanlaResponse
} from '../types/tahsilatBildirim'
import { whatsappAutomationReasonLabel } from './whatsapp'

export type PlanlamaBildirimi = {
  kind: 'success' | 'info'
  title: string
  description?: string
  durationMs: number
}

function trTarih(ymd: string): string {
  const [y, m, d] = ymd.split('-')
  return y && m && d ? `${d}.${m}.${y}` : ymd
}

const NEDEN_METNI: Record<TahsilatBildirimPlanAtlamaNedeni, (n: number, enYakin: string | null) => string> = {
  PLAN_KAPALI: (n) => `${n} taksitte hatırlatma kapatılmış.`,
  MUVEKKIL_IZNI_KAPALI: (n) => `${n} taksitte müvekkilin otomatik bildirim izni kapalı.`,
  DOSYA_OTOMASYONU_KAPALI: (n) => `${n} taksitte dosya için hatırlatmalar kapalı.`,
  TAKSIT_SESSIZDE: (n) => `${n} taksit sessize alınmış.`,
  AKTIF_KURAL_YOK: (n) => `${n} taksit için aktif hatırlatma kuralı yok.`,
  HATIRLATMA_GUNU_GELMEDI: (n, enYakin) =>
    `${n} taksitin hatırlatma günü henüz gelmedi${enYakin ? ` (en yakın: ${trTarih(enYakin)})` : ''}.`,
  HATIRLATMA_GUNU_GECTI: (n) =>
    `${n} taksitin hatırlatma günü geçmiş; geçmiş günler için yeni hatırlatma oluşturulmaz.`,
  ZATEN_PLANLANDI: (n) => `${n} taksit için bugünkü hatırlatma zaten planlanmış.`,
  BUGUN_ZATEN_ISLENDI: (n) =>
    `${n} taksit için bugünkü hatırlatma daha önce işlenmiş (gönderilmiş, atlanmış veya iptal edilmiş olabilir).`
}

function satirlar(lines: string[]): string | undefined {
  return lines.length ? lines.map((l) => `• ${l}`).join('\n') : undefined
}

/**
 * "Planlamayı şimdi çalıştır" sonucunu kullanıcı bildirimine çevirir.
 * Yalnızca backend'in doğruladığı neden kodları ve adetleri gösterilir;
 * planlama, gönderim sırası ve gönderim/teslim birbirinden ayrı anlatılır.
 */
export function planlamaSonucuBildirimi(res: TahsilatBildirimPlanlaResponse): PlanlamaBildirimi {
  const { result } = res
  if (result.skipped) {
    return {
      kind: 'info',
      title: whatsappAutomationReasonLabel(
        result.reason,
        typeof res.message === 'string' ? res.message : 'Planlama atlandı.'
      ),
      durationMs: 6000
    }
  }

  const ozet = result.ozet
  const lines: string[] = []

  if (result.created > 0 && ozet) {
    const bekleyen = Math.min(ozet.saatiBekleyenYeniIs, result.created)
    const hemen = result.created - bekleyen
    if (hemen > 0) lines.push(`${hemen} hatırlatmanın gönderim saati geldi; bir sonraki otomatik çalışmada işlenecek.`)
    if (bekleyen > 0) lines.push(`${bekleyen} hatırlatma bugün gönderim saati gelince işlenecek.`)
  }

  if (ozet) {
    const nedenler = (Object.entries(ozet.nedenler) as [TahsilatBildirimPlanAtlamaNedeni, number][])
      .filter(([kod, n]) => n > 0 && kod in NEDEN_METNI)
      .sort((a, b) => b[1] - a[1])
    for (const [kod, n] of nedenler) lines.push(NEDEN_METNI[kod](n, ozet.enYakinPlanYmd))
    if (ozet.acikTaksit === 0) lines.push('Borcu kalan aktif taksit bulunmuyor.')
  }

  if (result.cancelled > 0) {
    lines.push(`Borcu kapanan veya iptal edilen taksitlere ait ${result.cancelled} bekleyen hatırlatma iptal edildi.`)
  }

  const g = res.gonderimAsamasi
  if (g?.sablonEksik) {
    lines.push(`Gönderim aşaması (bugün): ${g.sablonEksik} hatırlatma onaylı WhatsApp şablonu olmadığı için gönderilmedi.`)
  }
  if (g?.paraBirimiUyumsuz) {
    lines.push(
      `Gönderim aşaması (bugün): ${g.paraBirimiUyumsuz} hatırlatma taksitin para birimine uygun şablon olmadığı için gönderilmedi.`
    )
  }

  const description = satirlar(lines)
  const durationMs = description ? 10000 : 5000

  if (result.created > 0) {
    return {
      kind: 'success',
      title: `${result.created} yeni hatırlatma planlandı (henüz gönderilmedi).`,
      description,
      durationMs
    }
  }

  return {
    kind: 'info',
    title: 'Yeni hatırlatma planlanmadı.',
    description: description ?? 'Bugün için planlanacak uygun hatırlatma bulunamadı.',
    durationMs
  }
}

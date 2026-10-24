import { describe, expect, it } from 'vitest'
import type { TahsilatBildirimPlanlaResponse, TahsilatBildirimPlanOzeti } from '../types/tahsilatBildirim'
import { planlamaSonucuBildirimi } from './planlamaSonucuBildirimi'

function ozet(patch: Partial<TahsilatBildirimPlanOzeti> = {}): TahsilatBildirimPlanOzeti {
  return {
    acikTaksit: 0,
    yeniPlanlananTaksit: 0,
    saatiBekleyenYeniIs: 0,
    nedenler: {},
    enYakinPlanYmd: null,
    ...patch
  }
}

function res(
  result: Partial<TahsilatBildirimPlanlaResponse['result']>,
  extra: Partial<TahsilatBildirimPlanlaResponse> = {}
): TahsilatBildirimPlanlaResponse {
  return {
    ok: true,
    result: { tenantId: 't', skipped: false, created: 0, cancelled: 0, ...result },
    ...extra
  }
}

describe('planlamaSonucuBildirimi', () => {
  it('yeni hatırlatma yoksa başarı değil bilgi gösterir ve nedenleri adetleriyle sıralar', () => {
    const b = planlamaSonucuBildirimi(
      res({
        ozet: ozet({
          acikTaksit: 12,
          nedenler: { MUVEKKIL_IZNI_KAPALI: 2, HATIRLATMA_GUNU_GELMEDI: 8, HATIRLATMA_GUNU_GECTI: 1 },
          enYakinPlanYmd: '2026-11-11'
        })
      })
    )
    expect(b.kind).toBe('info')
    expect(b.title).toBe('Yeni hatırlatma planlanmadı.')
    expect(b.description?.split('\n')).toEqual([
      '• 8 taksitin hatırlatma günü henüz gelmedi (en yakın: 11.11.2026).',
      '• 2 taksitte müvekkilin otomatik bildirim izni kapalı.',
      '• 1 taksitin hatırlatma günü geçmiş; geçmiş günler için yeni hatırlatma oluşturulmaz.'
    ])
    expect(b.title + b.description).not.toMatch(/Yeni: 0|İptal: 0|Başarılı/)
  })

  it('gerçekten yeni hatırlatma oluştuysa başarı gösterir; gönderildi demez', () => {
    const b = planlamaSonucuBildirimi(
      res({ created: 3, ozet: ozet({ acikTaksit: 3, yeniPlanlananTaksit: 3, saatiBekleyenYeniIs: 2 }) })
    )
    expect(b.kind).toBe('success')
    expect(b.title).toBe('3 yeni hatırlatma planlandı (henüz gönderilmedi).')
    expect(b.description).toContain('1 hatırlatmanın gönderim saati geldi; bir sonraki otomatik çalışmada işlenecek.')
    expect(b.description).toContain('2 hatırlatma bugün gönderim saati gelince işlenecek.')
    expect(b.description ?? '').not.toMatch(/teslim edildi|gönderildi\./i)
  })

  it('doğrulanmamış nedenleri göstermez', () => {
    const b = planlamaSonucuBildirimi(res({ ozet: ozet({ acikTaksit: 1, nedenler: { ZATEN_PLANLANDI: 1 } }) }))
    expect(b.description).toBe('• 1 taksit için bugünkü hatırlatma zaten planlanmış.')
    expect(b.description).not.toMatch(/şablon|para birimi|izni|saat/i)
  })

  it('bugün işlenmiş hatırlatmayı gönderildi diye iddia etmez', () => {
    const b = planlamaSonucuBildirimi(res({ ozet: ozet({ acikTaksit: 1, nedenler: { BUGUN_ZATEN_ISLENDI: 1 } }) }))
    expect(b.description).toContain('gönderilmiş, atlanmış veya iptal edilmiş olabilir')
  })

  it('şablon ve para birimi atlamalarını yalnızca gönderim aşaması olarak ayrı gösterir', () => {
    const b = planlamaSonucuBildirimi(
      res(
        { ozet: ozet({ acikTaksit: 1, nedenler: { ZATEN_PLANLANDI: 1 } }) },
        { gonderimAsamasi: { sablonEksik: 1, paraBirimiUyumsuz: 2 } }
      )
    )
    expect(b.kind).toBe('info')
    expect(b.description).toContain(
      'Gönderim aşaması (bugün): 1 hatırlatma onaylı WhatsApp şablonu olmadığı için gönderilmedi.'
    )
    expect(b.description).toContain(
      'Gönderim aşaması (bugün): 2 hatırlatma taksitin para birimine uygun şablon olmadığı için gönderilmedi.'
    )
  })

  it('sıfır gönderim aşaması değerlerini göstermez', () => {
    const b = planlamaSonucuBildirimi(
      res({ ozet: ozet({ acikTaksit: 1, nedenler: { AKTIF_KURAL_YOK: 1 } }) }, {
        gonderimAsamasi: { sablonEksik: 0, paraBirimiUyumsuz: 0 }
      })
    )
    expect(b.description).toBe('• 1 taksit için aktif hatırlatma kuralı yok.')
  })

  it('iptal edilen bekleyen hatırlatmaları açıklar', () => {
    const b = planlamaSonucuBildirimi(res({ cancelled: 2, ozet: ozet() }))
    expect(b.kind).toBe('info')
    expect(b.description).toContain('Borcu kalan aktif taksit bulunmuyor.')
    expect(b.description).toContain('Borcu kapanan veya iptal edilen taksitlere ait 2 bekleyen hatırlatma iptal edildi.')
  })

  it('otomasyon kapalıysa bilgi bildirimi ve anlaşılır neden', () => {
    const b = planlamaSonucuBildirimi(
      res({ skipped: true, reason: 'otomasyon_kapali' }, { message: 'Büro otomasyonu kapalı.' })
    )
    expect(b.kind).toBe('info')
    expect(b.title).toMatch(/Büro otomasyonu kapalı/)
  })

  it('eski backend yanıtında (özet yok) yeşil başarı göstermez', () => {
    const b = planlamaSonucuBildirimi(res({}))
    expect(b.kind).toBe('info')
    expect(b.description).toBe('Bugün için planlanacak uygun hatırlatma bulunamadı.')
  })
})

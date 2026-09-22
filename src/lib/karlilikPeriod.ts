import type { FinancePeriodRange } from './financePeriodRange'
import type { MuvekkilKarlilikPayload, MuvekkilKarlilikResponse } from '../types/maliOzet'

/**
 * Seçilen finans dönemine göre kârlılık özetini seçer.
 * ALL_TIME → tumZamanlar; diğer presetler → buDonem (API dönem filtreli payload).
 */
export function pickKarlilikPayload(
  data: MuvekkilKarlilikResponse,
  period: FinancePeriodRange
): MuvekkilKarlilikPayload {
  if (period.preset === 'ALL_TIME' || !period.bas || !period.bit) {
    return data.tumZamanlar
  }
  return data.buDonem ?? data.tumZamanlar
}

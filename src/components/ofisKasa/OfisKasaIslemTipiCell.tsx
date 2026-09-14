import type { ReactElement } from 'react'
import {
  isOfisDuzeltmeTipi,
  OFIS_DUZELTME_TIP_BADGE_CLASS
} from '../../lib/ofisKasaDuzeltmeStil'
import type { OfisKasaIslemTipiApi } from '../../types/ofisKasasi'

function tipLabel(t: OfisKasaIslemTipiApi): string {
  switch (t) {
    case 'GELIR':
      return 'Gelir'
    case 'GIDER':
      return 'Gider'
    case 'DUZELTME':
      return 'Düzeltme'
    case 'DOVIZ_CIKIS':
      return 'Döviz çıkış'
    case 'DOVIZ_GIRIS':
      return 'Döviz giriş'
    default:
      return t
  }
}

type Props = {
  islemTipi: OfisKasaIslemTipiApi
}

/** Tip sütunu: DUZELTME → kırmızı badge; diğerleri düz metin. */
export function OfisKasaIslemTipiCell({ islemTipi }: Props): ReactElement {
  if (isOfisDuzeltmeTipi(islemTipi)) {
    return (
      <span data-testid="ofis-duzeltme-tip-badge" className={OFIS_DUZELTME_TIP_BADGE_CLASS}>
        Düzeltme
      </span>
    )
  }
  return <span className="text-sm font-medium">{tipLabel(islemTipi)}</span>
}

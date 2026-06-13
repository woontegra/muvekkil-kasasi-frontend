import type { AuthTenantDto } from './auth'
import type { DosyaDto } from './dosya'
import type { KasaHareketiDto, KasaOzetDto } from './kasa'
import type { MuvekkilDto } from './muvekkil'
import type { DosyaVekaletOzetDto, VekaletTaksitiDto, VekaletUcretiDto } from './vekalet'

export type DosyaHesapOzetiVekaletDto = {
  ucret: VekaletUcretiDto | null
  ozet: DosyaVekaletOzetDto
}

export type DosyaHesapOzetiResponse = {
  ok: true
  dosya: DosyaDto
  muvekkil: MuvekkilDto
  tenant: AuthTenantDto
  kasaOzet: KasaOzetDto
  kasaHareketleri: KasaHareketiDto[]
  vekalet: DosyaHesapOzetiVekaletDto
  taksitler: VekaletTaksitiDto[]
  smmBekleyenler: VekaletTaksitiDto[]
  yazdirmaTarihi: string
}

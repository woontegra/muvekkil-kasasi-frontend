import { useMemo, type ReactElement, type ReactNode } from 'react'
import { AlertBox, Button, Input, Select } from '../../ui'
import { cn } from '../../../lib/cn'
import type { OzelSablonDegisken } from '../../../api/whatsappBaglanti'
import {
  SYSTEM_FIELDS,
  systemFieldLabel,
  slugifyMetaName,
  type SablonFormValues
} from './sablonFormShared'

export type FormVisibleSection =
  | 'identity'
  | 'classification'
  | 'message'
  | 'variables'
  | 'examples'

function SectionFrame(props: { framed?: boolean; children: ReactNode }): ReactElement {
  return (
    <div
      className={cn(
        'rounded-lg',
        props.framed && 'ring-2 ring-primary p-3 bg-primary/[0.03]'
      )}
    >
      {props.children}
    </div>
  )
}

type SectionProps = {
  values: SablonFormValues
  onChange: (patch: Partial<SablonFormValues>) => void
  readOnly?: boolean
  framed?: boolean
}

function IdentitySection(props: SectionProps & { metaNameTouched: boolean; onMetaNameTouched: () => void }): ReactElement {
  const { values, readOnly } = props
  return (
    <SectionFrame framed={props.framed}>
      <div className="space-y-3">
        <Input
          label="Şablon görünen adı"
          value={values.displayName}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) => {
            const next = e.target.value
            props.onChange({
              displayName: next,
              metaName: props.metaNameTouched ? values.metaName : slugifyMetaName(next)
            })
          }}
        />
        <Input
          label="Meta şablon adı"
          value={values.metaName}
          readOnly={readOnly}
          disabled={readOnly}
          hint={readOnly ? undefined : 'Küçük harf ve alt çizgi. Meta’ya gönderildikten sonra değiştirilemez.'}
          onChange={(e) => {
            props.onMetaNameTouched()
            props.onChange({ metaName: slugifyMetaName(e.target.value) })
          }}
        />
      </div>
    </SectionFrame>
  )
}

function ClassificationSection(props: SectionProps): ReactElement {
  const { values, readOnly } = props
  return (
    <SectionFrame framed={props.framed}>
      <div className="space-y-3">
        <Select
          label="Kullanım alanı"
          value={values.usageArea}
          disabled={readOnly}
          onChange={(e) =>
            props.onChange({ usageArea: e.target.value as SablonFormValues['usageArea'] })
          }
        >
          <option value="VADEDEN_ONCE">Vadeden önce</option>
          <option value="VADE_GUNU">Vade günü</option>
          <option value="VADE_SONRASI">Vade sonrası</option>
          <option value="KISMI_ODEME_SONRASI">Kısmi ödeme sonrası</option>
          <option value="ODEME_ALINDI">Ödeme alındı</option>
          <option value="RANDEVU_HATIRLATMA">Randevu hatırlatma</option>
          <option value="MANUEL">Yalnızca manuel kullanım</option>
        </Select>
        <Select
          label="Kategori"
          value={values.category}
          disabled={readOnly}
          onChange={(e) =>
            props.onChange({ category: e.target.value as SablonFormValues['category'] })
          }
        >
          <option value="UTILITY">UTILITY — Bilgilendirme/Hatırlatma</option>
          <option value="MARKETING">MARKETING — Tanıtım/Duyuru</option>
        </Select>
        {values.category === 'MARKETING' ? (
          <AlertBox variant="warning">MARKETING şablonları için açık rıza/ileti izni zorunludur.</AlertBox>
        ) : null}
        <Input label="Dil" value="Türkçe (tr)" disabled />
      </div>
    </SectionFrame>
  )
}

function MessageSection(props: SectionProps & { compactHint?: boolean }): ReactElement {
  const { values, readOnly } = props
  return (
    <SectionFrame framed={props.framed}>
      <div className="space-y-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">
            {props.compactHint ? 'Mesaj metni · örnek mesaj' : 'Mesaj metni'}
          </label>
          <textarea
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-surface-muted/40"
            rows={4}
            value={values.bodyText}
            readOnly={readOnly}
            disabled={readOnly}
            onChange={(e) => props.onChange({ bodyText: e.target.value })}
          />
        </div>
        <p className="text-xs leading-relaxed text-ink-subtle">
          {props.compactHint
            ? 'Mesaj açık, kısa ve gönderim amacıyla uyumlu olmalıdır. Tehdit, baskı veya yanıltıcı ifade kullanmayın.'
            : 'Değişken kodlarını elle yazmak zorunda değilsiniz; aşağıdaki sistem alanlarından ekleyebilirsiniz.'}
        </p>
      </div>
    </SectionFrame>
  )
}

function VariablesSection(props: SectionProps & { showMapping?: boolean }): ReactElement {
  const { values, readOnly } = props

  function addVariable(systemField: OzelSablonDegisken['systemField']): void {
    if (readOnly) return
    const next = values.variables.length + 1
    const sample = SYSTEM_FIELDS.find((f) => f.key === systemField)?.sample ?? 'örnek'
    props.onChange({
      variables: [...values.variables, { index: next, systemField, exampleValue: sample }],
      bodyText: `${values.bodyText}${values.bodyText ? ' ' : ''}{{${next}}}`
    })
  }

  return (
    <SectionFrame framed={props.framed}>
      <div className="space-y-3">
        <p className="text-xs font-semibold text-ink-muted">Sistem alanları</p>
        <div className="flex flex-wrap gap-1.5">
          {SYSTEM_FIELDS.map((field) => (
            <Button
              key={field.key}
              type="button"
              variant="outline"
              size="sm"
              disabled={readOnly}
              className={readOnly ? 'pointer-events-none h-7 px-2' : undefined}
              onClick={() => addVariable(field.key)}
            >
              + {field.label}
            </Button>
          ))}
        </div>
        {props.showMapping ? (
          <>
            <p className="rounded-md border border-border bg-surface-muted/20 px-3 py-2 text-sm leading-relaxed text-ink">
              {values.bodyText}
            </p>
            <ul className="space-y-1 text-sm text-ink">
              {values.variables.map((v) => (
                <li key={v.index}>
                  <span className="font-semibold">{`{{${v.index}}}`}</span>
                  {' — '}
                  {systemFieldLabel(v.systemField)}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </SectionFrame>
  )
}

function ExamplesSection(props: SectionProps & { compact?: boolean }): ReactElement {
  const { values, readOnly } = props
  const preview = useMemo(() => {
    let text = values.bodyText
    for (const v of values.variables) {
      text = text.split(`{{${v.index}}}`).join(v.exampleValue || `{{${v.index}}}`)
    }
    return text
  }, [values.bodyText, values.variables])

  return (
    <SectionFrame framed={props.framed}>
      <div className={cn('space-y-2.5', props.compact && 'space-y-2')}>
        <div className={cn(props.compact && 'grid gap-2 sm:grid-cols-2')}>
          {values.variables.map((v, idx) => (
            <Input
              key={`${v.index}-${v.systemField}`}
              label={`{{${v.index}}} — ${systemFieldLabel(v.systemField)}`}
              value={v.exampleValue}
              readOnly={readOnly}
              disabled={readOnly}
              onChange={(e) => {
                const next = [...values.variables]
                next[idx] = { ...next[idx], exampleValue: e.target.value }
                props.onChange({ variables: next })
              }}
            />
          ))}
        </div>
        <Input
          label="Opsiyonel alt bilgi"
          value={values.footerText}
          readOnly={readOnly}
          disabled={readOnly}
          hint={props.compact ? undefined : 'Footer alanı isteğe bağlıdır.'}
          onChange={(e) => props.onChange({ footerText: e.target.value })}
        />
        <div className="rounded-md border border-border bg-surface-muted/20 p-2.5">
          <p className="text-xs font-semibold text-ink-muted">Canlı önizleme</p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">
            {preview || 'Mesaj önizlemesi burada görünecek.'}
          </p>
          {values.footerText.trim() ? (
            <p className="mt-1.5 text-xs text-ink-muted">{values.footerText.trim()}</p>
          ) : null}
        </div>
      </div>
    </SectionFrame>
  )
}

export function OzelSablonFormFields(props: {
  values: SablonFormValues
  onChange: (patch: Partial<SablonFormValues>) => void
  readOnly?: boolean
  visibleSection?: FormVisibleSection | null
  metaNameTouched: boolean
  onMetaNameTouched: () => void
  saveLabel: string
  saving?: boolean
  onSave?: () => void
  onCancel?: () => void
}): ReactElement {
  const { values, readOnly, visibleSection } = props
  const showAll = !visibleSection
  const framed = Boolean(visibleSection)

  return (
    <div className={cn('space-y-3', !showAll && 'space-y-0')}>
      {showAll || visibleSection === 'identity' ? (
        <IdentitySection
          values={values}
          onChange={props.onChange}
          readOnly={readOnly}
          framed={framed}
          metaNameTouched={props.metaNameTouched}
          onMetaNameTouched={props.onMetaNameTouched}
        />
      ) : null}
      {showAll || visibleSection === 'classification' ? (
        <ClassificationSection
          values={values}
          onChange={props.onChange}
          readOnly={readOnly}
          framed={framed}
        />
      ) : null}
      {showAll || visibleSection === 'message' ? (
        <MessageSection
          values={values}
          onChange={props.onChange}
          readOnly={readOnly}
          framed={framed}
          compactHint={!showAll}
        />
      ) : null}
      {showAll || visibleSection === 'variables' ? (
        <VariablesSection
          values={values}
          onChange={props.onChange}
          readOnly={readOnly}
          framed={framed}
          showMapping={!showAll}
        />
      ) : null}
      {showAll || visibleSection === 'examples' ? (
        <ExamplesSection
          values={values}
          onChange={props.onChange}
          readOnly={readOnly}
          framed={framed}
          compact={!showAll}
        />
      ) : null}

      {showAll ? (
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          {props.onCancel ? (
            <Button type="button" variant="outline" onClick={props.onCancel}>
              İptal
            </Button>
          ) : null}
          <Button
            type="button"
            disabled={Boolean(props.saving)}
            onClick={() => {
              if (readOnly) return
              props.onSave?.()
            }}
          >
            {props.saving ? 'Kaydediliyor…' : props.saveLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

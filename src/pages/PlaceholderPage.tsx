import type { ReactElement } from 'react'
import { PageHeader, EmptyState } from '../components/ui'

export type PlaceholderPageProps = {
  title: string
  description?: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps): ReactElement {
  return (
    <div className="mx-auto max-w-[960px]">
      <PageHeader title={title} description={description} />
      <EmptyState
        title="Bu modül yakında"
        description="İş mantığı masaüstü uygulama ile aynı kalacak; API ve ekranlar sırayla bağlanacak. Şimdilik menü ve panel iskeleti üzerinde çalışıyorsunuz."
      />
    </div>
  )
}

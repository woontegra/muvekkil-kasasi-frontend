/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'pdfmake/build/pdfmake' {
  const pdfMake: {
    addVirtualFileSystem: (vfs: unknown) => void
    createPdf: (docDefinition: unknown, options?: unknown) => {
      download: (defaultFileName?: string) => Promise<void>
      getBlob: () => Promise<Blob>
    }
  }
  export default pdfMake
}

declare module 'pdfmake/build/vfs_fonts' {
  const pdfFonts: Record<string, string>
  export default pdfFonts
}

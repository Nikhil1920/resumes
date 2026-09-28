import { Capacitor, registerPlugin } from '@capacitor/core'

type NativePdfResult = { value?: string }
type NativePdfOptions = { value: string; title: string; pageSize: 'A4' | 'Letter' }

interface SilentPdfPlugin {
  download(options: NativePdfOptions): Promise<NativePdfResult>
  share(options: NativePdfOptions): Promise<NativePdfResult>
}

const silentPdf = registerPlugin<SilentPdfPlugin>('SilentPDF')

export const isNativeResumePlatform = () => Capacitor.isNativePlatform()

const currentPreviewPath = () =>
  typeof window === 'undefined' ? '' : window.location.pathname

const currentPreviewTitle = () =>
  typeof document === 'undefined' ? 'Resume' : document.title

const currentPreviewPageSize = (): NativePdfOptions['pageSize'] =>
  typeof document !== 'undefined' &&
  document.querySelector<HTMLElement>('.resume-preview[data-page-size]')?.dataset.pageSize === 'Letter'
    ? 'Letter'
    : 'A4'

export const downloadNativeResumePdf = () =>
  silentPdf.download({ value: currentPreviewPath(), title: currentPreviewTitle(), pageSize: currentPreviewPageSize() })

export const shareNativeResumePdf = () =>
  silentPdf.share({ value: currentPreviewPath(), title: currentPreviewTitle(), pageSize: currentPreviewPageSize() })

import { Capacitor, registerPlugin } from '@capacitor/core'

type NativePdfResult = { value?: string }

interface SilentPdfPlugin {
  download(options: { value: string; title: string }): Promise<NativePdfResult>
  share(options: { value: string; title: string }): Promise<NativePdfResult>
}

const silentPdf = registerPlugin<SilentPdfPlugin>('SilentPDF')

export const isNativeResumePlatform = () => Capacitor.isNativePlatform()

const currentPreviewPath = () =>
  typeof window === 'undefined' ? '' : window.location.pathname

const currentPreviewTitle = () =>
  typeof document === 'undefined' ? 'Resume' : document.title

export const downloadNativeResumePdf = () =>
  silentPdf.download({ value: currentPreviewPath(), title: currentPreviewTitle() })

export const shareNativeResumePdf = () =>
  silentPdf.share({ value: currentPreviewPath(), title: currentPreviewTitle() })

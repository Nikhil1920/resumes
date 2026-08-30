import { Capacitor, registerPlugin } from '@capacitor/core'

type NativePdfResult = { value?: string }

interface SilentPdfPlugin {
  download(options: { value: string }): Promise<NativePdfResult>
  share(options: { value: string }): Promise<NativePdfResult>
}

const silentPdf = registerPlugin<SilentPdfPlugin>('SilentPDF')

export const isNativeResumePlatform = () => Capacitor.isNativePlatform()

const currentPreviewPath = () =>
  typeof window === 'undefined' ? '' : window.location.pathname

export const downloadNativeResumePdf = () =>
  silentPdf.download({ value: currentPreviewPath() })

export const shareNativeResumePdf = () =>
  silentPdf.share({ value: currentPreviewPath() })

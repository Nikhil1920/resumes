// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

const nativePdf = vi.hoisted(() => ({
  download: vi.fn(async () => ({})),
  share: vi.fn(async () => ({})),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true },
  registerPlugin: () => nativePdf,
}))

import { downloadNativeResumePdf, shareNativeResumePdf } from './native-pdf'

describe('native PDF paper size', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = '<div class="rp-doc" data-page-size="A4"></div>'
    document.title = 'Sample resume'
  })

  it('uses the current paper selection for each download and share', async () => {
    await downloadNativeResumePdf()
    expect(nativePdf.download).toHaveBeenLastCalledWith(expect.objectContaining({ pageSize: 'A4' }))

    document.querySelector<HTMLElement>('.rp-doc')!.dataset.pageSize = 'Letter'
    await downloadNativeResumePdf()
    await shareNativeResumePdf()
    expect(nativePdf.download).toHaveBeenLastCalledWith(expect.objectContaining({ pageSize: 'Letter' }))
    expect(nativePdf.share).toHaveBeenLastCalledWith(expect.objectContaining({ pageSize: 'Letter' }))
  })

  it('preserves A4 when no page selection is rendered', async () => {
    document.body.innerHTML = ''
    await downloadNativeResumePdf()
    expect(nativePdf.download).toHaveBeenLastCalledWith(expect.objectContaining({ pageSize: 'A4' }))
  })
})

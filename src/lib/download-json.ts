export function downloadJsonFile(filename: string, payload: string | object) {
  if (typeof window === 'undefined') return
  const contents =
    typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)
  const blob = new Blob([contents], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

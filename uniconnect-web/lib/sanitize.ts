/**
 * Validates that a photo URL only uses safe protocols/origins.
 * Prevents javascript: URIs and other unsafe schemes in img src attributes.
 */
export function safePhotoUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://')
  ) {
    return trimmed
  }
  return ''
}

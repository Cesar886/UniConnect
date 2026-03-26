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

/**
 * Basic string sanitizer to remove HTML tags and trim whitespace.
 */
export function sanitizeString(str: string | null | undefined): string {
  if (!str || typeof str !== 'string') return ''
  return str
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .trim()
}

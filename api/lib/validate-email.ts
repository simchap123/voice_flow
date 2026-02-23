// Require at least 2-char TLD, reject local parts starting/ending with dots
const EMAIL_REGEX = /^[^\s@.][^\s@]*@[^\s@]+\.[^\s@]{2,}$/

export function isValidEmail(email: string): boolean {
  if (!EMAIL_REGEX.test(email)) return false
  const local = email.split('@')[0]
  // Reject local part ending with dot (e.g. "user.@example.com")
  if (local.endsWith('.')) return false
  // Reject consecutive dots in local part (e.g. "user..name@example.com")
  if (local.includes('..')) return false
  return true
}

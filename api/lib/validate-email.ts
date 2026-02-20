// Require at least 2-char TLD (rejects x@y.c but allows x@y.co)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}

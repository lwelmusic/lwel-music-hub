// Turns what a person types into +256XXXXXXXXX form. Returns null if it does not look like a phone number.
export function normalizePhone(input) {
  let s = String(input || '').replace(/[\s\-().]/g, '')
  if (!s) return null
  if (s.startsWith('00')) s = '+' + s.slice(2)
  else if (s.startsWith('0') && s.length === 10) s = '+256' + s.slice(1)
  else if (/^7\d{8}$/.test(s)) s = '+256' + s
  else if (/^256\d{9}$/.test(s)) s = '+' + s
  return /^\+\d{9,15}$/.test(s) ? s : null
}

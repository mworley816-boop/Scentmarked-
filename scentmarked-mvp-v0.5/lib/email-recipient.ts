/** Basic syntax check before passing a marketing recipient to the email provider. */
export function hasValidRecipientEmail(value:unknown):value is string{
  return typeof value==='string'&&value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

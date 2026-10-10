/** Basic syntax check before passing a marketing recipient to the email provider. */
export function hasValidRecipientEmail(value:unknown):value is string{
  if(typeof value!=='string')return false
  const email=value.trim()
  const at=email.lastIndexOf('@')
  if(email.length>254||at<1||at>64)return false
  const domain=email.slice(at+1)
  return domain.length<=253&&domain.split('.').every(label=>label.length>0&&label.length<=63)&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

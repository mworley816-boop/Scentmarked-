'use client'

import { useState } from 'react'

export default function ScheduleFields(){
  const [value,setValue]=useState('')
  const selected=value?new Date(value):null
  const offset=selected&&!Number.isNaN(selected.getTime())
    ? selected.getTimezoneOffset()
    : new Date().getTimezoneOffset()

  return <>
    <label>Send date and time<input type="datetime-local" name="scheduled_at" value={value} onChange={event=>setValue(event.target.value)} required/></label>
    <input type="hidden" name="timezone_offset" value={String(offset)}/>
  </>
}

'use client'

export default function ScheduleFields(){
  return <>
    <label>Send date and time<input type="datetime-local" name="scheduled_at" required/></label>
    <input type="hidden" name="timezone_offset" value={String(new Date().getTimezoneOffset())}/>
  </>
}

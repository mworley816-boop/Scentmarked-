'use client'

import { useFormStatus } from 'react-dom'

export default function ScentProfileSubmit({completed}:{completed:boolean}){
 const {pending}=useFormStatus()
 return <button type="submit" disabled={pending} aria-disabled={pending}>
  {pending?'Saving…':completed?'Update & Find My Matches':'Continue to My Results'}
 </button>
}

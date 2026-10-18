'use client'

import { ChangeEvent, FormEvent, ReactNode, useRef, useState } from 'react'
import { hasScentProfileRankingSignal } from '@/lib/scent-profile'

type Props={children:ReactNode;action:(formData:FormData)=>void|Promise<void>}

export default function ScentProfileForm({children,action}:Props){
 const [error,setError]=useState('')
 const errorRef=useRef<HTMLDivElement>(null)
 const submit=(event:FormEvent<HTMLFormElement>)=>{
  const form=event.currentTarget
  const data=new FormData(form)
  const numberOrNull=(name:string)=>{const raw=String(data.get(name)||'');return raw&&/^\d+$/.test(raw)?Number(raw):null}
  const budgetRaw=String(data.get('budget')||'0')
  const budget=/^\d+$/.test(budgetRaw)?Number(budgetRaw):0
  if(data.get('marketingConsent')==='yes'&&data.get('marketingOptOut')==='yes'){
   event.preventDefault()
   setError('Choose either marketing email updates or unsubscribe, not both.')
   requestAnimationFrame(()=>errorRef.current?.focus())
   return
  }
  const hasSignal=hasScentProfileRankingSignal({
   loved:[...data.getAll('families'),...data.getAll('lovedNotes')].map(String),
   avoided:data.getAll('avoidedNotes').map(String),
   favoriteIds:data.getAll('favoritePerfumes').map(String),
   presentations:data.getAll('presentations').map(String),
   sweetness:numberOrNull('sweetness'),
   projection:numberOrNull('projection'),
   longevity:numberOrNull('longevity'),
   budget
  })
  if(!hasSignal){event.preventDefault();setError('Choose at least one recommendation preference before continuing.');requestAnimationFrame(()=>errorRef.current?.focus());return}
  setError('')
 }
 const handleChange=(event:ChangeEvent<HTMLFormElement>)=>{
  const target=event.target
  if(!(target instanceof HTMLInputElement)||!target.checked)return
  if(target.name!=='marketingConsent'&&target.name!=='marketingOptOut')return
  const opposite=target.name==='marketingConsent'?'marketingOptOut':'marketingConsent'
  const other=event.currentTarget.elements.namedItem(opposite)
  if(other instanceof HTMLInputElement)other.checked=false
  setError('')
 }
 return <form action={action} className="quiz-form" onSubmit={submit} onChange={handleChange}>
  {error&&<div ref={errorRef} className="notice error" role="alert" tabIndex={-1}>{error}</div>}
  {children}
 </form>
}

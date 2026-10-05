'use client'

import { FormEvent, ReactNode, useRef, useState } from 'react'
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
 return <form action={action} className="quiz-form" onSubmit={submit}>
  {error&&<div ref={errorRef} className="notice error" role="alert" tabIndex={-1}>{error}</div>}
  {children}
 </form>
}

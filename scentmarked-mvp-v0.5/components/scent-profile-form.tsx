'use client'

import { FormEvent, ReactNode, useState } from 'react'

type Props={children:ReactNode;action:(formData:FormData)=>void|Promise<void>}

export default function ScentProfileForm({children,action}:Props){
 const [error,setError]=useState('')
 const submit=(event:FormEvent<HTMLFormElement>)=>{
  const form=event.currentTarget
  const data=new FormData(form)
  const hasChecked=(name:string)=>data.getAll(name).length>0
  const presentation=data.getAll('presentations').map(String)
  const hasPresentation=presentation.some(x=>x!=='No preference')
  const hasTrait=['sweetness','projection','longevity'].some(name=>String(data.get(name)||'')!=='')
  const budget=Number(data.get('budget')||0)
  const hasSignal=hasChecked('families')||hasChecked('lovedNotes')||hasChecked('avoidedNotes')||hasChecked('favoritePerfumes')||hasPresentation||hasTrait||(Number.isFinite(budget)&&budget>0)
  if(!hasSignal){event.preventDefault();setError('Choose at least one recommendation preference before saving, or use “Skip for now.”');form.querySelector('input')?.focus();return}
  setError('')
 }
 return <form action={action} className="quiz-form" onSubmit={submit}>
  {error&&<div className="notice error" role="alert">{error}</div>}
  {children}
 </form>
}

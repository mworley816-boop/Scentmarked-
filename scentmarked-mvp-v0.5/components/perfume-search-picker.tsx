'use client'

import {useEffect,useId,useMemo,useRef,useState} from 'react'
import {isExactPerfumeSearchMatch} from '@/lib/perfume-alias-search'

type PerfumeOption={id:string;name:string;slug:string;brand:string;aliases?:string[]}

export default function PerfumeSearchPicker({name,label,options,selectedSlug,required=false}:{name:string;label:string;options:PerfumeOption[];selectedSlug?:string;required?:boolean}){
 const selected=options.find(x=>x.slug===selectedSlug)
 const [query,setQuery]=useState(selected?selected.brand+' — '+selected.name:'')
 const [value,setValue]=useState(selected?.slug||'')
 const [open,setOpen]=useState(false)
 const [activeIndex,setActiveIndex]=useState(-1)
 const inputId=useId()
 const listId=useId()
 const hintId=useId()
 const activeOption=useRef<HTMLButtonElement>(null)
 const matches=useMemo(()=>{
  const q=query.trim().replace(/\s+/g,' ').toLowerCase();if(!q)return[]
  const words=q.split(/\s+/).filter(Boolean)
  const score=(x:PerfumeOption)=>{
   const normalize=(text:string)=>text.trim().replace(/\s+/g,' ').toLowerCase()
   const name=normalize(x.name),brand=normalize(x.brand),aliases=(x.aliases||[]).map(normalize),fields=[name,brand,...aliases]
   if(name===q)return 100
   if(aliases.some(alias=>alias===q))return 99
   if((brand+' — '+name)===q||(brand+' - '+name)===q)return 98
   if((brand+' '+name)===q)return 97
   if(name.startsWith(q))return 90
   if(aliases.some(alias=>alias.startsWith(q)))return 89
   if(brand===q)return 85
   if(brand.startsWith(q))return 80
   if(words.every(word=>name.includes(word)))return 72
   if(words.every(word=>fields.some(field=>field.includes(word))))return 65
   if(name.includes(q))return 60
   if(brand.includes(q))return 50
   if(fields.some(field=>field.includes(q)))return 40
   return 0
  }
  return options.map(x=>({x,score:score(x)})).filter(row=>row.score>0).sort((a,b)=>b.score-a.score||a.x.name.localeCompare(b.x.name)||a.x.brand.localeCompare(b.x.brand)).slice(0,8).map(row=>row.x)
 },[options,query])
 const expanded=open&&query.trim().length>0
 useEffect(()=>{
  setQuery(selected?selected.brand+' — '+selected.name:'')
  setValue(selected?.slug||'')
  setOpen(false)
  setActiveIndex(-1)
 },[selectedSlug,selected?.name,selected?.brand])
 useEffect(()=>{if(expanded)activeOption.current?.scrollIntoView({block:'nearest'})},[activeIndex,expanded])
 function choose(x:PerfumeOption){setQuery(x.brand+' — '+x.name);setValue(x.slug);setOpen(false);setActiveIndex(-1)}
 return <div className="perfume-search-picker">
  <label htmlFor={inputId}>{label}</label>
  <input type="hidden" name={name} value={value}/>
  <div className="perfume-search-box">
   <input id={inputId} role="combobox" value={query} required={required} pattern={required&&value?undefined:"(?!)"} title={required&&!value?"Choose a fragrance from the search results.":undefined} placeholder="Search perfume or brand…" autoComplete="off" aria-autocomplete="list" aria-describedby={required?hintId:undefined} aria-controls={expanded?listId:undefined} aria-expanded={expanded} aria-activedescendant={expanded&&matches[activeIndex]?listId+'-'+activeIndex:undefined}
    onFocus={()=>setOpen(true)}
    onBlur={()=>{setOpen(false);setActiveIndex(-1)}}
    onChange={e=>{setQuery(e.target.value);setValue('');setOpen(true);setActiveIndex(-1)}}
    onKeyDown={e=>{
     if(e.nativeEvent.isComposing)return
     if((e.key==='ArrowDown'||e.key==='ArrowUp')&&matches.length){
      e.preventDefault()
      setOpen(true)
      setActiveIndex(i=>!expanded||i<0?(e.key==='ArrowDown'?0:matches.length-1):Math.max(0,Math.min(matches.length-1,i+(e.key==='ArrowDown'?1:-1))))
     }else if(e.key==='Enter'&&expanded){
      const exact=matches.find(x=>isExactPerfumeSearchMatch(x,query))
      const choice=exact||matches[activeIndex]
      if(choice){
       e.preventDefault()
       choose(choice)
      }
     }else if(e.key==='Escape'&&expanded){
      e.preventDefault()
      setOpen(false)
      setActiveIndex(-1)
     }
    }}/>
   {required&&<span id={hintId} className="sr-only">Choose a fragrance from the search results.</span>}
   <span className="sr-only" role="status" aria-live="polite">{expanded&&matches.length?matches.length+" matching fragrance"+(matches.length===1?"":"s")+" available.":""}</span>
   {expanded&&<div className="perfume-search-results" id={listId} role="listbox" aria-label={label}>{matches.length?matches.map((x,index)=><button type="button" role="option" id={listId+'-'+index} tabIndex={-1} ref={index===activeIndex?activeOption:undefined} aria-selected={index===activeIndex} key={x.id} onPointerDown={e=>e.preventDefault()} onClick={()=>choose(x)}><b>{x.name}</b><span>{x.brand}</span></button>):<p role="status">No matching fragrances.</p>}</div>}
  </div>
 </div>
}

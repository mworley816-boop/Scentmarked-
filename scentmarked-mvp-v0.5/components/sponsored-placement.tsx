'use client'

import { useEffect } from 'react'

type Props={id:number;name:string;sponsor:string;placement:string;disclosure:string}

export default function SponsoredPlacement({id,name,sponsor,placement,disclosure}:Props){
 useEffect(()=>{void fetch('/api/sponsorships/'+id+'/impression',{method:'POST',keepalive:true})},[id])
 return <aside className="sponsored-placement" aria-label={disclosure+' from '+sponsor}>
  <small className="sponsored-disclosure">{disclosure}</small>
  <div><b>{name}</b><span>Presented by {sponsor}</span></div>
  <a className="button ghost" href={'/api/sponsorships/'+id+'/click'} rel="sponsored nofollow noopener">Learn more</a>
 </aside>
}

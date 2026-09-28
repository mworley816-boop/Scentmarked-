'use client'

import { useEffect } from 'react'

export default function Error({error,reset}:{error:Error & {digest?:string},reset:()=>void}){
 useEffect(()=>{console.error(error)},[error])
 return <main><section className="empty-state launch-error"><p className="eyebrow">SCENTMARKED</p><h1>Something went wrong.</h1><p>We couldn't load this page. You can try again without losing your place.</p><div className="button-row"><button className="button" type="button" onClick={()=>reset()}>Try Again</button><a className="button ghost" href="/">Go Home</a></div></section></main>
}

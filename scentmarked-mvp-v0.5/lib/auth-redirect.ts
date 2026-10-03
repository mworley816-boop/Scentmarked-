export function safeAuthNext(value:unknown,fallback='/collection'){
 const next=typeof value==='string'&&value?value:fallback
 if(!next.startsWith('/')||next.startsWith('//'))return fallback
 const pathname=next.split(/[?#]/,1)[0]
 if(pathname==='/login'||pathname==='/auth'||pathname.startsWith('/auth/'))return fallback
 return next
}

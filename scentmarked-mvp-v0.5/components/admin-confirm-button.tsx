'use client'
type Props={label?:string;message?:string;className?:string;ariaLabel?:string}
export default function AdminConfirmButton({label='Delete',message='Delete this item? This cannot be undone.',className='danger-link',ariaLabel}:Props){
 return <button type="submit" className={className} aria-label={ariaLabel} onClick={e=>{if(!window.confirm(message))e.preventDefault()}}>{label}</button>
}

'use client'

export default function ConfirmMediaDeleteButton(){
 return <button className="button ghost" type="submit" onClick={(event)=>{
  if(!window.confirm('Delete this unused media file? This cannot be undone.'))event.preventDefault()
 }}>Delete</button>
}

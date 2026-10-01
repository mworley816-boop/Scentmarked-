'use client'

export default function MediaBulkSelect(){
 function boxes(){return Array.from(document.querySelectorAll<HTMLInputElement>('input[data-media-select="unused"]'))}
 function setAll(checked:boolean){boxes().forEach((box)=>{box.checked=checked})}
 function confirmDelete(event:React.MouseEvent<HTMLButtonElement>){
  const count=boxes().filter((box)=>box.checked).length
  if(!count){event.preventDefault();window.alert('Select at least one unused image first.');return}
  if(!window.confirm(`Delete ${count} selected unused image${count===1?'':'s'}? This cannot be undone.`))event.preventDefault()
 }
 return <div className="result-actions">
  <button className="button ghost" type="button" onClick={()=>setAll(true)}>Select all on page</button>
  <button className="button ghost" type="button" onClick={()=>setAll(false)}>Clear selection</button>
  <button className="button ghost" type="submit" form="bulk-media-delete-form" onClick={confirmDelete}>Delete selected unused</button>
 </div>
}

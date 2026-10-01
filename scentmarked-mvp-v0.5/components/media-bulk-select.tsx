'use client'

export default function MediaBulkSelect(){
 function setAll(checked:boolean){
  document.querySelectorAll<HTMLInputElement>('input[data-media-select="unused"]').forEach((box)=>{box.checked=checked})
 }
 return <div className="result-actions">
  <button className="button ghost" type="button" onClick={()=>setAll(true)}>Select all on page</button>
  <button className="button ghost" type="button" onClick={()=>setAll(false)}>Clear selection</button>
 </div>
}

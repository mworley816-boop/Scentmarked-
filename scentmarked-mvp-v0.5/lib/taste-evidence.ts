export type TasteEvidence={perfumeId:string;direction:'positive'|'negative';updatedAt?:string|null;priority:number}
export type TasteEvidenceInput={perfumeId:string;direction:'positive'|'negative';updatedAt?:string|null;priority?:number}

const time=(value?:string|null)=>{const n=value?Date.parse(value):NaN;return Number.isFinite(n)?n:0}

export function resolveLatestTasteEvidence(rows:TasteEvidenceInput[]){
 const best=new Map<string,TasteEvidence>()
 for(const row of rows){
  const perfumeId=String(row.perfumeId||'').trim();if(!perfumeId)continue
  const next:TasteEvidence={perfumeId,direction:row.direction,updatedAt:row.updatedAt||null,priority:Number(row.priority)||0}
  const current=best.get(perfumeId)
  if(!current||time(next.updatedAt)>time(current.updatedAt)||(time(next.updatedAt)===time(current.updatedAt)&&next.priority>current.priority)||(time(next.updatedAt)===time(current.updatedAt)&&next.priority===current.priority&&next.direction==='negative'&&current.direction!=='negative'))best.set(perfumeId,next)
 }
 return [...best.values()].sort((a,b)=>time(b.updatedAt)-time(a.updatedAt)||b.priority-a.priority||a.perfumeId.localeCompare(b.perfumeId))
}

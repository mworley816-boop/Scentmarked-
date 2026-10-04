import type { MatchPerfume } from './match-scoring'

export type TastePattern={name:string;kind:'note'|'accord';positive:number;negative:number;net:number}

export function learnedTastePatterns(positive:MatchPerfume[],negative:MatchPerfume[],limit=5):TastePattern[]{
 const scores=new Map<string,TastePattern>()
 const add=(name:string,kind:'note'|'accord',direction:1|-1,weight:number)=>{
  const clean=name.trim();if(!clean)return
  const key=kind+':'+clean.toLocaleLowerCase(),row=scores.get(key)||{name:clean,kind,positive:0,negative:0,net:0}
  if(direction===1)row.positive+=weight;else row.negative+=weight
  row.net=row.positive-row.negative;scores.set(key,row)
 }
 const scan=(perfumes:MatchPerfume[],direction:1|-1)=>{for(const p of perfumes){
  const seenNotes=new Set<string>();for(const x of p.perfume_notes||[]){const name=x.notes?.name;if(!name||seenNotes.has(name.toLocaleLowerCase()))continue;seenNotes.add(name.toLocaleLowerCase());add(name,'note',direction,1)}
  const seenAccords=new Set<string>();for(const x of p.perfume_accords||[]){const name=x.accords?.name,strength=Number(x.strength)||0;if(!name||strength<=0||seenAccords.has(name.toLocaleLowerCase()))continue;seenAccords.add(name.toLocaleLowerCase());add(name,'accord',direction,Math.max(.35,Math.min(1,strength/100)))}
 }}
 scan(positive,1);scan(negative,-1)
 return [...scores.values()].filter(x=>x.positive>0&&x.net>0).sort((a,b)=>b.net-a.net||b.positive-a.positive||a.name.localeCompare(b.name)).slice(0,Math.max(0,limit))
}

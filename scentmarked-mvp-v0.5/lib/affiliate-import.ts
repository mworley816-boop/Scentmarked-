export type AffiliateImportRow={source_name:string;external_id:string;gross_cents:number;fee_cents:number;currency:string;status:'pending'|'confirmed'|'paid'|'refunded'|'void';occurred_at:string;affiliate_offer_id:number|null;affiliate_click_id:number|null;affiliate_merchant:string|null;affiliate_placement:string|null;perfume_id:string|null}
const allowed=new Set(['pending','confirmed','paid','refunded','void'])
const cents=(v:string)=>{const n=Number(v);return Number.isFinite(n)&&n>=0?Math.round(n*100):null}
const csvLine=(line:string)=>{const out:string[]=[],re=/(?:^|,)(?:"((?:[^"]|"")*)"|([^",]*))/g;let m;while((m=re.exec(line)))out.push((m[1]??m[2]??'').replace(/""/g,'"').trim());return out}
export function parseAffiliateCommissionCsv(text:string,defaultSource='affiliate_import'){
 const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.trim());if(lines.length<2)return {rows:[] as AffiliateImportRow[],errors:['CSV must include a header and at least one data row.']}
 const headers=csvLine(lines[0]).map(x=>x.toLowerCase()),required=['external_id','gross','occurred_at'],missing=required.filter(x=>!headers.includes(x));if(missing.length)return {rows:[] as AffiliateImportRow[],errors:['Missing required columns: '+missing.join(', ')]}
 const rows:AffiliateImportRow[]=[],errors:string[]=[],seen=new Set<string>()
 for(let i=1;i<lines.length;i++){const values=csvLine(lines[i]),get=(k:string)=>values[headers.indexOf(k)]||'',external=get('external_id'),gross=cents(get('gross')),fees=cents(get('fees')||'0'),status=(get('status')||'confirmed').toLowerCase(),source=get('source_name')||defaultSource,occurred=get('occurred_at')
  if(!external||gross===null||fees===null||!allowed.has(status)||!occurred||Number.isNaN(Date.parse(occurred))){errors.push('Row '+(i+1)+' is invalid.');continue}
  const key=source+'::'+external;if(seen.has(key)){errors.push('Row '+(i+1)+' duplicates an earlier external transaction.');continue}seen.add(key)
  const offer=Number(get('offer_id')),click=Number(get('click_id'))
  rows.push({source_name:source,external_id:external,gross_cents:gross,fee_cents:fees,currency:(get('currency')||'USD').toUpperCase().slice(0,3),status:status as AffiliateImportRow['status'],occurred_at:new Date(occurred).toISOString(),affiliate_offer_id:Number.isInteger(offer)&&offer>0?offer:null,affiliate_click_id:Number.isInteger(click)&&click>0?click:null,affiliate_merchant:get('merchant')||null,affiliate_placement:get('placement')||null,perfume_id:get('perfume_id')||null})
 }
 return {rows,errors}
}

export function affiliateImportQuality(rows:AffiliateImportRow[]){
 const total=rows.length,withClick=rows.filter(x=>x.affiliate_click_id).length,withOffer=rows.filter(x=>x.affiliate_offer_id).length,withMerchant=rows.filter(x=>x.affiliate_merchant).length,withPerfume=rows.filter(x=>x.perfume_id).length,fullyAttributed=rows.filter(x=>x.affiliate_click_id&&x.affiliate_offer_id&&x.affiliate_merchant&&x.perfume_id&&x.affiliate_placement).length
 return{total,withClick,withOffer,withMerchant,withPerfume,fullyAttributed,unattributed:total-fullyAttributed,attributionRate:total?fullyAttributed/total:0}
}

export const csvCell=(value:unknown)=>'"'+String(value??'').replaceAll('"','""')+'"'

export function affiliateExportLine(values:unknown[]){
 return values.map(csvCell).join(',')
}

export type AffiliateExportPeriod='7'|'30'|'all'

export function affiliateExportPeriod(value:string|null):AffiliateExportPeriod{
 return value==='7'||value==='30'||value==='all'?value:'30'
}

export function affiliateExportCutoff(period:AffiliateExportPeriod,now=Date.now()){
 if(period==='all')return null
 const days=period==='7'?7:30
 return new Date(now-days*24*60*60*1000).toISOString()
}

export function affiliateClickWithinPeriod(clickedAt:string,period:AffiliateExportPeriod,now=Date.now()){
 if(period==='all')return true
 const clicked=new Date(clickedAt).getTime()
 if(!Number.isFinite(clicked))return false
 const cutoff=now-(period==='7'?7:30)*24*60*60*1000
 return clicked>=cutoff&&clicked<=now
}

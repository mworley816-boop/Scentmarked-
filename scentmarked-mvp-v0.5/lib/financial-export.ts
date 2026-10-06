export function safeCsvCell(value:unknown){let s=String(value??'');if(/^[=+\-@]/.test(s))s="'"+s;return /[",\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s}
export function centsAmount(value:number){return (Number(value||0)/100).toFixed(2)}
export function financialDateRange(from:string|null,to:string|null,now=new Date()){
 const end=to&&/^\d{4}-\d{2}-\d{2}$/.test(to)?to:now.toISOString().slice(0,10)
 const start=from&&/^\d{4}-\d{2}-\d{2}$/.test(from)?from:new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1)).toISOString().slice(0,10)
 return start<=end?{from:start,to:end}:{from:end,to:start}
}

export const csvCell=(value:unknown)=>'"'+String(value??'').replaceAll('"','""')+'"'

export function affiliateExportLine(values:unknown[]){
 return values.map(csvCell).join(',')
}

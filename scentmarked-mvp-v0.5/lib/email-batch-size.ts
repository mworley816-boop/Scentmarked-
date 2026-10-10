/** Clamp an email delivery batch to the supported range. */
export function normalizeEmailBatchSize(batchSize:number):number{
  if(typeof batchSize!=='number'||!Number.isFinite(batchSize))return 25
  if(batchSize<=0)return 25
  return Math.max(1,Math.min(100,Math.trunc(batchSize)))
}

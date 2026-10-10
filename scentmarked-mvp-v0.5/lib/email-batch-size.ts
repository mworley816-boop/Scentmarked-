/** Clamp an email delivery batch to the supported range. */
export function normalizeEmailBatchSize(batchSize:number):number{
  return typeof batchSize==='number'&&Number.isFinite(batchSize)?Math.max(1,Math.min(100,Math.trunc(batchSize)||25)):25
}

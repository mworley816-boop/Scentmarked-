// Server-side research spending gate. The backing store MUST reserve atomically
// in durable storage before any billable model request. No in-memory counter.
export type AtlasBudgetReservation={
 id:string;
 reservedUsdMicros:number;
}
export type AtlasBudgetStore={
 reserve:(input:{day:string;limitUsdMicros:number;amountUsdMicros:number})=>Promise<AtlasBudgetReservation|null>;
 settle:(input:{reservationId:string;actualUsdMicros:number})=>Promise<void>;
}
export type AtlasResearchBudgetOptions={
 dailyLimitUsdMicros:number;
 perRequestReserveUsdMicros:number;
 store:AtlasBudgetStore;
 now?:()=>Date;
}
function positiveInteger(value:number,name:string){
 if(!Number.isSafeInteger(value)||value<=0)throw new Error('Invalid Atlas '+name)
}
export function createAtlasResearchBudgetGate(options:AtlasResearchBudgetOptions){
 positiveInteger(options.dailyLimitUsdMicros,'daily budget')
 positiveInteger(options.perRequestReserveUsdMicros,'request reserve')
 if(options.perRequestReserveUsdMicros>options.dailyLimitUsdMicros)
  throw new Error('Atlas request reserve exceeds daily budget')
 return async<T>(run:()=>Promise<{value:T;actualUsdMicros:number}>):Promise<T>=>{
  const now=(options.now??(()=>new Date()))()
  if(!Number.isFinite(now.getTime()))throw new Error('Invalid Atlas budget date')
  const day=now.toISOString().slice(0,10)
  const reservation=await options.store.reserve({
   day,limitUsdMicros:options.dailyLimitUsdMicros,
   amountUsdMicros:options.perRequestReserveUsdMicros
  })
  if(!reservation)throw new Error('Atlas daily research budget exhausted')
  if(!reservation.id||reservation.reservedUsdMicros!==options.perRequestReserveUsdMicros)
   throw new Error('Invalid Atlas budget reservation')
  // Fail closed: errors leave the reservation consumed until a trusted
  // reconciliation process settles it. Never automatically refund failures.
  const result=await run()
  if(!Number.isSafeInteger(result.actualUsdMicros)||result.actualUsdMicros<0||
   result.actualUsdMicros>reservation.reservedUsdMicros)
   throw new Error('Atlas actual usage exceeds reserved budget')
  await options.store.settle({
   reservationId:reservation.id,actualUsdMicros:result.actualUsdMicros
  })
  return result.value
 }
}

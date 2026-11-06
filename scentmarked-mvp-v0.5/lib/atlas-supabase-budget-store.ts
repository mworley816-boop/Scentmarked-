import type {SupabaseClient} from '@supabase/supabase-js'
import type {AtlasBudgetStore,AtlasBudgetReservation} from './atlas-research-budget-gate.ts'

// Service-role only. These RPCs must be installed as transactional,
// role-restricted SQL functions before this adapter is used.
export function createAtlasSupabaseBudgetStore(client:Pick<SupabaseClient,'rpc'>):AtlasBudgetStore{
 return {
  async reserve(input):Promise<AtlasBudgetReservation|null>{
   const {data,error}=await client.rpc('atlas_reserve_research_budget',{
    p_day:input.day,
    p_daily_limit_micros:input.limitUsdMicros,
    p_amount_micros:input.amountUsdMicros
   })
   if(error)throw new Error('Atlas budget reservation failed')
   if(data===null)return null
   if(!data||typeof data!=='object'||Array.isArray(data))
    throw new Error('Invalid Atlas budget reservation response')
   const result=data as Record<string,unknown>
   if(typeof result.id!=='string'||!result.id||
    result.reserved_usd_micros!==input.amountUsdMicros)
    throw new Error('Invalid Atlas budget reservation response')
   return {id:result.id,reservedUsdMicros:input.amountUsdMicros}
  },
  async settle(input){
   if(!input.reservationId||!Number.isSafeInteger(input.actualUsdMicros)||input.actualUsdMicros<0)
    throw new Error('Invalid Atlas settlement')
   const {data,error}=await client.rpc('atlas_settle_research_budget',{
    p_reservation_id:input.reservationId,
    p_actual_micros:input.actualUsdMicros
   })
   if(error||data!==true)throw new Error('Atlas budget settlement failed')
  }
 }
}

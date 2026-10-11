import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { EmailDeliveryPersistenceError, sendQueuedCampaign } from '@/lib/email-queue'
import { EmailProviderConfirmationError } from '@/lib/email-provider'

export const dynamic='force-dynamic'

function authorized(request:Request){
  const expected=(process.env.EMAIL_WORKER_SECRET||'').trim()
  if(!expected)return false
  const auth=request.headers.get('authorization')||''
  return auth==='Bearer '+expected
}

export async function POST(request:Request){
  const startedAt=Date.now()
  if(!authorized(request))return new NextResponse('Unauthorized',{status:401})

  const s=createServiceClient()
  const {data:due,error:dueError}=await s.rpc('get_due_email_campaigns',{p_limit:5})
  if(dueError)return new NextResponse('Due campaigns could not be loaded',{status:500})

  const {data:sending,error:sendingError}=await s.from('email_campaigns')
    .select('id').eq('status','sending').order('started_at',{ascending:true}).limit(5)
  if(sendingError)return new NextResponse('Sending campaigns could not be loaded',{status:500})

  const ids=[...new Set([...(due||[]).map((x:any)=>String(x.campaign_id)),...(sending||[]).map((x:any)=>String(x.id))])].slice(0,5)
  const results=[] as any[]
  let failures=0

  for(const campaignId of ids){
    try{
      results.push({campaignId,...await sendQueuedCampaign(s,campaignId,25)})
    }catch(error){
      failures++
      // Keep provider/database exception details out of operational logs.
      console.error('Email worker campaign batch failed',{campaignId,errorType:error instanceof EmailDeliveryPersistenceError?'delivery_persistence':error instanceof EmailProviderConfirmationError?'provider_confirmation':'processing_failure'})
      const reconciliationRequired=error instanceof EmailDeliveryPersistenceError||error instanceof EmailProviderConfirmationError
      results.push({campaignId,ok:false,reconciliationRequired,error:reconciliationRequired?'Delivery outcome uncertain; manual reconciliation required.':'Campaign batch failed.'})
    }
  }

  const reconciliationRequired=results.some(result=>result.reconciliationRequired===true)
  const summary={ok:failures===0,processed:results.length,failures,reconciliationRequired,durationMs:Date.now()-startedAt,results}
  console.info('Email worker run complete',{ok:summary.ok,processed:summary.processed,failures:summary.failures,reconciliationRequired:summary.reconciliationRequired,durationMs:summary.durationMs})
  if(reconciliationRequired)console.error('Email delivery reconciliation required',{campaignIds:results.filter(result=>result.reconciliationRequired===true).map(result=>result.campaignId)})
  if(failures>0)return NextResponse.json(summary,{status:500})
  return NextResponse.json(summary)
}

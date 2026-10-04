import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendQueuedCampaign } from '@/lib/email-queue'

export const dynamic='force-dynamic'

function authorized(request:Request){
  const expected=(process.env.EMAIL_WORKER_SECRET||'').trim()
  if(!expected)return false
  const auth=request.headers.get('authorization')||''
  return auth==='Bearer '+expected
}

export async function POST(request:Request){
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
      console.error('Email worker campaign batch failed',{campaignId,error:error instanceof Error?error.message:'Campaign batch failed.'})
      results.push({campaignId,ok:false,error:'Campaign batch failed.'})
    }
  }

  const summary={ok:failures===0,processed:results.length,failures,results}
  if(failures>0)return NextResponse.json(summary,{status:500})
  return NextResponse.json(summary)
}

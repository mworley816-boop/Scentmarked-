import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendQueuedCampaign } from '@/lib/email-queue'

export async function POST(request:Request){
  const s=await createClient()
  const {data:{user}}=await s.auth.getUser()
  if(!user)return new NextResponse('Unauthorized',{status:401})

  const {data:profile}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
  if(!profile?.is_admin)return new NextResponse('Forbidden',{status:403})

  let body:any
  try{body=await request.json()}catch{return new NextResponse('Invalid request',{status:400})}
  const campaignId=String(body?.campaignId||'')
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(campaignId)){
    return new NextResponse('Invalid campaign',{status:400})
  }

  try{
    const result=await sendQueuedCampaign(s,campaignId)
    return NextResponse.json({ok:true,...result})
  }catch(error){
    const message=error instanceof Error?error.message:'Campaign send failed.'
    return NextResponse.json({ok:false,error:message},{status:500})
  }
}

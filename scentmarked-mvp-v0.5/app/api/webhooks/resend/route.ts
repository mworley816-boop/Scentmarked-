import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyResendWebhook } from '@/lib/resend-webhook'


const eventMap:Record<string,string>={
  'email.sent':'sent',
  'email.delivered':'delivered',
  'email.opened':'opened',
  'email.clicked':'clicked',
  'email.bounced':'bounced',
  'email.complained':'complained',
  'email.failed':'failed'
}

export async function POST(request:Request){
  const secret=(process.env.RESEND_WEBHOOK_SECRET||'').trim()
  if(!secret)return new NextResponse('Webhook not configured',{status:503})
  const payload=await request.text()
  if(!(await verifyResendWebhook(payload,request.headers,secret)))return new NextResponse('Invalid webhook',{status:400})

  let event:any
  try{event=JSON.parse(payload)}catch{return new NextResponse('Invalid payload',{status:400})}
  const mapped=eventMap[String(event?.type||'')]
  if(!mapped)return NextResponse.json({ok:true,ignored:true})

  const providerMessageId=String(event?.data?.email_id||'')
  if(!providerMessageId)return new NextResponse('Missing email id',{status:400})

  const databaseSecret=(process.env.EMAIL_WEBHOOK_DATABASE_SECRET||'').trim()
  if(!databaseSecret)return new NextResponse('Webhook database bridge not configured',{status:503})

  const s=await createClient()
  const providerEventId=request.headers.get('svix-id')
  const {data:recorded,error}=await s.rpc('record_provider_email_event',{
    p_provider_message_id:providerMessageId,
    p_event_type:mapped,
    p_provider_event_id:providerEventId,
    p_metadata:{provider:'resend',created_at:event?.created_at||null},
    p_secret:databaseSecret
  })
  if(error)return new NextResponse('Event processing failed',{status:500})
  return NextResponse.json({ok:true,ignored:!recorded})
}

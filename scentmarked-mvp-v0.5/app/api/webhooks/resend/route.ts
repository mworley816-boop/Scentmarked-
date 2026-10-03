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

  const s=await createClient()
  const {data:delivery,error:lookupError}=await s.from('email_deliveries').select('id').eq('provider_message_id',providerMessageId).maybeSingle()
  if(lookupError)return new NextResponse('Lookup failed',{status:500})
  if(!delivery)return NextResponse.json({ok:true,ignored:true})

  const providerEventId=request.headers.get('svix-id')
  const {error}=await s.rpc('record_email_delivery_event',{
    p_delivery_id:delivery.id,
    p_event_type:mapped,
    p_provider_event_id:providerEventId,
    p_metadata:{provider:'resend',created_at:event?.created_at||null}
  })
  if(error)return new NextResponse('Event processing failed',{status:500})
  return NextResponse.json({ok:true})
}

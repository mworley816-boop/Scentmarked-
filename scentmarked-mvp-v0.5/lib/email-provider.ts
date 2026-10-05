export type OutboundEmail={
  to:string
  subject:string
  html:string
  text:string
  deliveryId:number|string
}

export type ProviderSendResult={providerMessageId:string}

export interface EmailProvider{
  send(message:OutboundEmail):Promise<ProviderSendResult>
}

class ResendProvider implements EmailProvider{
  private apiKey:string
  private from:string

  constructor(apiKey:string,from:string){
    this.apiKey=apiKey
    this.from=from
  }

  async send(message:OutboundEmail):Promise<ProviderSendResult>{
    const response=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{'Authorization':'Bearer '+this.apiKey,'Content-Type':'application/json','Idempotency-Key':'scentmarked-delivery-'+message.deliveryId},
      body:JSON.stringify({from:this.from,to:[message.to],subject:message.subject,html:message.html,text:message.text})
    })
    const body=await response.json().catch(()=>({}))
    if(!response.ok||!body?.id)throw new Error('Email provider rejected the send request.')
    return {providerMessageId:String(body.id)}
  }
}

export function getEmailProvider():EmailProvider{
  const apiKey=(process.env.RESEND_API_KEY||'').trim()
  const from=(process.env.RESEND_FROM_EMAIL||'').trim()
  if(!apiKey||!from)throw new Error('Email provider is not configured. Live sending remains disabled.')
  return new ResendProvider(apiKey,from)
}

export type OutboundEmail={
  to:string
  subject:string
  html:string
  text:string
  deliveryId:number
}

export type ProviderSendResult={
  providerMessageId:string
}

export interface EmailProvider{
  send(message:OutboundEmail):Promise<ProviderSendResult>
}

export function getEmailProvider():EmailProvider{
  throw new Error('Email provider is not configured. Live sending remains disabled.')
}

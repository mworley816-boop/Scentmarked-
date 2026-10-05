import test from 'node:test'
import assert from 'node:assert/strict'
import { marketingFooter, withMarketingFooter } from '../lib/email-footer.ts'
import { getEmailProvider } from '../lib/email-provider.ts'
import { emailFirstName } from '../lib/email-personalization.ts'

test('marketing footer includes the supplied unsubscribe URL in html and text',()=>{
  const url='https://scentmarked.example/unsubscribe?token=abc%20123'
  const footer=marketingFooter(url)
  assert.match(footer.html,/Unsubscribe/)
  assert.ok(footer.html.includes(url))
  assert.ok(footer.text.includes(url))
})

test('marketing footer is appended to campaign html and text',()=>{
  const body=withMarketingFooter('<p>Hello</p>','Hello','https://scentmarked.example/unsubscribe?token=abc')
  assert.ok(body.html.startsWith('<p>Hello</p>'))
  assert.match(body.html,/You are receiving this email because you opted in/)
  assert.ok(body.text.startsWith('Hello'))
  assert.match(body.text,/Unsubscribe:/)
})

test('email provider fails closed when production credentials are missing',()=>{
  const previousKey=process.env.RESEND_API_KEY
  const previousFrom=process.env.RESEND_FROM_EMAIL
  delete process.env.RESEND_API_KEY
  delete process.env.RESEND_FROM_EMAIL
  try{
    assert.throws(()=>getEmailProvider(),/Live sending remains disabled/)
  }finally{
    if(previousKey===undefined)delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY=previousKey
    if(previousFrom===undefined)delete process.env.RESEND_FROM_EMAIL
    else process.env.RESEND_FROM_EMAIL=previousFrom
  }
})

test('Resend request uses a stable delivery idempotency key',async()=>{
  const previousKey=process.env.RESEND_API_KEY
  const previousFrom=process.env.RESEND_FROM_EMAIL
  const previousFetch=globalThis.fetch
  process.env.RESEND_API_KEY='test-key'
  process.env.RESEND_FROM_EMAIL='ScentMarked <updates@example.com>'
  let request:RequestInit|undefined
  globalThis.fetch=(async(_input:RequestInfo|URL,init?:RequestInit)=>{
    request=init
    return new Response(JSON.stringify({id:'provider-123'}),{status:200,headers:{'content-type':'application/json'}})
  }) as typeof fetch
  try{
    const result=await getEmailProvider().send({to:'member@example.com',subject:'Hello',html:'<p>Hello</p>',text:'Hello',deliveryId:'test-42'})
    assert.equal(result.providerMessageId,'provider-123')
    const headers=new Headers(request?.headers)
    assert.equal(headers.get('Idempotency-Key'),'scentmarked-delivery-test-42')
    assert.equal(headers.get('Authorization'),'Bearer test-key')
  }finally{
    globalThis.fetch=previousFetch
    if(previousKey===undefined)delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY=previousKey
    if(previousFrom===undefined)delete process.env.RESEND_FROM_EMAIL
    else process.env.RESEND_FROM_EMAIL=previousFrom
  }
})

test('campaign personalization uses a safe first-name fallback',()=>{
  assert.equal(emailFirstName(null),'ScentMarked Friend')
  assert.equal(emailFirstName('   '),'ScentMarked Friend')
  assert.equal(emailFirstName('Member'),'Member')
})

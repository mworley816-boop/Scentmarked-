import test from 'node:test'
import assert from 'node:assert/strict'
import { marketingFooter, withMarketingFooter } from '../lib/email-footer.ts'
import { getEmailProvider } from '../lib/email-provider.ts'
import { emailFirstName, emailHtmlEscape } from '../lib/email-personalization.ts'
import { normalizeEmailBatchSize } from '../lib/email-batch-size.ts'
import { hasValidRecipientEmail } from '../lib/email-recipient.ts'

test('marketing recipients must have plausible email addresses',()=>{
  assert.equal(hasValidRecipientEmail('person@example.com'),true)
  assert.equal(hasValidRecipientEmail(''),false)
  assert.equal(hasValidRecipientEmail(null),false)
  assert.equal(hasValidRecipientEmail('not-an-email'),false)
  assert.equal(hasValidRecipientEmail('person@invalid'),false)
  assert.equal(hasValidRecipientEmail('person@@example.com'),false)
  assert.equal(hasValidRecipientEmail('a'.repeat(255)+'@example.com'),false)
})

test('email batches clamp invalid, fractional and oversized limits',()=>{
  assert.equal(normalizeEmailBatchSize(Number.NaN),25)
  assert.equal(normalizeEmailBatchSize(Infinity),25)
  assert.equal(normalizeEmailBatchSize(-Infinity),25)
  assert.equal(normalizeEmailBatchSize(0),25)
  assert.equal(normalizeEmailBatchSize(-5),25)
  assert.equal(normalizeEmailBatchSize(0.5),1)
  assert.equal(normalizeEmailBatchSize(1),1)
  assert.equal(normalizeEmailBatchSize(100),100)
  assert.equal(normalizeEmailBatchSize(2.9),2)
  assert.equal(normalizeEmailBatchSize(200),100)
})

test('marketing footer includes the supplied unsubscribe URL in html and text',()=>{
  const url='https://scentmarked.example/unsubscribe?token=abc%20123'
  const footer=marketingFooter(url)
  assert.match(footer.html,/Unsubscribe/)
  assert.ok(footer.html.includes(url))
  assert.ok(footer.text.includes(url))
})

test('marketing footer escapes unsubscribe URL characters in HTML only',()=>{
  const url='https://scentmarked.example/unsubscribe?token=a&next="<unsafe>'
  const footer=marketingFooter(url)
  assert.ok(footer.html.includes('token=a&amp;next=&quot;&lt;unsafe&gt;'))
  assert.ok(!footer.html.includes('token=a&next="<unsafe>'))
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

test('campaign HTML personalization escapes subscriber-supplied markup',()=>{
  assert.equal(emailHtmlEscape('Ada & <script>alert("x")</script>'), 'Ada &amp; &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;')
  assert.equal(emailHtmlEscape("O'Neil"),'O&#39;Neil')
  assert.equal(emailHtmlEscape('Plain Name'),'Plain Name')
})

test('campaign personalization normalizes whitespace and bounds greeting length',()=>{
  assert.equal(emailFirstName('  Ada\n\tLovelace  '),'Ada Lovelace')
  assert.equal(emailFirstName(123),'ScentMarked Friend')
  assert.equal(emailFirstName({firstName:'Ada'}),'ScentMarked Friend')
  assert.equal(emailFirstName('A'.repeat(100)).length,80)
})

test('campaign personalization uses a safe first-name fallback',()=>{
  assert.equal(emailFirstName(null),'ScentMarked Friend')
  assert.equal(emailFirstName('   '),'ScentMarked Friend')
  assert.equal(emailFirstName('Member'),'Member')
})

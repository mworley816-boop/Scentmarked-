import { getEmailProvider } from '@/lib/email-provider'
import { withMarketingFooter } from '@/lib/email-footer'
import { siteUrl } from '@/lib/site'

type DbClient=any

export async function sendQueuedCampaign(s:DbClient,campaignId:string){
  const {data:campaign,error:campaignError}=await s.from('email_campaigns')
    .select('id,subject,html_body,text_body,status')
    .eq('id',campaignId).maybeSingle()
  if(campaignError||!campaign)throw new Error('Campaign not found.')
  if(!['draft','scheduled','sending'].includes(campaign.status))throw new Error('Campaign is not sendable.')

  const {data:rows,error:deliveryError}=await s.from('email_deliveries')
    .select('id,contact_id,crm_contacts!inner(email,first_name,unsubscribe_token,status,marketing_consent,marketing_consented_at,unsubscribed_at)')
    .eq('campaign_id',campaignId).eq('status','queued')
  if(deliveryError)throw new Error('Queued deliveries could not be loaded.')

  const provider=getEmailProvider()
  const {error:startError}=await s.rpc('start_email_campaign',{p_campaign_id:campaignId})
  if(startError)throw new Error('Campaign could not start.')
  let sent=0,skipped=0,failed=0

  for(const row of rows||[]){
    const contact=Array.isArray(row.crm_contacts)?row.crm_contacts[0]:row.crm_contacts
    const eligible=contact?.status==='active'&&contact?.marketing_consent===true&&!!contact?.marketing_consented_at&&!contact?.unsubscribed_at
    if(!eligible){skipped++;continue}

    const unsubscribeUrl=siteUrl+'/unsubscribe?token='+encodeURIComponent(String(contact.unsubscribe_token))
    const firstName=String(contact.first_name||'').trim()
    const personalize=(value:string)=>value.replaceAll('{{first_name}}',firstName)
    const body=withMarketingFooter(personalize(campaign.html_body),personalize(campaign.text_body||''),unsubscribeUrl)

    try{
      const result=await provider.send({
        to:contact.email,
        subject:personalize(campaign.subject),
        html:body.html,
        text:body.text,
        deliveryId:row.id
      })
      const {error:updateError}=await s.from('email_deliveries').update({
        provider_message_id:result.providerMessageId,
        status:'sent',
        sent_at:new Date().toISOString()
      }).eq('id',row.id).eq('status','queued')
      if(updateError)throw updateError
      sent++
    }catch{
      await s.from('email_deliveries').update({
        status:'failed',
        failed_at:new Date().toISOString(),
        error_message:'Provider send failed.'
      }).eq('id',row.id).eq('status','queued')
      failed++
    }
  }

  const {error:finishError}=await s.rpc('finish_email_campaign',{
    p_campaign_id:campaignId,
    p_has_failures:failed>0
  })
  if(finishError)throw new Error('Campaign finished sending but its final status could not be saved.')
  return {sent,skipped,failed}
}

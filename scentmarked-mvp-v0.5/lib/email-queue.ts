import { getEmailProvider } from '@/lib/email-provider'
import { withMarketingFooter } from '@/lib/email-footer'
import { siteUrl } from '@/lib/site'
import { emailFirstName, emailHtmlEscape } from '@/lib/email-personalization'

type DbClient=any

export function normalizeEmailBatchSize(batchSize:number):number{
  return typeof batchSize==='number'&&Number.isFinite(batchSize)?Math.max(1,Math.min(100,Math.trunc(batchSize)||25)):25
}

export async function sendQueuedCampaign(s:DbClient,campaignId:string,batchSize=25){
  const safeBatchSize=normalizeEmailBatchSize(batchSize)
  const {data:campaign,error:campaignError}=await s.from('email_campaigns')
    .select('id,subject,html_body,text_body,status')
    .eq('id',campaignId).maybeSingle()
  if(campaignError||!campaign)throw new Error('Campaign not found.')
  if(!['draft','scheduled','sending'].includes(campaign.status))throw new Error('Campaign is not sendable.')

  const {data:claimed,error:claimError}=await s.rpc('claim_email_delivery_batch',{p_campaign_id:campaignId,p_limit:safeBatchSize})
  if(claimError)throw new Error('Queued deliveries could not be claimed.')
  if(!Array.isArray(claimed))throw new Error('Claimed deliveries returned an invalid response.')
  const claimedIds=claimed.map((x:any)=>x?.delivery_id)
  if(claimedIds.some((id:any)=>typeof id!=='string'||!id.trim())||new Set(claimedIds).size!==claimedIds.length){
    const validIds=claimedIds.filter((id:any):id is string=>typeof id==='string'&&!!id.trim())
    if(validIds.length)await s.rpc('release_email_delivery_claims',{p_delivery_ids:[...new Set(validIds)]})
    throw new Error('Claimed deliveries returned invalid or duplicate IDs.')
  }
  const releaseClaims=async()=>{
    if(claimedIds.length)await s.rpc('release_email_delivery_claims',{p_delivery_ids:claimedIds})
  }
  const {data:rows,error:deliveryError}=claimedIds.length?await s.from('email_deliveries')
    .select('id,contact_id,crm_contacts!inner(email,first_name,unsubscribe_token,status,marketing_consent,marketing_consented_at,unsubscribed_at)')
    .in('id',claimedIds).order('id',{ascending:true}):{data:[],error:null}
  if(deliveryError){
    await releaseClaims()
    throw new Error('Claimed deliveries could not be loaded.')
  }

  // An inner join can hide a claimed delivery if its CRM contact was deleted.
  // Release all claims rather than silently stranding missing rows in processing.
  const loadedIds=new Set(Array.isArray(rows)?rows.map((row:any)=>row?.id):[])
  if(!Array.isArray(rows)||rows.length!==claimedIds.length||loadedIds.size!==claimedIds.length||claimedIds.some((id:any)=>!loadedIds.has(id))){
    await releaseClaims()
    throw new Error('Some claimed deliveries could not be loaded with their contacts.')
  }

  let provider
  try{
    provider=getEmailProvider()
    const {error:startError}=await s.rpc('start_email_campaign',{p_campaign_id:campaignId})
    if(startError)throw new Error('Campaign could not start.')
  }catch(error){
    await releaseClaims()
    throw error
  }
  let sent=0,skipped=0,failed=0

  for(const row of rows||[]){
    const contact=Array.isArray(row.crm_contacts)?row.crm_contacts[0]:row.crm_contacts
    const eligible=contact?.status==='active'&&contact?.marketing_consent===true&&!!contact?.marketing_consented_at&&!contact?.unsubscribed_at&&typeof contact?.unsubscribe_token==='string'&&!!contact.unsubscribe_token.trim()
    if(!eligible){
      const {error:skipError}=await s.from('email_deliveries').update({
        status:'skipped',
        skipped_at:new Date().toISOString(),
        error_message:'Recipient was no longer eligible for marketing email at send time.'
      }).eq('id',row.id).eq('status','processing')
      if(skipError){
        failed++
        continue
      }
      skipped++
      continue
    }

    try{
      const unsubscribeUrl=siteUrl+'/unsubscribe?token='+encodeURIComponent(String(contact.unsubscribe_token))
      const firstName=emailFirstName(contact.first_name)
      const personalize=(value:unknown,name:string)=>String(value??'').replaceAll('{{first_name}}',name)
      const body=withMarketingFooter(personalize(campaign.html_body,emailHtmlEscape(firstName)),personalize(campaign.text_body,firstName),unsubscribeUrl)
      const result=await provider.send({
        to:contact.email,
        subject:personalize(campaign.subject,firstName),
        html:body.html,
        text:body.text,
        deliveryId:row.id
      })
      const {error:updateError}=await s.from('email_deliveries').update({
        provider_message_id:result.providerMessageId,
        status:'sent',
        sent_at:new Date().toISOString()
      }).eq('id',row.id).eq('status','processing')
      if(updateError)throw updateError
      sent++
    }catch{
      const {error:failureUpdateError}=await s.from('email_deliveries').update({
        status:'failed',
        failed_at:new Date().toISOString(),
        error_message:'Delivery processing failed.'
      }).eq('id',row.id).eq('status','processing')
      if(failureUpdateError)throw new Error('Delivery failed but its failure status could not be saved.')
      failed++
    }
  }

  const {count:remaining,error:remainingError}=await s.from('email_deliveries')
    .select('id',{count:'exact',head:true})
    .eq('campaign_id',campaignId).in('status',['queued','processing'])
  if(remainingError||typeof remaining!=='number'||!Number.isSafeInteger(remaining)||remaining<0)throw new Error('Campaign batch sent but remaining deliveries could not be counted reliably.')

  if((remaining||0)===0){
    const {count:failedTotal,error:failedCountError}=await s.from('email_deliveries')
      .select('id',{count:'exact',head:true})
      .eq('campaign_id',campaignId).eq('status','failed')
    if(failedCountError||typeof failedTotal!=='number'||!Number.isSafeInteger(failedTotal)||failedTotal<0)throw new Error('Campaign batch sent but failed deliveries could not be counted reliably.')
    const {error:finishError}=await s.rpc('finish_email_campaign',{
      p_campaign_id:campaignId,
      p_has_failures:(failedTotal||0)>0
    })
    if(finishError)throw new Error('Campaign finished sending but its final status could not be saved.')
  }

  return {sent,skipped,failed,remaining:remaining||0,complete:(remaining||0)===0}
}

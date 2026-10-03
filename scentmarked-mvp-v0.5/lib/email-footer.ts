export function marketingFooter(unsubscribeUrl:string){
  return {
    html: '<p style="font-size:12px;line-height:1.5;color:#666">You are receiving this email because you opted in to ScentMarked updates. <a href="'+unsubscribeUrl+'">Unsubscribe</a>.</p>',
    text: 'You are receiving this email because you opted in to ScentMarked updates.\nUnsubscribe: '+unsubscribeUrl
  }
}

export function withMarketingFooter(html:string,text:string,unsubscribeUrl:string){
  const footer=marketingFooter(unsubscribeUrl)
  return {
    html: html+'<hr style="margin:32px 0 16px;border:0;border-top:1px solid #ddd"/>'+footer.html,
    text: text.trim()+'\n\n'+footer.text
  }
}

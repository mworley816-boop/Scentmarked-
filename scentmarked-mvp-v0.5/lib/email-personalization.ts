/** Plain-text name for email greetings. Keep user input out of HTML markup. */
export function emailFirstName(value:unknown){
  if(typeof value!=='string')return 'ScentMarked Friend'
  const name=value.trim().replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').slice(0,80)
  return name||'ScentMarked Friend'
}

/** Escape personalized values before inserting them into campaign HTML. */
export function emailHtmlEscape(value:string){
  return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
}

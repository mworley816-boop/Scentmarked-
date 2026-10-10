/** Plain-text name for email greetings. Keep user input out of HTML markup. */
export function emailFirstName(value:unknown){
  if(typeof value!=='string')return 'ScentMarked Friend'
  const name=value.trim().replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').slice(0,80)
  return name||'ScentMarked Friend'
}

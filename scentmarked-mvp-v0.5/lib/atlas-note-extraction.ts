/** Extract explicitly labeled note sections from manufacturer text.
 * This parser never guesses notes. All output remains pending human source review.
 */
export type AtlasNoteSections={top:string[];middle:string[];base:string[]}
const LABELS:{key:keyof AtlasNoteSections;pattern:RegExp}[]=[
 {key:'top',pattern:/^(?:top|head|opening)\s+notes?\s*[:\-–]?\s*(.*)$/i},
 {key:'middle',pattern:/^(?:middle|heart)\s+notes?\s*[:\-–]?\s*(.*)$/i},
 {key:'base',pattern:/^(?:base|drydown|dry-down)\s+notes?\s*[:\-–]?\s*(.*)$/i},
]
export function extractAtlasNoteSections(text:string):AtlasNoteSections{
 const result:AtlasNoteSections={top:[],middle:[],base:[]}
 for(const raw of text.split(/\r?\n/).slice(0,1000)){
  const line=raw.trim()
  for(const {key,pattern} of LABELS){
   const match=line.match(pattern)
   if(!match)continue
   const notes=match[1].split(/[,;•]/).map(s=>s.trim()).filter(s=>s.length>0&&s.length<=80).slice(0,20)
   // Preserve the first labeled section; repeated labels elsewhere on the page
   // must not silently replace the primary product's notes.
   if(notes.length&&!result[key].length)result[key]=notes
   break
  }
 }
 return result
}

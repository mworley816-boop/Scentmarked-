import test from 'node:test'
import assert from 'node:assert/strict'
import {atlasVisibleResearchText} from '../lib/atlas-automated-extraction.ts'
import {extractAtlasNoteSections} from '../lib/atlas-note-extraction.ts'

test('site chrome cannot override main product note pyramid',()=>{
 const html='<html><head><title>Perfume</title></head><body>'+
  '<nav><p>Top Notes: Wrong, Navigation</p></nav>'+
  '<main><p>Top Notes: Strawberry, Milk</p><p>Heart Notes: Caramel</p><p>Base Notes: Vanilla</p></main>'+
  '<footer><p>Top Notes: Wrong, Footer</p></footer>'+
  '<script>Top Notes: Wrong, Script</script></body></html>'
 const visible=atlasVisibleResearchText(html)
 assert.deepEqual(extractAtlasNoteSections(visible),{
  top:['Strawberry','Milk'],middle:['Caramel'],base:['Vanilla']
 })
 assert.doesNotMatch(visible,/Wrong/)
})

test('note extraction preserves line boundaries between paragraphs',()=>{
 const visible=atlasVisibleResearchText('<div>Top Notes: Pear</div><div>Heart Notes: Rose</div><div>Base Notes: Musk</div>')
 assert.deepEqual(extractAtlasNoteSections(visible),{top:['Pear'],middle:['Rose'],base:['Musk']})
})

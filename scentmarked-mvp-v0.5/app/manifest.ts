import type { MetadataRoute } from 'next'

export default function manifest():MetadataRoute.Manifest{
 return {
  name:'Scentmarked',
  short_name:'Scentmarked',
  description:'Know the notes. Find the match.',
  start_url:'/',
  display:'standalone',
  background_color:'#fbf5ec',
  theme_color:'#3b1607',
  icons:[{src:'/icon',sizes:'32x32',type:'image/png'},{src:'/apple-icon',sizes:'180x180',type:'image/png'}]
 }
}

import type { MetadataRoute } from 'next'

export default function robots():MetadataRoute.Robots{
 return {
  rules:{
   userAgent:'*',
   allow:'/',
   disallow:['/admin/','/collection/','/login','/reset-password']
  },
  sitemap:'https://scentmarked.m-worley816.workers.dev/sitemap.xml'
 }
}

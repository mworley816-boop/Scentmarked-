import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

export default function robots():MetadataRoute.Robots{
 return {
  rules:{
   userAgent:'*',
   allow:'/',
   disallow:['/admin/','/account','/collection/','/login','/reset-password','/onboarding','/unsubscribe','/auth/','/api/']
  },
  sitemap:siteUrl+'/sitemap.xml'
 }
}

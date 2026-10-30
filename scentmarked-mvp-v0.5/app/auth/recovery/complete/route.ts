import {NextResponse} from 'next/server'
import {createClient} from '@/lib/supabase/server'

export async function POST(request:Request){
 const origin=new URL(request.url).origin
 // A same-origin browser request is required before issuing a recovery-only cookie.
 if(request.headers.get('origin')!==origin)return NextResponse.json({error:'Invalid origin'},{status:403})
 const supabase=await createClient()
 const {data:{user},error}=await supabase.auth.getUser()
 if(error||!user)return NextResponse.json({error:'Not authenticated'},{status:401})
 const response=NextResponse.json({ok:true})
 response.cookies.set('scent_password_recovery',user.id,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/reset-password',maxAge:900})
 return response
}

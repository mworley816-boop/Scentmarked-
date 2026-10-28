import {NextResponse} from 'next/server'
import {authorizeHyperdriveDiagnostic} from '@/lib/hyperdrive-diagnostic-auth'
import {probeLiveHyperdrive} from '@/lib/hyperdrive-live-probe'

export const runtime='nodejs'
export const dynamic='force-dynamic'

const headers={'Cache-Control':'no-store'}
export async function POST(request:Request){
  const secret=process.env.ATLAS_RETAILER_INTAKE_SECRET
  if(!secret||secret.length<32)
    return NextResponse.json({status:'not_configured'},{status:503,headers})
  if(!await authorizeHyperdriveDiagnostic(request.headers.get('authorization'),secret))
    return NextResponse.json({status:'unauthorized'},{status:401,headers})
  const result=await probeLiveHyperdrive()
  if(result.ok)return NextResponse.json({status:'connected',read_only:true},{status:200,headers})
  return NextResponse.json({status:'unavailable',reason:result.reason},{status:503,headers})
}

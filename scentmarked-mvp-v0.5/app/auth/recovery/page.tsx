import RecoveryClient from './recovery-client'

export const metadata={title:'Verify Password Recovery',robots:{index:false,follow:false}}

export default function RecoveryPage(){
 return <main className="auth-page"><section className="auth-shell reset-shell"><div className="auth-panel"><h1>Verify password recovery</h1><RecoveryClient/></div></section></main>
}

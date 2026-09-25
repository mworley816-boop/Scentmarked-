import './globals.css';import AccountNav from '@/components/account-nav';
export const metadata={title:'Scentmarked',description:'Know the notes. Find the match.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><header><a className="logo" href="/">Scentmarked</a><nav><a href="/discover">Discover</a><a href="/matches">Find a Match</a><a href="/compare">Compare</a><AccountNav/></nav></header>{children}<footer>© Scentmarked · Know the notes. Find the match.</footer></body></html>}

import Link from 'next/link'

export default function NotFound(){
 return <main><section className="empty-state launch-error"><p className="eyebrow">404 · SCENT NOT FOUND</p><h1>That page isn't in the collection.</h1><p>The fragrance, brand, note, or page may have moved or may no longer be published.</p><div className="button-row"><Link className="button" href="/discover">Discover Fragrances</Link><Link className="button ghost" href="/">Go Home</Link></div></section></main>
}

import Link from 'next/link'

export const metadata={title:'Contact & Feedback',description:'Contact Scentmarked about fragrance data, corrections, community issues or general feedback.',alternates:{canonical:'/contact'}}

export default function Contact(){
 return <main><section className="legal-page"><p className="eyebrow">CONTACT & FEEDBACK</p><h1 className="page-title">Help us make Scentmarked better.</h1><p className="lede">Scentmarked is building a carefully sourced fragrance library. Feedback about catalog accuracy, missing scents and community content helps improve it.</p>
 <h2>Catalog corrections</h2><p>If you spot an incorrect note, accord, release detail or source, include the fragrance name, brand, the information that needs review and a reliable source when possible.</p>
 <h2>Missing fragrances</h2><p>Requests for fragrances that are not yet in the catalog are welcome. Include the fragrance and brand name so it can be researched before being added.</p>
 <h2>Community concerns</h2><p>If a review or other community contribution appears to violate the <Link href="/community-guidelines">Community Guidelines</Link>, identify the fragrance and the content that needs review.</p>
 <h2>Contact channel</h2><p>A dedicated public Scentmarked email address is being prepared. Until it is published, please do not send sensitive personal information through fragrance reviews or other public community fields.</p>
 </section></main>
}

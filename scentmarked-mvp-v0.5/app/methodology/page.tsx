import Link from 'next/link'

export const metadata={
 title:'Methodology',
 description:'How Scentmarked verifies fragrance data and calculates scent similarity.',
 alternates:{canonical:'/methodology'}
}

export default function Methodology(){
 return <main><section className="legal-page">
  <p className="eyebrow">SCENTMARKED METHODOLOGY</p>
  <h1 className="page-title">How we verify and compare scents.</h1>
  <p className="lede">Scentmarked separates sourced fragrance information, calculated similarity, and community opinion so you can see what each part of a profile means.</p>

  <h2>Catalog verification</h2>
  <p>Fragrance records can include brand, concentration, release year, country, description, notes, accords, and source provenance. Source links shown on fragrance profiles identify where catalog details were checked. A field is not treated as verified simply because it appears in a community review.</p>

  <h2>Notes and note position</h2>
  <p>When a source identifies top, heart, or base placement, Scentmarked stores that position with the note. The matching system gives base notes a weight of 1.25, heart notes 1.15, top notes 1.05, and notes without a specified position 1.00. A shared note appearing in the same known position receives a 1.18 matching bonus.</p>

  <h2>Rarity weighting</h2>
  <p>Shared notes that occur less often in the eligible Scentmarked catalog receive more weight than very common notes. This helps a distinctive shared note contribute more meaningfully than a note found across many fragrances.</p>

  <h2>Accord similarity</h2>
  <p>Accord strength is used only when both fragrances have usable accord-strength data. When that data exists for both scents, the current match score combines 65% note similarity and 35% accord similarity. Otherwise the score remains note-only.</p>

  <h2>Data confidence</h2>
  <p>Match results display Limited, Medium, or High data confidence based on the amount of usable note and accord data available for the two fragrances. Confidence describes data coverage, not certainty that two perfumes smell the same.</p>

  <h2>What a match score means</h2>
  <p>A Scentmarked match percentage is a catalog-comparison score. It is not an official clone percentage, a brand claim, or a guarantee of perceived similarity. Skin chemistry, formulation, concentration, batch variation, and individual perception can all affect how a fragrance smells and wears.</p>

  <h2>Personalized recommendations</h2>
  <p>When you use a Scent Profile, Scentmarked can combine your loved notes and accords, wear preferences, budget, and saved favorite fragrances with catalog similarity. Saved favorites are treated as taste references: the system compares a candidate with your saved favorites and uses the strongest available similarity signals rather than labeling the candidate a clone.</p>
  <p>If you save a fragrance-presentation preference such as feminine-leaning, masculine-leaning, or unisex / gender-neutral, a matching catalog presentation can add a bounded 4-point adjustment after the base recommendation score is calculated. The final displayed score remains capped at 100.</p>
  <p>Occasion and vibe answers are saved as part of your Scent Profile, but they are not currently used to change recommendation ranking. Scentmarked will only use those answers as ranking signals when comparable structured catalog data is available; we do not infer those attributes just to increase a match score.</p>

  <h2>Community data</h2>
  <p>Ratings, written reviews, wear metrics, and comparison votes come from Scentmarked members and are presented separately from sourced catalog facts. Community comparison consensus is withheld until enough votes are available to avoid presenting a tiny sample as established opinion.</p>

  <p><Link className="button" href="/matches">TRY FIND A MATCH →</Link></p>
 </section></main>
}

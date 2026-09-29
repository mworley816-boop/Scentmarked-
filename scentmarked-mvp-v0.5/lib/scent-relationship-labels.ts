export const relationshipLabel=(type:string)=>type==='manufacturer_inspired_by'?'Documented inspiration':type==='possible_clone'?'Possible clone — compare before buying':type==='similar_dna'?'Similar scent DNA':type==='flanker'?'Same fragrance family':'Known scent comparison'

export const relationshipReason=(type:string)=>type==='possible_clone'?'Possible clone relationship':relationshipLabel(type)

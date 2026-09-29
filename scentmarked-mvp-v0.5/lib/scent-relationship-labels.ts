type RelationshipType =
  | 'manufacturer_inspired_by'
  | 'possible_clone'
  | 'similar_dna'
  | 'community_comparison'
  | 'flanker'
  | string

export function relationshipLabel(type: RelationshipType): string {
  switch (type) {
    case 'manufacturer_inspired_by':
      return 'Documented inspiration'
    case 'possible_clone':
      return 'Possible clone'
    case 'similar_dna':
      return 'Similar scent DNA'
    case 'community_comparison':
      return 'Known scent comparison'
    case 'flanker':
      return 'Same fragrance family'
    default:
      return 'Related fragrance'
  }
}

export function relationshipReason(type: RelationshipType): string {
  switch (type) {
    case 'manufacturer_inspired_by':
      return 'Documented manufacturer inspiration'
    case 'possible_clone':
      return 'Possible clone relationship'
    case 'similar_dna':
      return 'Similar scent DNA'
    case 'community_comparison':
      return 'Known scent comparison'
    case 'flanker':
      return 'Same fragrance family'
    default:
      return 'Related fragrance'
  }
}

export function relationshipCopy(type: RelationshipType, name: string): string {
  switch (type) {
    case 'manufacturer_inspired_by':
      return `A manufacturer-documented inspiration relationship is recorded between this fragrance and ${name}.`
    case 'possible_clone':
      return `This fragrance has a community-reported possible clone relationship with ${name}; this is not the same as manufacturer confirmation.`
    case 'similar_dna':
      return `This fragrance has similar scent DNA to ${name}; this does not mean they are duplicates.`
    case 'community_comparison':
      return `This fragrance has been compared with ${name}; a comparison alone is not a clone claim.`
    case 'flanker':
      return `This fragrance is part of the same fragrance family as ${name}.`
    default:
      return `This fragrance has a known relationship with ${name}.`
  }
}

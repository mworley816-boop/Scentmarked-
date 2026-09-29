import { relationshipLabel } from './scent-relationship-labels'

export { relationshipLabel, relationshipReason } from './scent-relationship-labels'

export const relationshipCopy=(type:string,name:string)=>type==='manufacturer_inspired_by'?('A manufacturer-documented inspiration relationship is recorded between this fragrance and '+name+'.'):type==='possible_clone'?('A possible clone relationship is recorded between this fragrance and '+name+'. This is not the same as manufacturer confirmation.'):type==='similar_dna'?('ScentMarked records similar scent DNA between this fragrance and '+name+'; that does not mean they are duplicates.'):type==='flanker'?('This fragrance and '+name+' are recorded as members of the same fragrance family.'):('A scent comparison is recorded between this fragrance and '+name+'; a comparison alone is not a clone claim.')

export type DiscoverRelationship = {
 source_perfume_id: string | null
 target_perfume_id: string | null
 relationship_type: string
 confidence: number | null
}

export function relationshipPriority(type: string): number {
 switch(type){
  case 'manufacturer_inspired_by': return 5
  case 'possible_clone': return 4
  case 'similar_dna': return 3
  case 'community_comparison': return 2
  case 'flanker': return 1
  default: return 0
 }
}

export function indexVisibleRelationships<T extends DiscoverRelationship>(relationships: T[], visibleIds: Iterable<string>): Map<string,T> {
 const visible=new Set(visibleIds)
 const index=new Map<string,T>()
 for(const relationship of relationships){
  const priority=relationshipPriority(relationship.relationship_type)
  const confidence=Number(relationship.confidence)||0
  for(const id of new Set([relationship.source_perfume_id,relationship.target_perfume_id])){
   if(typeof id!=='string'||!visible.has(id))continue
   const current=index.get(id)
   if(!current||priority>relationshipPriority(current.relationship_type)||(priority===relationshipPriority(current.relationship_type)&&confidence>(Number(current.confidence)||0)))index.set(id,relationship)
  }
 }
 return index
}

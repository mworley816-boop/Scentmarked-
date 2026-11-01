/** Stable, validated identifier for one approved Atlas research handoff. */
export function atlasImportKey(researchId:string):string{
 const id=researchId.trim()
 if(!id||id.length>160||!/^[a-zA-Z0-9][a-zA-Z0-9:_-]*$/.test(id)){
  throw new Error('Invalid Atlas research import identifier')
 }
 return id
}

/** Never treat a different research row as a retry of the same import. */
export function isSameAtlasImport(existingResearchId:string,requestedResearchId:string):boolean{
 return atlasImportKey(existingResearchId)===atlasImportKey(requestedResearchId)
}

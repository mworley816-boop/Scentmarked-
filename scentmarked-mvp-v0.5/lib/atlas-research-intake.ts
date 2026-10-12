export type PerfumeResearchCandidate = {
 brand: string
 name: string
 manufacturerUrl: string
 sourceNotes: string[]
}

export type ResearchValidation = {
 valid: boolean
 errors: string[]
 normalized: PerfumeResearchCandidate | null
}

export function validatePerfumeResearchCandidate(input: unknown): ResearchValidation {
 const errors: string[] = []
 if (!input || typeof input !== 'object' || Array.isArray(input)) return { valid:false, errors:['Candidate must be an object'], normalized:null }
 const data=input as Record<string,unknown>
 const brand=typeof data.brand==='string'?data.brand.trim():''
 const name=typeof data.name==='string'?data.name.trim():''
 const url=typeof data.manufacturerUrl==='string'?data.manufacturerUrl.trim():''
 if (!brand || brand.length>120) errors.push('Brand must be 1–120 characters')
 if (!name || name.length>180) errors.push('Name must be 1–180 characters')
 let parsed:URL|null=null
 try { parsed=new URL(url) } catch {}
 if (!parsed || parsed.protocol!=='https:' || !parsed.hostname || parsed.username || parsed.password) errors.push('Manufacturer URL must be an HTTPS URL without credentials')
 const notes=Array.isArray(data.sourceNotes)&&data.sourceNotes.every(x=>typeof x==='string')?data.sourceNotes.map((x:string)=>x.trim()):[]
 if (!Array.isArray(data.sourceNotes) || !data.sourceNotes.every(x=>typeof x==='string') || notes.some((x:string)=>!x||x.length>120) || notes.length>100) errors.push('Source notes must be up to 100 nonempty strings of at most 120 characters')
 return {valid:errors.length===0,errors,normalized:errors.length?null:{brand,name,manufacturerUrl:url,sourceNotes:notes}}
}

export function perfumeResearchIdentity(brand:string,name:string):string {
 return [brand,name].map(s=>s.normalize('NFKC').trim().toLocaleLowerCase('en-US').replace(/\\s+/g,' ')).join('::')
}

export function hasResearchCatalogDuplicate(candidate:PerfumeResearchCandidate,existing:ReadonlyArray<{brand:string,name:string}>):boolean {
 const key=perfumeResearchIdentity(candidate.brand,candidate.name)
 return existing.some(item=>perfumeResearchIdentity(item.brand,item.name)===key)
}

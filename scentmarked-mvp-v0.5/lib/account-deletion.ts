export function hasAccountDeletionConfirmation(value:unknown){
 return typeof value==='string'&&value.trim().toUpperCase()==='DELETE'
}

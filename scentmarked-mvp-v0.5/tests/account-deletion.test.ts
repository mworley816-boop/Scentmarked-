import test from 'node:test'
import assert from 'node:assert/strict'
import { hasAccountDeletionConfirmation } from '../lib/account-deletion.ts'

test('account deletion requires the DELETE confirmation word',()=>{
 assert.equal(hasAccountDeletionConfirmation('DELETE'),true)
 assert.equal(hasAccountDeletionConfirmation(' delete '),true)
 assert.equal(hasAccountDeletionConfirmation('Delete'),true)
 assert.equal(hasAccountDeletionConfirmation(''),false)
 assert.equal(hasAccountDeletionConfirmation('DELETE NOW'),false)
 assert.equal(hasAccountDeletionConfirmation('DELET'),false)
 assert.equal(hasAccountDeletionConfirmation(null),false)
 assert.equal(hasAccountDeletionConfirmation(undefined),false)
})

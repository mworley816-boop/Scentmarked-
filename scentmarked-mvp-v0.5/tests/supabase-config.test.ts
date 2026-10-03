import test from 'node:test'
import assert from 'node:assert/strict'
import {
 defaultSupabaseUrl,
 defaultSupabasePublishableKey,
 publicSupabaseConfig,
} from '../lib/supabase/config.ts'

test('publicSupabaseConfig falls back to the production public project configuration',()=>{
 const oldUrl=process.env.NEXT_PUBLIC_SUPABASE_URL
 const oldKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 delete process.env.NEXT_PUBLIC_SUPABASE_URL
 delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 try{
  assert.deepEqual(publicSupabaseConfig(),{
   url:defaultSupabaseUrl,
   publishableKey:defaultSupabasePublishableKey,
  })
 }finally{
  if(oldUrl===undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
  else process.env.NEXT_PUBLIC_SUPABASE_URL=oldUrl
  if(oldKey===undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=oldKey
 }
})

test('publicSupabaseConfig uses environment overrides',()=>{
 const oldUrl=process.env.NEXT_PUBLIC_SUPABASE_URL
 const oldKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co'
 process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='sb_publishable_example'
 try{
  assert.deepEqual(publicSupabaseConfig(),{
   url:'https://example.supabase.co',
   publishableKey:'sb_publishable_example',
  })
 }finally{
  if(oldUrl===undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
  else process.env.NEXT_PUBLIC_SUPABASE_URL=oldUrl
  if(oldKey===undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=oldKey
 }
})

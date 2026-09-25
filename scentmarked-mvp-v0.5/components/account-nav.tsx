import { createClient } from '@/lib/supabase/server'
export default async function AccountNav(){const s=await createClient();const {data:{user}}=await s.auth.getUser();return user?<><a href="/collection">My Marks</a><form action="/auth/signout" method="post" className="nav-form"><button className="link-button">Sign Out</button></form></>:<a href="/login">Sign In</a>}

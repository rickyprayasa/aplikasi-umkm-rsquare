// src/lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Browser client for client-side components
export const createClient = () => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server client for server components
export const createServerClient = () => createServerComponentClient({ cookies })

// Debug log for production validation (client-side only, after client creation)
if (typeof window !== 'undefined') {
  const client = createClient()
  console.log('Supabase Client Debug:', {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'URL defined' : 'URL undefined',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Key defined (length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 'Key undefined',
    hasAuth: !!client.auth.signInWithPassword,
    hasOAuth: !!client.auth.signInWithOAuth
  });
}


export const supabase = createClient()

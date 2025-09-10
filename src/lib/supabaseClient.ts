// src/lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a real client if we have the required environment variables, otherwise create a mock
let supabase: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  // Create a more comprehensive mock client for build purposes
  console.warn('Supabase environment variables not set. Using mock client.')
  supabase = {
    from: (table) => ({
      select: (columns) => ({
        data: null,
        error: null,
        eq: (column, value) => ({
          data: null,
          error: null,
          single: () => ({ data: null, error: null })
        }),
        single: () => ({ data: null, error: null }),
        order: (column, options) => ({ 
          data: null, 
          error: null,
          range: (from, to) => ({ data: null, error: null, count: null })
        }),
        range: (from, to) => ({ data: null, error: null, count: null })
      }),
      insert: (values) => ({ data: null, error: null }),
      update: (values) => ({
        data: null,
        error: null,
        eq: (column, value) => ({ data: null, error: null })
      }),
      delete: () => ({
        data: null,
        error: null,
        eq: (column, value) => ({ data: null, error: null })
      }),
      eq: (column, value) => ({
        data: null,
        error: null,
        single: () => ({ data: null, error: null })
      }),
      single: () => ({ data: null, error: null }),
      order: (column, options) => ({ 
        data: null, 
        error: null,
        range: (from, to) => ({ data: null, error: null, count: null })
      }),
      range: (from, to) => ({ data: null, error: null, count: null })
    }),
    rpc: (functionName, params) => Promise.resolve({ data: null, error: null }),
    auth: {
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: (callback) => {
        // Call the callback immediately with null session
        callback('SIGNED_OUT', null)
        // Return a subscription object with unsubscribe method
        return { 
          data: { 
            subscription: { 
              unsubscribe: () => {} 
            } 
          },
          error: null
        }
      },
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      updateUser: (attributes) => Promise.resolve({ data: { user: null }, error: null }),
      mfa: {
        listFactors: () => Promise.resolve({ data: { totp: [] }, error: null }),
        enroll: (params) => Promise.resolve({ data: null, error: null }),
        challengeAndVerify: (params) => Promise.resolve({ data: null, error: null })
      },
      update: {
        password: (params) => Promise.resolve({ data: null, error: null })
      }
    },
    storage: {
      from: (bucket) => ({
        upload: (path, file) => Promise.resolve({ data: null, error: null }),
        getPublicUrl: (path) => ({ data: { publicUrl: '' }, error: null })
      })
    }
  }
}

export { supabase }

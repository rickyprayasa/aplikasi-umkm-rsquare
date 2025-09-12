// src/app/providers.tsx
"use client"
import { ThemeProvider } from 'next-themes'
import { SessionProvider } from '@supabase/auth-helpers-react'
import { createBrowserClient } from '@supabase/ssr'

export function Providers({ children }: { children: React.ReactNode }) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return (
    <SessionProvider supabaseClient={supabase}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
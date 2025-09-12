// src/components/Auth.tsx
"use client"

import { supabase } from '@/lib/supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function AuthComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-black text-gray-900">Selamat Datang di Omzetin</h1>
          <p className="mt-2 text-sm text-gray-600">Silakan masuk atau daftar untuk melanjutkan</p>
        </div>
        {supabase && (
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="light"
            // Baris ini yang akan memunculkan tombol Google
            providers={['google']} 
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Alamat Email',
                  password_label: 'Password',
                  button_label: 'Masuk',
                  social_provider_text: 'Masuk dengan {{provider}}',
                  link_text: 'Sudah punya akun? Masuk'
                },
                sign_up: {
                  email_label: 'Alamat Email',
                  password_label: 'Password',
                  button_label: 'Daftar',
                  link_text: 'Belum punya akun? Daftar'
                },
                forgotten_password: {
                  email_label: 'Alamat Email',
                  button_label: 'Kirim instruksi reset password',
                  link_text: 'Lupa password?'
                }
              },
            }}
          />
        )}
      </div>
    </div>
  )
}
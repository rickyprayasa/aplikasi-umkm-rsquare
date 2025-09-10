// src/components/UserProfile.tsx
"use client"

import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Save } from 'lucide-react';

interface UserProfileProps {
  session: Session | null;
  onBack: () => void;
}

export default function UserProfile({ session, onBack }: UserProfileProps) {
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Ambil data profil saat komponen dimuat
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();
      
      if (data) {
        setFullName(data.full_name || '');
      }
      setLoading(false);
    };
    fetchProfile();
  }, [session]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    const { error } = await supabase.from('profiles').upsert({
      id: session!.user.id,
      full_name: fullName,
      updated_at: new Date().toISOString()
    });

    if (error) {
      setMessage(`Gagal menyimpan profil: ${error.message}`);
    } else {
      setMessage('Profil berhasil diperbarui!');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali ke Pengaturan
      </Button>

      <Card className="bg-white border-2 border-gray-200 shadow-xl">
        <CardHeader>
          <CardTitle>Profil Pengguna</CardTitle>
          <CardDescription>Kelola informasi personal akun Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={session?.user?.email || 'Tidak ada email'} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masukkan nama lengkap Anda"
                disabled={loading}
              />
            </div>
            {message && <p className={`text-sm ${message.includes('Gagal') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
            <CardFooter className="px-0 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Simpan Perubahan
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
// src/components/StoreProfile.tsx
"use client"

import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from 'lucide-react';

interface StoreProfileProps {
  session: Session | null;
  onBack: () => void;
  onProfileUpdate: () => void; // <-- TERIMA PROP BARU
}

export default function StoreProfile({ session, onBack, onProfileUpdate }: StoreProfileProps) {
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session) return;
      setLoading(true);
      if (!supabase) {
        setLoading(false);
        setMessage('Supabase client tidak tersedia.');
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (data) {
        setStoreName(data.store_name || '');
        setAddress(data.address || '');
        setPhoneNumber(data.phone_number || '');
      }
      setLoading(false);
    };
    fetchProfile();
  }, [session]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (!supabase) {
      setMessage('Supabase client tidak tersedia.');
      setLoading(false);
      return;
    }
    const { error } = await supabase.from('profiles').upsert({
      id: session!.user.id,
      store_name: storeName,
      address: address,
      phone_number: phoneNumber,
      updated_at: new Date().toISOString()
    });

    if (error) {
      setMessage(`Gagal menyimpan profil toko: ${error.message}`);
    } else {
      setMessage('Profil toko berhasil diperbarui!');
      onProfileUpdate(); // <-- PANGGIL FUNGSI REFRESH DI SINI
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
          <CardTitle>Profil Toko</CardTitle>
          <CardDescription>Informasi ini akan ditampilkan pada struk belanjaan.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p>Memuat data...</p> : (
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Nama Toko</Label>
                <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Contoh: Kedai Kopi Senja" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Alamat Toko</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Contoh: Jl. Kenangan No. 10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Nomor Telepon</Label>
                <Input id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Contoh: 08123456789" />
              </div>
              {message && <p className={`text-sm ${message.includes('Gagal') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
              <CardFooter className="px-0 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Simpan Profil Toko
                </Button>
              </CardFooter>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
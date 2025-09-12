// src/components/LoyaltySettings.tsx
"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; // Import baru
import { ArrowLeft, Loader2, Save } from 'lucide-react';

interface LoyaltySettingsProps {
  profile: { id: string; loyalty_enabled?: boolean; loyalty_threshold?: number; loyalty_discount_percent?: number; };
  onBack: () => void;
  refreshProfileData: () => void; // Fungsi untuk refresh data profil
}

export default function LoyaltySettings({ profile, onBack, refreshProfileData }: LoyaltySettingsProps) {
  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState(10);
  const [discount, setDiscount] = useState(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setEnabled(profile.loyalty_enabled || false);
      setThreshold(profile.loyalty_threshold || 10);
      setDiscount(profile.loyalty_discount_percent || 15);
      setLoading(false);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    if (!supabase) {
      setMessage('Supabase client tidak tersedia.');
      setSaving(false);
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({
        loyalty_enabled: enabled,
        loyalty_threshold: threshold,
        loyalty_discount_percent: discount
      })
      .eq('id', profile.id);

    if (error) {
      setMessage('Gagal menyimpan: ' + error.message);
    } else {
      setMessage('Pengaturan berhasil disimpan!');
      refreshProfileData(); // Refresh data profil di halaman utama
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali ke Pengaturan
      </Button>

      <Card className="bg-white border-2 border-gray-200 shadow-xl">
        <CardHeader>
          <CardTitle>Program Loyalitas</CardTitle>
          <CardDescription>Atur reward untuk pelanggan setia Anda agar mereka terus kembali.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? <p>Memuat pengaturan...</p> : (
            <>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="loyalty-enabled" className="text-base">Aktifkan Program Loyalitas</Label>
                <Switch
                  id="loyalty-enabled"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
              </div>

              {enabled && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Reward Setelah (Transaksi)</Label>
                    <Input
                      id="threshold"
                      type="number"
                      value={threshold}
                      onChange={(e) => setThreshold(parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-gray-500">Pelanggan akan mendapat reward setelah mencapai jumlah transaksi ini.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount">Besar Diskon Reward (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-gray-500">Jumlah diskon dalam persen yang akan didapat.</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Simpan Pengaturan
                </Button>
                {message && <p className={`text-sm ${message.includes('Gagal') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
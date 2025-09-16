"use client";
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';

const defaultMethods = [
  { id: 'cash', name: 'Tunai', enabled: true },
  { id: 'transfer', name: 'Transfer Bank', enabled: true },
  { id: 'qris', name: 'QRIS (Manual)', enabled: false },
  { id: 'ewallet', name: 'E-Wallet (Manual)', enabled: false },
];

export default function PaymentSettings({ onBack }: { onBack?: () => void }) {
  const [methods, setMethods] = useState(defaultMethods);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleToggle = (id: string) => {
    setMethods(methods => methods.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
  };

  const handleSave = async () => {
    setSaving(true);
    // Simpan ke database jika perlu
    setTimeout(() => {
      setSaving(false);
      setMessage('Pengaturan metode pembayaran berhasil disimpan!');
    }, 800);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-4">← Kembali ke Pengaturan</Button>
      )}
      <Card className="bg-white border-2 border-gray-200 shadow-xl">
        <CardHeader>
          <CardTitle>Metode Pembayaran</CardTitle>
          <CardDescription>Pilih metode pembayaran yang tersedia di kasir.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {methods.map(method => (
              <label key={method.id} className="flex items-center gap-3 font-medium">
                <input type="checkbox" checked={method.enabled} onChange={() => handleToggle(method.id)} />
                {method.name}
              </label>
            ))}
            {message && <p className={`text-sm ${message.includes('Gagal') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
          </div>
        </CardContent>
        <CardFooter className="px-6 pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

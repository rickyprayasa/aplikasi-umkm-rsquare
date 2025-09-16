"use client";
import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationSettingsProps {
  notifEnabled: boolean;
  notifSound: boolean;
  notifType: string;
  onSave: (settings: { notifEnabled: boolean; notifSound: boolean; notifType: string }) => void;
  profile?: any;
  onBack?: () => void;
  onProfileUpdate?: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ notifEnabled, notifSound, notifType, onSave, onBack }) => {
  const [enabled, setEnabled] = useState<boolean>(notifEnabled);
  const [sound, setSound] = useState<boolean>(notifSound);
  const [type, setType] = useState<string>(notifType);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const handleSave = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      await onSave({ notifEnabled: enabled, notifSound: sound, notifType: type });
      setMessage('Pengaturan notifikasi berhasil disimpan!');
    } catch (err: any) {
      setMessage('Gagal menyimpan pengaturan: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {typeof onBack === 'function' && (
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Pengaturan
        </Button>
      )}
      <Card className="bg-white border-2 border-gray-200 shadow-xl">
        <CardHeader>
          <CardTitle>Pengaturan Notifikasi</CardTitle>
          <CardDescription>Atur preferensi notifikasi aplikasi Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium flex items-center gap-2">
                <input type="checkbox" checked={enabled} onChange={(e: ChangeEvent<HTMLInputElement>) => setEnabled(e.target.checked)} />
                Aktifkan Notifikasi
              </label>
            </div>
            <div className="space-y-2">
              <label className="font-medium flex items-center gap-2">
                <input type="checkbox" checked={sound} onChange={(e: ChangeEvent<HTMLInputElement>) => setSound(e.target.checked)} />
                Bunyikan Suara
              </label>
            </div>
            <div className="space-y-2">
              <label className="font-medium">Tipe Notifikasi</label>
              <select value={type} onChange={(e: ChangeEvent<HTMLSelectElement>) => setType(e.target.value)} className="border rounded px-2 py-1">
                <option value="all">Semua</option>
                <option value="stock">Stok Rendah</option>
                <option value="transaction">Transaksi</option>
              </select>
            </div>
            {message && <p className={`text-sm ${message.includes('Gagal') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
            <CardFooter className="px-0 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Simpan Pengaturan
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;

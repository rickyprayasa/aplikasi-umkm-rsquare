// src/components/SecuritySettings.tsx
"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { QRCodeSVG as QRCode } from 'qrcode.react';

interface SecuritySettingsProps {
  onBack: () => void;
}

export default function SecuritySettings({ onBack }: SecuritySettingsProps) {
  // --- State untuk Ganti Password ---
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  // --- State untuk 2FA (Diperbarui) ---
  const [isMfaEnabled, setIsMfaEnabled] = useState<boolean | null>(null);
  const [otpAuthUri, setOtpAuthUri] = useState<string | null>(null);
  const [unverifiedFactorId, setUnverifiedFactorId] = useState<string | null>(null); // <-- STATE BARU UNTUK MENYIMPAN ID
  const [verificationCode, setVerificationCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaMessage, setMfaMessage] = useState('');

  useEffect(() => {
    const checkMfaStatus = async () => {
      if (!supabase) {
        setIsMfaEnabled(false);
        return;
      }
      const { data } = await supabase.auth.mfa.listFactors();
      setIsMfaEnabled(data && data.totp.length > 0);
    };
    checkMfaStatus();
  }, []);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    if (newPassword.length < 6) {
      setPasswordMessage('Password minimal harus 6 karakter.'); return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Password baru dan konfirmasi tidak cocok.'); return;
    }
    if (!supabase) {
      setPasswordMessage('Supabase client tidak tersedia.');
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setPasswordMessage(`Gagal memperbarui password: ${error.message}`);
    else {
      setPasswordMessage('Password berhasil diperbarui!');
      setNewPassword(''); setConfirmPassword('');
    }
    setPasswordLoading(false);
  };

  // --- Fungsi Baru untuk Memulai Proses 2FA ---
  const handleEnrollMfa = async () => {
    if (!supabase) {
      setMfaMessage('Supabase client tidak tersedia.');
      return;
    }
    setMfaLoading(true);
    setMfaMessage('');
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) {
      setMfaMessage(`Gagal memulai 2FA: ${error.message}`);
    } else if (data) {
      setOtpAuthUri(data.totp.uri);
      setUnverifiedFactorId(data.id); // <-- SIMPAN FACTOR ID YANG BARU DIBUAT
    }
    setMfaLoading(false);
  };

  // --- Fungsi Verifikasi 2FA (Diperbarui) ---
  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaLoading(true);
    setMfaMessage('');

    // Pastikan factorId ada sebelum melanjutkan
    if (!supabase) {
      setMfaMessage('Supabase client tidak tersedia.');
      setMfaLoading(false);
      return;
    }
    if (!unverifiedFactorId) {
      setMfaMessage('Gagal menemukan faktor otentikasi. Coba mulai ulang proses.');
      setMfaLoading(false);
      return;
    }

    // Gunakan factorId yang sudah kita simpan
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: unverifiedFactorId,
      code: verificationCode
    });
    
    if (error) {
      setMfaMessage(`Verifikasi gagal: ${error.message}`);
    } else {
      setMfaMessage('Autentikasi Dua Faktor (2FA) berhasil diaktifkan!');
      setIsMfaEnabled(true);
      setOtpAuthUri(null);
      setUnverifiedFactorId(null);
    }
    setMfaLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali ke Pengaturan
      </Button>

      {/* --- Bagian Ganti Password (Tidak Berubah) --- */}
      <Card className="bg-white border-2 border-gray-200 shadow-xl">
        <CardHeader><CardTitle>Ubah Password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            {/* ... (kode form ganti password tidak berubah) ... */}
            <div className="space-y-2"><Label htmlFor="newPassword">Password Baru</Label><Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" required/></div>
            <div className="space-y-2"><Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label><Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required/></div>
            {passwordMessage && <p className={`text-sm ${passwordMessage.includes('Gagal') ? 'text-red-500' : 'text-green-600'}`}>{passwordMessage}</p>}
            <CardFooter className="px-0 pt-4"><Button type="submit" disabled={passwordLoading}>{passwordLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Simpan Password Baru</Button></CardFooter>
          </form>
        </CardContent>
      </Card>

      {/* --- Bagian Baru untuk 2FA --- */}
      <Card className="bg-white border-2 border-gray-200 shadow-xl">
        <CardHeader>
          <CardTitle>Autentikasi Dua Faktor (2FA)</CardTitle>
          <CardDescription>Tingkatkan keamanan akun Anda dengan lapisan verifikasi tambahan.</CardDescription>
        </CardHeader>
        <CardContent>
          {isMfaEnabled === null ? <p>Memeriksa status 2FA...</p> : 
           isMfaEnabled ? (
            <p className="text-green-600 font-semibold">2FA sudah aktif di akun Anda.</p>
           ) : (
            <div>
              {otpAuthUri ? ( // Cek berdasarkan URI, bukan URL SVG
                <form onSubmit={handleVerifyMfa} className="space-y-4 text-center">
                  <p>Scan QR Code di bawah ini menggunakan aplikasi authenticator Anda.</p>
                  
                  {/* --- TAMPILKAN QR CODE MENGGUNAKAN LIBRARY BARU --- */}
                  <div className="flex justify-center p-4 bg-white">
                    <QRCode value={otpAuthUri} size={200} />
                  </div>
                  
                  <div className="space-y-2 text-left"><Label htmlFor="verificationCode">Masukkan Kode Verifikasi 6 Digit</Label><Input id="verificationCode" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="123456" required /></div>
                  <Button type="submit" disabled={mfaLoading}>
                    {mfaLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Verifikasi & Aktifkan
                  </Button>
                </form>
              ) : (
                <Button onClick={handleEnrollMfa} disabled={mfaLoading}>{mfaLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Aktifkan 2FA</Button>
              )}
              {mfaMessage && <p className={`mt-4 text-sm ${mfaMessage.includes('gagal') ? 'text-red-500' : 'text-green-600'}`}>{mfaMessage}</p>}
            </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
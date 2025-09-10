// src/components/PrinterSettings.tsx

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface PrinterSettingsProps {
  onBack: () => void;
  profile: any;
  onProfileUpdate: () => void; // <-- TAMBAHKAN INI
}

export default function PrinterSettings({ onBack, profile, onProfileUpdate }: PrinterSettingsProps) {
  const [paperSize, setPaperSize] = useState("80mm");
  const [autoPrint, setAutoPrint] = useState(false);
  const [footerText, setFooterText] = useState("Terima kasih telah berbelanja!");
  const [loading, setLoading] = useState(false); 
  const [printMode, setPrintMode] = useState("Gambar");

  useEffect(() => {
    if (profile) {
      setPaperSize(profile.printer_paper_size || "80mm");
      setAutoPrint(profile.printer_auto_print || false);
      setFooterText(profile.printer_footer_text || "Terima kasih!");
      setPrintMode(profile.printer_mode || "Gambar"); // <-- Muat state
    }
  }, [profile]);

  const handleSaveChanges = async () => {
    if (!profile) return alert("Profil tidak ditemukan.");
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ 
        printer_paper_size: paperSize,
        printer_auto_print: autoPrint,
        printer_footer_text: footerText,
        printer_mode: printMode,
      })
      .eq('id', profile.id);

    if (error) {
      alert("Gagal menyimpan pengaturan: " + error.message);
    } else {
      alert("Pengaturan berhasil disimpan!");
      onProfileUpdate(); // <-- PERBAIKAN: Panggil refresh data, BUKAN onBack()
      onBack(); // Tetap panggil onBack setelah selesai
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Kembali ke Pengaturan
        </Button>
      </div>
      <Card className="bg-white border-2 border-gray-200 shadow-xl">
        <CardHeader><CardTitle>Pengaturan Printer</CardTitle><CardDescription>Atur preferensi printer kasir Anda untuk pencetakan struk.</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="print-mode">Mode Cetak</Label>
            <Select value={printMode} onValueChange={setPrintMode}>
              <SelectTrigger id="print-mode" className="w-[280px]">
                <SelectValue placeholder="Pilih mode cetak" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gambar">Gambar (Direkomendasikan untuk semua printer)</SelectItem>
                <SelectItem value="HTML">HTML (Khusus untuk printer thermal)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Pilih 'Gambar' untuk printer biasa (A4) atau jika Anda tidak yakin.</p>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="auto-print" className="text-base">Cetak Otomatis</Label>
              <p className="text-sm text-muted-foreground">Cetak struk secara otomatis setelah transaksi berhasil.</p>
            </div>
            <Switch id="auto-print" checked={autoPrint} onCheckedChange={setAutoPrint} />
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="footer-text">Teks Tambahan di Struk (Footer)</Label>
            <Textarea id="footer-text" placeholder="Contoh: Terima kasih!" value={footerText} onChange={(e) => setFooterText(e.target.value)} />
          </div>
        </CardContent>
      
      <div className="px-6 pt-4">
        <Button onClick={handleSaveChanges} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Simpan Perubahan
        </Button>
      </div>
      </Card>
    </div>
  );
}
"use client";

import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toPng } from 'html-to-image';

interface ReceiptPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: { items: Array<{ quantity: number; nama_produk: string; harga: number; }>; created_at: string; total_amount: number; };
  profile: { printer_mode?: string; store_name?: string; full_name?: string; };
}

export default function ReceiptPreviewDialog({ isOpen, onClose, transaction, profile }: ReceiptPreviewDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!transaction) return null;

  const totalItems = transaction.items.reduce((sum: number, item: { quantity: number; }) => sum + item.quantity, 0);

  const handlePrint = async () => {
    if (receiptRef.current === null) return;
    
    if (profile?.printer_mode === 'HTML') {
      // --- LOGIKA BARU UNTUK CETAK HTML ---
      let receiptHtml = `
        <div style="width: 280px; font-family: monospace; font-size: 12px; color: black;">
          <div style="text-align: center; margin-bottom: 8px;">
            <h2 style="font-size: 16px; font-weight: bold; margin: 0;">${profile?.store_name || 'Toko Anda'}</h2>
            <p style="margin: 2px 0;">${profile?.address || 'Alamat Toko Anda'}</p>
          </div>
          <hr style="border-top: 1px dashed black; margin: 8px 0;" />
          <div>
            <p style="margin: 2px 0;">No: ${transaction.nomor_faktur || `#${transaction.id}`}</p>
            <p style="margin: 2px 0;">Kasir: ${profile?.full_name || 'Kasir'}</p>
            <p style="margin: 2px 0;">Tanggal: ${new Date(transaction.created_at).toLocaleString('id-ID')}</p>
          </div>
          <hr style="border-top: 1px dashed black; margin: 8px 0;" />
          <div>
      `;

      transaction.items.forEach((item: { nama_produk: string; quantity: number; harga: number; }) => {
        receiptHtml += `
          <div style="margin-bottom: 4px;">
            <div>${item.nama_produk}</div>
            <div style="display: grid; grid-template-columns: 1fr 2fr 2fr;">
              <span>${item.quantity}x</span>
              <span style="text-align: right;">@${item.harga.toLocaleString('id-ID')}</span>
              <span style="text-align: right;">${(item.quantity * item.harga).toLocaleString('id-ID')}</span>
            </div>
          </div>
        `;
      });

      receiptHtml += `
          </div>
          <hr style="border-top: 1px dashed black; margin: 8px 0;" />
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <p>TOTAL (${totalItems} item)</p>
            <p>Rp ${transaction.total_amount.toLocaleString('id-ID')}</p>
          </div>
          <hr style="border-top: 1px dashed black; margin: 8px 0;" />
          <div style="text-align: center; margin-top: 8px;">
            <p>${profile?.printer_footer_text || 'Terima Kasih Telah Berbelanja'}</p>
          </div>
        </div>
      `;

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      const iframeDoc = iframe.contentWindow?.document;
      if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(`<html><head><title>Cetak Struk</title><style>@page { size: auto; margin: 0mm; }</style></head><body>${receiptHtml}</body></html>`);
          iframeDoc.close();
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          document.body.removeChild(iframe);
      }
    } else {
      // --- LOGIKA CETAK GAMBAR (TIDAK BERUBAH) ---
      try {
        const dataUrl = await toPng(receiptRef.current, { skipFonts: true, backgroundColor: '#FFFFFF' });
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`<html><head><title>Cetak Struk</title></head><body style="margin: 0;"><img src="${dataUrl}" style="width: 100%;" /><script>window.onload = () => { window.print(); window.close(); }</script></body></html>`);
          printWindow.document.close();
        }
      } catch (err) {
        console.error('Gagal membuat gambar struk:', err);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader><DialogTitle>Preview Struk</DialogTitle></DialogHeader>
        
        <div ref={receiptRef}>
          {/* Preview di dalam dialog tetap menggunakan styling Tailwind */}
          <div className="bg-white p-4 text-black font-mono text-xs">
            <div className="text-center mb-2">
              <h2 className="font-bold text-sm">{profile?.store_name || 'Toko Anda'}</h2>
              <p>{profile?.address || 'Alamat Toko Anda'}</p>
            </div>
            <hr className="border-t border-dashed border-black my-2" />
            <div>
              <p>No: {transaction.nomor_faktur || `#${transaction.id}`}</p>
              <p>Kasir: {profile?.full_name || 'Kasir'}</p>
              <p>Tanggal: {new Date(transaction.created_at).toLocaleString('id-ID')}</p>
            </div>
            <hr className="border-t border-dashed border-black my-2" />
            <div>
              {transaction.items.map((item: { nama_produk: string; quantity: number; harga: number; }, index: number) => (
                <div key={index} className="grid grid-cols-12 gap-1 my-1">
                  <div className="col-span-12">{item.nama_produk}</div>
                  <div className="col-span-3">{item.quantity}x</div>
                  <div className="col-span-4 text-right">@{item.harga.toLocaleString('id-ID')}</div>
                  <div className="col-span-5 text-right">{(item.quantity * item.harga).toLocaleString('id-ID')}</div>
                </div>
              ))}
            </div>
            <hr className="border-t border-dashed border-black my-2" />
            <div className="grid grid-cols-2 gap-1 font-bold">
              <p>TOTAL ({totalItems} item)</p>
              <p className="text-right">Rp {transaction.total_amount.toLocaleString('id-ID')}</p>
            </div>
            <hr className="border-t border-dashed border-black my-2" />
            <div className="text-center mt-2">
              <p>{profile?.printer_footer_text || 'Terima Kasih Telah Berbelanja'}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">Tutup</Button>
          <Button onClick={handlePrint}>Cetak</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
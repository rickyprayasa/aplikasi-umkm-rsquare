// src/components/ReceiptPreviewDialog.tsx
"use client"

import { useRef } from 'react';
// Hapus semua import terkait react-to-print
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Receipt } from './Receipt';

interface ReceiptPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  profile: any;
}

export default function ReceiptPreviewDialog({ isOpen, onClose, transaction, profile }: ReceiptPreviewDialogProps) {
  // Kita hanya butuh ref, tanpa hook atau state printing tambahan
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pratinjau Struk</DialogTitle>
        </DialogHeader>
        <div className="border rounded-md p-2 max-h-96 overflow-y-auto">
          {/* Pastikan komponen Receipt memiliki className 'printable-receipt' */}
          <Receipt ref={receiptRef} transaction={transaction} profile={profile} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          {/* Tombol ini sekarang langsung memanggil window.print() */}
          <Button 
            onClick={() => window.print()} 
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Cetak Ulang
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
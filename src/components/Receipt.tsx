// src/components/Receipt.tsx
import React from 'react';

interface ReceiptProps {
  transaction: any;
  profile: any;
}

// Gunakan React.forwardRef agar library react-to-print bisa mengakses komponen ini
export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ transaction, profile }, ref) => {
    const customerName = transaction?.customer?.name;

  let subtotal = transaction?.total_amount;
  let discountAmount = 0;
  const discountPercent = profile?.loyalty_discount_percent;

  if (transaction?.metadata?.applied_discount) {
    // Hitung ulang subtotal dan diskon dari total akhir
    subtotal = transaction.total_amount / (1 - (discountPercent / 100));
    discountAmount = subtotal - transaction.total_amount;
  }

  return (
    <div ref={ref} className="printable-receipt p-4 bg-white text-black font-mono text-xs">
      {/* Header Struk */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold">{profile?.store_name || 'Toko Anda'}</h2>
        <p>{profile?.address || 'Alamat Toko Anda'}</p>
        <p>{profile?.phone_number || ''}</p>
      </div>
      <hr className="border-dashed border-black my-2"/>
      {/* Info Transaksi */}
      <div>
        <p>No: {transaction?.nomor_faktur || `#${transaction?.id}`}</p>
        <p>Tgl: {new Date(transaction?.created_at).toLocaleString('id-ID')}</p>
        <p>Kasir: {profile?.full_name || 'Admin'}</p>
        {customerName && <p>Pelanggan: {customerName}</p>}
      </div>
      <hr className="border-dashed border-black my-2"/>
      {/* Daftar Item */}
      <div>
        {transaction?.items?.map((item: any) => (
          <div key={item.product_id || item.nama_produk} className="grid grid-cols-12 gap-1 my-1">
            <div className="col-span-12">{item.nama_produk}</div>
            <div className="col-span-3 text-left">{item.quantity} x</div>
            <div className="col-span-4 text-left">@{item.harga?.toLocaleString('id-ID')}</div>
            <div className="col-span-5 text-right">{(item.quantity * item.harga)?.toLocaleString('id-ID')}</div>
          </div>
        ))}
      </div>
      <hr className="border-dashed border-black my-2"/>
      {/* Total */}
      <div className="space-y-1">
        {/* --- TAMPILKAN RINCIAN DISKON JIKA ADA --- */}
        {discountAmount > 0 ? (
          <>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Diskon ({discountPercent}%)</span>
              <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
            </div>
          </>
        ) : null}
        
        <div className="flex justify-between font-bold text-sm pt-1">
          <span>TOTAL</span>
          <span>Rp {transaction?.total_amount?.toLocaleString('id-ID')}</span>
        </div>
      </div>
      <hr className="border-dashed border-black my-2"/>
      {/* Footer Struk */}
      <div className="text-center mt-4">
        <p>{profile?.receipt_footer || 'Terima Kasih Telah Berbelanja!'}</p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';
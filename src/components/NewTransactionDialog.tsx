// src/components/NewTransactionDialog.tsx
"use client"

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Combobox } from "@/components/ui/combobox";
import { XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Receipt } from './Receipt';
import { supabase } from '@/lib/supabaseClient';

// Tipe Data
interface Product { id: number; nama_produk: string; harga: number; stok: number; }
interface CartItem extends Product { quantity: number; }
interface Customer { id: number; name: string; }
interface TransactionData { items: any[]; total_amount: number; customer_id: number | null; }

interface NewTransactionDialogProps {
  products: Product[];
  customers: Customer[];
  profile: any;
  onSave: (transactionData: TransactionData) => Promise<any>;
  onClose: () => void;
}

export default function NewTransactionDialog({ products, customers, profile, onSave, onClose }: NewTransactionDialogProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [transactionSuccessData, setTransactionSuccessData] = useState<any>(null);

  const [customerTransactionCount, setCustomerTransactionCount] = useState(0);
  const [discountApplied, setDiscountApplied] = useState(0);

  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCustomerCount = async () => {
      if (selectedCustomerId) {
        const { data, error } = await supabase
          .rpc('get_customer_transaction_count', { p_customer_id: Number(selectedCustomerId) });
        if (typeof data === 'number') {
          setCustomerTransactionCount(data);
        }
      } else {
        setCustomerTransactionCount(0);
      }
    };
    fetchCustomerCount();
  }, [selectedCustomerId]);
  // ----------------------------------------------------------------

  // --- useEffect Total Diperbarui dengan Logika Diskon ---
  useEffect(() => {
    const subTotal = cart.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
    
    // Cek apakah diskon berlaku
    const isLoyaltyEnabled = profile?.loyalty_enabled;
    const threshold = profile?.loyalty_threshold;
    // Diskon berlaku jika ini adalah transaksi ke-N (sesuai threshold)
    const isRewardTransaction = isLoyaltyEnabled && selectedCustomerId && threshold > 0 && (customerTransactionCount + 1) % threshold === 0;

    if (isRewardTransaction) {
      const discountAmount = subTotal * (profile.loyalty_discount_percent / 100);
      setDiscountApplied(discountAmount);
      setTotal(subTotal - discountAmount);
    } else {
      setDiscountApplied(0);
      setTotal(subTotal);
    }
  }, [cart, profile, customerTransactionCount, selectedCustomerId]);

  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
    setTotal(newTotal);
  }, [cart]);

  const handleProductSelect = (selectedProductId: string) => {
    const productId = Number(selectedProductId);
    const productToAdd = products.find(p => p.id === productId);
    if (productToAdd && !cart.find(item => item.id === productId)) {
      setCart(prevCart => [...prevCart, { ...productToAdd, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    if (quantity < 1) return;
    const newCart = cart.map(item => item.id === productId ? { ...item, quantity } : item);
    setCart(newCart);
  };

  const handleRemoveItem = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const handleReset = () => {
    setCart([]);
    setSelectedCustomerId(null);
  };

  const handleSave = async () => {
    const hasOverStock = cart.some(item => { const productInfo = products.find(p => p.id === item.id); return !productInfo || item.quantity > productInfo.stok; }); if (cart.length === 0 || hasOverStock) { alert("Pastikan keranjang tidak kosong dan stok mencukupi."); return; } setIsSaving(true); const transactionData: TransactionData = { total_amount: total, customer_id: selectedCustomerId ? Number(selectedCustomerId) : null, items: cart.map(item => ({ product_id: item.id, nama_produk: item.nama_produk, quantity: item.quantity, harga: item.harga })) }; const result = await onSave(transactionData); if (result) { setTransactionSuccessData(result); } setIsSaving(false);
  };
  
  const handleNewTransaction = () => {
    setCart([]); setSelectedCustomerId(null); setTransactionSuccessData(null);
  };

  if (transactionSuccessData) {
    return (
      <div className="grid gap-4 py-4">
        <h3 className="text-lg font-semibold text-center text-green-600">Transaksi Berhasil!</h3>
        <div className="border rounded-md p-2 max-h-80 overflow-y-auto">
           <Receipt ref={receiptRef} transaction={transactionSuccessData} profile={profile} />
        </div>
        <div className="flex justify-between mt-4">
          <Button onClick={handleNewTransaction} variant="outline">Transaksi Baru</Button>
          {/* Tombol ini sekarang hanya memanggil window.print() */}
          <Button onClick={() => window.print()} className="bg-orange-500 hover:bg-orange-600">Cetak Struk</Button>
        </div>
      </div>
    );
  }

  // Tampilan form transaksi
  const productOptions = products.map(p => ({ value: p.id.toString(), label: `${p.nama_produk} (Stok: ${p.stok})` }));
  const customerOptions = customers.map(c => ({ value: c.id.toString(), label: c.name }));

  return (
    <div className="grid gap-4 py-4">
      <div><Label>Pilih Pelanggan (Opsional)</Label><Combobox options={customerOptions} onSelect={setSelectedCustomerId} placeholder="Cari pelanggan..."/></div>
      <div><Label>Pilih Produk</Label><Combobox options={productOptions} onSelect={handleProductSelect} placeholder="Cari & pilih produk..."/></div>
      <div className="max-h-60 overflow-y-auto border rounded-md"><Table><TableHeader><TableRow><TableHead>Produk</TableHead><TableHead className="w-[100px]">Jumlah</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{cart.length === 0 ? (<TableRow><TableCell colSpan={3} className="text-center text-gray-500">Keranjang kosong</TableCell></TableRow>) : cart.map(item => { const productInfo = products.find(p => p.id === item.id); const isOverStock = productInfo && item.quantity > productInfo.stok; return (<TableRow key={item.id}><TableCell className="font-medium">{item.nama_produk}{isOverStock && <p className="text-xs text-red-500">Stok tidak cukup (sisa: {productInfo.stok})</p>}</TableCell><TableCell><Input type="number" min="1" value={item.quantity} onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)} className={`w-20 h-8 ${isOverStock ? 'border-red-500' : ''}`} /></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}><XCircle className="h-4 w-4 text-gray-500" /></Button></TableCell></TableRow>);})}</TableBody></Table></div>
            <div className="space-y-2 text-right mt-4 pr-4">
        {discountApplied > 0 && (
          <div className="text-sm">
            <span>Subtotal:</span>
            <span className="ml-2">Rp {(total + discountApplied).toLocaleString('id-ID')}</span>
          </div>
        )}
        {discountApplied > 0 && (
          <div className="text-sm text-green-600 font-semibold">
            <span>Diskon Loyalitas ({profile?.loyalty_discount_percent}%):</span>
            <span className="ml-2">- Rp {discountApplied.toLocaleString('id-ID')}</span>
          </div>
        )}
        <div className="flex justify-end items-center space-x-4">
          <span className="text-lg font-bold">Total:</span>
          <span className="text-xl font-black text-orange-600">Rp {total.toLocaleString('id-ID')}</span>
        </div>
      </div>
      <div className="flex justify-between mt-4"><Button onClick={onClose} variant="outline">Tutup</Button><div className="flex gap-2"><Button onClick={handleReset} variant="destructive">Reset</Button><Button onClick={handleSave} disabled={isSaving || cart.length === 0 || cart.some(item => { const productInfo = products.find(p => p.id === item.id); return !productInfo || item.quantity > productInfo.stok; })} className="bg-orange-500 hover:bg-orange-600">{isSaving ? 'Menyimpan...' : 'Simpan Transaksi'}</Button></div></div>
    </div>
  );
}
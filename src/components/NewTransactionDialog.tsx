
"use client";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { X, Plus, Minus, Loader2, Package, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabaseClient';
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from 'next/image';
import ReceiptPreviewDialog from "./ReceiptPreviewDialog";
import { cn } from "@/lib/utils";

interface Product { id: number; nama_produk: string; harga: number; stok: number; kategori: string; image_url?: string; }
interface CartItem extends Product { quantity: number; }
interface Customer { id: number; name: string; }
interface TransactionData { items: CartItem[]; total_amount: number; customer_id: number | null; }

interface NewTransactionDialogProps {
  products: Product[];
  customers: Customer[];
  profile: { id: string; store_name?: string; store_address?: string; store_phone?: string; loyalty_enabled?: boolean; loyalty_threshold?: number; loyalty_discount_percent?: number; };
  onSave: (transactionData: TransactionData) => Promise<TransactionData | null>;
  onClose: () => void;
}

const LOW_STOCK_THRESHOLD = 15;

export default function NewTransactionDialog({ products, customers, profile, onSave, onClose }: NewTransactionDialogProps) {
  // --- State Management ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [customerTransactionCount, setCustomerTransactionCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [transactionSuccessData, setTransactionSuccessData] = useState<TransactionData | null>(null);

  // --- Logika Kalkulasi ---
  const { subTotal, discountApplied, total } = useMemo(() => {
    const subTotal = cart.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
    const isLoyaltyEnabled = profile?.loyalty_enabled;
    const threshold = profile?.loyalty_threshold ?? 0;
    const discountPercent = profile?.loyalty_discount_percent ?? 0;
    const isRewardTransaction = isLoyaltyEnabled && selectedCustomerId && threshold > 0 && (customerTransactionCount + 1) % threshold === 0;

    if (isRewardTransaction) {
      const discountAmount = subTotal * (discountPercent / 100);
      return { subTotal, discountApplied: discountAmount, total: subTotal - discountAmount };
    }
    return { subTotal, discountApplied: 0, total: subTotal };
  }, [cart, profile, customerTransactionCount, selectedCustomerId]);

  // --- Data Fetching & Filtering ---
  useEffect(() => {
    const fetchCustomerCount = async () => {
      if (!supabase) return;
      if (selectedCustomerId) {
        const { data } = await supabase.rpc('get_customer_transaction_count', { p_customer_id: Number(selectedCustomerId) });
        if (typeof data === 'number') setCustomerTransactionCount(data);
      } else {
        setCustomerTransactionCount(0);
      }
    };
    fetchCustomerCount();
  }, [selectedCustomerId]);

  const uniqueCategories = useMemo(() => ["Semua", ...new Set(products.map((p: Product) => p.kategori).filter(Boolean))], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p: Product) => {
      const matchesCategory = activeCategory === "Semua" || p.kategori === activeCategory;
      const matchesSearch = p.nama_produk.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchTerm]);

  // --- Fungsi Aksi (Event Handlers) ---
  const handleCartAction = (product: Product, action: 'add' | 'increase' | 'decrease') => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id);
      if (existingItem) {
        let newQuantity = existingItem.quantity;
        if (action === 'increase' || action === 'add') newQuantity += 1;
        if (action === 'decrease') newQuantity -= 1;
        
        if (newQuantity === 0) return currentCart.filter(item => item.id !== product.id);
        if (newQuantity > product.stok) {
          alert(`Stok ${product.nama_produk} tidak mencukupi (sisa: ${product.stok})`);
          return currentCart;
        }
        return currentCart.map(item => item.id === product.id ? { ...item, quantity: newQuantity } : item);
      }
      if ((action === 'add' || action === 'increase') && product.stok > 0) {
        return [...currentCart, { ...product, quantity: 1 }];
      }
      return currentCart;
    });
  };

  const resetDialog = () => {
    setCart([]);
    setSelectedCustomerId(null);
    setTransactionSuccessData(null);
  };

  const handleSave = async () => {
    if (cart.length === 0) return alert("Keranjang tidak boleh kosong.");
    setIsSaving(true);
    const transactionData: TransactionData = {
      total_amount: total,
      customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
      items: cart.map(item => ({
        id: item.id,
        nama_produk: item.nama_produk,
        quantity: item.quantity,
        harga: item.harga,
        kategori: item.kategori,
        stok: item.stok
      }))
    };
    const result = await onSave(transactionData);
    if (result) {
        setTransactionSuccessData(result);
    }
    setIsSaving(false);
  };

  const customerOptions = customers.map((c: Customer) => ({ value: c.id.toString(), label: c.name }));

  // --- Tampilan setelah transaksi berhasil ---
  if (transactionSuccessData) {
    return (
      <div className="flex flex-col items-center justify-center p-4 h-[75vh]">
        <h3 className="text-2xl font-semibold text-center text-green-600 mb-4">Transaksi Berhasil!</h3>
        <p className="text-center text-muted-foreground mb-4">Silakan cetak struk jika diperlukan.</p>
        <div className="flex justify-center gap-4">
          <Button onClick={resetDialog} variant="outline" size="lg">Buat Transaksi Baru</Button>
          <Button onClick={onClose} size="lg">Tutup</Button>
        </div>
        {transactionSuccessData && (
          <ReceiptPreviewDialog 
            isOpen={true} 
            onClose={resetDialog}
            transaction={transactionSuccessData as any}
            profile={profile}
          />
        )}
      </div>
    );
  }

  // --- Tampilan utama form transaksi ---
  return (
    <div className="flex gap-6 h-[75vh] p-1">
      {/* Kolom Kiri: Pilihan Produk */}
      <div className="w-2/3 flex flex-col gap-4">
        {/* Header: Pencarian & Kategori (Ukurannya tetap) */}
        <div className="flex-shrink-0 space-y-4">
          <Input 
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {uniqueCategories.map(category => (
              <Button key={category} variant={activeCategory === category ? "default" : "outline"} onClick={() => setActiveCategory(category)}>
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Konten: Daftar Produk (Mengisi sisa ruang & bisa di-scroll) */}
        <ScrollArea className="flex-grow rounded-lg border min-h-0">
          <div className="flex flex-col">
            {filteredProducts.map(product => {
              const isLowStock = product.stok > 0 && product.stok < LOW_STOCK_THRESHOLD;
              return (
                <div 
                  key={product.id} 
                  onClick={() => handleCartAction(product, 'add')} 
                  className={cn("flex items-center gap-4 p-3 cursor-pointer border-b last:border-b-0 transition-all duration-200", "hover:bg-gray-100 hover:translate-x-1 hover:border-l-4 hover:border-blue-500", // Efek baru
                  isLowStock && "bg-amber-50 border-l-4 border-orange-400"
                )}
                >
                  <div className="relative w-14 h-14 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                    {product.image_url ? (<Image src={product.image_url} alt={product.nama_produk} fill className="object-cover" />) : (<div className="flex items-center justify-center h-full text-gray-300"><Package className="h-6 w-6"/></div>)}
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold">{product.nama_produk}</p>
                    <p className={cn("text-sm flex items-center gap-1.5", isLowStock ? "text-orange-600 font-semibold" : "text-muted-foreground")}>
                      {isLowStock && <AlertTriangle className="h-3 w-3" />} Stok: {product.stok}
                    </p>
                  </div>
                  <div className="px-2 font-bold text-orange-600">Rp {product.harga.toLocaleString('id-ID')}</div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Kolom Kanan: Keranjang */}
      <div className="w-1/3 flex flex-col bg-slate-50 p-4 rounded-lg">
        <div className="flex-shrink-0 space-y-2">
          <Label>Pelanggan (Opsional)</Label>
          <Combobox value={selectedCustomerId} options={customerOptions} onSelect={setSelectedCustomerId} placeholder="Pilih pelanggan..."/>
        </div>
        <hr className="my-4 flex-shrink-0"/>
        <h3 className="font-semibold mb-2 flex-shrink-0">Keranjang</h3>
        <ScrollArea className="flex-grow">
            {cart.length === 0 ? <p className="text-sm text-center text-muted-foreground py-10">Keranjang kosong</p> : 
            cart.map(item => (
                <div key={item.id} className="flex items-center gap-2 mb-2">
                    <div className="flex-grow"><p className="text-sm font-medium truncate">{item.nama_produk}</p><p className="text-xs text-muted-foreground">Rp {item.harga.toLocaleString('id-ID')}</p></div>
                    <div className="flex items-center gap-1 border rounded-md bg-white"><Button onClick={() => handleCartAction(item, 'decrease')} variant="ghost" size="sm" className="h-6 w-6 p-0"><Minus className="h-3 w-3"/></Button><span className="text-sm font-semibold w-6 text-center">{item.quantity}</span><Button onClick={() => handleCartAction(item, 'increase')} variant="ghost" size="sm" className="h-6 w-6 p-0"><Plus className="h-3 w-3"/></Button></div>
                </div>
            ))}
        </ScrollArea>
        <div className="mt-auto pt-4 space-y-2 flex-shrink-0">
            {discountApplied > 0 && <><div className="flex justify-between text-sm"><p>Subtotal:</p><p>Rp {subTotal.toLocaleString('id-ID')}</p></div><div className="flex justify-between text-sm text-green-600"><p>Diskon Loyalitas:</p><p>- Rp {discountApplied.toLocaleString('id-ID')}</p></div></>}
            <div className="flex justify-between items-center text-lg font-bold border-t pt-2"><p>Total:</p><p className="text-orange-600">Rp {total.toLocaleString('id-ID')}</p></div>
            <div className="grid grid-cols-2 gap-2 mt-4">
                <Button onClick={onClose} variant="outline">Tutup</Button>
                <Button onClick={handleSave} disabled={isSaving || cart.length === 0}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : "Simpan Transaksi"}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
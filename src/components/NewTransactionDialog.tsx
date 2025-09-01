// src/components/NewTransactionDialog.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Combobox } from "@/components/ui/combobox"
import { XCircle } from "lucide-react"
import { Label } from "@/components/ui/label"

// Definisikan tipe data di sini
interface Product {
  id: number
  nama_produk: string
  harga: number
  stok: number
}

interface CartItem extends Product {
  quantity: number
}

interface Customer {
  id: number;
  name: string;
}

// Tipe untuk data yang akan dikirim ke page.tsx
interface TransactionData {
  items: any[];
  total_amount: number;
  customer_id: number | null;
}

interface NewTransactionDialogProps {
  products: Product[]
  customers: Customer[]
  onSave: (transactionData: TransactionData) => Promise<void>
  onClose: () => void
}

// Hapus 'type Customer' yang duplikat

export default function NewTransactionDialog({ products, customers, onSave, onClose }: NewTransactionDialogProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + (item.harga * item.quantity), 0)
    setTotal(newTotal)
  }, [cart])

  const handleProductSelect = (selectedProductId: string) => {
    const productId = Number(selectedProductId)
    const productToAdd = products.find(p => p.id === productId)
    
    if (productToAdd && !cart.find(item => item.id === productId)) {
      const newCart = [...cart, { ...productToAdd, quantity: 1 }]
      setCart(newCart)
    }
  }

  const handleQuantityChange = (productId: number, quantity: number) => {
    if (quantity < 1) return
    const productInCart = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);
    if (product && quantity > product.stok) {
      // Optional: beri peringatan atau batasi jumlah
      return;
    }
    const newCart = cart.map(item => 
      item.id === productId ? { ...item, quantity: quantity } : item
    )
    setCart(newCart)
  }

  const handleRemoveItem = (productId: number) => {
    const newCart = cart.filter(item => item.id !== productId)
    setCart(newCart)
  }

  const handleReset = () => {
    setCart([])
    setSelectedCustomerId(null)
  }

  // --- FUNGSI handlesave YANG SUDAH DIPERBAIKI ---
  const handleSave = async () => {
    if (cart.length === 0 || cart.some(item => item.quantity > item.stok)) {
      alert("Pastikan keranjang tidak kosong dan stok mencukupi.");
      return;
    }
    setIsSaving(true)
    
    const transactionData: TransactionData = {
      total_amount: total,
      customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
      items: cart.map(item => ({ 
        product_id: item.id, 
        nama_produk: item.nama_produk, 
        quantity: item.quantity, 
        harga: item.harga 
      }))
    }
    
    await onSave(transactionData);
    setIsSaving(false);
  };
  // ---------------------------------------------

  const productOptions = products.map(p => ({ value: p.id.toString(), label: `${p.nama_produk} (Stok: ${p.stok})` }))
  const customerOptions = customers.map(c => ({ value: c.id.toString(), label: c.name }))

  return (
    <div className="grid gap-4 py-4">
      <div>
        <Label>Pilih Pelanggan (Opsional)</Label>
        <Combobox
          options={customerOptions}
          onSelect={(val) => setSelectedCustomerId(val)}
          placeholder="Cari pelanggan..."
        />
      </div>
      <div>
        <Label>Pilih Produk</Label>
        <Combobox
          options={productOptions}
          onSelect={handleProductSelect}
          placeholder="Cari & pilih produk..."
        />
      </div>      
      <div className="max-h-60 overflow-y-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead className="w-[100px]">Jumlah</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cart.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500">Keranjang kosong</TableCell>
              </TableRow>
            ) : cart.map(item => {
              const productInfo = products.find(p => p.id === item.id);
              const isOverStock = productInfo && item.quantity > productInfo.stok;
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.nama_produk}
                    {isOverStock && <p className="text-xs text-red-500">Stok tidak cukup (sisa: {productInfo.stok})</p>}
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.quantity} 
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                      className={`w-20 h-8 ${isOverStock ? 'border-red-500' : ''}`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                      <XCircle className="h-4 w-4 text-gray-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex justify-end items-center space-x-4 mt-4">
        <span className="text-lg font-bold">Total:</span>
        <span className="text-xl font-black text-orange-600">Rp {total.toLocaleString('id-ID')}</span>
      </div>
      
      <div className="flex justify-between mt-4">
        <Button onClick={onClose} variant="outline">Tutup</Button>
        <div className="flex gap-2">
          <Button onClick={handleReset} variant="destructive">Reset</Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || cart.length === 0 || cart.some(item => {
              const productInfo = products.find(p => p.id === item.id);
              return !productInfo || item.quantity > productInfo.stok;
            })} 
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Transaksi'}
          </Button>
        </div>
      </div>
    </div>
  )
}
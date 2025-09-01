// src/app/page.tsx
"use client"

import { useState, useEffect } from "react"
import type { Session } from '@supabase/supabase-js'
import { Calendar as CalendarIcon, DollarSign, Receipt, Star, Plus, User, Menu, X, Package, TrendingUp, FileText, BarChart3, ArrowUp, ArrowDown, Settings, Users, Bell, HelpCircle, Download, FileSpreadsheet, Printer, CreditCard, Shield, Gift, Tag, ArrowRight } from "lucide-react" // Tambahkan ArrowRight
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts"
import { supabase } from "@/lib/supabaseClient"
import Auth from "@/components/Auth"
import NewTransactionDialog from "@/components/NewTransactionDialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination"
import { Combobox } from "@/components/ui/combobox"
import { ThemeSwitcher } from "@/components/ThemeSwitcher" // Import baru
import { Globe } from "lucide-react" // Import baru
import { Store } from "lucide-react" // Import baru
import { LogOut } from "lucide-react" 
import * as XLSX from 'xlsx'; // <-- Impor untuk Excel
import jsPDF from 'jspdf';     // <-- Impor untuk PDF
import autoTable from 'jspdf-autotable';
import UserProfile from '@/components/UserProfile';
import StoreProfile from '@/components/StoreProfile';
import SecuritySettings from '@/components/SecuritySettings';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";



type TransactionData = {
  items: any[]; // Anda bisa buat tipe lebih spesifik jika mau
  total_amount: number;
  customer_id: number | null; // customer_id bisa berupa angka atau null
};

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null)
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("dashboard")
  const [activeSetting, setActiveSetting] = useState("main")
  
  const [products, setProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  const [transactions, setTransactions] = useState<any[]>([])
  const [dashboardStats, setDashboardStats] = useState({ revenue: 0, count: 0 })
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [productFormData, setProductFormData] = useState<any>({ id: null, nama_produk: '', harga: '', stok: '', kategori: '' })
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
  
  const [reportData, setReportData] = useState<any[]>([])
  const [reportSummary, setReportSummary] = useState({ revenue: 0, count: 0, average: 0 })
  const [loadingReport, setLoadingReport] = useState(false)
  const [reportTitle, setReportTitle] = useState("Ringkasan Penjualan")
  const [categoryList, setCategoryList] = useState<{ value: string; label: string }[]>([]); // <-- STATE DAFTAR KATEGORI
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // <-- STATE KATEGORI TERPILIH
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: new Date(new Date().setDate(new Date().getDate() - 7)), to: new Date() });

  const [bestSeller, setBestSeller] = useState({ name: '-', count: 0 })
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const ITEMS_PER_PAGE = 5;

  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [stockToAdd, setStockToAdd] = useState('');

  const [customers, setCustomers] = useState<any[]>([])
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isStockOutOpen, setIsStockOutOpen] = useState(false);
  const [stockChangeData, setStockChangeData] = useState({ product_id: '', quantity: '' });

  const [productSummary, setProductSummary] = useState<any>(null);
  const [loadingProductSummary, setLoadingProductSummary] = useState(true);

  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({ id: null, name: '', email: '', phone: '' });
  const [productReportData, setProductReportData] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  

  const MINIMUM_STOCK = 15;

  const getStatus = (stock: number) => {
    if (stock === 0) return { key: "habis", label: "Habis", className: "bg-red-100 text-red-800" };
    if (stock < MINIMUM_STOCK) return { key: "rendah", label: "Rendah", className: "bg-orange-100 text-orange-800" };
    return { key: "normal", label: "Normal", className: "bg-green-100 text-green-800" };
  };

  const [comparisonData, setComparisonData] = useState<any>(null);

  const [customerSummary, setCustomerSummary] = useState({ total_customers: 0, new_last_30_days: 0, inactive_customers: 0 });
  const [loadingSummary, setLoadingSummary] = useState(true);
  
  async function getCustomerSummary() {
    setLoadingSummary(true);
    // Pastikan Anda sudah membuat fungsi 'get_customer_summary' di Supabase
    const { data, error } = await supabase.rpc('get_customer_summary');
    if (data) {
      setCustomerSummary(data);
    } else {
      // Set nilai default jika tidak ada data untuk menghindari error
      setCustomerSummary({ total_customers: 0, new_last_30_days: 0, inactive_customers: 0 });
    }
    if (error) {
      console.error("Error fetching customer summary:", error);
    }
    setLoadingSummary(false);
  }


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session) })
    return () => subscription.unsubscribe()
  }, [])
 
async function getNotifications() {
  setLoadingNotifications(true);
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false }); // Tampilkan yang terbaru di atas

  if (data) setNotifications(data);
  if (error) console.error("Error fetching notifications:", error);
  setLoadingNotifications(false);
}

const handleMarkAsRead = async (id: number) => {
  // Optimistic UI update: langsung ubah di state
  setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));

  // Panggil fungsi Supabase di latar belakang
  await supabase.rpc('mark_notification_as_read', { notification_id: id });

  // Update jumlah notifikasi belum dibaca
  const { data } = await supabase.rpc('get_unread_notification_count');
  if (typeof data === 'number') {
    setUnreadCount(data);
  }
};
  
 useEffect(() => {
    const fetchInitialData = async () => {
      if (!session) return;

      const getUnreadCount = async () => {
        const { data, error } = await supabase.rpc('get_unread_notification_count');
        if (error) console.error("Error fetching unread count:", error);
        else if (typeof data === 'number') {
          setUnreadCount(data);
        }
      };

      await Promise.all([
        fetchDashboardData(currentPage), // Data untuk kartu & tabel dashboard
        getProducts(),                  // Data produk untuk dialog transaksi, dll.
        getCustomers(),                 // Data pelanggan untuk dialog transaksi, dll.
        getUnreadCount()                // Jumlah notifikasi untuk badge di sidebar
      ]);
    };

    fetchInitialData();
    
  }, [session, currentPage]);


  async function getProductSummary() {
    setLoadingProductSummary(true);
    const { data, error } = await supabase.rpc('get_product_summary');
    if(data) setProductSummary(data);
    if(error) console.error("Error fetching product summary: ", error);
    setLoadingProductSummary(false);
  }  

  async function fetchAllData() {
    if (!session) return;
    setLoadingDashboard(true);
    setLoadingProducts(true);
    setLoadingAnalytics(true);
    await Promise.all([ getProducts(), getProductSummary(), fetchDashboardData(currentPage), fetchAnalyticsData() ]);
  }

  useEffect(() => {
    const fetchAllData = async () => {
      if (!session) return;
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .single();
      if (profileData) setProfile(profileData);
       };
    fetchAllData();
  }, [session, currentPage]);
  
  async function fetchDashboardData(page = 1) {
    setLoadingDashboard(true)
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data: transData, error: transError, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (transData) {
      setTransactions(transData)
      if (count) setTotalTransactions(count)
      
    // Ambil SEMUA transaksi hari ini untuk statistik
    const today = new Date().toISOString().slice(0, 10);
    const { data: todayTransData } = await supabase
      .from('transactions')
      .select('total_amount, items')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lte('created_at', `${today}T23:59:59.999Z`)

    if (todayTransData) {
      const totalRevenue = todayTransData.reduce((sum, t) => sum + t.total_amount, 0)
      const transactionCount = todayTransData.length
      setDashboardStats({ revenue: totalRevenue, count: transactionCount })

     // --- LOGIKA PENGHITUNGAN PRODUK TERLARIS YANG BENAR ---
      const productCounts: { [key: string]: number } = {};
      todayTransData.forEach(t => {
        t.items.forEach((item: any) => {
          productCounts[item.nama_produk] = (productCounts[item.nama_produk] || 0) + item.quantity;
        });
      });
      
      const best = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];
      if (best) {
        setBestSeller({ name: best[0], count: best[1] });
      } else {
        setBestSeller({ name: '-', count: 0 });
      }
    }
  }
    const { data: compData } = await supabase.rpc('get_dashboard_comparison');
    if (compData) setComparisonData(compData);
    
    if (transError) console.error("Error fetching transactions: ", transError)
    setLoadingDashboard(false)
  }

  // Fungsi fetchAnalyticsData sekarang memanggil satu fungsi super
  async function fetchAnalyticsData() {
    setLoadingAnalytics(true);
    const { data, error } = await supabase.rpc('get_all_analytics');
    if (data) {
      setAnalyticsData(data);
    }
    if (error) console.error("Error fetching analytics data: ", error);
    setLoadingAnalytics(false);
  }


async function fetchTransactionsByDate(startDate: Date, endDate: Date, category: string | null = null) {
  setLoadingReport(true);
  // Panggil fungsi RPC yang baru dengan parameter yang sesuai
  const { data, error } = await supabase.rpc('get_filtered_transactions', {
    start_date_in: startDate.toISOString(),
    end_date_in: endDate.toISOString(),
    category_in: category
  });

  if (data) {
    setReportData(data);
    const totalRevenue = data.reduce((sum, t) => sum + t.total_amount, 0);
    const transactionCount = data.length;
    const averageTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;
    setReportSummary({ revenue: totalRevenue, count: transactionCount, average: averageTransaction });
  }

  if (error) {
    console.error("Error fetching report data: ", error);
  }
  
  setLoadingReport(false);
}


  async function getProducts() {
    setLoadingProducts(true)
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (data) setProducts(data)
    if (error) console.error('Error fetching products:', error)
    setLoadingProducts(false)
  }


 useEffect(() => {
    const fetchDataForSection = async () => {
      if (activeSection === 'customers') {
        getCustomerSummary();
        getCustomers();
      } else if (activeSection === 'products') {
        getProductSummary();
      } else if (activeSection === 'reports') {
        const { data } = await supabase.rpc('get_unique_categories');
        if (data) {
          const formattedCategories = data.map((cat: any) => ({ value: cat.kategori, label: cat.kategori }));
          setCategoryList(formattedCategories);
        }
      } else if (activeSection === 'notifications') {
        getNotifications();
      }
    };
    fetchDataForSection();
  }, [activeSection]);

async function getCustomers() {
  // Pastikan fungsi ini memanggil RPC yang menghitung status
  const { data, error } = await supabase.rpc('get_customers_with_status'); 
  if(data) setCustomers(data);
  if(error) console.error("Error fetching customers: ", error);
}


  useEffect(() => {
    setIsMounted(true);
    if(session) {
      getProducts();
      getCustomers(); // Panggil data pelanggan
      fetchDashboardData(currentPage);
      fetchAnalyticsData();
      refreshProfileData();
    }
  }, [session, currentPage])

  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCustomerFormData(prev => ({ ...prev, [id]: value }));
  };

   const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return alert("Anda harus login.");

    const customerData = {
      name: customerFormData.name,
      email: customerFormData.email,
      phone: customerFormData.phone,
      user_id: session.user.id
    };

    const { error } = await supabase.from('customers').insert([customerData]);

    if (error) {
      alert('Gagal menyimpan pelanggan: ' + error.message);
    } else {
      alert('Pelanggan berhasil ditambahkan!');
      setIsCustomerDialogOpen(false);
      setCustomerFormData({ id: null, name: '', email: '', phone: '' });
      getCustomers(); 
      getCustomerSummary();
    }
  };

  const handleAddCustomerClick = () => {
    setCustomerFormData({ id: null, name: '', email: '', phone: '' });
    setIsCustomerDialogOpen(true);
  }; 

  const handleAddStockClick = (product: any) => {
    setSelectedProduct(product);
    setStockToAdd('');
    setIsAddStockOpen(true);
  };  

  const handleSaveAddedStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !stockToAdd || Number(stockToAdd) <= 0) {
      alert("Jumlah stok tidak valid.");
      return;
    }
    const { error } = await supabase.rpc('add_stock', {
      product_id_to_update: selectedProduct.id,
      quantity_to_add: Number(stockToAdd)
    });
    if (error) {
      alert("Gagal menambah stok: " + error.message);
    } else {
      alert("Stok berhasil ditambahkan!");
      setIsAddStockOpen(false);
      getProducts();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setProductFormData((prev: any) => ({ ...prev, [id]: value }))
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return alert("Anda harus login.");
    
    const { id, nama_produk, harga, stok, kategori } = productFormData
    const productData = { nama_produk, harga: Number(harga), stok: Number(stok), user_id: session.user.id, kategori }
    
    let error;
    if (id) {
      ({ error } = await supabase.from('products').update(productData).eq('id', id))
    } else {
      ({ error } = await supabase.from('products').insert([productData]))
    }

  if (error) {
    alert('Error: ' + error.message);
  } else {
    alert(`Produk berhasil ${id ? 'diperbarui' : 'ditambahkan'}!`);
    setIsDialogOpen(false);
    getProducts();
    getProductSummary(); // Panggil ini agar ringkasan ter-update
  }
};
  
const handleEditClick = (product: any) => {
  setProductFormData({
    ...product, // Salin semua data produk yang ada
    kategori: product.kategori || '', // <-- TAMBAHKAN BARIS INI
  });
  setIsDialogOpen(true);
};
  
  const handleAddClick = () => {
    setProductFormData({ id: null, nama_produk: '', harga: '', stok: '', kategori: '' })
    setIsDialogOpen(true)
  }

  const handleDeleteProduct = async (productId: number) => {
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Produk berhasil dihapus.')
      getProducts()
    }
  }

const handleExportExcel = () => {
    const isProductReport = reportTitle.includes('Produk');
    const data = isProductReport ? productReportData : reportData;

    if (data.length === 0) {
        alert("Tidak ada data untuk diekspor!");
        return;
    }

    // Buat Workbook baru
    const workbook = XLSX.utils.book_new();

    // --- SHEET 1: RINGKASAN ---
    // (Hanya dibuat jika ini adalah laporan transaksi)
    if (!isProductReport) {
        const summaryData = [
            { A: 'Nama Toko', B: profile?.store_name || '-' }, // <-- TAMBAHKAN INFO TOKO
            { A: 'Alamat', B: profile?.address || '-' },
            { A: 'Laporan', B: reportTitle },
            {}, // Baris kosong
            { A: 'Total Pendapatan', B: `Rp ${reportSummary.revenue.toLocaleString('id-ID')}` },
            { A: 'Total Transaksi', B: reportSummary.count },
            { A: 'Rata-rata per Transaksi', B: `Rp ${Math.round(reportSummary.average).toLocaleString('id-ID')}` },
        ];
        const summarySheet = XLSX.utils.json_to_sheet(summaryData, { skipHeader: true });
        summarySheet["!cols"] = [{ wch: 25 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan");
    }

    // --- SHEET 2: DETAIL TRANSAKSI / PRODUK ---
    const formattedData = data.map(item => {
        if (isProductReport) {
            return {
                'Nama Produk': item.nama_produk,
                'Jumlah Terjual': item.total_quantity,
                'Total Pendapatan (Rp)': item.total_revenue
            };
        } else {
            return {
                'Waktu': new Date(item.created_at).toLocaleString('id-ID', {
                    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                }),
                'ID Transaksi': item.id,
                'Detail Item': item.items.map((i: any) => `${i.nama_produk} (x${i.quantity})`).join(', '),
                'Total (Rp)': item.total_amount
            };
        }
    });
    const detailSheet = XLSX.utils.json_to_sheet(formattedData);
    detailSheet["!cols"] = [ { wch: 25 }, { wch: 15 }, { wch: 50 }, { wch: 20 } ];
    
    // Tentukan nama sheet detail
    const detailSheetName = isProductReport ? "Laporan Produk" : "Detail Transaksi";
    XLSX.utils.book_append_sheet(workbook, detailSheet, detailSheetName);

    // Download file
    XLSX.writeFile(workbook, `${reportTitle.replace(/ /g, "_")}.xlsx`);
};

const handleExportPdf = () => {
  const isProductReport = reportTitle.includes('Produk');
  const data = isProductReport ? productReportData : reportData;

  if (data.length === 0) {
    alert("Tidak ada data untuk diekspor!");
    return;
  }
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- Bagian Judul ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(profile?.store_name || "Laporan KasirKu", pageWidth / 2, 22, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(profile?.address || "Laporan Bisnis", pageWidth / 2, 29, { align: "center" });

  doc.setFontSize(12);
  doc.text(reportTitle, pageWidth / 2, 38, { align: "center" });

  // --- Bagian Ringkasan (Hanya untuk Laporan Transaksi) ---
  if (!isProductReport) {
    doc.setFontSize(11);
    doc.text(`Total Pendapatan:`, 14, 45);
    doc.text(`Total Transaksi:`, 14, 52);
    doc.text(`Rata-rata per Transaksi:`, 14, 59);

    doc.setFont("helvetica", "bold");
    doc.text(`Rp ${reportSummary.revenue.toLocaleString('id-ID')}`, 65, 45);
    doc.text(`${reportSummary.count}`, 65, 52);
    doc.text(`Rp ${Math.round(reportSummary.average).toLocaleString('id-ID')}`, 65, 59);
  }

  // --- Bagian Tabel Data ---
  let head, body;
  if (isProductReport) {
    head = [['Nama Produk', 'Jumlah Terjual', 'Total Pendapatan']];
    body = data.map(item => [
      item.nama_produk,
      item.total_quantity,
      `Rp ${item.total_revenue.toLocaleString('id-ID')}`
    ]);
  } else {
    head = [['Waktu', 'ID Transaksi', 'Detail Item', 'Total']];
    body = data.map(t => [
      new Date(t.created_at).toLocaleString('id-ID', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}),
      `#${t.nomor_faktur}`,
      t.items.map((item: any) => `${item.nama_produk} (x${item.quantity})`).join(', '),
      `Rp ${t.total_amount.toLocaleString('id-ID')}`
    ]);
  }

  autoTable(doc, {
    startY: isProductReport ? 40 : 70, // Beri ruang lebih jika ada ringkasan
    head: head,
    body: body,
    theme: 'grid',
    headStyles: { fillColor: [249, 115, 22] }, // Header Oranye
    styles: { fontSize: 9 },
    // --- Bagian Footer ---
    didDrawPage: (data) => {
      doc.setFontSize(10);
      doc.setTextColor(150);
      const pageCount = doc.internal.pages.length;
      const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric'});
      
      doc.text(
        `Laporan diekspor pada ${today}`,
        data.settings.margin.left,
        doc.internal.pageSize.getHeight() - 10
      );
      doc.text(
        `Halaman ${data.pageNumber} dari ${pageCount - 1}`,
        pageWidth - data.settings.margin.right,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      );
    }
  });

  doc.save(`${reportTitle.replace(/ /g, "_")}.pdf`);
};

  const refreshProfileData = async () => {
    if (!session) return;
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .single();
    if (profileData) setProfile(profileData);
  };

const handleSaveTransaction = async (transactionData: TransactionData) => {
  if (!session) return alert("Sesi tidak ditemukan.");

  // Panggil fungsi RPC dengan nama key yang sudah disamakan
  const { error } = await supabase.rpc('create_transaction_and_update_stock', {
    total_amount_in: transactionData.total_amount, // <-- Ganti nama
    items_in: transactionData.items,               // <-- Ganti nama
    owner_id_in: session.user.id,                  // <-- Ganti nama
    customer_id_in: transactionData.customer_id
  });

  if (error) {
    alert("Gagal menyimpan transaksi: " + error.message);
  } else {
    alert("Transaksi berhasil disimpan dan stok telah diupdate!");
    setIsTransactionDialogOpen(false);
    fetchDashboardData(); 
    getProducts();
    refreshProfileData(); 
    // Panggil fetch notif count setelah transaksi berhasil
    const { data } = await supabase.rpc('get_unread_notification_count');
    if (typeof data === 'number') {
      setUnreadCount(data);
    }
  }
};


  const handleStockChange = async (type: 'in' | 'out') => {
    if (!stockChangeData.product_id || !stockChangeData.quantity) return alert("Produk dan jumlah harus dipilih.");
    
    const functionName = type === 'in' ? 'stock_in' : 'stock_out';
    const params = {
      product_id_to_update: Number(stockChangeData.product_id),
      [type === 'in' ? 'quantity_to_add' : 'quantity_to_subtract']: Number(stockChangeData.quantity)
    };

    const { error } = await supabase.rpc(functionName, params);

    if (error) {
      alert(`Gagal memproses stok: ${error.message}`);
    } else {
      alert(`Stok berhasil diupdate!`);
      type === 'in' ? setIsStockInOpen(false) : setIsStockOutOpen(false);
      setStockChangeData({ product_id: '', quantity: '' });
      getProducts();
    }
  };


  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 }, { id: "inventory", label: "Stok Barang", icon: Package }, { id: "products", label: "Kelola Produk", icon: Tag }, { id: "customers", label: "Pelanggan", icon: Users }, { id: "reports", label: "Laporan", icon: FileText }, { id: "analytics", label: "Analitik", icon: TrendingUp }, { id: "notifications", label: "Notifikasi", icon: Bell }, { id: "settings", label: "Pengaturan", icon: Settings }, { id: "help", label: "Bantuan", icon: HelpCircle },
  ]
  
const renderDashboard = () => {
  const dynamicStatsData = [
    { 
      key: "revenue",
      title: "Pendapatan Hari Ini", 
      value: loadingDashboard ? '...' : `Rp ${dashboardStats.revenue.toLocaleString('id-ID')}`, 
      icon: DollarSign, 
      bgColor: "bg-orange-500", 
      iconColor: "text-white",
      comparisonValue: loadingDashboard ? '...' : `Rp ${(comparisonData?.yesterday_revenue || 0).toLocaleString('id-ID')}`,
      isUp: dashboardStats.revenue > (comparisonData?.yesterday_revenue || 0),
      comparisonText: "dari kemarin"
    },
    { 
      key: "transactions",
      title: "Transaksi Sukses", 
      value: loadingDashboard ? '...' : dashboardStats.count.toString(), 
      icon: Receipt, 
      bgColor: "bg-gray-500", 
      iconColor: "text-white",
      comparisonValue: loadingDashboard ? '...' : (comparisonData?.yesterday_count || 0),
      isUp: dashboardStats.count > (comparisonData?.yesterday_count || 0),
      comparisonText: "transaksi kemarin"
    },
    { 
      key: "bestseller",
      title: "Produk Terlaris Hari Ini", 
      value: loadingDashboard ? '...' : bestSeller.name, 
      icon: Star, 
      bgColor: "bg-black", 
      iconColor: "text-white",
      comparisonValue: loadingDashboard ? '...' : (comparisonData?.yesterday_bestseller?.name || '-'),
      isUp: null, // No up/down for bestseller
      comparisonText: "kemarin"
    },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* --- KARTU-KARTU DENGAN GAYA YANG DISEMPURNAKAN --- */}
        <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-gray-800 uppercase">Pendapatan Hari Ini</CardTitle>
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-black mb-2">
              {loadingDashboard ? '...' : `Rp ${dashboardStats.revenue.toLocaleString('id-ID')}`}
            </div>
            <div className="flex items-center text-sm font-semibold">
              {loadingDashboard ? <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse"></div> : (
                dashboardStats.revenue > (comparisonData?.yesterday_revenue || 0) ? 
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md flex items-center"><ArrowUp className="h-4 w-4 mr-1" /> Rp {(comparisonData?.yesterday_revenue || 0).toLocaleString('id-ID')}</span> : 
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md flex items-center"><ArrowDown className="h-4 w-4 mr-1" /> Rp {(comparisonData?.yesterday_revenue || 0).toLocaleString('id-ID')}</span>
              )}
              <span className="text-gray-500 font-normal ml-2">dari kemarin</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold text-gray-800 uppercase">Transaksi Sukses</CardTitle>
                <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Receipt className="h-6 w-6 text-white" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-black text-black mb-2">{loadingDashboard ? '...' : dashboardStats.count}</div>
                <div className="flex items-center text-sm font-semibold">
                {loadingDashboard ? <div className="h-6 w-24 bg-gray-200 rounded-md animate-pulse"></div> : (dashboardStats.count > (comparisonData?.yesterday_count || 0) ? 
                    <span className="px-3 py-2 bg-green-100 text-green-800 rounded-md flex items-center"><ArrowUp className="h-4 w-4 mr-1" /> {comparisonData?.yesterday_count || 0}</span> : 
                    <span className="px-3 py-2 bg-red-100 text-red-800 rounded-md flex items-center"><ArrowDown className="h-4 w-4 mr-1" /> {comparisonData?.yesterday_count || 0}</span>
                )}
                <span className="text-gray-500 font-normal ml-2">transaksi kemarin</span>
                </div>
            </CardContent>
        </Card>

        <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-gray-800 uppercase">Produk Terlaris Hari Ini</CardTitle>
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Star className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-black truncate mb-2">
              {loadingDashboard ? '...' : bestSeller.name}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="px-3 py-2 bg-orange-100 text-orange-800 rounded-full text-m font-bold">
                {loadingDashboard ? '...' : `${bestSeller.count} terjual`}
              </span>
              <div className="text-right">
                <p className="text-gray-500 font-normal">Kemarin:</p>
                <p className="font-semibold text-gray-700">
                  {loadingDashboard ? '...' : (comparisonData?.yesterday_bestseller?.name || '-')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-black mb-6 tracking-tight">Aksi Cepat</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black hover:bg-gray-800 text-white px-8 py-6 text-lg font-bold rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-3xl hover:-translate-y-2" size="lg"><Plus className="w-5 h-5 mr-3" />Transaksi Baru</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl bg-white"><DialogHeader><DialogTitle className="text-black">Buat Transaksi Baru</DialogTitle><DialogDescription>Pilih produk dan tentukan jumlahnya.</DialogDescription></DialogHeader><NewTransactionDialog products={products} customers={customers} onSave={handleSaveTransaction} onClose={() => setIsTransactionDialogOpen(false)} /></DialogContent>
          </Dialog>
          <Button onClick={() => setActiveSection('inventory')} variant="outline" className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 px-8 py-6 text-lg font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 bg-transparent" size="lg"><Package className="w-5 h-5 mr-3" />Kelola Stok</Button>
          <Button onClick={() => setActiveSection('reports')} variant="outline" className="border-2 border-gray-500 text-gray-600 hover:bg-gray-50 px-8 py-6 text-lg font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 bg-transparent" size="lg"><FileText className="w-5 h-5 mr-3" />Lihat Laporan</Button>
          <Button onClick={() => setActiveSection('analytics')} variant="outline" className="border-2 border-black text-black hover:bg-gray-50 px-8 py-6 text-lg font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 bg-transparent" size="lg"><TrendingUp className="w-5 h-5 mr-3" />Analitik</Button>
        </div>
      </div>

    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl relative overflow-hidden">
      <div className="p-8">
        <h3 className="text-2xl font-bold text-black tracking-tight mb-6">Aktivitas Terbaru</h3>
        <div className="overflow-y-auto max-h-[340px] relative">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead>Waktu</TableHead>
                <TableHead>ID Transaksi</TableHead>
                <TableHead>Detail Item</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
<TableBody>
  {/* --- UBAH KONDISI DI SINI --- */}
  {!isMounted || loadingDashboard ? (
    <TableRow key="loading-row">
      <TableCell colSpan={4} className="text-center text-gray-500 py-6">Memuat transaksi...</TableCell>
    </TableRow>
  ) : transactions.length === 0 ? (
    <TableRow key="empty-row">
      <TableCell colSpan={4} className="text-center text-gray-500 py-6">Belum ada transaksi hari ini.</TableCell>
    </TableRow>
  ) : (
    transactions.map((t) => (
      <TableRow key={t.id} className="border-gray-200">
        {/* ... sisa kode tidak berubah ... */}
        <TableCell>
          {new Date(t.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </TableCell>
        <TableCell>{t.nomor_faktur || `#${t.id}`}</TableCell>
        <TableCell>{t.items.map((item: any) => `${item.nama_produk} (x${item.quantity})`).join(', ')}</TableCell>
        <TableCell className="text-right font-bold">Rp {t.total_amount.toLocaleString('id-ID')}</TableCell>
      </TableRow>
    ))
  )}
</TableBody>
          </Table>
        </div>
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }} />
                </PaginationItem>
                
                <PaginationItem><PaginationLink href="#">{currentPage}</PaginationLink></PaginationItem>
                
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (currentPage < Math.ceil(totalTransactions / ITEMS_PER_PAGE)) setCurrentPage(p => p + 1); }} />
                </PaginationItem>
              </PaginationContent>
             </Pagination>
          </div>        
        </div>
      </div>
    </div> // <-- Ini adalah tag </div> penutup yang hilang
  );
};

const renderInventory = () => {

  
  const productOptions = products.map(p => ({ value: p.id.toString(), label: p.nama_produk }));
  return (
    <>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-black tracking-tight">Manajemen Stok Barang</h3>
          <div className="flex gap-4">
            <Dialog open={isStockInOpen} onOpenChange={setIsStockInOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"><ArrowUp className="w-4 h-4 mr-2" />Barang Masuk</Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader><DialogTitle>Catat Barang Masuk</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <Combobox options={productOptions} onSelect={(val) => setStockChangeData(prev => ({...prev, product_id: val}))} placeholder="Pilih Produk..." />
                  <Input type="number" placeholder="Jumlah" value={stockChangeData.quantity} onChange={(e) => setStockChangeData(prev => ({...prev, quantity: e.target.value}))} />
                </div>
                <DialogFooter>
                  <Button onClick={() => handleStockChange('in')} className="bg-green-600 hover:bg-green-700">Simpan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isStockOutOpen} onOpenChange={setIsStockOutOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"><ArrowDown className="w-4 h-4 mr-2" />Barang Keluar</Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader><DialogTitle>Catat Barang Keluar</DialogTitle></DialogHeader>
                 <div className="grid gap-4 py-4">
                  <Combobox options={productOptions} onSelect={(val) => setStockChangeData(prev => ({...prev, product_id: val}))} placeholder="Pilih Produk..." />
                  <Input type="number" placeholder="Jumlah" value={stockChangeData.quantity} onChange={(e) => setStockChangeData(prev => ({...prev, quantity: e.target.value}))} />
                </div>
                <DialogFooter>
                  <Button onClick={() => handleStockChange('out')} className="bg-red-600 hover:bg-red-700">Simpan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>      
        {/* Kartu Summary Stok */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { title: "Total Produk", value: loadingProducts ? '...' : products.length, note: "Item dalam stok", color: "gray" },
            { title: "Stok Rendah", value: loadingProducts ? '...' : products.filter(p => p.stok < 15 && p.stok > 0).length, note: "Perlu restok", color: "orange" },
            { title: "Stok Habis", value: loadingProducts ? '...' : products.filter(p => p.stok === 0).length, note: "Segera restok", color: "red" }
          ].map(card => (
            <Card key={card.title} className={`bg-white border-2 border-${card.color}-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}>
              <CardHeader><CardTitle className={`text-sm font-bold text-${card.color}-800 uppercase tracking-wider`}>{card.title}</CardTitle></CardHeader>
              <CardContent><div className={`text-3xl font-black text-${card.color}-600`}>{card.value}</div><p className={`text-${card.color}-600`}>{card.note}</p></CardContent>
            </Card>
          ))}
        </div>

        {/* Tabel Produk */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl">
          <div className="p-8">
            <h4 className="text-xl font-bold text-black mb-6">Status Stok Produk</h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead>Produk</TableHead>
                    <TableHead>Stok Saat Ini</TableHead>
                    <TableHead>Stok Minimum</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingProducts ? <TableRow><TableCell colSpan={5}>Memuat data...</TableCell></TableRow> :
                    products.map((item) => {
                      const status = getStatus(item.stok);
                      return (
                        <TableRow key={item.id} className="border-gray-200 hover:bg-gray-50">
                          <TableCell className="font-semibold">{item.nama_produk}</TableCell>
                          <TableCell className={`${status.key !== 'normal' ? 'font-bold text-red-600' : ''}`}>{item.stok}</TableCell>
                          <TableCell>{MINIMUM_STOCK}</TableCell>
                          <TableCell><span className={`px-3 py-1 rounded-full text-sm font-bold ${status.className}`}>{status.label}</span></TableCell>

                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Tambah Stok untuk: {selectedProduct?.nama_produk}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAddedStock}>
            <div className="grid gap-4 py-4">
              <Input type="number" value={stockToAdd} onChange={(e) => setStockToAdd(e.target.value)} required autoFocus />
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-green-600">Simpan Stok</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

const renderProducts = () => (
  <>
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-black tracking-tight">Kelola Produk</h3>
        <Button onClick={handleAddClick} className="bg-black hover:bg-gray-800 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

        {/* --- KARTU SUMMARY SEKARANG DINAMIS SEMUA --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-2 border-gray-200 shadow-xl"><CardHeader><CardTitle className="text-sm font-bold text-gray-800 uppercase">Total Produk</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-black">{loadingProductSummary ? '...' : productSummary?.total_products}</div><p className="text-gray-600">Produk aktif</p></CardContent></Card>
          <Card className="bg-white border-2 border-gray-200 shadow-xl"><CardHeader><CardTitle className="text-sm font-bold text-gray-800 uppercase">Kategori</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-orange-600">{loadingProductSummary ? '...' : productSummary?.distinct_categories}</div><p className="text-gray-600">Kategori produk</p></CardContent></Card>
          <Card className="bg-white border-2 border-gray-200 shadow-xl"><CardHeader><CardTitle className="text-sm font-bold text-gray-800 uppercase">Produk Baru</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-black">{loadingProductSummary ? '...' : productSummary?.new_this_month}</div><p className="text-gray-600">Bulan ini</p></CardContent></Card>
          <Card className="bg-white border-2 border-gray-200 shadow-xl"><CardHeader><CardTitle className="text-sm font-bold text-gray-800 uppercase">Rata-rata Harga</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-black">{loadingProductSummary ? '...' : `Rp ${Math.round(productSummary?.avg_price || 0).toLocaleString('id-ID')}`}</div><p className="text-gray-600">Per produk</p></CardContent></Card>
        </div>
      {/* ^^^ ------------------------------------- ^^^ */}

      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl">
        <div className="p-8">
          <h4 className="text-xl font-bold text-black mb-6">Daftar Produk</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingProducts ? <p>Memuat produk...</p> : products.map((product) => (
              <Card key={product.id} className="border border-gray-200 hover:shadow-lg transition-all duration-200 flex flex-col">
                <CardContent className="p-4 flex flex-col flex-grow">
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="font-bold text-black">{product.nama_produk}</h5>
                      <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Stok: {product.stok}</span>
                    </div>
                    <p className="text-lg font-bold text-orange-600 mb-4">
                      Rp {product.harga.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="flex justify-end items-center space-x-2 mt-auto">
                    {/* --- TOMBOL +STOK SELALU MUNCUL --- */}
                    <Button onClick={() => handleAddStockClick(product)} size="sm" className="bg-green-600 hover:bg-green-700 text-white font-bold">
                      <Plus className="w-4 h-4 mr-1" /> Stok
                    </Button>
                    <Button onClick={() => handleEditClick(product)} variant="outline" size="sm">Edit</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">Hapus</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white">
                        <AlertDialogHeader><AlertDialogTitle className="text-black">Apakah Anda Yakin?</AlertDialogTitle><AlertDialogDescription>Tindakan ini akan menghapus produk <span className="font-bold">{product.nama_produk}</span> secara permanen.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-600 hover:bg-red-700" 
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Ya, Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  </>
)
  

  const renderCustomers = () => (
   <>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-black tracking-tight">Manajemen Pelanggan</h3>
          <Button onClick={handleAddCustomerClick} className="bg-black hover:bg-gray-800 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pelanggan
          </Button>
        </div>
        
       {/* VVV --- KARTU SUMMARY DENGAN TAMBAHAN KARTU BARU --- VVV */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border-2 border-gray-200 shadow-xl">
            <CardHeader><CardTitle className="text-sm font-bold text-gray-800 uppercase">Total Pelanggan</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-black text-black">{loadingSummary ? '...' : customerSummary.total_customers}</div><p className="text-green-600 font-medium">pelanggan terdaftar</p></CardContent>
          </Card>
          <Card className="bg-white border-2 border-gray-200 shadow-xl">
            <CardHeader><CardTitle className="text-sm font-bold text-gray-800 uppercase">Pelanggan Baru</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-black text-orange-600">{loadingSummary ? '...' : customerSummary.new_last_30_days}</div><p className="text-gray-600">30 hari terakhir</p></CardContent>
          </Card>
          <Card className="bg-white border-2 border-red-200 shadow-xl">
            <CardHeader><CardTitle className="text-sm font-bold text-red-800 uppercase">Pelanggan Tidak Aktif</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-black text-red-600">{loadingSummary ? '...' : customerSummary.inactive_customers}</div><p className="text-red-600">Perlu dihubungi</p></CardContent>
          </Card>
        </div>
        {/* ^^^ --------------------------------------------- ^^^ */}
        {/* VVV --- TABEL DAFTAR PELANGGAN BARU --- VVV */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl">
          <div className="p-8">
            <h4 className="text-xl font-bold text-black mb-6">Daftar Pelanggan</h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-gray-500 py-8">Belum ada pelanggan.</TableCell></TableRow> :
                    customers.map((customer) => (
                      <TableRow key={customer.id} className="border-gray-200 hover:bg-gray-50">
                        <TableCell className="font-semibold">{customer.name}</TableCell>
                        <TableCell>{customer.email || '-'}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                        <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${customer.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{customer.status}</span></TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
    </div>
       {/* --- DIALOG UNTUK TAMBAH PELANGGAN --- */}
      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader><DialogTitle>Tambah Pelanggan Baru</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveCustomer}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Pelanggan</Label>
                <Input id="name" value={customerFormData.name} onChange={handleCustomerInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Opsional)</Label>
                <Input id="email" type="email" value={customerFormData.email} onChange={handleCustomerInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telepon (Opsional)</Label>
                <Input id="phone" value={customerFormData.phone} onChange={handleCustomerInputChange} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">Simpan Pelanggan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )

const renderReports = () => {
  // FUNGSI INI DILENGKAPI AGAR TOMBOL SHORTCUT BERFUNGSI
  const handleShortcutClick = (period: 'week' | 'month') => {
    const end = new Date();
    const start = new Date();
    let title = "";

    if (period === 'week') {
      start.setDate(end.getDate() - 7);
      title = `Ringkasan 7 Hari Terakhir`;
    } else { // month
      start.setDate(1); // Set ke tanggal 1 bulan ini
      title = `Ringkasan Bulan Ini`;
    }
    
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);

    setDateRange({ from: start, to: end });
    setReportTitle(title);
    fetchTransactionsByDate(start, end);
    // Kosongkan data laporan produk jika ada
    setProductReportData([]); 
  };
  
  // FUNGSI INI DIPINDAHKAN KE SCOPE YANG BENAR (DI LUAR handleShortcutClick)
  const handleProductReportClick = async () => {
    if (!dateRange?.from || !dateRange?.to) return alert("Pilih rentang tanggal dulu.");
    
    setReportTitle(`Laporan Produk dari ${format(dateRange.from, "d MMM")} - ${format(dateRange.to, "d MMM")}`);
    
    // Kosongkan data laporan transaksi agar tidak tumpang tindih
    setReportData([]);
    setReportSummary({ revenue: 0, count: 0, average: 0 });

    setLoadingReport(true); // Tambahkan loading state
    const { data, error } = await supabase.rpc('get_product_report', {
        start_date: dateRange.from.toISOString(),
        end_date: dateRange.to.toISOString()
    });

    if (data) setProductReportData(data);
    if (error) alert("Gagal mengambil laporan produk: " + error.message);
    setLoadingReport(false); // Hentikan loading state
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-black tracking-tight">Laporan Bisnis</h3>
        <div className="flex gap-3">
          <Button 
            onClick={handleExportExcel} 
            className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button 
            onClick={handleExportPdf} 
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* --- KARTU SHORTCUT LAPORAN --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          onClick={() => {
            setReportTitle("Ringkasan Penjualan Hari Ini");
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            fetchTransactionsByDate(start, end);
            setProductReportData([]); 
          }}
          className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-orange-400"
        >
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h4 className="font-bold text-lg text-black mb-2">Laporan Harian</h4>
            <p className="text-gray-600 text-sm">Ringkasan penjualan hari ini</p>
          </CardContent>
        </Card>
        <Card
          onClick={() => handleShortcutClick('week')}
          className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-gray-400"
        >
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h4 className="font-bold text-lg text-black mb-2">Laporan Mingguan</h4>
            <p className="text-gray-600 text-sm">Analisis 7 hari terakhir</p>
          </CardContent>
        </Card>
        <Card
          onClick={() => handleShortcutClick('month')}
          className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-black"
        >
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-12 h-12 text-black mx-auto mb-4" />
            <h4 className="font-bold text-lg text-black mb-2">Laporan Bulanan</h4>
            <p className="text-gray-600 text-sm">Performa bulan ini</p>
          </CardContent>
        </Card>
        <Card
          onClick={handleProductReportClick} // <-- SEKARANG MEMANGGIL FUNGSI YANG BENAR
          className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-orange-400"
        >
          <CardContent className="p-6 text-center">
            <Receipt className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h4 className="font-bold text-lg text-black mb-2">Laporan Produk</h4>
            <p className="text-gray-600 text-sm">Analisis per produk</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filter Section */}
      <div className="bg-white p-4 rounded-2xl border-2 border-gray-200 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleShortcutClick('week')}>7 Hari Terakhir</Button>
            <Button variant="outline" onClick={() => handleShortcutClick('month')}>Bulan Ini</Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="w-[280px] justify-start text-left font-normal text-gray-600">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (dateRange.to ? (`${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`) : (format(dateRange.from, "LLL dd, y"))) : (<span>Pilih rentang custom</span>)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar autoFocus={true} mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/>
              </PopoverContent>
            </Popover>
      {categoryList.length > 0 && (
        <Combobox
          options={[{ value: 'semua', label: 'Semua Kategori' }, ...categoryList]}
          onSelect={(value) => setSelectedCategory(value === 'semua' ? null : value)}
          placeholder="Filter Kategori..."
        />
      )}            
          </div>
          <div className="flex items-center gap-2">
<Button onClick={() => {
  if (dateRange?.from && dateRange?.to) {
    let title = `Ringkasan dari ${format(dateRange.from, "d MMM yyyy")} - ${format(dateRange.to, "d MMM yyyy")}`;
    if(selectedCategory) {
      title += ` (Kategori: ${selectedCategory})`;
    }
    setReportTitle(title);
    
    // Kirim kategori yang dipilih ke fungsi fetch
    fetchTransactionsByDate(dateRange.from, dateRange.to, selectedCategory); 
    
    setProductReportData([]);
  } else {
    alert("Silakan pilih rentang tanggal yang valid.");
  }
}} className="bg-orange-500 ...">
  Terapkan
</Button>
          </div>
        </div>
      </div>
      
      {/* Summary & Details Section */}
      {/* Tampilkan summary transaksi jika ada data transaksi */}
      {reportData.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl">
          <div className="p-8">
            <h4 className="text-xl font-bold text-black mb-6">{reportTitle}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center"><div className="text-3xl font-black text-black">{loadingReport ? '...' : `Rp ${reportSummary.revenue.toLocaleString('id-ID')}`}</div><p className="text-gray-600 font-medium">Total Pendapatan</p></div>
              <div className="text-center"><div className="text-3xl font-black text-orange-600">{loadingReport ? '...' : reportSummary.count}</div><p className="text-gray-600 font-medium">Total Transaksi</p></div>
              <div className="text-center"><div className="text-3xl font-black text-gray-600">{loadingReport ? '...' : `Rp ${Math.round(reportSummary.average).toLocaleString('id-ID')}`}</div><p className="text-gray-600 font-medium">Rata-rata per Transaksi</p></div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow className="border-gray-200"><TableHead>Waktu</TableHead><TableHead>ID Transaksi</TableHead><TableHead>Detail Item</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loadingReport ? <TableRow><TableCell colSpan={4} className="text-center">Memuat...</TableCell></TableRow> :
                    reportData.map((t) => (
                      <TableRow key={t.nomor_faktur} className="border-gray-200">
                        <TableCell>{new Date(t.created_at).toLocaleString('id-ID', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'})}</TableCell>
                        <TableCell>#{t.nomor_faktur}</TableCell>
                        <TableCell>{t.items.map((item: any) => `${item.nama_produk} (x${item.quantity})`).join(', ')}</TableCell>
                        <TableCell className="text-right font-bold">Rp {t.total_amount.toLocaleString('id-ID')}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
      
      {/* Tampilkan laporan produk jika ada data produk */}
      {productReportData.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl">
          <div className="p-8">
            <h4 className="text-xl font-bold text-black mb-6">{reportTitle}</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Jumlah Terjual</TableHead>
                  <TableHead className="text-right">Total Pendapatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingReport ? <TableRow><TableCell colSpan={3} className="text-center">Memuat...</TableCell></TableRow> : 
                 productReportData.map((prod, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-semibold">{prod.nama_produk}</TableCell>
                    <TableCell>{prod.total_quantity}</TableCell>
                    <TableCell className="text-right font-bold">Rp {prod.total_revenue.toLocaleString('id-ID')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Tampilkan pesan jika tidak ada data sama sekali */}
      {reportData.length === 0 && productReportData.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl">
              <div className="p-8 text-center text-gray-500">
                  <h4 className="text-xl font-bold text-black mb-4">{reportTitle}</h4>
                  <p>Tidak ada data untuk ditampilkan pada rentang tanggal yang dipilih.</p>
                  <p>Silakan pilih laporan atau rentang tanggal yang lain.</p>
              </div>
          </div>
      )}
    </div>
  );
};

  const renderAnalytics = () => (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-black tracking-tight">Analitik & Grafik</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white border-2 border-gray-200 shadow-2xl">
          <CardHeader><CardTitle className="text-xl font-bold text-black">Tren Penjualan 7 Hari Terakhir</CardTitle></CardHeader>
          <CardContent>
            {loadingAnalytics ? <div className="h-[300px] flex items-center justify-center">Memuat...</div> :
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData?.sales_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis tickFormatter={(value) => `Rp${Number(value)/1000}k`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="total_sales" name="Penjualan" stroke="#f97316" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            }
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-gray-200 shadow-2xl">
          <CardHeader><CardTitle className="text-xl font-bold text-black">Top 5 Produk Terlaris</CardTitle></CardHeader>
          <CardContent>
            {loadingAnalytics ? <div className="h-[300px] flex items-center justify-center">Memuat...</div> :
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical" // Mengubah orientasi menjadi horizontal
            data={analyticsData?.top_products}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" /> 
            <YAxis 
              type="category" 
              dataKey="nama_produk" // Sumbu Y sekarang untuk nama produk
              width={80} // Beri ruang untuk label
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="total_quantity" name="Jumlah Terjual" fill="#8884d8" />
          </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            }
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-gray-400"><CardHeader><CardTitle className="text-sm font-bold text-gray-800 uppercase">Rata-Rata Penjualan</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-black">{loadingAnalytics ? '...' : `Rp ${Math.round(analyticsData?.advanced_stats?.avg_sale || 0).toLocaleString('id-ID')}`}</div><p className="text-gray-600">per transaksi</p></CardContent></Card>
        <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-orange-400"><CardHeader><CardTitle className="text-sm font-bold text-gray-800 uppercase">Produk Unik Terjual</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-black">{loadingAnalytics ? '...' : analyticsData?.advanced_stats?.unique_products_sold}</div><p className="text-gray-600">jenis produk</p></CardContent></Card>
        <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-blue-400"><CardHeader><CardTitle className="text-sm font-bold text-gray-800 uppercase">Jam Tersibuk</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-black">{loadingAnalytics ? '...' : `${analyticsData?.advanced_stats?.busiest_hour || 0}:00`}</div><p className="text-gray-600">Peak hour</p></CardContent></Card>
        <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-green-400"><CardHeader><CardTitle className="text-sm font-bold text-gray-800 uppercase">Item Terjual (Hari Ini)</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-black">{loadingAnalytics ? '...' : analyticsData?.advanced_stats?.total_items_sold_today}</div><p className="text-orange-600">buah</p></CardContent></Card>
      </div>
    </div>
  )

const NotificationMessage = ({ message, isRead }: { message: string; isRead: boolean }) => {
  // Regex untuk mendeteksi URL yang diawali http atau https
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = message.split(urlRegex);

  return (
    <p className={`font-medium ${isRead ? 'text-gray-500' : 'text-black'}`}>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
              // Hentikan event agar tidak memicu onClick dari parent div
              onClick={(e) => e.stopPropagation()} 
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </p>
  );
};

  // RENDER UNTUK MENU BARU (MASIH DUMMY)
const renderNotifications = () => {
  const criticalCount = notifications.filter(n => n.type === 'stok_rendah' && !n.is_read).length;
  const warningCount = notifications.filter(n => n.type === 'warning' && !n.is_read).length;
  const infoCount = notifications.filter(n => n.type === 'info' && !n.is_read).length;

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-black tracking-tight">Notifikasi & Peringatan</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white border-2 border-red-200 shadow-xl"><CardHeader><CardTitle className="text-sm font-bold text-red-800 uppercase">Peringatan Kritis</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-red-600">{loadingNotifications ? '...' : criticalCount}</div><p className="text-red-600">Perlu perhatian segera</p></CardContent></Card>
        <Card className="bg-white border-2 border-orange-200 shadow-xl"><CardHeader><CardTitle className="text-sm font-bold text-orange-800 uppercase">Peringatan</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-orange-600">{loadingNotifications ? '...' : warningCount}</div><p className="text-orange-600">Perlu tindakan</p></CardContent></Card>
        <Card className="bg-white border-2 border-blue-200 shadow-xl"><CardHeader><CardTitle className="text-sm font-bold text-blue-800 uppercase">Info</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-blue-600">{loadingNotifications ? '...' : infoCount}</div><p className="text-blue-600">Informasi umum</p></CardContent></Card>
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl">
        <div className="p-8">
          <h4 className="text-xl font-bold text-black mb-6">Notifikasi Terbaru</h4>
          <div className="space-y-4">
            {loadingNotifications ? <p>Memuat notifikasi...</p> : 
             notifications.length === 0 ? <p className="text-gray-500 text-center py-4">Tidak ada notifikasi.</p> :
             notifications.map((notif) => {
               const isStockWarning = notif.type === 'stok_rendah';
               const isClickable = isStockWarning && !notif.is_read;
               
               let dotColor = 'bg-blue-500';
               if (notif.type === 'stok_rendah') dotColor = 'bg-red-500';
               else if (notif.type === 'warning') dotColor = 'bg-orange-500';

               return (
                 <div
                   key={notif.id}
                   // onClick sekarang HANYA untuk notifikasi stok
                   onClick={() => { if (isClickable) setActiveSection('inventory'); }}
                   className={`${isClickable ? 'cursor-pointer' : ''}`}
                 >
                   <div className={`flex items-start space-x-4 p-4 rounded-lg border transition-colors ${notif.is_read ? 'bg-gray-50' : 'bg-white'} ${isClickable ? 'hover:bg-orange-50' : ''}`}>
                     <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`}></div>
                     <div className="flex-1">
                       {/* --- GUNAKAN KOMPONEN BARU DI SINI --- */}
                       <NotificationMessage message={notif.message} isRead={notif.is_read} />
                       <p className="text-gray-500 text-sm">{new Date(notif.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                     </div>
                     {!notif.is_read && (
                       <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}>
                         Tandai Dibaca
                       </Button>
                     )}
                   </div>
                 </div>
               );
             })}
          </div>
        </div>
      </div>
    </div>
  );
};

const renderSettings = () => {
  switch (activeSetting) {
    case 'profile':
      return <UserProfile session={session} onBack={() => setActiveSetting('main')} />;
      
    case 'store':
      return <StoreProfile session={session} onBack={() => setActiveSetting('main')} onProfileUpdate={refreshProfileData} />;

    case 'security':
    return <SecuritySettings onBack={() => setActiveSetting('main')} />;

    default: // Tampilan utama pengaturan
      return (
        <div className="space-y-8">
          <h3 className="text-2xl font-bold text-black tracking-tight">Pengaturan Sistem</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <Card 
              onClick={() => setActiveSetting('profile')} 
              className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-orange-500"
            >
              <CardContent className="p-6 text-center">
                <User className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h4 className="font-bold text-lg text-black mb-2">Akun</h4>
                <p className="text-gray-600 text-sm">Lihat detail akun Anda</p>
              </CardContent>
            </Card>

            {/* --- KARTU BARU UNTUK PROFIL TOKO --- */}
            <Card 
              onClick={() => setActiveSetting('store')} 
              className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-orange-500"
            >
              <CardContent className="p-6 text-center">
                <Store className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h4 className="font-bold text-lg text-black mb-2">Profil Toko</h4>
                <p className="text-gray-600 text-sm">Atur nama & alamat toko</p>
              </CardContent>
            </Card>

            {/* Kartu-kartu lainnya masih statis untuk saat ini */}
            <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer">
              <CardContent className="p-6 text-center">
                <Printer className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h4 className="font-bold text-lg text-black mb-2">Pengaturan Printer</h4>
                <p className="text-gray-600 text-sm">Konfigurasi printer kasir</p>
              </CardContent>
            </Card>
            <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer">
              <CardContent className="p-6 text-center">
                <CreditCard className="w-12 h-12 text-black mx-auto mb-4" />
                <h4 className="font-bold text-lg text-black mb-2">Metode Pembayaran</h4>
                <p className="text-gray-600 text-sm">Atur opsi pembayaran</p>
              </CardContent>
            </Card>
            <Card onClick={() => setActiveSetting('security')} className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-orange-500">
              <CardContent className="p-6 text-center">
                <Shield className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h4 className="font-bold text-lg text-black mb-2">Keamanan</h4>
                <p className="text-gray-600 text-sm">Password & keamanan akun</p>
              </CardContent>
            </Card>
        <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <CardContent className="p-6 text-center">
            <Gift className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h4 className="font-bold text-lg text-black mb-2">Program Loyalitas</h4>
            <p className="text-gray-600 text-sm">Atur reward pelanggan</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <CardContent className="p-6 text-center">
            <Bell className="w-12 h-12 text-black mx-auto mb-4" />
            <h4 className="font-bold text-lg text-black mb-2">Notifikasi</h4>
            <p className="text-gray-600 text-sm">Pengaturan peringatan</p>
          </CardContent>
        </Card>
      </div>
        </div>
      );
  }
};

  const renderHelp = () => (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-black tracking-tight">Bantuan & Dukungan</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h4 className="font-bold text-lg text-black mb-2">Panduan Pengguna</h4>
            <p className="text-gray-600 text-sm">Tutorial lengkap penggunaan</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <CardContent className="p-6 text-center">
            <HelpCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h4 className="font-bold text-lg text-black mb-2">FAQ</h4>
            <p className="text-gray-600 text-sm">Pertanyaan yang sering diajukan</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <CardContent className="p-6 text-center">
            <Users className="w-12 h-12 text-black mx-auto mb-4" />
            <h4 className="font-bold text-lg text-black mb-2">Hubungi Support</h4>
            <p className="text-gray-600 text-sm">Tim dukungan 24/7</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl">
        <div className="p-8">
          <h4 className="text-xl font-bold text-black mb-6">Informasi Sistem</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 mb-2">Versi Aplikasi</p>
              <p className="text-black font-bold text-lg">KasirKu v2.1.0</p>
            </div>
            <div>
              <p className="text-gray-600 mb-2">Terakhir Update</p>
              <p className="text-black font-bold text-lg">15 Januari 2024</p>
            </div>
            <div>
              <p className="text-gray-600 mb-2">Lisensi</p>
              <p className="text-black font-bold text-lg">Premium Business</p>
            </div>
            <div>
              <p className="text-gray-600 mb-2">Support</p>
              <p className="text-black font-bold text-lg">support@kasirku.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case "inventory": return renderInventory();
      case "products": return renderProducts();
      case "customers": return renderCustomers();
      case "reports": return renderReports();
      case "analytics": return renderAnalytics();
      case "notifications": return renderNotifications();
      case "settings": return renderSettings();
      case "help": return renderHelp();
      default: return renderDashboard();
    }
  }

  if (!session) {
    return <Auth />
  } else {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 font-sans flex">
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r-2 border-gray-200 shadow-2xl transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out lg:translate-x-0`}>
          <div className="flex items-center justify-between h-20 px-6 border-b-2 border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg"><span className="text-white font-bold text-lg">R</span></div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-black via-gray-700 to-orange-500 bg-clip-text text-transparent tracking-tight">KasirKu</h1>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}><X className="h-6 w-6" /></Button>
          </div>
          {profile?.store_name && (
            <div className="px-6 py-4 border-b-2 border-gray-200">
            <p className="text-sm text-gray-500">Profil Toko</p>
            <p className="font-bold text-lg text-black truncate">{profile.store_name}</p>
            </div>
            )}         
          <nav className="mt-8 px-4">
            <div className="space-y-2">
              {menuItems.map((item) => (
                <button key={item.id} onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 ${activeSection === item.id ? "bg-orange-500 text-white shadow-lg" : "text-gray-700 hover:bg-gray-100"}`}>
                  <item.icon className="h-5 w-5 mr-3" /><span className="font-semibold">{item.label}</span>
                  {item.id === 'notifications' && unreadCount > 0 && (
              <span className="flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5">
                  {unreadCount}
              </span>
              )}    
                </button>
              ))}
            </div>
          </nav>
        </div>
        <div className="flex-1 flex flex-col lg:ml-64">
          <header className="flex justify-between items-center p-6 bg-white/80 backdrop-blur-sm border-b-2 border-gray-200 sticky top-0 z-40">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6" /></Button>
              <div>
                <h2 className="text-3xl font-bold text-black tracking-tight">{menuItems.find((item) => item.id === activeSection)?.label || "Dashboard"}</h2>
                  <p className="text-gray-600 text-lg font-medium">Selamat datang kembali, {profile?.full_name ? profile.full_name.split(' ')[0] : 'Pengguna'}! Kelola bisnismu dengan mudah.</p>
              </div>
            </div>
<div className="flex items-center space-x-2">
  <ThemeSwitcher />
  <Button variant="ghost" size="icon"><Globe className="h-5 w-5" /></Button>
  
  {/* --- Dropdown Menu Pengguna --- */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="relative h-12 w-12 rounded-full border-2 border-gray-300 shadow-md">
        <User className="h-6 w-6 text-gray-700" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-56" align="end" forceMount>
      <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none">
            {profile?.full_name || 'Pengguna'}
          </p>
          <p className="text-xs leading-none text-muted-foreground">
            {session?.user?.email || 'Tidak ada email'}
          </p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => setActiveSection('settings')}>
        <Settings className="mr-2 h-4 w-4" />
        <span>Pengaturan</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={async () => await supabase.auth.signOut()}>
        <LogOut className="mr-2 h-4 w-4" />
        <span>Logout</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
  {/* ----------------------------- */}
</div>
          </header>
          <main className="flex-1 p-10 overflow-y-auto">{renderContent()}

    {/* Dialog universal untuk Tambah & Edit Produk diletakkan di sini */}
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-[425px] bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-black">{productFormData.id ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
          <DialogDescription>
            {productFormData.id ? 'Ubah detail produk di bawah ini.' : 'Isi detail produk yang akan ditambahkan.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleFormSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nama_produk" className="text-right text-gray-800">Nama</Label>
              <Input id="nama_produk" value={productFormData.nama_produk} onChange={handleInputChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="kategori" className="text-right text-gray-800">Kategori</Label>
              <Input id="kategori" value={productFormData.kategori} onChange={handleInputChange} className="col-span-3" placeholder="Contoh: Minuman, Makanan" />
            </div>            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="harga" className="text-right text-gray-800">Harga</Label>
              <Input id="harga" type="number" value={productFormData.harga} onChange={handleInputChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stok" className="text-right text-gray-800">Stok</Label>
              <Input id="stok" type="number" value={productFormData.stok} onChange={handleInputChange} className="col-span-3" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
              {productFormData.id ? 'Simpan Perubahan' : 'Simpan Produk'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

          {/* Dialog Tambah Stok (Universal) */}
          <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
            <DialogContent className="sm:max-w-[425px] bg-white">
              <DialogHeader>
                <DialogTitle>Tambah Stok untuk: {selectedProduct?.nama_produk}</DialogTitle>
                <DialogDescription>Stok saat ini: {selectedProduct?.stok}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveAddedStock}>
                <div className="grid gap-4 py-4">
                  <Label htmlFor="stok_tambah">Jumlah</Label>
                  <Input id="stok_tambah" type="number" value={stockToAdd} onChange={(e) => setStockToAdd(e.target.value)} required autoFocus />
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">Simpan Stok</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          </main>
        </div>
        {sidebarOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>)}
      </div>
    )
  }
}

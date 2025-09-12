// src/app/page.tsx
"use client"

import { useState, useEffect } from "react"
import type { Session } from '@supabase/supabase-js'
import { Calendar as CalendarIcon, DollarSign, Receipt, Star, Plus, User, Menu, X, Package, TrendingUp, FileText, BarChart3, ArrowUp, ArrowDown, Settings, Users, Bell, HelpCircle, Download, FileSpreadsheet, Printer, CreditCard, Shield, Gift, Tag, Medal, ArrowLeft, Loader2, Lightbulb } from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle,CardDescription } from "@/components/ui/card"
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
import LoyaltySettings from '@/components/LoyaltySettings';
import PrinterSettings from '@/components/PrinterSettings';
import { Progress } from "@/components/ui/progress";
import { useMemo } from 'react';
import { Textarea } from "@/components/ui/textarea";
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReceiptPreviewDialog from '@/components/ReceiptPreviewDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type TransactionData = {
  items: any[]; // Anda bisa buat tipe lebih spesifik jika mau
  total_amount: number;
  customer_id: number | null; // customer_id bisa berupa angka atau null
};

type TransactionReportItem = {
  id: number;
  created_at: string;
  total_amount: number;
  items: any[];
  customer_id: number | null;
  nomor_faktur: string;
  payment_method_name: string | null;
};

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null)
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("dashboard")
  const [activeSetting, setActiveSetting] = useState("main")
  const [activeReportType, setActiveReportType] = useState('transactions');
  
  const [products, setProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  const [transactions, setTransactions] = useState<any[]>([])
  const [dashboardStats, setDashboardStats] = useState({ revenue: 0, count: 0 })
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
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

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [newlyAddedProductId, setNewlyAddedProductId] = useState<number | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<any>(null);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [customerLoyaltyCount, setCustomerLoyaltyCount] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('Semua');
  const [customerNotes, setCustomerNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState(7);
  const [salesPrediction, setSalesPrediction] = useState<any[]>([]);
  const [restockRecommendations, setRestockRecommendations] = useState<any[]>([]);
  const [comboboxKey, setComboboxKey] = useState(Date.now());
  
  const MINIMUM_STOCK = 15;

  const getStatus = (stock: number) => {
    if (stock === 0) return { key: "habis", label: "Habis", className: "bg-red-100 text-red-800" };
    if (stock < MINIMUM_STOCK) return { key: "rendah", label: "Rendah", className: "bg-orange-100 text-orange-800" };
    return { key: "normal", label: "Normal", className: "bg-green-100 text-green-800" };
  };

  const [comparisonData, setComparisonData] = useState<any>(null);

  const [customerSummary, setCustomerSummary] = useState({ total_customers: 0, new_last_30_days: 0, inactive_customers: 0 });
  const [loadingSummary, setLoadingSummary] = useState(true);

    useEffect(() => {
    if (viewingCustomer) {
        setCustomerNotes(viewingCustomer.notes || '');
    }
}, [viewingCustomer]);

const handleResetFilters = () => {
  // Reset tanggal ke default (misalnya, bulan ini)
  const start = new Date(); start.setDate(1); start.setHours(0,0,0,0);
  const end = new Date(); end.setHours(23,59,59,999);
  setDateRange({ from: start, to: end });

  // Reset kategori
  setSelectedCategory(null);

  // Reset combobox agar menampilkan placeholder lagi
  setComboboxKey(Date.now()); 
};

const productReportSummary = useMemo(() => {
  if (!productReportData || productReportData.length === 0) {
    return { totalRevenue: 0, totalQuantity: 0, bestseller: '-' };
  }

  const totalRevenue = productReportData.reduce((sum, p) => sum + Number(p.total_revenue), 0);
  const totalQuantity = productReportData.reduce((sum, p) => sum + Number(p.total_quantity), 0);
  
  // Karena data sudah diurutkan dari SQL, produk terlaris adalah item pertama
  const bestseller = productReportData[0]?.nama_produk || '-';

  return { totalRevenue, totalQuantity, bestseller };
}, [productReportData]);

const customerStats = useMemo(() => {
  if (!customerHistory || customerHistory.length === 0) {
    return { totalSpending: 0, favoriteProduct: '-', averageSpending: 0 };
  }

  const totalSpending = customerHistory.reduce((sum, t) => sum + t.total_amount, 0);
  const averageSpending = totalSpending / customerHistory.length;

  const allItems = customerHistory.flatMap(t => t.items);
  const productCounts = allItems.reduce((acc, item) => {
    acc[item.nama_produk] = (acc[item.nama_produk] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);


  const favoriteProduct = Object.entries(productCounts).sort(
    (a, b) => (b[1] as number) - (a[1] as number)
  )[0]?.[0] || '-';


  return { totalSpending, favoriteProduct, averageSpending };
}, [customerHistory]);

const getCustomerTier = (transactionCount: number) => {
  const tiers = {
    bronze: { name: 'Bronze', threshold: 0, color: 'bg-orange-200 text-orange-900', iconColor: 'text-orange-600' },
    silver: { name: 'Silver', threshold: 10, color: 'bg-gray-200 text-gray-800', iconColor: 'text-gray-600' },
    gold: { name: 'Gold', threshold: 30, color: 'bg-yellow-100 text-yellow-900', iconColor: 'text-yellow-500' },
  };

  if (transactionCount >= tiers.gold.threshold) {
    return { ...tiers.gold, icon: Medal, nextTier: null, progress: 100 };
  }
  if (transactionCount >= tiers.silver.threshold) {
    const progress = ((transactionCount - tiers.silver.threshold) / (tiers.gold.threshold - tiers.silver.threshold)) * 100;
    return { ...tiers.silver, icon: Medal, nextTier: tiers.gold, progress: progress, transactionsForNextTier: tiers.gold.threshold - tiers.silver.threshold, currentProgressInTier: transactionCount - tiers.silver.threshold };
  }
  const progress = (transactionCount / tiers.silver.threshold) * 100;
  return { ...tiers.bronze, icon: Medal, nextTier: tiers.silver, progress: progress, transactionsForNextTier: tiers.silver.threshold, currentProgressInTier: transactionCount };
};

  useEffect(() => {
    setIsMounted(true);
    if(session) {
      if (activeSection === 'dashboard') {
        fetchDashboardData();
        // Anda bisa tambahkan fetch data lain untuk dashboard di sini
      } else if (activeSection === 'reports') {
        // Ambil daftar kategori saat masuk ke halaman laporan
        const fetchCategories = async () => {
          const { data } = await supabase!.rpc('get_unique_categories');
          if (data) {
            setCategoryList(data.map((cat: any) => ({ value: cat.kategori, label: cat.kategori })));
          }
        };
        fetchCategories();
      }
      // Tambahkan else if untuk section lain jika perlu
    }
  }, [session, activeSection]);

  useEffect(() => {
    if (activeSection !== 'reports' || !isMounted || !dateRange?.from || !dateRange?.to) {
        return;
    }

    const fetchData = async () => {
      setLoadingReport(true);
      
      if (activeReportType === 'products') {
        setReportData([]);
        const { data, error } = await supabase!.rpc('get_product_report', {
          start_date: dateRange.from ? dateRange.from.toISOString() : "",
          end_date: (dateRange.to ?? dateRange.from ?? new Date()).toISOString(),
          category_in: selectedCategory
        });
        if (error) console.error("Error fetching product report:", error);
        setProductReportData(data || []);
      } else { // activeReportType === 'transactions'
        setProductReportData([]);
        const { data, error } = await supabase!.rpc('get_filtered_transactions', {
          start_date_in: dateRange.from ? dateRange.from.toISOString() : "",
          end_date_in: dateRange.to ? dateRange.to.toISOString() : ""
        });
        if (!error) {
          const reportData: TransactionReportItem[] = data || [];
          setReportData(reportData);
          const totalRevenue = reportData.reduce((sum, t) => sum + t.total_amount, 0);
          const transactionCount = reportData.length;
          const averageTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;
          setReportSummary({ revenue: totalRevenue, count: transactionCount, average: averageTransaction });
        } else {
          console.error("Error fetching transaction report:", error);
          setReportData([]); // Pastikan data kosong jika ada error
        }
      }
      setLoadingReport(false);
    };

    fetchData();
  }, [activeSection, activeReportType, dateRange, selectedCategory, isMounted]);

const filteredCustomers = useMemo(() => {
  if (!customers) return [];

  return customers
    .filter(customer => {
      if (tierFilter === 'Semua') return true;
      const tier = getCustomerTier(customer.transaction_count || 0);
      return tier.name === tierFilter;
    })
    .filter(customer => {
      const search = searchTerm.toLowerCase();
      if (!search) return true;
      return (
        customer.name?.toLowerCase().includes(search) ||
        customer.email?.toLowerCase().includes(search) ||
        customer.phone?.toLowerCase().includes(search)
      );
    });
}, [customers, searchTerm, tierFilter]);

const handleViewCustomerHistory = async (customer: any) => {
  setViewingCustomer(customer);
  setLoadingHistory(true);
  setCustomerHistory([]); // Kosongkan dulu
  setCustomerLoyaltyCount(0); // Reset

  // Panggil kedua fungsi (ambil riwayat & hitung jumlah) secara bersamaan
  const [historyResult, countResult] = await Promise.all([
    supabase!.rpc('get_transactions_by_customer', { p_customer_id: customer.id }),
    supabase!.rpc('get_customer_transaction_count', { p_customer_id: customer.id })
  ]);
  
  if (historyResult.data) {
    setCustomerHistory(historyResult.data);
  }
  if (historyResult.error) {
    console.error("Error fetching customer history:", historyResult.error);
  }
  
  if (typeof countResult.data === 'number') {
    setCustomerLoyaltyCount(countResult.data);
  }
  if (countResult.error) {
    console.error("Error fetching customer transaction count:", countResult.error);
  }
  
  setLoadingHistory(false);
};

  const handleShortcutClick = (period: 'week' | 'month') => {
    const end = new Date();
    const start = new Date();
    let title = "";

    if (period === 'week') {
      start.setDate(end.getDate() - 7);
      title = `Ringkasan 7 Hari Terakhir`;
    } else { // month
      start.setDate(1);
      title = `Ringkasan Bulan Ini`;
    }
    
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);

    setActiveReportType('transactions');
    setReportTitle(title);
    setDateRange({ from: start, to: end });
  };

const handleSaveCustomerNotes = async () => {
  if (!viewingCustomer) return;
  setSavingNotes(true);
  const { error } = await supabase!
    .from('customers')
    .update({ notes: customerNotes })
    .eq('id', viewingCustomer.id);

  if (error) {
    alert('Gagal menyimpan catatan: ' + error.message);
  } else {
    alert('Catatan berhasil disimpan!');
    // Perbarui data customer di state utama agar sinkron
    setCustomers(customers.map(c => 
      c.id === viewingCustomer.id ? { ...c, notes: customerNotes } : c
    ));
  }
  setSavingNotes(false);
};


  const handleReprintClick = (transaction: any) => { setIsPreviewOpen(true); setSelectedTransaction(transaction); };
  
  async function getCustomerSummary() {
    setLoadingSummary(true);
    // Pastikan Anda sudah membuat fungsi 'get_customer_summary' di Supabase
    const { data, error } = await supabase!.rpc('get_customer_summary');
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
    supabase!.auth.getSession().then(({ data: { session } }) => { setSession(session) });
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => { setSession(session) });
    return () => subscription.unsubscribe();
  }, []);

  
async function fetchSalesPrediction() {
  const { data, error } = await supabase!.rpc('get_daily_sales_avg');
  if (data) {
    setSalesPrediction(data);
  }
  if (error) {
    console.error("Error fetching sales prediction:", error);
  }
}


async function getNotifications() {
  setLoadingNotifications(true);
  const { data, error } = await supabase!
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
  await supabase!.rpc('mark_notification_as_read', { notification_id: id });

  // Update jumlah notifikasi belum dibaca
  const { data } = await supabase!.rpc('get_unread_notification_count');
  if (typeof data === 'number') {
    setUnreadCount(data);
  }
};
  
useEffect(() => {
  const fetchInitialData = async () => {
    if (!session) return;

    const getUnreadCount = async () => {
      const { data, error } = await supabase!.rpc('get_unread_notification_count');
      if (error) console.error("Error fetching unread count:", error);
      else if (typeof data === 'number') setUnreadCount(data);
    };

    // Panggil semua data yang dibutuhkan saat aplikasi pertama kali dimuat
    await Promise.all([
      fetchDashboardData(currentPage),
      getProducts(),
      getCustomers(),
      refreshProfileData(),
      getUnreadCount()
    ]);
  };

  fetchInitialData();
  
}, [session, currentPage]);


  async function getProductSummary() {
    setLoadingProductSummary(true);
    const { data, error } = await supabase!.rpc('get_product_summary');
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
      const { data: profileData } = await supabase!
        .from('profiles')
        .select('*')
        .single();
      if (profileData) setProfile(profileData);
       };
    fetchAllData();
  }, [session, currentPage]);
  
async function fetchDashboardData(page = 1) {
  setLoadingDashboard(true);

  // --- MEMANGGIL SEMUA DATA YANG DIPERLUKAN UNTUK DASHBOARD ---
  const [
    { data: recoData },
    { data: compData },
    { data: transData, count }
  ] = await Promise.all([
    supabase!.rpc('get_restock_recommendations'),
    supabase!.rpc('get_dashboard_comparison'),
    supabase!.from('transactions').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range((page - 1) * ITEMS_PER_PAGE, (page - 1) * ITEMS_PER_PAGE + ITEMS_PER_PAGE - 1)
  ]);

  // Memperbarui state dengan data yang sudah diambil
  if (recoData) setRestockRecommendations(recoData);
  if (compData) setComparisonData(compData);
  if (transData) {
    setTransactions(transData);
    if (count) setTotalTransactions(count);
  }
  // ----------------------------------------------------

  // Sisa dari fungsi fetchDashboardData (tidak berubah)
  const today = new Date().toISOString().slice(0, 10);
  const { data: todayTransData } = await supabase!
    .from('transactions')
    .select('total_amount, items')
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lte('created_at', `${today}T23:59:59.999Z`);

  if (todayTransData) {
    const totalRevenue = todayTransData.reduce((sum, t) => sum + t.total_amount, 0);
    const transactionCount = todayTransData.length;
    setDashboardStats({ revenue: totalRevenue, count: transactionCount });

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
  
  setLoadingDashboard(false);
}

  // Fungsi fetchAnalyticsData sekarang memanggil satu fungsi super
async function fetchAnalyticsData() {
  setLoadingAnalytics(true);
  // Panggil fungsi baru dengan periode dari state
  const { data, error } = await supabase!.rpc('get_analytics_by_period', { days_period: analyticsPeriod });
  if (data) setAnalyticsData(data);
  if (error) console.error("Error fetching analytics data: ", error);
  setLoadingAnalytics(false);
}

useEffect(() => {
  // Panggil ulang fetchAnalyticsData setiap kali periode berubah
  if (activeSection === 'analytics' && session) {
    fetchAnalyticsData();
  }
}, [analyticsPeriod]);

async function fetchTransactionsByDate(startDate: Date, endDate: Date) {
  setLoadingReport(true);
  setProductReportData([]); // PERUBAHAN: Selalu kosongkan laporan produk
  setReportData([]);
  
  const { data, error } = await supabase!.rpc('get_filtered_transactions', {
    start_date_in: startDate.toISOString(),
    end_date_in: endDate.toISOString()
  });

  if (error) {
    console.error("Error fetching report data: ", error);
    alert("Error mengambil data laporan: " + error.message);
  }

  if (data) {
    setReportData(data);
    const totalRevenue = data.reduce((sum: number, t: any) => sum + t.total_amount, 0);
    const transactionCount = data.length;
    const averageTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;
    setReportSummary({ revenue: totalRevenue, count: transactionCount, average: averageTransaction });
  } else {
    setReportData([]);
    setReportSummary({ revenue: 0, count: 0, average: 0 });
  }
  setLoadingReport(false);
}


  async function getProducts() {
    setLoadingProducts(true)
    const { data, error } = await supabase!.from('products').select('*').order('created_at', { ascending: false })
    if (data) setProducts(data)
    if (error) console.error('Error fetching products:', error)
    setLoadingProducts(false)
  }


  useEffect(() => {
    const fetchDataForSection = async () => {
      if (!session) return;
      switch (activeSection) {
        case 'dashboard': fetchDashboardData(); break;
        case 'inventory': getProducts(); fetchSalesPrediction(); break;
        case 'products': getProductSummary(); getProducts(); break;
        case 'customers': getCustomerSummary(); getCustomers(); break;
case 'reports': { // Tambahkan kurung kurawal
  const { data } = await supabase!.rpc('get_unique_categories');
  if (data) {
    setCategoryList(data.map((cat: any) => ({ value: cat.kategori, label: cat.kategori })));
  }
  // PERBAIKAN: Panggil laporan bulanan sebagai default setiap masuk ke halaman laporan
  handleShortcutClick('month');
  break;
}
        case 'notifications': getNotifications(); break;
        case 'analytics': fetchAnalyticsData(); break;
        default: break;
      }
    };
    fetchDataForSection();
  }, [activeSection, session]);

async function getCustomers() {
  // Pastikan fungsi ini memanggil RPC yang menghitung status
  const { data, error } = await supabase!.rpc('get_customers_with_status');
  if(data) setCustomers(data);
  if(error) console.error("Error fetching customers: ", error);
}


  useEffect(() => {
    setIsMounted(true);
    if(session) {
      const fetchInitialData = async () => {
        const getUnreadCount = async () => {
          const { data, error } = await supabase!.rpc('get_unread_notification_count');
          if (error) console.error("Error fetching unread count:", error);
          else if (typeof data === 'number') setUnreadCount(data);
        };
        await Promise.all([
          fetchDashboardData(currentPage),
          getProducts(),
          getCustomers(),
          refreshProfileData(),
          getUnreadCount()
        ]);
      };
      fetchInitialData();
    }
  }, [session, currentPage]);

  // useEffect UTAMA untuk mengambil data laporan secara reaktif
  useEffect(() => {
    if (activeSection !== 'reports' || !isMounted) return;

    const fetchData = async () => {
      if (!dateRange?.from || !dateRange?.to) return;
      setLoadingReport(true);
      
      if (activeReportType === 'products') {
        setReportData([]);
        const { data, error } = await supabase!.rpc('get_product_report', {
          start_date: dateRange.from.toISOString(),
          end_date: dateRange.to.toISOString(),
          category_in: selectedCategory
        });
        if (!error) setProductReportData(data || []);
        else console.error("Error fetching product report:", error);
      } else {
        setProductReportData([]);
        const { data, error } = await supabase!.rpc('get_filtered_transactions', {
          start_date_in: dateRange.from.toISOString(),
          end_date_in: dateRange.to.toISOString()
        });
        if (!error) {
          setReportData(data || []);
          const totalRevenue = (data || []).reduce((sum: number, t: TransactionReportItem) => sum + t.total_amount, 0);
          const transactionCount = (data || []).length;
          const averageTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;
          setReportSummary({ revenue: totalRevenue, count: transactionCount, average: averageTransaction });
        } else {
          console.error("Error fetching transaction report:", error);
        }
      }
      setLoadingReport(false);
    };

    fetchData();
  }, [activeSection, activeReportType, dateRange, selectedCategory, isMounted]);

  // useEffect untuk mengambil daftar kategori saat masuk ke halaman laporan
  useEffect(() => {
    const fetchCategories = async () => {
        if (activeSection === 'reports') {
            const { data } = await supabase!.rpc('get_unique_categories');
            if (data) {
                setCategoryList(data.map((cat: any) => ({ value: cat.kategori, label: cat.kategori })));
            }
        }
    };
    fetchCategories();
  }, [activeSection]);


  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCustomerFormData(prev => ({ ...prev, [id]: value }));
  };

   const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return alert("Anda harus login.");

  const { id, name, email, phone } = customerFormData;
  const customerData = { name, email, phone, user_id: session.user.id };


  let error;
  if (id) {
    // Jika ada ID, lakukan UPDATE
    ({ error } = await supabase!.from('customers').update(customerData).eq('id', id));
  } else {
    // Jika tidak ada ID, lakukan INSERT
    ({ error } = await supabase!.from('customers').insert([customerData]));
  }
    

  if (error) {
    alert('Gagal menyimpan pelanggan: ' + error.message);
  } else {
    alert(`Pelanggan berhasil ${id ? 'diperbarui' : 'ditambahkan'}!`);
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

const handleEditCustomerClick = (customer: any) => {
  setCustomerFormData(customer);
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
    const { error } = await supabase!.rpc('add_stock', {
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
  e.preventDefault();
  const form = e.currentTarget as HTMLFormElement;
  const fileInput = form.elements.namedItem('gambar_produk') as HTMLInputElement;
  const file = fileInput?.files?.[0];

  if (!session) return alert("Anda harus login.");

  const { id, nama_produk, harga, stok, kategori } = productFormData;
  let imageUrl = productFormData.image_url || null; // Ambil URL gambar yang sudah ada

  // Jika ada file baru yang diunggah
  if (file) {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error: uploadError } = await supabase!.storage
      .from('product-images')
      .upload(fileName, file);

    if (uploadError) {
      alert('Gagal mengunggah gambar: ' + uploadError.message);
      return;
    }

    // Dapatkan URL publik dari gambar yang baru diunggah
    const { data: { publicUrl } } = supabase!.storage
      .from('product-images')
      .getPublicUrl(fileName);
    imageUrl = publicUrl;
  }
  
  const productData = { nama_produk, harga: Number(harga), stok: Number(stok), user_id: session.user.id, kategori, image_url: imageUrl };
  
  // Logika simpan data ke tabel (update/insert)
  if (id) {
    const { error } = await supabase!.from('products').update(productData).eq('id', id);
    if (error) alert('Error: ' + error.message);
    else alert('Produk berhasil diperbarui!');
  } else {
    const { error } = await supabase!.from('products').insert([productData]);
    if (error) alert('Error: ' + error.message);
    else alert('Produk berhasil ditambahkan!');
  }

  // PERBAIKAN: Panggil getProducts() di luar blok if/else
  // agar selalu berjalan setelah simpan.
  getProducts();
  setIsProductDialogOpen(false);
};

  
const handleEditClick = (product: any) => {
  setProductFormData({
    ...product, // Salin semua data produk yang ada
    kategori: product.kategori || '', // <-- TAMBAHKAN BARIS INI
  });
  setIsProductDialogOpen(true);
};
  
  const handleAddClick = () => {
    setProductFormData({ id: null, nama_produk: '', harga: '', stok: '', kategori: '' })
    setIsProductDialogOpen(true)
  }

  const handleDeleteProduct = async (productId: number) => {
    const { error } = await supabase!.from('products').delete().eq('id', productId)
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
    const { data: profileData } = await supabase!
      .from('profiles')
      .select('*')
      .single();
    if (profileData) setProfile(profileData);
  };

const handleSaveTransaction = async (transactionData: TransactionData) => {
  if (!session) return alert("Sesi tidak ditemukan.");

  const { data, error } = await supabase!.rpc('create_transaction_and_update_stock', {
    total_amount_in: transactionData.total_amount,
    items_in: transactionData.items,
    owner_id_in: session.user.id,
    customer_id_in: transactionData.customer_id
  });

  if (error) {
    alert("Gagal menyimpan transaksi: " + error.message);
    return null;
  } 
  
  if (data) {
    // PERBAIKAN: Buka dialog preview struk setelah berhasil
    setSelectedTransaction(data);
    setIsPreviewOpen(true);
    
    // Refresh data di background
    fetchDashboardData(); 
    getProducts();
    refreshProfileData();
  }
  return data; 
};


  const handleStockChange = async (type: 'in' | 'out') => {
    if (!stockChangeData.product_id || !stockChangeData.quantity) return alert("Produk dan jumlah harus dipilih.");
    
    const functionName = type === 'in' ? 'stock_in' : 'stock_out';
    const params = {
      product_id_to_update: Number(stockChangeData.product_id),
      [type === 'in' ? 'quantity_to_add' : 'quantity_to_subtract']: Number(stockChangeData.quantity)
    };

    const { error } = await supabase!.rpc(functionName, params);

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
            <DialogContent className="sm:max-w-6xl bg-white"><DialogHeader><DialogTitle className="text-black">Buat Transaksi Baru</DialogTitle><DialogDescription>Pilih produk dan tentukan jumlahnya.</DialogDescription></DialogHeader>
            <NewTransactionDialog 
              products={products} 
              customers={customers} 
              profile={profile} // <-- Teruskan data profil
              onSave={handleSaveTransaction} 
              onClose={() => setIsTransactionDialogOpen(false)} /></DialogContent>
          </Dialog>
          <Button onClick={() => setActiveSection('inventory')} variant="outline" className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 px-8 py-6 text-lg font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 bg-transparent" size="lg"><Package className="w-5 h-5 mr-3" />Kelola Stok</Button>
          <Button onClick={() => setActiveSection('reports')} variant="outline" className="border-2 border-gray-500 text-gray-600 hover:bg-gray-50 px-8 py-6 text-lg font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 bg-transparent" size="lg"><FileText className="w-5 h-5 mr-3" />Lihat Laporan</Button>
          <Button onClick={() => setActiveSection('analytics')} variant="outline" className="border-2 border-black text-black hover:bg-gray-50 px-8 py-6 text-lg font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 bg-transparent" size="lg"><TrendingUp className="w-5 h-5 mr-3" />Analitik</Button>
        </div>
      </div>

      {restockRecommendations.length > 0 && (
        <Card className="bg-white border-2 border-yellow-200 shadow-xl">
          <CardHeader className="flex flex-row items-start gap-4">
            <div className="bg-yellow-400 p-3 rounded-full mt-1">
              <Lightbulb className="w-6 h-6 text-yellow-900" />
            </div>
            <div>
              <CardTitle>Rekomendasi Aksi</CardTitle>
              <p className="text-sm text-gray-600">Produk terlaris dengan stok menipis. Segera isi ulang!</p>
            </div>
          </CardHeader>
<CardContent>
  <div className="space-y-3">
    {restockRecommendations.map(product => {
      // Hitung perkiraan hari sampai habis (jika ada data penjualan rata-rata)
      const daysLeft = product.avg_daily_sales > 0 
        ? Math.floor(product.stok / product.avg_daily_sales)
        : null;

      return (
        <div key={product.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
          {/* Bagian Kiri: Info Produk & Prediksi */}
          <div>
            <p className="font-bold text-black">{product.nama_produk}</p>
            {daysLeft !== null && (
              <p className="text-xs text-yellow-800 font-semibold italic">
                {`Diperkirakan habis dalam ~${daysLeft} hari`}
              </p>
            )}
          </div>

          {/* Bagian Kanan: Sisa Stok & Tombol Aksi */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-sm text-gray-500">Sisa</span>
              <p className="font-bold text-lg text-red-600">{product.stok}</p>
            </div>
            <Button 
              size="sm" 
              onClick={() => handleAddStockClick(product)} // <-- Memanggil fungsi yang sudah ada!
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold"
            >
              + Stok
            </Button>
          </div>
        </div>
      );
    })}
  </div>
</CardContent>
        </Card>
      )}

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
                <TableHead className="text-right">Aksi</TableHead>
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
        <TableCell className="text-right"> {/* <-- SEL BARU */}
        <Button variant="outline" size="sm" onClick={() => handleReprintClick(t)} className="text-purple-600 border-purple-300 hover:bg-purple-50 hover:text-purple-700">
          Cetak
        </Button>
      </TableCell>
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
    </div>
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
            
            {/* --- Dialog Barang Masuk --- */}
            <Dialog 
              open={isStockInOpen} 
              onOpenChange={(isOpen) => {
                setIsStockInOpen(isOpen);
                if (isOpen) {
                  // PERBAIKAN: Reset state saat dialog dibuka
                  setStockChangeData({ product_id: '', quantity: '' });
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl"><ArrowUp className="w-4 h-4 mr-2" />Barang Masuk</Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader><DialogTitle>Catat Barang Masuk</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <Combobox 
                    value={stockChangeData.product_id}
                    options={productOptions} 
                    onSelect={(val) => setStockChangeData(prev => ({...prev, product_id: val}))} 
                    placeholder="Pilih Produk..." 
                  />
                  <Input type="number" placeholder="Jumlah" value={stockChangeData.quantity} onChange={(e) => setStockChangeData(prev => ({...prev, quantity: e.target.value}))} />
                </div>
                <DialogFooter>
                  <Button onClick={() => handleStockChange('in')} className="bg-green-600 hover:bg-green-700">Simpan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* --- Dialog Barang Keluar --- */}
            <Dialog 
              open={isStockOutOpen} 
              onOpenChange={(isOpen) => {
                setIsStockOutOpen(isOpen);
                if (isOpen) {
                  // PERBAIKAN: Reset state saat dialog dibuka
                  setStockChangeData({ product_id: '', quantity: '' });
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl"><ArrowDown className="w-4 h-4 mr-2" />Barang Keluar</Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader><DialogTitle>Catat Barang Keluar</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <Combobox 
                    value={stockChangeData.product_id}
                    options={productOptions} 
                    onSelect={(val) => setStockChangeData(prev => ({...prev, product_id: val}))} 
                    placeholder="Pilih Produk..." 
                  />
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
            <Card key={card.title} className={`bg-white border-2 border-${card.color}-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer`}>
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
                      const prediction = salesPrediction.find(p => p.product_id == item.id);
                      let predictionText = null;
                      if (prediction && prediction.avg_daily_sales > 0) {
                        const daysLeft = Math.floor(item.stok / prediction.avg_daily_sales);
                        if (daysLeft <= 7) { // Hanya tampilkan jika prediksi di bawah 7 hari
                          predictionText = `Diperkirakan habis dalam ~${daysLeft} hari`;
                        }
                      }
    return (
      <TableRow key={item.id}>
        <TableCell className="font-semibold">
          {item.nama_produk}
          {/* --- TAMPILKAN TEKS PREDIKSI --- */}
          {predictionText && (
            <p className="text-xs text-gray-500 font-normal italic">{predictionText}</p>
          )}
        </TableCell>
        <TableCell>{item.stok}</TableCell>
        <TableCell>{MINIMUM_STOCK}</TableCell>
        <TableCell>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${status.className}`}>
            {status.label}
          </span>
        </TableCell>
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
          <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-black"><CardHeader><CardTitle className="text-sm font-bold text-gray-800 uppercase">Total Produk</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-black">{loadingProductSummary ? '...' : productSummary?.total_products}</div><p className="text-gray-600">Produk aktif</p></CardContent></Card>
          <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-orange-400"><CardHeader><CardTitle className="text-sm font-bold text-gray-800 uppercase">Kategori</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-orange-600">{loadingProductSummary ? '...' : productSummary?.distinct_categories}</div><p className="text-gray-600">Kategori produk</p></CardContent></Card>
          <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-green-400"><CardHeader><CardTitle className="text-sm font-bold text-gray-800 uppercase">Produk Baru</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-black">{loadingProductSummary ? '...' : productSummary?.new_this_month}</div><p className="text-gray-600">Bulan ini</p></CardContent></Card>
          <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-blue-400"><CardHeader><CardTitle className="text-sm font-bold text-gray-800 uppercase">Rata-rata Harga</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-black">{loadingProductSummary ? '...' : `Rp ${Math.round(productSummary?.avg_price || 0).toLocaleString('id-ID')}`}</div><p className="text-gray-600">Per produk</p></CardContent></Card>
        </div>
      {/* ^^^ ------------------------------------- ^^^ */}

      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl">
        <div className="p-8">
          <h4 className="text-xl font-bold text-black mb-6">Daftar Produk</h4>
          
          {/* PERUBAHAN UTAMA: DARI GRID MENJADI LIST */}
          <div className="flex flex-col gap-2">
            {loadingProducts ? <p>Memuat produk...</p> : products.map((product) => (
              <div key={product.id} className="flex items-center p-3 gap-4 rounded-lg hover:bg-gray-50">
                <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.nama_produk} layout="fill" objectFit="cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300"><Package className="h-8 w-8"/></div>
                  )}
                </div>

                {/* Bagian Detail Produk */}
                <div className="flex-grow grid grid-cols-3 items-center gap-4">
                    {/* Info Nama & Kategori */}
                    <div>
                        <p className="font-bold text-base text-black">{product.nama_produk}</p>
                        {product.kategori && <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">{product.kategori}</span>}
                    </div>
                    {/* Info Stok & Harga */}
                    <div>
                        <p className="text-gray-600 text-sm">Stok: {product.stok}</p>
                        <p className="text-lg font-bold text-orange-600">Rp {Number(product.harga).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button onClick={() => handleAddStockClick(product)} size="sm" className="bg-green-600 hover:bg-green-700"><Plus className="w-4 h-4 mr-1" /> Stok</Button>
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </>
);
  

const renderCustomers = () => {

  if (viewingCustomer) {
    const customerTier = getCustomerTier(customerLoyaltyCount);
    
 return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => setViewingCustomer(null)} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali ke Daftar Pelanggan
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- KOLOM KIRI --- */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-2 border-gray-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">{viewingCustomer.name}</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div><Label className="text-xs text-gray-500">Email</Label><p>{viewingCustomer.email || '-'}</p></div>
                <div><Label className="text-xs text-gray-500">Telepon</Label><p>{viewingCustomer.phone || '-'}</p></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-notes">Catatan Pelanggan</Label>
                <Textarea id="customer-notes" placeholder="Preferensi, alergi, dll." value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} rows={2}/>
                <Button onClick={handleSaveCustomerNotes} disabled={savingNotes} size="sm">{savingNotes && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan Catatan</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader><CardTitle>Ringkasan Statistik</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div><p className="text-sm text-gray-500 uppercase">Total Belanja</p><p className="text-2xl font-bold">Rp {customerStats.totalSpending.toLocaleString('id-ID')}</p></div>
              <div><p className="text-sm text-gray-500 uppercase">Produk Favorit</p><p className="text-2xl font-bold truncate">{customerStats.favoriteProduct}</p></div>
              <div><p className="text-sm text-gray-500 uppercase">Rata-rata Transaksi</p><p className="text-2xl font-bold">Rp {Math.round(customerStats.averageSpending).toLocaleString('id-ID')}</p></div>
            </CardContent>
          </Card>
        </div>

        {/* --- KOLOM KANAN --- */}
        <div className="lg:col-span-1">
          <Card className="bg-white h-full">
            <CardHeader><CardTitle>Status Loyalitas</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className={`relative p-2 rounded-full ${customerTier.color}`}><div className="bg-white p-3 rounded-full shadow-inner"><customerTier.icon className={`w-16 h-16 ${customerTier.iconColor}`} /></div></div>
              <h3 className={`mt-4 text-xl font-bold ${customerTier.iconColor}`}>{customerTier.name}</h3>
              <p className="text-sm text-gray-500">{customerLoyaltyCount} Total Transaksi</p>
              <div className="w-full mt-6 space-y-5">
                {profile?.loyalty_enabled && (<div><div className="flex justify-between items-center mb-1 text-xs"><span className="text-gray-600">Reward (Diskon {profile.loyalty_discount_percent}%)</span><span className="font-bold">{customerLoyaltyCount % profile.loyalty_threshold} / {profile.loyalty_threshold}</span></div><Progress value={(customerLoyaltyCount % profile.loyalty_threshold / profile.loyalty_threshold) * 100} /></div>)}
                {customerTier.nextTier ? (<div><div className="flex justify-between items-center mb-1 text-xs"><span className="text-gray-600">Progres ke {customerTier.nextTier.name}</span><span className="font-bold">{customerLoyaltyCount} / {customerTier.nextTier.threshold}</span></div><Progress value={(customerLoyaltyCount / customerTier.nextTier.threshold) * 100} className="[&>*]:bg-yellow-400" /></div>) : (<p className="text-sm font-semibold text-yellow-600 mt-2">Pencapaian Tertinggi!</p>)}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
      
      {/* --- TABEL RIWAYAT TRANSAKSI (DI LUAR GRID) --- */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl">
        <div className="p-8">
          <h4 className="text-xl font-bold text-black mb-6">Riwayat Transaksi</h4>
          <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Waktu</TableHead><TableHead>ID Transaksi</TableHead><TableHead>Detail Item</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{loadingHistory ? (<TableRow><TableCell colSpan={4} className="text-center">Memuat riwayat...</TableCell></TableRow>) : customerHistory.length === 0 ? (<TableRow><TableCell colSpan={4} className="text-center">Pelanggan ini belum memiliki transaksi.</TableCell></TableRow>) : (customerHistory.map(t => (<TableRow key={t.id}><TableCell>{new Date(t.created_at).toLocaleString('id-ID')}</TableCell><TableCell>{t.nomor_faktur || `#${t.id}`}</TableCell><TableCell>{t.items.map((item: any) => `${item.nama_produk} (x${item.quantity})`).join(', ')}</TableCell><TableCell className="text-right font-bold">Rp {t.total_amount.toLocaleString('id-ID')}</TableCell></TableRow>)))}</TableBody></Table></div>
        </div>
      </div>
    </div>
  );
}

  

  // Tampilan Daftar Pelanggan (Default)
  return (
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
          <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-green-400">
            <CardHeader><CardTitle className="text-sm font-bold text-gray-800 uppercase">Total Pelanggan</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-black text-black">{loadingSummary ? '...' : customerSummary.total_customers}</div><p className="text-green-600 font-medium">pelanggan terdaftar</p></CardContent>
          </Card>
          <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-orange-400">
            <CardHeader><CardTitle className="text-sm font-bold text-gray-800 uppercase">Pelanggan Baru</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-black text-orange-600">{loadingSummary ? '...' : customerSummary.new_last_30_days}</div><p className="text-gray-600">30 hari terakhir</p></CardContent>
          </Card>
          <Card className="bg-white border-2 border-red-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-red-400">
            <CardHeader><CardTitle className="text-sm font-bold text-red-800 uppercase">Pelanggan Tidak Aktif</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-black text-red-600">{loadingSummary ? '...' : customerSummary.inactive_customers}</div><p className="text-red-600">Perlu dihubungi</p></CardContent>
          </Card>
        </div>

        {/* ^^^ --------------------------------------------- ^^^ */}
        {/* VVV --- TABEL DAFTAR PELANGGAN BARU --- VVV */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl">
          <div className="p-8">
            <h4 className="text-xl font-bold text-black mb-6">Daftar Pelanggan</h4>
              <div className="flex items-center gap-4 mb-6">
    <Input
      placeholder="Cari nama, email, atau telepon..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="max-w-sm"
    />
    <Select value={tierFilter} onValueChange={setTierFilter}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter Tier" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Semua">Semua Tier</SelectItem>
        <SelectItem value="Bronze">Bronze</SelectItem>
        <SelectItem value="Silver">Silver</SelectItem>
        <SelectItem value="Gold">Gold</SelectItem>
      </SelectContent>
    </Select>
  </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
               <TableBody>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer.id} className="border-gray-200 hover:bg-gray-50">
                        <TableCell>
                          <button onClick={() => handleViewCustomerHistory(customer)} className="font-semibold text-orange-600 hover:underline">
                            {customer.name}
                          </button>
                        </TableCell>
                        <TableCell>{customer.email || '-'}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                        <TableCell><span className={`px-2 py-1 rounded-full text-xs font-semibold ${customer.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{customer.status}</span></TableCell>
                        <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => handleEditCustomerClick(customer)}>Edit</Button></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        Tidak ada pelanggan yang cocok.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
    </Table>
  </div>
</div>
        </div>
    </div>
       {/* --- DIALOG UNTUK TAMBAH PELANGGAN --- */}
    <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
      <DialogContent className="bg-white">
        {/* --- JUDUL DIALOG DINAMIS --- */}
        <DialogHeader><DialogTitle>{customerFormData.id ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSaveCustomer}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label htmlFor="name">Nama Pelanggan</Label><Input id="name" value={customerFormData.name} onChange={handleCustomerInputChange} required /></div>
            <div className="space-y-2"><Label htmlFor="email">Email (Opsional)</Label><Input id="email" type="email" value={customerFormData.email} onChange={handleCustomerInputChange} /></div>
            <div className="space-y-2"><Label htmlFor="phone">Telepon (Opsional)</Label><Input id="phone" value={customerFormData.phone} onChange={handleCustomerInputChange} /></div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
              {customerFormData.id ? 'Simpan Perubahan' : 'Simpan Pelanggan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>
  );
};

const renderReports = () => {
  // --- LOGIKA UNTUK MENYIAPKAN KONTEN LAPORAN (SUDAH BENAR) ---
  let reportContent;
  if (!isMounted || loadingReport) {
    reportContent = (
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl">
        <div className="p-8 text-center text-gray-500">
          <h4 className="text-xl font-bold text-black mb-4">{reportTitle}</h4>
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="mt-2">Memuat data laporan...</p>
        </div>
      </div>
    );
  } else if (activeReportType === 'products') {
    reportContent = (
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl">
        <div className="p-8">

<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
  <div className="text-center">
    <div className="text-3xl font-black text-black">Rp {productReportSummary.totalRevenue.toLocaleString('id-ID')}</div>
    <p className="text-gray-600 font-medium">Total Pendapatan</p>
  </div>
  <div className="text-center">
    <div className="text-3xl font-black text-orange-600">{productReportSummary.totalQuantity}</div>
    <p className="text-gray-600 font-medium">Total Kuantitas Terjual</p>
  </div>
  <div className="text-center">
    <div className="text-3xl font-black text-black truncate">{productReportSummary.bestseller}</div>
    <p className="text-gray-600 font-medium">Produk Terlaris</p>
  </div>
</div>
        
        {productReportData.length > 0 ? (
          <Table><TableHeader><TableRow><TableHead>Nama Produk</TableHead><TableHead>Jumlah Terjual</TableHead><TableHead className="text-right">Total Pendapatan</TableHead></TableRow></TableHeader><TableBody>{productReportData.map((p, i) => (<TableRow key={i}><TableCell>{p.nama_produk}</TableCell><TableCell>{p.total_quantity}</TableCell><TableCell className="text-right font-bold">Rp {p.total_revenue.toLocaleString('id-ID')}</TableCell></TableRow>))}</TableBody></Table>
        ) : (<div className="text-center text-gray-500 py-8"><p>Tidak ada data produk untuk ditampilkan pada filter yang dipilih.</p></div>)}
      </div>
      </div>
    );
  } else if (activeReportType === 'transactions' && reportData.length > 0) {
    reportContent = (
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl">
        <div className="p-8">
          <h4 className="text-xl font-bold text-black mb-6">{reportTitle}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center"><div className="text-3xl font-black text-black">Rp {reportSummary.revenue.toLocaleString('id-ID')}</div><p className="text-gray-600 font-medium">Total Pendapatan</p></div>
            <div className="text-center"><div className="text-3xl font-black text-orange-600">{reportSummary.count}</div><p className="text-gray-600 font-medium">Total Transaksi</p></div>
            <div className="text-center"><div className="text-3xl font-black text-gray-600">Rp {Math.round(reportSummary.average).toLocaleString('id-ID')}</div><p className="text-gray-600 font-medium">Rata-rata per Transaksi</p></div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Waktu</TableHead><TableHead>ID Transaksi</TableHead><TableHead>Detail</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
              <TableBody>{reportData.map((t) => (<TableRow key={t.nomor_faktur || t.id}><TableCell>{new Date(t.created_at).toLocaleString('id-ID')}</TableCell><TableCell>#{t.nomor_faktur}</TableCell><TableCell>{t.items.map((i:any) => `${i.nama_produk} (x${i.quantity})`).join(', ')}</TableCell><TableCell className="text-right font-bold">Rp {t.total_amount.toLocaleString('id-ID')}</TableCell><TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => handleReprintClick(t)}>Cetak</Button></TableCell></TableRow>))}</TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  } else {
    reportContent = (
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl">
        <div className="p-8 text-center text-gray-500">
          <h4 className="text-xl font-bold text-black mb-4">{reportTitle}</h4>
          <p>Tidak ada data untuk ditampilkan pada rentang tanggal yang dipilih.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* --- UI ASLI ANDA DIKEMBALIKAN --- */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-black tracking-tight">Laporan Bisnis</h3>
        <div className="flex gap-3">
          <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"><FileSpreadsheet className="w-4 h-4 mr-2" />Export Excel</Button>
          <Button onClick={handleExportPdf} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"><Download className="w-4 h-4 mr-2" />Download PDF</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card onClick={() => {
            const start = new Date(); start.setHours(0,0,0,0);
            const end = new Date(); end.setHours(23,59,59,999);
            setActiveReportType('transactions');
            // FITUR BARU: Judul dinamis dengan tanggal
            setReportTitle(`Ringkasan Penjualan Hari Ini (${format(start, "d MMM")})`);
            setDateRange({ from: start, to: end });
          }} className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-orange-400"><CardContent className="p-6 text-center"><FileText className="w-12 h-12 text-orange-500 mx-auto mb-4" /><h4 className="font-bold text-lg text-black mb-2">Laporan Harian</h4><p className="text-gray-600 text-sm">Ringkasan penjualan hari ini</p></CardContent></Card>
        <Card onClick={() => {
            const start = new Date(); start.setDate(start.getDate() - 7); start.setHours(0,0,0,0);
            const end = new Date(); end.setHours(23,59,59,999);
            setActiveReportType('transactions');
            // FITUR BARU: Judul dinamis dengan tanggal
            setReportTitle(`Ringkasan 7 Hari Terakhir (${format(start, "d MMM")} - ${format(end, "d MMM")})`);
            setDateRange({ from: start, to: end });
          }} className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-gray-400"><CardContent className="p-6 text-center"><BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" /><h4 className="font-bold text-lg text-black mb-2">Laporan Mingguan</h4><p className="text-gray-600 text-sm">Analisis 7 hari terakhir</p></CardContent></Card>
        <Card onClick={() => {
            const start = new Date(); start.setDate(1); start.setHours(0,0,0,0);
            const end = new Date(); end.setHours(23,59,59,999);
            setActiveReportType('transactions');
            // FITUR BARU: Judul dinamis dengan tanggal
            setReportTitle(`Ringkasan Bulan Ini (${format(start, "MMMM yyyy")})`);
            setDateRange({ from: start, to: end });
          }} className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-black"><CardContent className="p-6 text-center"><TrendingUp className="w-12 h-12 text-black mx-auto mb-4" /><h4 className="font-bold text-lg text-black mb-2">Laporan Bulanan</h4><p className="text-gray-600 text-sm">Performa bulan ini</p></CardContent></Card>
        <Card onClick={() => {
            setSelectedCategory(null);
            setActiveReportType('products');
            // FITUR BARU: Judul dinamis dengan tanggal
            if (dateRange?.from && dateRange.to) {
                setReportTitle(`Laporan Produk (${format(dateRange.from, "d MMM")} - ${format(dateRange.to, "d MMM")})`);
            } else {
                setReportTitle(`Laporan Produk`);
            }
            setComboboxKey(Date.now());
          }} className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-orange-400"><CardContent className="p-6 text-center"><Receipt className="w-12 h-12 text-orange-500 mx-auto mb-4" /><h4 className="font-bold text-lg text-black mb-2">Laporan Produk</h4><p className="text-gray-600 text-sm">Analisis per produk</p></CardContent></Card>
      </div>

       <div className="flex justify-center">
  {/* Div ini yang akan menjadi frame ringkas */}
  <div className="inline-flex flex-wrap items-center gap-3 p-2 rounded-2xl border bg-white shadow-md">
          
  {/* Grup Filter Tanggal */}
  <Button 
    variant={reportTitle.includes('3 Bulan') ? 'default' : 'outline'}
    onClick={() => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      setActiveReportType('transactions');
      setReportTitle(`Ringkasan 3 Bulan Terakhir (${format(start, "d MMM")} - ${format(end, "d MMM")})`);
      setDateRange({ from: start, to: end });
    }}
  >
    3 Bulan
  </Button>
  <Button 
    variant={reportTitle.includes('6 Bulan') ? 'default' : 'outline'}
    onClick={() => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 6);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      setActiveReportType('transactions');
      setReportTitle(`Ringkasan 6 Bulan Terakhir (${format(start, "d MMM")} - ${format(end, "d MMM")})`);
      setDateRange({ from: start, to: end });
    }}
  >
    6 Bulan
  </Button>
  <Popover>
    <PopoverTrigger asChild>
      <Button variant={"outline"} className="w-auto justify-start text-left font-normal text-gray-600">
        <CalendarIcon className="mr-2 h-4 w-4" />
        {dateRange?.from ? (`${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to || dateRange.from, "LLL dd, y")}`) : (<span>Pilih tanggal</span>)}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} /></PopoverContent>
  </Popover>

    {/* Filter Kategori */}
  <div className="w-full md:w-60">
    <Combobox
      key={comboboxKey}
      disabled={activeReportType !== 'products'}
      options={[{ value: 'semua', label: 'Semua Kategori' }, ...categoryList]}
      onSelect={(value) => setSelectedCategory(value === 'semua' ? null : value)}
      placeholder="Filter Kategori..."
    />
  </div>

    {/* Tombol Reset */}
    <Button onClick={handleResetFilters} variant="ghost" className="hover:bg-red-100 hover:text-red-800">
      Reset
    </Button>
  </div>
</div>

        {/* Konten Laporan */}                
      <div className="bg-white rounded-xl">
           <CardContent>{reportContent}</CardContent>
      </div>
    </div>
  );
};
  

  const renderAnalytics = () => (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-4">
      <h3 className="text-2xl font-bold text-black tracking-tight">Analitik & Grafik</h3>

      <div className="flex items-center gap-2">
        {[7, 30, 90].map(period => (
          <Button
            key={period}
            onClick={() => setAnalyticsPeriod(period)}
            variant={analyticsPeriod === period ? "default" : "outline"} // Ubah variant
            className={`transition-all ${analyticsPeriod === period ? 'bg-black text-white' : 'border-gray-300'}`}
          >
            {period} Hari Terakhir
          </Button>
        ))}
      </div>
      </div>

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
        <Card className="bg-white border-2 border-red-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-red-400"><CardHeader><CardTitle className="text-sm font-bold text-red-800 uppercase">Peringatan Kritis</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-red-600">{loadingNotifications ? '...' : criticalCount}</div><p className="text-red-600">Perlu perhatian segera</p></CardContent></Card>
        <Card className="bg-white border-2 border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-orange-400"><CardHeader><CardTitle className="text-sm font-bold text-orange-800 uppercase">Peringatan</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-orange-600">{loadingNotifications ? '...' : warningCount}</div><p className="text-orange-600">Perlu tindakan</p></CardContent></Card>
        <Card className="bg-white border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-blue-400"><CardHeader><CardTitle className="text-sm font-bold text-blue-800 uppercase">Info</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-blue-600">{loadingNotifications ? '...' : infoCount}</div><p className="text-blue-600">Informasi umum</p></CardContent></Card>
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

    case 'loyalty':
    return <LoyaltySettings profile={profile} onBack={() => setActiveSetting('main')} refreshProfileData={refreshProfileData} />;
    
    case 'printer':
    return <PrinterSettings 
            profile={profile} 
            onBack={() => setActiveSetting('main')} 
            onProfileUpdate={refreshProfileData} // <-- TAMBAHKAN INI
         />;

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
            <Card 
              onClick={() => setActiveSetting('printer')} // <-- TAMBAHKAN INI
              className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-orange-500"
            >
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
            <Card 
              onClick={() => setActiveSetting('loyalty')} 
              className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-orange-500"
            >
              <CardContent className="p-6 text-center">
                <Gift className="w-12 h-12 text-orange-500 mx-auto mb-4" />
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
      <DropdownMenuItem onClick={async () => await supabase!.auth.signOut()}>
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
    <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
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
              <Label htmlFor="gambar_produk" className="text-right">Gambar</Label>
            <div className="col-span-3">
              <Input id="gambar_produk" name="gambar_produk" type="file" />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Format: JPG, WebP, PNG. Ukuran maks: 200KB.
                </p>
            </div>
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

        <ReceiptPreviewDialog
      isOpen={isPreviewOpen}
      onClose={() => setIsPreviewOpen(false)}
      transaction={selectedTransaction}
      profile={profile}
    />
        </div>
        {sidebarOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>)}
      </div>
    )
  }
}


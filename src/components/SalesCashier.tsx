import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { FastItem, StagedItem, Transaction, PendingSale, PaymentMethod, Customer, CustomerType, CustomerStatus, SalesEntryMode } from '../types';
import { AutoIntegrationSales } from './AutoIntegrationSales';
import {
  fetchCustomersFromSupabase,
  addCustomerToSupabase,
  updateCustomerStatusInSupabase,
  updateCustomerCreditLimitInSupabase,
  deleteCustomerFromSupabase,
} from '../lib/customersService';

export const SalesCashier: React.FC = () => {
  const {
    language,
    customPalette,
    fastItems,
    customers,
    setCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    transactions,
    addTransaction,
    pendingSales,
    holdSale,
    restorePendingSale,
    cancelPendingSale,
    deductStockForTransaction,
  } = useApp();

  const isRtl = language === 'ar';

  // Fetch Customers from Supabase public.customers on mount
  useEffect(() => {
    async function loadCustomersFromSupabase() {
      const { data, error } = await fetchCustomersFromSupabase();
      if (!error && data.length > 0) {
        setCustomers(data);
      }
    }
    loadCustomersFromSupabase();
  }, [setCustomers]);

  // Entry Mode: 'manual' (يدوي) | 'auto_integration' (ربط تلقائي)
  const [salesEntryMode, setSalesEntryMode] = useState<SalesEntryMode>('manual');

  // Section Tabs: 'pos' (Cashier Terminal), 'customers' (Customer Database), 'history' (Sales History), 'pending' (Incomplete / Held Sales)
  const [activeTab, setActiveTab] = useState<'pos' | 'customers' | 'history' | 'pending'>('pos');

  // --- POS TERMINAL STATE ---
  const [cart, setCart] = useState<StagedItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [discountPct, setDiscountPct] = useState<number>(0);

  // Customer Selection & Customer Database State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(customers[0] || null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [custDatabaseSearch, setCustDatabaseSearch] = useState('');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustTarget, setDeletingCustTarget] = useState<Customer | null>(null);

  // Form State for Add Customer Modal
  const [custForm, setCustForm] = useState({
    name: '',
    phone1: '',
    phone2: '',
    address: '',
    email: '',
    type: 'Individual' as CustomerType,
  });

  // Modal 1: Engagement Status Rules Modal (تحديد درجة تفاعل العملاء)
  const [isEngagementModalOpen, setIsEngagementModalOpen] = useState(false);
  const [engagementTargetCustomer, setEngagementTargetCustomer] = useState<Customer | null>(null);
  const [newEngagementStatus, setNewEngagementStatus] = useState<CustomerStatus>('New');

  // Modal 2: Credit Limit Control Modal (إدارة حدود الائتمان)
  const [isCreditLimitModalOpen, setIsCreditLimitModalOpen] = useState(false);
  const [creditLimitTargetCustomer, setCreditLimitTargetCustomer] = useState<Customer | null>(null);
  const [newCreditLimitInput, setNewCreditLimitInput] = useState<string>('0.00');

  // Manual Item Form State
  const [manualDescription, setManualDescription] = useState('');
  const [manualPrice, setManualPrice] = useState<string>('');
  const [manualQty, setManualQty] = useState<number>(1);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [shiftNotes, setShiftNotes] = useState('');

  // Hold Sale Modal State
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [holdNote, setHoldNote] = useState('');

  // Receipt Details Modal State
  const [viewingReceipt, setViewingReceipt] = useState<Transaction | null>(null);

  // Success Confirmation Notice
  const [lastConfirmedTx, setLastConfirmedTx] = useState<Transaction | null>(null);

  // Track recently confirmed/deducted item IDs with timestamp (for 5-minute red stock highlight)
  const [recentlyDeducted, setRecentlyDeducted] = useState<Record<string, number>>({});

  // Pagination state (Strict limit: max 3 items displayed in selection views)
  const [productPage, setProductPage] = useState<number>(1);
  const [customerPage, setCustomerPage] = useState<number>(1);

  // Categories for catalog filter
  const categories = ['all', 'Retail', 'Service', 'Wholesale'];

  // Filtered Catalog Items
  const filteredCatalog = fastItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const nameMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.nameAr && item.nameAr.includes(searchTerm)) ||
      (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && nameMatch;
  });

  // Strict Max 3 items slice for Products
  const totalProductPages = Math.ceil(filteredCatalog.length / 3) || 1;
  const currentProductPage = Math.min(productPage, totalProductPages);
  const visibleCatalog = filteredCatalog.slice((currentProductPage - 1) * 3, currentProductPage * 3);

  // Filtered Customers by Name or Phone
  const filteredCustomers = customers.filter((cust) => {
    const term = customerSearchTerm.trim().toLowerCase();
    if (!term) return true;
    return cust.name.toLowerCase().includes(term) || cust.phone.includes(term) || (cust.company && cust.company.toLowerCase().includes(term));
  });

  // Strict Max 3 items slice for Customers
  const totalCustomerPages = Math.ceil(filteredCustomers.length / 3) || 1;
  const currentCustomerPage = Math.min(customerPage, totalCustomerPages);
  const visibleCustomers = filteredCustomers.slice((currentCustomerPage - 1) * 3, currentCustomerPage * 3);

  // Calculate Cart Subtotal, Tax (8%), Discount, Grand Total
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountAmount = (subtotal * discountPct) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = taxableAmount * 0.08;
  const total = taxableAmount + tax;

  // Change due calculation
  const numericPaid = parseFloat(amountPaid) || total;
  const changeDue = Math.max(0, numericPaid - total);

  // Handlers for POS Cart
  const handleAddToCart = (item: FastItem) => {
    // Stock Check Validation
    const existingStaged = cart.find((i) => i.originalFastItemId === item.id || i.name === (isRtl && item.nameAr ? item.nameAr : item.name));
    const currentQtyInCart = existingStaged ? existingStaged.quantity : 0;
    const availableStock = item.stockQuantity;

    if (currentQtyInCart + 1 > availableStock) {
      alert(
        isRtl
          ? `عفواً! الكمية المتاحة في المخزون للمنتج (${item.nameAr || item.name}) هي (${availableStock} ${item.unit || 'قطعة'}) فقط. لا يمكن إدخال كمية تتجاوز المخزون.`
          : `Insufficient stock! Only ${availableStock} ${item.unit || 'unit(s)'} available.`
      );
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((i) => i.originalFastItemId === item.id || i.name === (isRtl && item.nameAr ? item.nameAr : item.name));
      if (existing) {
        return prevCart.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        const newItem: StagedItem = {
          id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          name: isRtl && item.nameAr ? item.nameAr : item.name,
          category: item.category,
          unitPrice: item.price,
          quantity: 1,
          discountPct: 0,
          originalFastItemId: item.id,
        };
        return [...prevCart, newItem];
      }
    });
  };

  const handleUpdateQty = (id: string, delta: number) => {
    if (delta > 0) {
      const targetItem = cart.find((i) => i.id === id);
      if (targetItem) {
        const catalogMatch = fastItems.find(
          (fi) => fi.id === targetItem.originalFastItemId || fi.name === targetItem.name || (fi.nameAr && fi.nameAr === targetItem.name)
        );
        if (catalogMatch && targetItem.quantity + delta > catalogMatch.stockQuantity) {
          alert(
            isRtl
              ? `عفواً! الكمية المتاحة بالرصيد لـ (${catalogMatch.nameAr || catalogMatch.name}) هي (${catalogMatch.stockQuantity} ${catalogMatch.unit || 'قطعة'}) فقط.`
              : `Cannot exceed available stock limit (${catalogMatch.stockQuantity})!`
          );
          return;
        }
      }
    }

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as StagedItem[]
    );
  };

  const handleDirectQtyChange = (id: string, newQtyVal: number) => {
    if (isNaN(newQtyVal) || newQtyVal < 0) return;

    if (newQtyVal === 0) {
      setCart((prev) => prev.filter((i) => i.id !== id));
      return;
    }

    const targetItem = cart.find((i) => i.id === id);
    if (targetItem) {
      const catalogMatch = fastItems.find(
        (fi) => fi.id === targetItem.originalFastItemId || fi.name === targetItem.name || (fi.nameAr && fi.nameAr === targetItem.name)
      );
      if (catalogMatch && newQtyVal > catalogMatch.stockQuantity) {
        alert(
          isRtl
            ? `عفواً! الكمية المتاحة بالرصيد لـ (${catalogMatch.nameAr || catalogMatch.name}) هي (${catalogMatch.stockQuantity} ${catalogMatch.unit || 'قطعة'}) فقط.`
            : `Cannot exceed available stock limit (${catalogMatch.stockQuantity})!`
        );
        setCart((prev) =>
          prev.map((item) => (item.id === id ? { ...item, quantity: catalogMatch.stockQuantity } : item))
        );
        return;
      }
    }

    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQtyVal } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  // Instant Clear Cart Handler (زر تفريغ الفاتورة الحالية)
  const handleClearCart = () => {
    setCart([]);
    setDiscountPct(0);
  };

  // Customer Management Handlers
  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setCustForm({
      name: '',
      phone1: '',
      phone2: '',
      address: '',
      email: '',
      type: 'Individual',
    });
    setIsAddCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (cust: Customer) => {
    setEditingCustomer(cust);
    setCustForm({
      name: cust.name,
      phone1: cust.phone || '',
      phone2: cust.phone2 || '',
      address: cust.address || '',
      email: cust.email || '',
      type: cust.type || 'Individual',
    });
    setIsAddCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("1. Submit triggered - Customer Form Data:", custForm);

    if (!custForm.name.trim() || !custForm.phone1.trim() || !custForm.address.trim()) {
      alert(isRtl ? 'يرجى استكمال الحقول الإجبارية: اسم العميل، رقم الهاتف الأول، والعنوان!' : 'Please fill required fields: Customer Name, Phone 1, and Address!');
      return;
    }

    const customerParams = {
      name: custForm.name.trim(),
      phone1: custForm.phone1.trim(),
      phone2: custForm.phone2.trim() || undefined,
      address: custForm.address.trim(),
      email: custForm.email.trim() || undefined,
      type: custForm.type || 'Individual',
      status: 'New' as CustomerStatus,
      creditLimit: 0.0,
    };

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: customerParams.name,
        phone: customerParams.phone1,
        phone2: customerParams.phone2,
        address: customerParams.address,
        email: customerParams.email,
        type: customerParams.type,
      });
      const updatedObj = { ...editingCustomer, ...customerParams, phone: customerParams.phone1 };
      if (selectedCustomer?.id === editingCustomer.id) {
        setSelectedCustomer(updatedObj);
      }
      alert(isRtl ? 'تم تحديث بيانات العميل بنجاح!' : 'Customer updated successfully!');
    } else {
      // Direct async insertion into Supabase public.customers table
      console.log('2. Inserting Customer Payload directly to Supabase public.customers:', customerParams);
      const result = await addCustomerToSupabase(customerParams);

      if (result.success && result.data) {
        console.log('✅ Successfully inserted customer in Supabase:', result.data);
        alert(isRtl ? 'تم حفظ العميل بنجاح في قاعدة بيانات Supabase!' : 'Customer saved successfully in Supabase!');
        
        const createdCustomer = result.data;
        setCustomers((prev) => [createdCustomer, ...prev]);
        setSelectedCustomer(createdCustomer);
      } else {
        console.error('❌ Supabase Insert Error:', result.error);
        alert(isRtl ? `خطأ أثناء الحفظ في Supabase: ${result.error || 'تأكد من الاتصال'}` : `Error saving to Supabase: ${result.error}`);
        
        // Fallback local save
        const fallbackCreated = addCustomer({
          name: customerParams.name,
          phone: customerParams.phone1,
          phone2: customerParams.phone2,
          address: customerParams.address,
          email: customerParams.email,
          type: customerParams.type,
          status: 'New',
          creditLimit: 0.0,
        });
        setSelectedCustomer(fallbackCreated);
      }
    }

    setCustForm({ name: '', phone1: '', phone2: '', address: '', email: '', type: 'Individual' });
    setEditingCustomer(null);
    setIsAddCustomerModalOpen(false);
  };

  const handleSaveEngagementStatus = async () => {
    if (!engagementTargetCustomer) return;
    const res = await updateCustomerStatusInSupabase(engagementTargetCustomer.id, newEngagementStatus);
    if (res.success) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === engagementTargetCustomer.id ? { ...c, status: newEngagementStatus } : c))
      );
      if (selectedCustomer?.id === engagementTargetCustomer.id) {
        setSelectedCustomer((prev) => prev ? { ...prev, status: newEngagementStatus } : null);
      }
      alert(isRtl ? 'تم تحديث درجة تفاعل العميل بنجاح!' : 'Customer engagement status updated!');
    } else {
      alert(isRtl ? `فشل تحديث الحالة: ${res.error}` : `Failed to update status: ${res.error}`);
    }
    setIsEngagementModalOpen(false);
    setEngagementTargetCustomer(null);
  };

  const handleSaveCreditLimit = async () => {
    if (!creditLimitTargetCustomer) return;
    const numericLimit = parseFloat(newCreditLimitInput) || 0.0;
    const res = await updateCustomerCreditLimitInSupabase(creditLimitTargetCustomer.id, numericLimit);
    if (res.success) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === creditLimitTargetCustomer.id ? { ...c, creditLimit: numericLimit } : c))
      );
      if (selectedCustomer?.id === creditLimitTargetCustomer.id) {
        setSelectedCustomer((prev) => prev ? { ...prev, creditLimit: numericLimit } : null);
      }
      alert(isRtl ? 'تم تحديث حدود الائتمان بنجاح!' : 'Credit limit updated successfully!');
    } else {
      alert(isRtl ? `فشل تحديث حدود الائتمان: ${res.error}` : `Failed to update credit limit: ${res.error}`);
    }
    setIsCreditLimitModalOpen(false);
    setCreditLimitTargetCustomer(null);
  };

  const handleDeleteCustomer = async (cust: Customer) => {
    if (window.confirm(isRtl ? `هل أنت تأكد من حذف العميل (${cust.name})؟` : `Delete customer ${cust.name}?`)) {
      await deleteCustomerFromSupabase(cust.id);
      deleteCustomer(cust.id);
      if (selectedCustomer?.id === cust.id) {
        setSelectedCustomer(null);
      }
    }
  };

  // Open Checkout Modal
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setAmountPaid(total.toFixed(2));
    setShiftNotes('');
    setIsCheckoutOpen(true);
  };

  // Confirm Sale & Process Inventory
  const handleConfirmSale = () => {
    if (cart.length === 0) return;

    const receiptNo = `#TX-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const itemsSummaryStr = cart.map((i) => `${i.quantity}x ${i.name}`).join(', ');

    const finalCustomerName = selectedCustomer ? selectedCustomer.name : (isRtl ? 'عميل نقدي' : 'Cash Customer');

    const newTx: Omit<Transaction, 'id'> = {
      receiptNo,
      time: timeStr,
      date: dateStr,
      itemsSummary: itemsSummaryStr,
      items: cart,
      subtotal,
      tax,
      total,
      paymentMethod,
      status: 'Completed',
      shiftNotes: shiftNotes.trim() || (isRtl ? 'تم البيع عبر الكاشير' : 'Cashier Direct POS'),
      cashier: 'S. Alvarez',
      amountPaid: numericPaid,
      changeDue,
      customerName: finalCustomerName,
    };

    // 1. Add to sales history transactions
    addTransaction(newTx);

    // 2. DEDUCT INVENTORY STOCK
    deductStockForTransaction(cart);

    // 3. Mark items as recently confirmed with timestamp for 5-minute red highlight
    const nowTs = Date.now();
    setRecentlyDeducted((prev) => {
      const nextMap = { ...prev };
      cart.forEach((c) => {
        if (c.originalFastItemId) {
          nextMap[c.originalFastItemId] = nowTs;
        }
      });
      return nextMap;
    });

    // Set last confirmed tx for receipt feedback
    const txCreated: Transaction = { ...newTx, id: `tx-${Date.now()}` };
    setLastConfirmedTx(txCreated);

    // Clear cart and close modal
    setCart([]);
    setDiscountPct(0);
    setIsCheckoutOpen(false);
  };

  // Hold / Save Incomplete Sale
  const handleConfirmHoldSale = () => {
    if (cart.length === 0) return;

    const finalCustomerName = selectedCustomer ? selectedCustomer.name : (isRtl ? 'فاتورة معلقة' : 'Held Invoice');

    holdSale({
      customerName: finalCustomerName,
      notes: holdNote.trim() || (isRtl ? 'تم تعليق العملية لاستكمال الدفع لاحقاً' : 'Held for later completion'),
      items: cart,
      subtotal,
      tax,
      total,
    });

    setCart([]);
    setDiscountPct(0);
    setIsHoldModalOpen(false);
    setHoldNote('');
    alert(isRtl ? 'تم حفظ العملية بنجاح في قسم (فواتير معلقة)' : 'Sale saved to Pending Invoices tab!');
  };

  // Restore Pending Sale into Active POS Cart
  const handleRestorePending = (pendingId: string) => {
    const restored = restorePendingSale(pendingId);
    if (restored) {
      setCart(restored.items);
      // Link customer if matched
      if (restored.customerName) {
        const matchedCust = customers.find((c) => c.name === restored.customerName);
        if (matchedCust) setSelectedCustomer(matchedCust);
      }
      setActiveTab('pos');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Mode Switcher: الربط اليدوي | الربط الآلي */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 px-1">
            {isRtl ? 'طريقة الربط وتسجيل المبيعات:' : 'Integration Mode:'}
          </span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSalesEntryMode('manual')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                salesEntryMode === 'manual'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-base">touch_app</span>
              <span>{isRtl ? 'الربط اليدوي' : 'Manual Linking'}</span>
            </button>

            <button
              onClick={() => setSalesEntryMode('auto_integration')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                salesEntryMode === 'auto_integration'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-base">hub</span>
              <span>{isRtl ? 'الربط الآلي' : 'Automated Linking'}</span>
            </button>
          </div>
        </div>

        {salesEntryMode === 'auto_integration' && (
          <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {isRtl ? 'محرك الربط الآلي والمزامنة التلقائية نشط' : 'Auto Engine Active'}
          </span>
        )}
      </div>

      {salesEntryMode === 'auto_integration' ? (
        <AutoIntegrationSales />
      ) : (
        <>
          {/* Top Header Card & Section Tabs */}
          <div
            style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
            className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors"
          >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm"
            style={{ backgroundColor: customPalette.primaryAccent }}
          >
            <span className="material-symbols-outlined text-2xl">point_of_sale</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{isRtl ? 'شاشة المبيعات والكاشير' : 'Sales & Cashier Terminal'}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                {isRtl ? 'مستمر' : 'Active'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isRtl
                ? 'تسجيل المبيعات المباشرة واليدوية، حسم المخزون التلقائي، وتحديد العميل.'
                : 'Direct cashier checkout, manual item entry, automated inventory sync, and customer selection.'}
            </p>
          </div>
        </div>

        {/* Main View Tabs (الكاشير | قاعدة العملاء | سجل المبيعات | فواتير معلقة) */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('pos')}
            title={isRtl ? 'الكاشير' : 'Cashier'}
            className={`group relative px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span className="material-symbols-outlined text-base text-indigo-600">shopping_cart</span>
            <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out text-xs font-bold">
              {isRtl ? 'الكاشير' : 'Cashier'}
            </span>
            {cart.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                {cart.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            title={isRtl ? 'قاعدة العملاء' : 'Customer Database'}
            className={`group relative px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span className="material-symbols-outlined text-base text-purple-600">group</span>
            <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out text-xs font-bold">
              {isRtl ? 'قاعدة العملاء' : 'Customers'}
            </span>
            <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-800 text-[9px] font-bold shrink-0">
              {customers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            title={isRtl ? 'سجل المبيعات' : 'Sales History'}
            className={`group relative px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span className="material-symbols-outlined text-base text-emerald-600">receipt_long</span>
            <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out text-xs font-bold">
              {isRtl ? 'سجل المبيعات' : 'Sales History'}
            </span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-200/80 text-slate-700 text-[9px] shrink-0">
              {transactions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            title={isRtl ? 'فواتير معلقة' : 'Pending Invoices'}
            className={`group relative px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span className="material-symbols-outlined text-base text-amber-600">pending_actions</span>
            <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out text-xs font-bold">
              {isRtl ? 'فواتير معلقة' : 'Pending Invoices'}
            </span>
            {pendingSales.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-amber-500 text-white text-[9px] font-bold shrink-0">
                {pendingSales.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION BANNER */}
      {lastConfirmedTx && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">✓</span>
            <div>
              <div className="text-xs font-bold text-emerald-900">
                {isRtl ? `تم إتمام الفاتورة رقم ${lastConfirmedTx.receiptNo} بنجاح للعميل (${lastConfirmedTx.customerName})!` : `Sale ${lastConfirmedTx.receiptNo} confirmed for ${lastConfirmedTx.customerName}!`}
              </div>
              <div className="text-[11px] text-emerald-700">
                {isRtl ? `الإجمالي: $${lastConfirmedTx.total.toFixed(2)} • تم حسم الكميات من المخزون تلقائياً` : `Total: $${lastConfirmedTx.total.toFixed(2)} • Inventory stock updated`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewingReceipt(lastConfirmedTx)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              {isRtl ? 'عرض الفاتورة' : 'View Receipt'}
            </button>
            <button
              onClick={() => setLastConfirmedTx(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: CASHIER POS TERMINAL */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 7 COLS: Dual Search Rows (Product Item Search & Customer Search + Single Row Catalog) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* DUAL SIDE-BY-SIDE COLUMNS: PRODUCTS COLUMN & CUSTOMERS COLUMN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* COLUMN 1: PRODUCTS COLUMN (صف/عمود المنتجات والخدمات مع محرك البحث والصف العمودي) */}
              <div
                style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
                className="p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-600 text-base">inventory_2</span>
                    <span>{isRtl ? '( حدد منتجات الفاتورة )' : '( Select Invoice Products )'}</span>
                  </div>
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 font-bold px-2 py-0.5 rounded-md">
                    {filteredCatalog.length} {isRtl ? 'عنصر' : 'items'}
                  </span>
                </div>

                {/* Products Search Engine (محرك بحث المنتجات) */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setProductPage(1);
                    }}
                    placeholder={isRtl ? 'ابحث باسم المنتج أو الكود...' : 'Search product by name or code...'}
                    className="w-full pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>



                {/* VERTICAL Scrollable Product Items directly below Product Search - MAX 3 VISIBLE AT A TIME */}
                <div className="flex flex-col gap-2 min-h-[220px]">
                  {visibleCatalog.length === 0 ? (
                    <div className="w-full py-12 text-center text-slate-400 text-xs">
                      {isRtl ? 'لا توجد منتجات مطابقة للبحث' : 'No matching products'}
                    </div>
                  ) : (
                    visibleCatalog.map((item) => {
                      const actualStock = item.stockQuantity ?? 50;

                      // Staged quantity in active cart/invoice
                      const stagedQty = cart.reduce((acc, c) => {
                        const matchId = c.originalFastItemId === item.id;
                        const matchName = c.name === item.name || (item.nameAr && c.name === item.nameAr);
                        return matchId || matchName ? acc + c.quantity : acc;
                      }, 0);

                      const displayStock = Math.max(0, actualStock - stagedQty);

                      // Check if item was confirmed/deducted in the last 5 minutes (300,000 ms)
                      const lastDeductedTime = recentlyDeducted[item.id];
                      const isRecentlyDeducted = Boolean(lastDeductedTime && (Date.now() - lastDeductedTime < 300000));

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleAddToCart(item)}
                          className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                            isRecentlyDeducted
                              ? 'border-rose-400 bg-rose-50/50 shadow-2xs'
                              : stagedQty > 0
                              ? 'border-amber-400 bg-amber-50/40 shadow-2xs'
                              : 'border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-indigo-400'
                          }`}
                        >
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                {isRtl && item.nameAr ? item.nameAr : item.name}
                              </h3>
                              <span className="text-[9px] font-mono text-slate-400 font-bold bg-slate-200/60 px-1.5 py-0.2 rounded">
                                {item.code || `ID-${item.id}`}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-extrabold text-indigo-700 font-mono">${item.price.toFixed(2)}</span>

                              {/* STOCK BADGE: RED if confirmed in last 5 min, ORANGE if staged in active invoice, normal otherwise */}
                              {isRecentlyDeducted ? (
                                <span className="text-[10px] font-extrabold text-rose-600 bg-rose-100/80 border border-rose-300 px-2 py-0.5 rounded-md animate-pulse flex items-center gap-1">
                                  <span>{isRtl ? 'المخزون:' : 'Stock:'}</span>
                                  <span className="font-mono text-xs text-rose-700">{displayStock}</span>
                                </span>
                              ) : stagedQty > 0 ? (
                                <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100/80 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <span>{isRtl ? 'المخزون:' : 'Stock:'}</span>
                                  <span className="font-mono text-xs text-amber-800">{displayStock}</span>
                                  <span className="text-[9px] text-amber-700 font-semibold">(-{stagedQty})</span>
                                </span>
                              ) : (
                                <span className={`text-[10px] font-semibold ${actualStock <= 10 ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>
                                  {isRtl ? `المخزون: ${actualStock}` : `Stock: ${actualStock}`}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-2xs cursor-pointer ${
                              isRecentlyDeducted
                                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                : stagedQty > 0
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                          >
                            <span>+</span>
                            <span>{isRtl ? 'إضافة' : 'Add'}</span>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Product Pagination Bar (تنقل 3 عناصر كحد أقصى) */}
                {totalProductPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-semibold text-slate-600">
                    <button
                      type="button"
                      disabled={currentProductPage <= 1}
                      onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isRtl ? '← السابق' : '← Prev'}
                    </button>
                    <span className="text-[10px] font-bold text-indigo-700 font-mono">
                      {isRtl ? `صفحة ${currentProductPage} من ${totalProductPages}` : `Page ${currentProductPage} of ${totalProductPages}`}
                    </span>
                    <button
                      type="button"
                      disabled={currentProductPage >= totalProductPages}
                      onClick={() => setProductPage((p) => Math.min(totalProductPages, p + 1))}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isRtl ? 'التالي →' : 'Next →'}
                    </button>
                  </div>
                )}
              </div>

              {/* COLUMN 2: CUSTOMERS COLUMN (صف/عمود العملاء مع محرك البحث والصف العمودي - MAX 3 VISIBLE AT A TIME) */}
              <div
                style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
                className="p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-600 text-base">group</span>
                    <span>{isRtl ? '( اختر العميل )' : '( Select Customer )'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddCustomer}
                    className="px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>+ {isRtl ? 'عميل جديد' : 'New Customer'}</span>
                  </button>
                </div>

                {/* Customer Search Engine (محرك بحث العملاء باسمه أو رقم هاتفه) */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">contact_phone</span>
                  <input
                    type="text"
                    value={customerSearchTerm}
                    onChange={(e) => {
                      setCustomerSearchTerm(e.target.value);
                      setCustomerPage(1);
                    }}
                    placeholder={isRtl ? 'ابحث باسم العميل أو رقم الهاتف...' : 'Search customer by name or phone...'}
                    className="w-full pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>



                {/* VERTICAL Customer List directly below Customer Search - MAX 3 VISIBLE AT A TIME */}
                <div className="flex flex-col gap-2 min-h-[220px]">
                  {visibleCustomers.length === 0 ? (
                    <div className="w-full py-12 text-center text-slate-400 text-xs">
                      {isRtl ? 'لا يوجد عميل مطابق' : 'No matching customers'}
                    </div>
                  ) : (
                    visibleCustomers.map((cust) => {
                      const isSelected = selectedCustomer?.id === cust.id;
                      return (
                        <div
                          key={cust.id}
                          onClick={() => setSelectedCustomer(cust)}
                          className={`w-full p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/90 shadow-xs'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {cust.name}
                              </span>
                              {cust.company && (
                                <span className="text-[9px] text-slate-500 bg-slate-200/50 px-1.5 py-0.2 rounded truncate">
                                  {cust.company}
                                </span>
                              )}
                            </div>

                            <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                              📞 {cust.phone}
                            </span>
                          </div>

                          <div className="flex items-center">
                            {isSelected ? (
                              <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                                <span>✓</span>
                                <span>{isRtl ? 'محدد' : 'Selected'}</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-[10px] font-bold transition-colors">
                                {isRtl ? 'اختيار' : 'Select'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Customer Pagination Bar (تنقل 3 عناصر كحد أقصى) */}
                {totalCustomerPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-semibold text-slate-600">
                    <button
                      type="button"
                      disabled={currentCustomerPage <= 1}
                      onClick={() => setCustomerPage((p) => Math.max(1, p - 1))}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isRtl ? '← السابق' : '← Prev'}
                    </button>
                    <span className="text-[10px] font-bold text-indigo-700 font-mono">
                      {isRtl ? `صفحة ${currentCustomerPage} من ${totalCustomerPages}` : `Page ${currentCustomerPage} of ${totalCustomerPages}`}
                    </span>
                    <button
                      type="button"
                      disabled={currentCustomerPage >= totalCustomerPages}
                      onClick={() => setCustomerPage((p) => Math.min(totalCustomerPages, p + 1))}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isRtl ? 'التالي →' : 'Next →'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: Active Cart / Invoice Summary (الفاتورة الحالية) */}
          <div className="lg:col-span-5 flex flex-col gap-4 sticky top-20">
            <div
              style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
              className="p-5 rounded-2xl border border-slate-200/80 shadow-md flex flex-col gap-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600">receipt</span>
                    <h2 className="font-bold text-base text-slate-900">
                      {isRtl ? 'الفاتورة الحالية' : 'Active Invoice'}
                    </h2>
                  </div>
                  {selectedCustomer && (
                    <span className="text-[11px] font-bold text-indigo-700 mt-0.5">
                      {isRtl ? `العميل: ${selectedCustomer.name}` : `Customer: ${selectedCustomer.name}`}
                    </span>
                  )}
                </div>

                {cart.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="text-xs text-rose-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">delete_sweep</span>
                    <span>{isRtl ? 'تفريغ' : 'Clear'}</span>
                  </button>
                )}
              </div>

              {/* Cart List */}
              <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">shopping_bag</span>
                    <span className="text-xs font-bold text-slate-600">
                      {isRtl ? 'الفاتورة فارغة حالياً' : 'Current Invoice is Empty'}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      {isRtl ? 'اختر من المنتجات المسجلة أو أضف بيعاً يدوياً' : 'Pick items from catalog or enter a manual sale'}
                    </span>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-bold text-slate-900 truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ${item.unitPrice.toFixed(2)} × {item.quantity} = ${(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, -1)}
                            className="w-6 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer font-bold border-r border-slate-200 text-sm"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity === 0 ? '' : item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              handleDirectQtyChange(item.id, isNaN(val) ? 0 : val);
                            }}
                            onFocus={(e) => e.target.select()}
                            className="w-12 h-7 text-center font-bold text-xs focus:outline-none focus:bg-indigo-50/80 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            title={isRtl ? 'أدخل الكمية يدوياً' : 'Type quantity manually'}
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, 1)}
                            className="w-6 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer font-bold border-l border-slate-200 text-sm"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Calculation Summary Box */}
              <div className="border-t border-slate-200/80 pt-3 flex flex-col gap-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>{isRtl ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                  <span className="font-mono font-semibold">${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <span>{isRtl ? 'الخصم (%):' : 'Discount (%):'}</span>
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    className="w-16 h-7 px-1 text-center bg-slate-50 border border-slate-200 rounded font-mono font-bold text-xs"
                  />
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>{isRtl ? 'ضريبة القيمة المضافة (8%):' : 'Tax (8% VAT):'}</span>
                  <span className="font-mono font-semibold">${tax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2.5 mt-1">
                  <span>{isRtl ? 'الإجمالي النهائي:' : 'Grand Total:'}</span>
                  <span className="text-indigo-600 font-mono">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={handleOpenCheckout}
                  disabled={cart.length === 0}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  style={{ backgroundColor: customPalette.primaryAccent }}
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <span>{isRtl ? 'إتمام البيع والتأكيد' : 'Complete Sale & Checkout'}</span>
                </button>

                <button
                  onClick={() => setIsHoldModalOpen(true)}
                  disabled={cart.length === 0}
                  className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">pause_circle</span>
                  <span>{isRtl ? 'تعليق الفاتورة (حفظ مؤقت)' : 'Hold Invoice (Save Pending)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER DATABASE (قاعدة العملاء) - Matching Image 1 Design */}
      {activeTab === 'customers' && (
        <div className="flex flex-col gap-5 w-full">
          {/* 1. Header Banner Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Title & Subtitle */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <span className="material-symbols-outlined text-2xl">group</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {isRtl ? 'قاعدة بيانات العملاء' : 'Customer Database'}
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono">
                    {customers.length} {isRtl ? 'عميل' : 'clients'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {isRtl
                    ? 'عرض وحفظ وتحديث بيانات جميع العملاء المسجلين في النظام لاستخدامهم المباشر في المبيعات.'
                    : 'View, save, and update all registered customer data for direct use in sales.'}
                </p>
              </div>
            </div>

            {/* Header Right Actions / Switcher Pills */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
              <button
                onClick={handleOpenAddCustomer}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                <span>{isRtl ? '+ إضافة عميل جديد' : '+ Add New Customer'}</span>
              </button>

              <button
                onClick={() => {
                  if (customers.length > 0) {
                    setEngagementTargetCustomer(customers[0]);
                    setNewEngagementStatus(customers[0].status || 'New');
                    setIsEngagementModalOpen(true);
                  } else {
                    alert(isRtl ? 'يرجى إضافة عميل أولاً لتحديد درجة التفاعل.' : 'Please add a customer first.');
                  }
                }}
                className="px-3.5 py-2 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs rounded-xl shadow-2xs border border-slate-200/80 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-amber-500">analytics</span>
                <span>{isRtl ? 'تحديد درجة تفاعل العملاء' : 'Engagement Rules'}</span>
              </button>

              <button
                onClick={() => {
                  if (customers.length > 0) {
                    setCreditLimitTargetCustomer(customers[0]);
                    setNewCreditLimitInput((customers[0].creditLimit || 0).toString());
                    setIsCreditLimitModalOpen(true);
                  } else {
                    alert(isRtl ? 'يرجى إضافة عميل أولاً لتحديد حدود الائتمان.' : 'Please add a customer first.');
                  }
                }}
                className="px-3.5 py-2 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs rounded-xl shadow-2xs border border-slate-200/80 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-emerald-600">credit_score</span>
                <span>{isRtl ? 'إدارة حدود الائتمان' : 'Credit Limits'}</span>
              </button>
            </div>
          </div>

          {/* 2. Three Summary Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stat Card 1: Total Customers */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-600">
                  {isRtl ? 'إجمالي قاعدة العملاء' : 'Total Customer Base'}
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {customers.length}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {isRtl ? 'عملاء مسجلون في Supabase' : 'Registered clients in Supabase'}
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">group</span>
              </div>
            </div>

            {/* Stat Card 2: Corporate & Companies */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-600">
                  {isRtl ? 'عدد حسابات الشركات' : 'Company Accounts'}
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {customers.filter((c) => c.type === 'Company' || Boolean(c.company)).length}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {isRtl ? 'مؤسسات وشركات تجارية' : 'Commercial entities'}
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">domain</span>
              </div>
            </div>

            {/* Stat Card 3: Individuals */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-600">
                  {isRtl ? 'عدد الأفراد المباشرين' : 'Individual Accounts'}
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {customers.filter((c) => c.type !== 'Company' && !c.company).length}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {isRtl ? 'عملاء أفراد نقدي' : 'Individual accounts'}
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">person</span>
              </div>
            </div>
          </div>

          {/* 3. Search and Action Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddCustomer}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                <span>{isRtl ? '+ إضافة عميل جديد' : '+ Add New Customer'}</span>
              </button>
            </div>

            <div className="relative w-full sm:w-96">
              <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={custDatabaseSearch}
                onChange={(e) => setCustDatabaseSearch(e.target.value)}
                placeholder={isRtl ? 'ابحث باسم العميل، رقم الهاتف، العنوان...' : 'Search by name, phone, address...'}
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 shadow-2xs"
              />
            </div>
          </div>

          {/* 4. Customer Cards Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 min-h-[220px] flex flex-col justify-center">
            {(() => {
              const searchLower = custDatabaseSearch.trim().toLowerCase();
              const filteredCusts = customers.filter((c) => {
                if (!searchLower) return true;
                return (
                  c.name.toLowerCase().includes(searchLower) ||
                  (c.phone && c.phone.toLowerCase().includes(searchLower)) ||
                  (c.phone2 && c.phone2.toLowerCase().includes(searchLower)) ||
                  (c.address && c.address.toLowerCase().includes(searchLower)) ||
                  (c.email && c.email.toLowerCase().includes(searchLower))
                );
              });

              if (filteredCusts.length === 0) {
                return (
                  <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-slate-300">
                      no_accounts
                    </span>
                    <span className="font-bold text-slate-500 text-sm">
                      {isRtl ? 'لا يوجد عملاء مطابقون في قاعدة البيانات' : 'No matching customers in database'}
                    </span>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCusts.map((cust) => {
                    const isSelectedForPOS = selectedCustomer?.id === cust.id;
                    const statusVal = cust.status || 'New';
                    const isNew = statusVal === 'New';
                    const isActive = statusVal === 'Active';
                    const isChurned = statusVal === 'Churned';

                    return (
                      <div
                        key={cust.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                          isSelectedForPOS
                            ? 'border-indigo-500 bg-indigo-50/40 shadow-xs'
                            : 'border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                {cust.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h3 className="text-sm font-bold text-slate-900 truncate">
                                    {cust.name}
                                  </h3>
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-700 shrink-0">
                                    {cust.type === 'Company' ? (isRtl ? 'شركة' : 'Company') : (isRtl ? 'فرد' : 'Individual')}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono truncate">
                                  {cust.address ? `📍 ${cust.address}` : (isRtl ? 'بدون عنوان' : 'No address')}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleOpenEditCustomer(cust)}
                                className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                title={isRtl ? 'تعديل' : 'Edit'}
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(cust)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                title={isRtl ? 'حذف' : 'Delete'}
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          </div>

                          {/* Phone & Status Badges */}
                          <div className="flex flex-col gap-1.5 text-xs text-slate-600 font-medium">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm text-slate-400">call</span>
                                <span className="font-mono text-slate-800 font-bold">{cust.phone || '—'}</span>
                              </div>
                              {cust.phone2 && (
                                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  احتياطي: {cust.phone2}
                                </span>
                              )}
                            </div>

                            {/* Customer Status Badge (حالة العميل: جديد / متفاعل / منقطع) */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                              <span className="text-[11px] font-bold text-slate-500">{isRtl ? 'حالة العميل:' : 'Status:'}</span>
                              <button
                                onClick={() => {
                                  setEngagementTargetCustomer(cust);
                                  setNewEngagementStatus(cust.status || 'New');
                                  setIsEngagementModalOpen(true);
                                }}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-transform active:scale-95 ${
                                  isNew
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : isActive
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                <span>
                                  {isNew
                                    ? (isRtl ? 'جديد (افتراضي)' : 'New')
                                    : isActive
                                    ? (isRtl ? 'متفاعل' : 'Active')
                                    : (isRtl ? 'منقطع' : 'Churned')}
                                </span>
                                <span className="material-symbols-outlined text-[12px]">edit</span>
                              </button>
                            </div>

                            {/* Credit Limit Badge (حدود الائتمان: نقداً فقط / مبلغ) */}
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-500">{isRtl ? 'حدود الائتمان:' : 'Credit Limit:'}</span>
                              <button
                                onClick={() => {
                                  setCreditLimitTargetCustomer(cust);
                                  setNewCreditLimitInput((cust.creditLimit || 0).toString());
                                  setIsCreditLimitModalOpen(true);
                                }}
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[12px] text-emerald-600">credit_score</span>
                                <span>
                                  {cust.creditLimit && cust.creditLimit > 0
                                    ? `${cust.creditLimit} ر.س`
                                    : (isRtl ? 'نقداً فقط' : 'Cash Only')}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          {isSelectedForPOS ? (
                            <span className="w-full py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1">
                              <span>✓</span>
                              <span>{isRtl ? 'محدد للكاشير' : 'Selected for POS'}</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedCustomer(cust);
                                setActiveTab('pos');
                              }}
                              className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">point_of_sale</span>
                              <span>{isRtl ? 'اختيار للبيع في الكاشير' : 'Select for POS'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 3: SALES HISTORY (سجل المبيعات) */}
      {activeTab === 'history' && (
        <div
          style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
          className="p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">history</span>
              <span>{isRtl ? 'سجل عمليات البيع المكتملة' : 'Completed Sales History Log'}</span>
            </h2>

            <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
              {isRtl ? `إجمالي الفواتير: ${transactions.length}` : `Total Transactions: ${transactions.length}`}
            </div>
          </div>

          {/* Transactions List */}
          {transactions.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              {isRtl ? 'لا توجد فواتير مسجلة حتى الآن' : 'No sales history recorded yet'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold">
                    <th className="p-3">{isRtl ? 'رقم الفاتورة' : 'Receipt No'}</th>
                    <th className="p-3">{isRtl ? 'التاريخ والوقت' : 'Date & Time'}</th>
                    <th className="p-3">{isRtl ? 'العميل' : 'Customer'}</th>
                    <th className="p-3">{isRtl ? 'الملخص' : 'Items'}</th>
                    <th className="p-3">{isRtl ? 'طريقة الدفع' : 'Payment'}</th>
                    <th className="p-3">{isRtl ? 'الإجمالي' : 'Total'}</th>
                    <th className="p-3 text-center">{isRtl ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 font-mono font-bold text-indigo-600">{tx.receiptNo}</td>
                      <td className="p-3 text-slate-600 font-mono">{tx.date} • {tx.time}</td>
                      <td className="p-3 font-medium text-slate-900">{tx.customerName || (isRtl ? 'عميل نقدي' : 'Cash')}</td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{tx.itemsSummary}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 font-extrabold text-slate-900 font-mono">${tx.total.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setViewingReceipt(tx)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          {isRtl ? 'التفاصيل' : 'Details'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PENDING / HELD INCOMPLETE SALES (العمليات غير المكتملة) */}
      {activeTab === 'pending' && (
        <div
          style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
          className="p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600">pending_actions</span>
              <span>{isRtl ? 'فواتير معلقة' : 'Pending Invoices'}</span>
            </h2>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-xl">
              {pendingSales.length} {isRtl ? 'فاتورة معلقة' : 'held invoice(s)'}
            </span>
          </div>

          {pendingSales.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-4xl text-slate-300">task_alt</span>
              <span className="font-bold text-slate-600">
                {isRtl ? 'لا توجد عمليات بيع معلقة حالياً' : 'No pending sales found'}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingSales.map((ps) => (
                <div
                  key={ps.id}
                  className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900">{ps.customerName}</span>
                      <span className="text-[11px] font-mono text-amber-700">{ps.date} • {ps.heldAt}</span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 italic">"{ps.notes}"</p>

                    <div className="mt-2 border-t border-amber-200/60 pt-2 flex flex-col gap-1 text-xs">
                      {ps.items.map((it: StagedItem, idx: number) => (
                        <div key={idx} className="flex justify-between text-slate-700">
                          <span>{it.quantity}x {it.name}</span>
                          <span className="font-mono">${(it.unitPrice * it.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-amber-200/80 pt-3">
                    <div className="text-sm font-extrabold text-slate-900 font-mono">
                      ${ps.total.toFixed(2)}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (window.confirm(isRtl ? 'هل تريد إلغاء وحذف هذه العملية المعلقة؟' : 'Cancel this pending sale?')) {
                            cancelPendingSale(ps.id);
                          }
                        }}
                        className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-bold transition-colors cursor-pointer"
                      >
                        {isRtl ? 'إلغاء' : 'Cancel'}
                      </button>

                      <button
                        onClick={() => handleRestorePending(ps.id)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">play_arrow</span>
                        <span>{isRtl ? 'استكمال الفاتورة' : 'Resume Order'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CHECKOUT MODAL (إتمام البيع) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">payments</span>
                <span>{isRtl ? 'إتمام عملية البيع والدفع' : 'Complete Checkout'}</span>
              </h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Total & Customer Display */}
            <div className="p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl flex flex-col items-center justify-center text-center gap-1">
              <span className="text-[11px] font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded-full shadow-2xs">
                {isRtl ? `العميل: ${selectedCustomer?.name || 'عميل نقدي'}` : `Customer: ${selectedCustomer?.name || 'Cash'}`}
              </span>
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider mt-1">{isRtl ? 'إجمالي الفاتورة المطلوب' : 'Grand Total Due'}</span>
              <span className="text-3xl font-extrabold text-indigo-900 font-mono">${total.toFixed(2)}</span>
            </div>

            {/* Payment Method Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700">{isRtl ? 'طريقة الدفع' : 'Payment Method'}</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['Cash', 'Card', 'Bank Transfer', 'Invoice'] as PaymentMethod[]).map((pm) => {
                  const labelsAr: Record<string, string> = {
                    Cash: '💵 نقدي',
                    Card: '💳 إلكتروني / بطاقة',
                    'Bank Transfer': '🏦 تحويل بنكي',
                    Invoice: '📄 آجل / على الحساب',
                  };
                  const isSelected = paymentMethod === pm;
                  return (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isRtl ? labelsAr[pm] : pm}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount Tendered & Change Calculation */}
            {paymentMethod === 'Cash' && (
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-700">{isRtl ? 'المبلغ المدفوع ($)' : 'Amount Paid ($)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="h-9 px-2 rounded-lg bg-white border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1 justify-center">
                  <span className="text-[11px] font-bold text-slate-500">{isRtl ? 'الباقي للعميل' : 'Change Due'}</span>
                  <span className="text-sm font-extrabold font-mono text-emerald-600">
                    ${changeDue.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-700">{isRtl ? 'ملاحظات الفاتورة' : 'Shift Notes'}</label>
              <input
                type="text"
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
                placeholder={isRtl ? 'ملاحظات إضافية...' : 'Additional invoice notes...'}
                className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Confirm Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmSale}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>{isRtl ? 'تأكيد العملية وحسم المخزون' : 'Confirm & Deduct Stock'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT CUSTOMER MODAL (Matching User Requirements for Supabase public.customers) */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 flex flex-col gap-6 max-h-[90vh] overflow-y-auto animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-indigo-600 text-2xl">
                  {editingCustomer ? 'edit_square' : 'person_add'}
                </span>
                <h3 className="font-bold text-lg text-slate-900">
                  {editingCustomer
                    ? isRtl
                      ? 'تعديل بيانات العميل'
                      : 'Edit Customer Details'
                    : isRtl
                    ? 'إضافة عميل جديد إلى قاعدة البيانات'
                    : 'Add New Customer to Database'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddCustomerModalOpen(false);
                  setEditingCustomer(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xl p-1 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCustomer} className="flex flex-col gap-4 text-xs font-medium">
              {/* Field 1: Customer Name (اسم العميل - اجباري) */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-800 text-xs flex items-center justify-between">
                  <span>{isRtl ? 'اسم العميل' : 'Customer Name'}</span>
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded font-bold">{isRtl ? 'اجباري' : 'Required'}</span>
                </label>
                <input
                  type="text"
                  required
                  value={custForm.name}
                  onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                  placeholder={isRtl ? 'مثال: محمد أحمد علي / شركة التقنية' : 'e.g. John Doe / Tech Corp'}
                  className="w-full h-11 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Field 2 & 3: Primary Phone & Backup Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-800 text-xs flex items-center justify-between">
                    <span>{isRtl ? 'رقم هاتف العميل الأول' : 'Primary Phone'}</span>
                    <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded font-bold">{isRtl ? 'اجباري' : 'Required'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={custForm.phone1}
                    onChange={(e) => setCustForm({ ...custForm, phone1: e.target.value })}
                    placeholder="0500000000"
                    className="w-full h-11 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-800 text-xs flex items-center justify-between">
                    <span>{isRtl ? 'رقم الهاتف الثاني / الاحتياطي' : 'Secondary Phone'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{isRtl ? 'اختياري' : 'Optional'}</span>
                  </label>
                  <input
                    type="text"
                    value={custForm.phone2}
                    onChange={(e) => setCustForm({ ...custForm, phone2: e.target.value })}
                    placeholder="0550000000"
                    className="w-full h-11 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Field 4: Customer Address (عنوان العميل - اجباري) */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-800 text-xs flex items-center justify-between">
                  <span>{isRtl ? 'عنوان العميل' : 'Customer Address'}</span>
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded font-bold">{isRtl ? 'اجباري' : 'Required'}</span>
                </label>
                <input
                  type="text"
                  required
                  value={custForm.address}
                  onChange={(e) => setCustForm({ ...custForm, address: e.target.value })}
                  placeholder={isRtl ? 'مثال: الرياض - حي العليا - شارع الملك فهد' : 'e.g. Riyadh - Olaya District'}
                  className="w-full h-11 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Field 5: Customer Email (البريد الإلكتروني - اختياري) */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-800 text-xs flex items-center justify-between">
                  <span>{isRtl ? 'البريد الإلكتروني الخاص بالعميل' : 'Customer Email'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{isRtl ? 'اختياري' : 'Optional'}</span>
                </label>
                <input
                  type="email"
                  value={custForm.email}
                  onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                  placeholder="client@domain.com"
                  className="w-full h-11 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Field 6: Customer Type (أفراد أم شركات - اجباري) */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-800 text-xs flex items-center justify-between">
                  <span>{isRtl ? 'نوع العميل (أفراد أم شركات)' : 'Customer Type'}</span>
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded font-bold">{isRtl ? 'اجباري' : 'Required'}</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCustForm({ ...custForm, type: 'Individual' })}
                    className={`py-2.5 px-4 rounded-2xl font-bold text-xs border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      custForm.type === 'Individual'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">person</span>
                    <span>{isRtl ? 'أفراد (Individual)' : 'Individual'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustForm({ ...custForm, type: 'Company' })}
                    className={`py-2.5 px-4 rounded-2xl font-bold text-xs border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      custForm.type === 'Company'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">domain</span>
                    <span>{isRtl ? 'شركات (Company)' : 'Company'}</span>
                  </button>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center gap-3 pt-3 mt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-sm transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  <span>{isRtl ? 'حفظ العميل في Supabase' : 'Save Customer to Supabase'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAddCustomerModalOpen(false);
                    setEditingCustomer(null);
                  }}
                  className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-2xl cursor-pointer transition-colors"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ENGAGEMENT STATUS RULES MODAL (تحديد درجة تفاعل العملاء) */}
      {isEngagementModalOpen && engagementTargetCustomer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">analytics</span>
                <span>{isRtl ? `تحديد درجة تفاعل العميل (${engagementTargetCustomer.name})` : 'Customer Engagement Status'}</span>
              </h3>
              <button onClick={() => setIsEngagementModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                {isRtl
                  ? 'يمكنك تحديد وتحديث حالة العميل يدوياً أو وفقاً لعدد مرات الشراء والتفاعل خلال فترة معينة:'
                  : 'Select engagement status for customer based on purchase frequency:'}
              </p>

              <div className="grid grid-cols-1 gap-2.5 pt-1">
                {/* Option 1: جديد */}
                <button
                  type="button"
                  onClick={() => setNewEngagementStatus('New')}
                  className={`p-3 rounded-2xl border text-right font-bold transition-all flex items-center justify-between cursor-pointer ${
                    newEngagementStatus === 'New'
                      ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span>{isRtl ? 'جديد (حالة افتراضية لكل عميل)' : 'New (Default status)'}</span>
                  </div>
                  {newEngagementStatus === 'New' && <span>✓</span>}
                </button>

                {/* Option 2: متفاعل */}
                <button
                  type="button"
                  onClick={() => setNewEngagementStatus('Active')}
                  className={`p-3 rounded-2xl border text-right font-bold transition-all flex items-center justify-between cursor-pointer ${
                    newEngagementStatus === 'Active'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span>{isRtl ? 'متفاعل (عميل دائم الشراء والتفاعل)' : 'Active (Regular buyer)'}</span>
                  </div>
                  {newEngagementStatus === 'Active' && <span>✓</span>}
                </button>

                {/* Option 3: منقطع */}
                <button
                  type="button"
                  onClick={() => setNewEngagementStatus('Churned')}
                  className={`p-3 rounded-2xl border text-right font-bold transition-all flex items-center justify-between cursor-pointer ${
                    newEngagementStatus === 'Churned'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                    <span>{isRtl ? 'منقطع (انقطع عن الشراء منذ فترة)' : 'Churned (Inactive buyer)'}</span>
                  </div>
                  {newEngagementStatus === 'Churned' && <span>✓</span>}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsEngagementModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                onClick={handleSaveEngagementStatus}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                {isRtl ? 'حفظ درجة التفاعل' : 'Save Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CREDIT LIMIT CONTROL MODAL (إدارة حدود الائتمان) */}
      {isCreditLimitModalOpen && creditLimitTargetCustomer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">credit_score</span>
                <span>{isRtl ? `إدارة حدود الائتمان والآجل للعميل (${creditLimitTargetCustomer.name})` : 'Credit Limit Management'}</span>
              </h3>
              <button onClick={() => setIsCreditLimitModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                {isRtl
                  ? 'حدود الائتمان توضع افتراضياً على (0.00 ر.س — نقداً فقط). يمكنك إدخال المبلغ الأقصى المسموح به بالآجل:'
                  : 'Credit limits default to (0.00 - Cash Only). Enter maximum credit line:'}
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-800 text-xs">
                  {isRtl ? 'حد الائتمان المسموح (ر.س):' : 'Credit Limit Amount ($):'}
                </label>
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={newCreditLimitInput}
                  onChange={(e) => setNewCreditLimitInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-11 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-500 italic">
                  {parseFloat(newCreditLimitInput) <= 0
                    ? (isRtl ? 'الحالة الحالية: نقداً فقط (لا يسمح بالبيع بالآجل)' : 'Current Status: Cash Only')
                    : (isRtl ? `يسمح للعميل بالدين والآجل حتى ${newCreditLimitInput} ر.س` : `Allows credit up to ${newCreditLimitInput}`)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsCreditLimitModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                onClick={handleSaveCreditLimit}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                {isRtl ? 'حفظ حد الائتمان' : 'Save Credit Limit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: HOLD SALE MODAL (تعليق الفاتورة) */}
      {isHoldModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 flex flex-col gap-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600">pause_circle</span>
              <span>{isRtl ? 'تعليق الفاتورة الحالية' : 'Hold Current Sale'}</span>
            </h3>

            <div className="flex flex-col gap-3 text-xs font-medium">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 font-bold">
                {isRtl ? `العميل المحدد: ${selectedCustomer?.name || 'عميل نقدي'}` : `Customer: ${selectedCustomer?.name || 'Cash'}`}
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">{isRtl ? 'سبب التعليق / ملاحظة' : 'Hold Reason / Note'}</label>
                <input
                  type="text"
                  value={holdNote}
                  onChange={(e) => setHoldNote(e.target.value)}
                  placeholder={isRtl ? 'في انتظار الدفع أو تجهيز الطلب...' : 'Awaiting payment...'}
                  className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsHoldModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmHoldSale}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                {isRtl ? 'حفظ معلقة' : 'Hold Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: RECEIPT DETAILS MODAL (عرض تفاصيل الفاتورة المكتملة) */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-indigo-600 font-mono">{viewingReceipt.receiptNo}</span>
                <h3 className="font-bold text-sm text-slate-900">{isRtl ? 'فاتورة بيع مكتملة' : 'Completed Sale Receipt'}</h3>
              </div>
              <button onClick={() => setViewingReceipt(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 text-xs border-b border-slate-100 pb-3">
              <div className="flex justify-between text-slate-600">
                <span>{isRtl ? 'التاريخ والوقت:' : 'Date & Time:'}</span>
                <span className="font-mono">{viewingReceipt.date} • {viewingReceipt.time}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{isRtl ? 'العميل:' : 'Customer:'}</span>
                <span className="font-bold text-slate-800">{viewingReceipt.customerName || 'عميل نقدي'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{isRtl ? 'طريقة الدفع:' : 'Payment:'}</span>
                <span className="font-semibold">{viewingReceipt.paymentMethod}</span>
              </div>
            </div>

            {/* Line items list */}
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              {viewingReceipt.items.map((it: StagedItem, idx: number) => (
                <div key={idx} className="p-2 bg-slate-50 rounded-lg flex justify-between text-xs">
                  <span>{it.quantity}x {it.name}</span>
                  <span className="font-mono font-bold">${(it.unitPrice * it.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-3 flex flex-col gap-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>{isRtl ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                <span className="font-mono">${viewingReceipt.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{isRtl ? 'الضريبة (8%):' : 'Tax:'}</span>
                <span className="font-mono">${viewingReceipt.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-200 pt-2 mt-1">
                <span>{isRtl ? 'الإجمالي النهائي:' : 'Grand Total:'}</span>
                <span className="text-indigo-600 font-mono">${viewingReceipt.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>{isRtl ? 'طباعة' : 'Print'}</span>
              </button>
              <button
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {isRtl ? 'إلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CONFIRM DELETE CUSTOMER MODAL */}
      {deletingCustTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4 border border-slate-100 animate-scale-up">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">delete_forever</span>
              </div>
              <h3 className="font-bold text-base text-slate-900">
                {isRtl ? 'تأكيد حذف العميل' : 'Confirm Customer Deletion'}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {isRtl
                ? `هل أنت متأكد من حذف العميل (${deletingCustTarget.name}) من قاعدة البيانات؟`
                : `Are you sure you want to delete customer (${deletingCustTarget.name})?`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingCustTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={() => {
                  deleteCustomer(deletingCustTarget.id);
                  if (selectedCustomer?.id === deletingCustTarget.id) {
                    setSelectedCustomer(null);
                  }
                  setDeletingCustTarget(null);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                {isRtl ? 'حذف العميل' : 'Delete Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

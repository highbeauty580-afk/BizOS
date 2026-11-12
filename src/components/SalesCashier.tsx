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
import { fetchProductsFromSupabase } from '../lib/productsService';
import { fetchStockFromSupabase, updateStockQuantityInSupabase } from '../lib/stockService';
import { addFinancialTransactionToSupabase } from '../lib/transactionsService';
import {
  addOrderToSupabase,
  addOrderItemsToSupabase,
  AddOrderItemInput,
  updateOrderStatusInSupabase,
  DEFAULT_DELIVERY_STATUS,
  DEFAULT_PREPARING_STATUS,
  DEFAULT_ORDER_STATUS,
} from '../lib/ordersService';

export const SalesCashier: React.FC = () => {
  const {
    language,
    customPalette,
    fastItems,
    setFastItems,
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
    returnTransactionItems,
    setTransactions,
    updateTransactionOrderStatus,
  } = useApp();

  const isRtl = language === 'ar';


  // Entry Mode: 'manual' (يدوي) | 'auto_integration' (ربط تلقائي)
  const [salesEntryMode, setSalesEntryMode] = useState<SalesEntryMode>('manual');

  // Section Tabs: 'pos' (Cashier Terminal), 'customers' (Customer Database), 'history' (Sales History), 'pending' (Incomplete / Held Sales)
  const [activeTab, setActiveTab] = useState<'pos' | 'customers' | 'history' | 'pending'>('pos');

  // --- POS TERMINAL STATE ---
  const [cart, setCart] = useState<StagedItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [discountPct, setDiscountPct] = useState<number>(0);

  // Customer Selection & Customer Database State (no forced pre-selection)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
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

  // Helper to format transaction name: "[Action] ([Item Name]) [DayOfMonth] [Month] [DayOfWeek] [H:M:S]"
  const getFormattedTxName = (actionSuffix: string, actorName: string) => {
    const now = new Date();
    const days = [
      isRtl ? 'الأحد' : 'Sunday',
      isRtl ? 'الاثنين' : 'Monday',
      isRtl ? 'الثلاثاء' : 'Tuesday',
      isRtl ? 'الأربعاء' : 'Wednesday',
      isRtl ? 'الخميس' : 'Thursday',
      isRtl ? 'الجمعة' : 'Friday',
      isRtl ? 'السبت' : 'Saturday'
    ];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[now.getDay()];
    const monthName = isRtl ? monthsAr[now.getMonth()] : monthsEn[now.getMonth()];
    const dayOfMonth = now.getDate();
    const timeStr = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    return `${actorName} ${actionSuffix} ${dayOfMonth} ${monthName} ${dayName} ${timeStr}`;
  };

  // Filtered Catalog Items (Only Products - Exclude Raw Materials)
  const filteredCatalog = fastItems.filter((item) => {
    const isRawMaterial =
      item.inventoryType === 'raw_material' ||
      item.category === 'Raw Materials' ||
      item.category === 'مواد خام';
    if (isRawMaterial) return false;

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const nameMatch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  // Toggle Customer Selection (Deselects on re-click and clears active invoice)
  const handleToggleCustomer = (cust: Customer) => {
    if (selectedCustomer?.id === cust.id) {
      setSelectedCustomer(null);
      setCart([]);
    } else {
      setSelectedCustomer(cust);
    }
  };

  // Handlers for POS Cart - Toggle Product Selection (Deselects on re-click)
  const handleAddToCart = (item: FastItem) => {
    // 1. Enforce requirement: Invoice window and product selection are only active AFTER customer is chosen
    if (!selectedCustomer) {
      alert(
        isRtl
          ? '⚠️ يرجى أولاً تحديد العميل الموجه له الطلب من قائمة العملاء لتفعيل نافذة الفاتورة والبدء في اختيار المنتجات.'
          : '⚠️ Please select a customer first to activate the invoice before picking products.'
      );
      return;
    }

    // 2. Toggle Logic: If product is already selected in cart, re-clicking it DESELECTS / removes it
    const existingStaged = cart.find(
      (i) => i.originalFastItemId === item.id || i.name === (isRtl && item.nameAr ? item.nameAr : item.name)
    );

    if (existingStaged) {
      setCart((prevCart) => prevCart.filter((i) => i.id !== existingStaged.id));
      return;
    }

    // 3. Stock Check Validation
    const availableStock = item.stockQuantity ?? 0;
    if (availableStock <= 0) {
      alert(
        isRtl
          ? `عفواً! المنتج (${item.nameAr || item.name}) غير متوفر حالياً في المخزون (الرصيد: 0).`
          : `Out of stock! Only ${availableStock} ${item.unit || 'unit(s)'} available.`
      );
      return;
    }

    // 4. Add new item to invoice with quantity 1
    const newItem: StagedItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: isRtl && item.nameAr ? item.nameAr : item.name,
      category: item.category,
      unitPrice: item.price,
      quantity: 1,
      discountPct: 0,
      originalFastItemId: item.id,
    };
    setCart((prevCart) => [...prevCart, newItem]);
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
    console.log("1. Starting customer save process...", custForm);

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
      status: 'Active' as CustomerStatus, // Defaulting to 'Active' to satisfy chk_customer_status constraint
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
      setCustForm({ name: '', phone1: '', phone2: '', address: '', email: '', type: 'Individual' });
      setEditingCustomer(null);
      setIsAddCustomerModalOpen(false);
    } else {
      console.log('2. Sending Payload to Supabase public.customers:', customerParams);
      const result = await addCustomerToSupabase(customerParams);

      if (!result.success || !result.data) {
        console.error('❌ Supabase Insert Error:', result.error);
        alert(isRtl ? `فشل الحفظ: ${result.error}` : `Save failed: ${result.error}`);
        return; // توقف هنا ولا تكتمل لرسالة النجاح!
      }

      console.log('✅ Successfully inserted customer:', result.data);
      alert(isRtl ? 'تم الحفظ بنجاح في قاعدة البيانات!' : 'Saved successfully in database!');

      const createdCustomer = result.data;
      setCustomers((prev) => [createdCustomer, ...prev]);
      setSelectedCustomer(createdCustomer);

      setCustForm({ name: '', phone1: '', phone2: '', address: '', email: '', type: 'Individual' });
      setEditingCustomer(null);
      setIsAddCustomerModalOpen(false);
    }
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
    if (!selectedCustomer) {
      alert(isRtl ? '⚠️ يرجى تحديد العميل الموجه له الطلب أولاً قبل إتمام البيع.' : 'Please select a customer first before checkout.');
      return;
    }
    if (cart.length === 0) return;
    setAmountPaid(total.toFixed(2));
    setShiftNotes('');
    setIsCheckoutOpen(true);
  };

  // Confirm Sale & Process Inventory
  const handleConfirmSale = async () => {
    if (cart.length === 0) return;

    const receiptNo = `#TX-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const itemsSummaryStr = cart.map((i) => `${i.quantity}x ${i.name}`).join(', ');

    const finalCustomerName = selectedCustomer ? selectedCustomer.name : (isRtl ? 'عميل نقدي' : 'Cash Customer');
    const finalCustomerPhone1 = selectedCustomer ? (selectedCustomer.phone || '') : '';
    const finalCustomerPhone2 = selectedCustomer ? (selectedCustomer.phone2 || '') : '';
    const finalCustomerAddress = selectedCustomer ? (selectedCustomer.address || '') : '';

    // --- SYNC WITH SUPABASE: public.orders (Order & Delivery Management) ---
    const orderRes = await addOrderToSupabase({
      customerName: finalCustomerName,
      customerPhone1: finalCustomerPhone1,
      customerPhone2: finalCustomerPhone2,
      customerAddress: finalCustomerAddress,
      totalPrice: total,
      paymentMethod,
      deliveryStatus: DEFAULT_DELIVERY_STATUS,
      preparingStatus: DEFAULT_PREPARING_STATUS,
      orderStatus: DEFAULT_ORDER_STATUS,
    });

    const createdOrderId = orderRes.data?.orderPk ?? orderRes.data?.id;

    // --- SYNC WITH SUPABASE: public.order_items (Order Items Breakdown) ---
    // Rule: Orders = order_pk = order_items = order_fk
    if (createdOrderId) {
      const orderItemsPayload: AddOrderItemInput[] = cart.map((c) => {
        const itemTotal = Number((c.unitPrice * c.quantity).toFixed(2));
        const matchedProd = fastItems.find(
          (fi) => fi.id === c.originalFastItemId || fi.product_pk === c.originalFastItemId || fi.name === c.name || (fi.nameAr && fi.nameAr === c.name)
        );
        const resolvedProductPk = matchedProd?.product_pk || matchedProd?.id || c.originalFastItemId;
        return {
          orderFk: createdOrderId,
          productFk: resolvedProductPk,
          itemName: c.name,
          unitPrice: c.unitPrice,
          quantityItems: c.quantity,
          totalItemPrice: itemTotal,
        };
      });

      const itemsRes = await addOrderItemsToSupabase(orderItemsPayload);
      if (!itemsRes.success) {
        console.error('❌ Failed to record order items in Supabase public.order_items:', itemsRes.error);
      } else {
        console.log(`✅ Successfully stored ${orderItemsPayload.length} order_items in Supabase with order_fk:`, createdOrderId);
      }
    }

    const newTx: Omit<Transaction, 'id'> = {
      orderId: createdOrderId,
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
      customerPhone1: finalCustomerPhone1,
      customerPhone2: finalCustomerPhone2,
      customerAddress: finalCustomerAddress,
      deliveryStatus: DEFAULT_DELIVERY_STATUS,
      preparingStatus: DEFAULT_PREPARING_STATUS,
      orderStatus: DEFAULT_ORDER_STATUS,
    };

    // --- SYNC WITH SUPABASE: public.transactions (Financial Ledger) ---
    const methodMapping: Record<PaymentMethod, string> = {
      Cash: 'Cash',
      Card: 'E_Wallet',
      'Bank Transfer': 'Bank',
      Invoice: 'Credit'
    };
    const dbMethod = methodMapping[paymentMethod] || 'Cash';
    const txName = `${finalCustomerName} فاتورة مبيعات`;

    const finRes = await addFinancialTransactionToSupabase({
      amount: total,
      method: dbMethod,
      notice: shiftNotes.trim() || (isRtl ? 'فاتورة مبيعات' : 'Sales Invoice'),
      type: 'Sales_Trans',
      name: getFormattedTxName(isRtl ? 'فاتورة مبيعات' : 'Sales Invoice', finalCustomerName)
    });
    if (!finRes.success) {
      console.error('❌ Failed to record financial transaction (Sales):', finRes.error);
    }
    // ------------------------------------------------------------------

    // 1. Add to sales history transactions
    addTransaction(newTx);

    // 2. DEDUCT INVENTORY STOCK LOCALLY & SYNC WITH SUPABASE public.stock
    deductStockForTransaction(cart);
    cart.forEach(async (c) => {
      const match = fastItems.find((fi) => fi.id === c.originalFastItemId || fi.name === c.name);
      if (match) {
        const remainingQty = Math.max(0, match.stockQuantity - c.quantity);
        const unitCost = match.costPrice || match.price || 0;
        // Sales are always 'Finished Goods', so we update by product_fk
        await updateStockQuantityInSupabase(match.id, remainingQty, unitCost, true);
      }
    });

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

    // Clear cart, reset customer selection, and close modal
    setCart([]);
    setSelectedCustomer(null);
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
    setSelectedCustomer(null);
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
              <span>{isRtl ? 'التسجيل اليدوي' : 'Manual Entry'}</span>
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
            {/* DUAL SIDE-BY-SIDE COLUMNS: CUSTOMERS COLUMN FIRST, PRODUCTS COLUMN SECOND */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* COLUMN 1: CUSTOMERS COLUMN (صف/عمود العملاء مع محرك البحث والصف العمودي - MAX 3 VISIBLE AT A TIME) */}
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
                          onClick={() => handleToggleCustomer(cust)}
                          className={`w-full p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-2 border-indigo-600 bg-indigo-50/90 shadow-sm ring-2 ring-indigo-500/20'
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
                              <span className="px-2.5 py-1 bg-indigo-600 hover:bg-rose-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors">
                                <span className="material-symbols-outlined text-[13px]">check_circle</span>
                                <span>{isRtl ? 'محدد (انقر للإلغاء)' : 'Selected (Click to deselect)'}</span>
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

              {/* COLUMN 2: PRODUCTS COLUMN (صف/عمود المنتجات والخدمات مع محرك البحث والصف العمودي) */}
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

                {/* Notice if customer is not selected yet */}
                {!selectedCustomer && (
                  <div className="flex items-center gap-1.5 p-2 bg-amber-50/90 border border-amber-200/90 rounded-xl text-[11px] font-bold text-amber-800">
                    <span className="truncate">{isRtl ? 'اختر العميل أولاً' : 'Select customer first'}</span>
                  </div>
                )}

                {/* VERTICAL Scrollable Product Items with prominent custom scrollbar */}
                <div className="flex flex-col gap-2 max-h-[360px] sm:max-h-[420px] overflow-y-auto pl-1 pr-2.5 product-scrollbar min-h-[220px]">
                  {filteredCatalog.length === 0 ? (
                    <div className="w-full py-12 text-center text-slate-400 text-xs">
                      {isRtl ? 'لا توجد منتجات مطابقة للبحث' : 'No matching products'}
                    </div>
                  ) : (
                    filteredCatalog.map((item) => {
                      const actualStock = item.stockQuantity ?? 50;

                      // Staged quantity in active cart/invoice
                      const stagedQty = cart.reduce((acc, c) => {
                        const matchId = c.originalFastItemId === item.id;
                        const matchName = c.name === item.name || (item.nameAr && c.name === item.nameAr);
                        return matchId || matchName ? acc + c.quantity : acc;
                      }, 0);

                      const isSelectedProduct = stagedQty > 0;
                      const displayStock = Math.max(0, actualStock - stagedQty);

                      // Check if item was confirmed/deducted in the last 5 minutes (300,000 ms)
                      const lastDeductedTime = recentlyDeducted[item.id];
                      const isRecentlyDeducted = Boolean(lastDeductedTime && (Date.now() - lastDeductedTime < 300000));

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleAddToCart(item)}
                          className={`w-full p-2.5 sm:p-3 rounded-xl border transition-all flex items-start gap-3 group cursor-pointer ${
                            !selectedCustomer
                              ? 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/70 opacity-75'
                              : isSelectedProduct
                              ? 'border-2 border-emerald-500 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20'
                              : isRecentlyDeducted
                              ? 'border-rose-400 bg-rose-50/50 shadow-2xs hover:bg-rose-50'
                              : 'border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-indigo-400 shadow-2xs'
                          }`}
                        >
                          {/* PRODUCT IMAGE BOX (مربع صورة المنتج) */}
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-slate-200/90 bg-gradient-to-br from-slate-100 to-indigo-50/80 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs group-hover:scale-105 transition-transform">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-indigo-500">
                                <span className="material-symbols-outlined text-xl select-none">package_2</span>
                              </div>
                            )}
                          </div>

                          {/* PRODUCT DETAILS (تفاصيل المنتج بجوار الصورة) */}
                          <div className="flex flex-col flex-1 min-w-0 gap-1">
                            {/* Top Row: Product Title, Category, Code + Cancel Button at TOP of Card if selected */}
                            <div className="flex items-center justify-between w-full gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                <h3 className={`text-xs font-bold truncate transition-colors ${
                                  isSelectedProduct ? 'text-emerald-950 font-extrabold' : 'text-slate-900 group-hover:text-indigo-600'
                                }`}>
                                  {isRtl && item.nameAr ? item.nameAr : item.name}
                                </h3>
                                <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 shrink-0">
                                  {item.category}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400 font-bold bg-slate-200/60 px-1.5 py-0.2 rounded shrink-0">
                                  {item.code || `ID-${item.id}`}
                                </span>
                              </div>

                              {/* Top Cancel Button with Basket/Trash Icon when item is selected */}
                              {selectedCustomer && isSelectedProduct && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(item);
                                  }}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all active:scale-95 flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/90 cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                                  title={isRtl ? 'انقر لإلغاء هذا المنتج من الفاتورة' : 'Click to remove from invoice'}
                                >
                                  <span className="material-symbols-outlined text-[13px] text-rose-600">delete</span>
                                  <span>{isRtl ? 'إلغاء' : 'Remove'}</span>
                                </button>
                              )}
                            </div>

                            {/* Line 2: Product Description (if available) */}
                            {item.description && (
                              <p className="text-[10px] text-slate-500 line-clamp-1 truncate">
                                {item.description}
                              </p>
                            )}

                            {/* Line 3: Retail Price, Stock Status & Bottom Action Button */}
                            <div className="flex items-center justify-between w-full gap-2 mt-0.5">
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <span className="text-xs font-extrabold text-emerald-700 font-mono">
                                  ${item.price.toFixed(2)}
                                </span>

                                {/* STOCK BADGE */}
                                {isRecentlyDeducted ? (
                                  <span className="text-[10px] font-extrabold text-rose-600 bg-rose-100/80 border border-rose-300 px-2 py-0.5 rounded-md animate-pulse flex items-center gap-1">
                                    <span>{isRtl ? 'المخزون:' : 'Stock:'}</span>
                                    <span className="font-mono text-xs text-rose-700">{displayStock}</span>
                                  </span>
                                ) : isSelectedProduct ? (
                                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <span>{isRtl ? 'المتبقي:' : 'Rem:'}</span>
                                    <span className="font-mono text-xs text-emerald-900 font-bold">{displayStock}</span>
                                    <span className="text-[9px] text-emerald-700 font-semibold">({stagedQty} بالفاتورة)</span>
                                  </span>
                                ) : (
                                  <span className={`text-[10px] font-semibold ${actualStock <= 10 ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>
                                    {isRtl ? `المخزون: ${actualStock}` : `Stock: ${actualStock}`}
                                  </span>
                                )}
                              </div>

                              {/* Bottom Action Button when not selected or customer not selected */}
                              {!selectedCustomer ? (
                                <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-500 flex items-center gap-1 whitespace-nowrap shrink-0">
                                  <span>{isRtl ? 'اختر العميل أولاً' : 'Select Customer First'}</span>
                                </span>
                              ) : !isSelectedProduct ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(item);
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1 shadow-2xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer whitespace-nowrap shrink-0"
                                >
                                  <span>+</span>
                                  <span>{isRtl ? 'تحديد' : 'Select'}</span>
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: Active Cart / Invoice Summary (الفاتورة الحالية) */}
          <div className="lg:col-span-5 flex flex-col gap-4 sticky top-20">
            {!selectedCustomer ? (
              /* INACTIVE / LOCKED STATE - لا تضيء ولا تعمل حتى يختار العميل الموجه له الطلب */
              <div
                style={{ backgroundColor: '#f8fafc' }}
                className="p-5 rounded-2xl border-2 border-dashed border-slate-300 shadow-none flex flex-col gap-4 opacity-80 select-none transition-all"
              >
                {/* Prominent Guidance Box */}
                <div className="py-10 px-4 flex flex-col items-center justify-center text-center rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <div className="flex flex-col gap-3.5 items-center justify-center max-w-sm">
                    {/* Line 1: Select Customer First */}
                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-900 font-bold text-xs sm:text-sm">
                      <span className="material-symbols-outlined text-indigo-600 text-lg shrink-0">person_search</span>
                      <span>{isRtl ? 'حدد العميل أولاً' : 'Select Customer First'}</span>
                    </div>

                    {/* Line 2: Then Products to Show Invoice */}
                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm">
                      <span className="material-symbols-outlined text-slate-600 text-lg shrink-0">inventory_2</span>
                      <span>{isRtl ? 'ثم المنتجات لتظهر الفاتورة' : 'Then Products to Show Invoice'}</span>
                    </div>
                  </div>
                </div>

                {/* Summary Box (Disabled / Zeroed) */}
                <div className="border-t border-slate-200 pt-3 flex flex-col gap-2 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>{isRtl ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                    <span className="font-mono">$0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isRtl ? 'الخصم (%):' : 'Discount (%):'}</span>
                    <span className="font-mono">0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isRtl ? 'ضريبة القيمة المضافة (8%):' : 'Tax (8% VAT):'}</span>
                    <span className="font-mono">$0.00</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-slate-400 border-t border-slate-200 pt-2">
                    <span>{isRtl ? 'الإجمالي النهائي:' : 'Grand Total:'}</span>
                    <span className="font-mono">$0.00</span>
                  </div>
                </div>
              </div>
            ) : (
              /* ACTIVE STATE */
              <div
                style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
                className="p-5 rounded-2xl border-2 border-indigo-500 shadow-xl ring-4 ring-indigo-500/10 flex flex-col gap-4 animate-in fade-in duration-300 transition-all"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-600 text-xl animate-pulse">receipt_long</span>
                      <h2 className="font-extrabold text-base text-slate-900">
                        {isRtl ? 'الفاتورة الحالية' : 'Active Invoice'}
                      </h2>
                    </div>
                  </div>

                  {cart.length > 0 && (
                    <button
                      onClick={handleClearCart}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">delete_sweep</span>
                      <span>{isRtl ? 'تفريغ المنتجات' : 'Clear Items'}</span>
                    </button>
                  )}
                </div>

                {/* Customer Active Bar with Deselect Option */}
                <div className="flex items-center justify-between bg-indigo-50/90 border border-indigo-200 px-3 py-2.5 rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {selectedCustomer.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-indigo-950 truncate">
                          {selectedCustomer.name}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-200/70 text-indigo-800 shrink-0">
                          {selectedCustomer.type === 'Company' ? (isRtl ? 'شركة' : 'Company') : (isRtl ? 'فرد' : 'Individual')}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-700 truncate">
                        📞 {selectedCustomer.phone || (isRtl ? 'بدون هاتف' : 'No phone')}
                        {selectedCustomer.address && ` • 📍 ${selectedCustomer.address}`}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCart([]);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                    title={isRtl ? 'إلغاء تحديد هذا العميل وإغلاق الفاتورة' : 'Deselect customer and lock invoice'}
                  >
                    <span>✕</span>
                    <span>{isRtl ? 'إلغاء العميل' : 'Deselect'}</span>
                  </button>
                </div>

                {/* Cart Items List */}
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                      <span className="material-symbols-outlined text-3xl mb-1.5 text-indigo-400 animate-bounce">add_shopping_cart</span>
                      <span className="text-xs font-bold text-slate-700">
                        {isRtl ? 'العميل محدد بنجاح!' : 'Customer selected!'}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1 max-w-xs">
                        {isRtl
                          ? 'انقر على المنتجات من القائمة المجاورة لتحديدها وإضافتها للفاتورة (أو انقر عليها مجدداً لإلغائها).'
                          : 'Click items from the list to select/add them (or re-click to deselect).'}
                      </span>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 flex items-center justify-between gap-2 text-xs hover:border-indigo-200 transition-colors"
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
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                            title={isRtl ? 'إلغاء هذا المنتج' : 'Remove item'}
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
            )}
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
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCustomer(null);
                                setCart([]);
                              }}
                              className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              title={isRtl ? 'انقر لإلغاء تحديد هذا العميل' : 'Click to deselect'}
                            >
                              <span>✕</span>
                              <span>{isRtl ? 'محدد للكاشير (انقر للإلغاء)' : 'Selected for POS (Click to deselect)'}</span>
                            </button>
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
                    <th className="p-3">{isRtl ? 'العميل وبياناته' : 'Customer & Contact'}</th>
                    <th className="p-3">{isRtl ? 'الملخص' : 'Items'}</th>
                    <th className="p-3">{isRtl ? 'طريقة الدفع' : 'Payment'}</th>
                    <th className="p-3">{isRtl ? 'الإجمالي' : 'Total'}</th>
                    <th className="p-3 text-center">{isRtl ? 'حالة التحضير' : 'Prep Status'}</th>
                    <th className="p-3 text-center">{isRtl ? 'حالة التوصيل' : 'Delivery Status'}</th>
                    <th className="p-3 text-center">{isRtl ? 'حالة الطلب' : 'Order Status'}</th>
                    <th className="p-3 text-center">{isRtl ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => {
                    const isReturned = tx.status === 'Returned';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-mono font-bold text-indigo-600">{tx.receiptNo}</td>
                        <td className="p-3 text-slate-600 font-mono">{tx.date} • {tx.time}</td>
                        <td className="p-3 font-medium text-slate-900">
                          <div className="flex flex-col">
                            <span className="font-bold">{tx.customerName || (isRtl ? 'عميل نقدي' : 'Cash')}</span>
                            {(tx.customerPhone1 || tx.customerAddress) && (
                              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                {tx.customerPhone1 && <span>{tx.customerPhone1}</span>}
                                {tx.customerAddress && <span className="truncate max-w-[130px]">• {tx.customerAddress}</span>}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate">{tx.itemsSummary}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${isReturned ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                            {isReturned ? (isRtl ? 'مرتجع' : 'Returned') : tx.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 font-extrabold text-slate-900 font-mono">${tx.total.toFixed(2)}</td>

                        {/* حالة التحضير (Preparing_Status) */}
                        <td className="p-2.5 text-center">
                          <select
                            value={tx.preparingStatus || 'تم البدء فيه'}
                            disabled={isReturned}
                            onChange={async (e) => {
                              const val = e.target.value;
                              await updateTransactionOrderStatus(tx.id, tx.orderId, { preparingStatus: val });
                            }}
                            className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none transition-colors cursor-pointer ${
                              (tx.preparingStatus || 'تم البدء فيه') === 'تم الانتهاء من تحضيره'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : (tx.preparingStatus || 'تم البدء فيه') === 'جاري العمل عليه'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-blue-50 text-blue-800 border-blue-300'
                            }`}
                          >
                            <option value="تم البدء فيه">تم البدء فيه</option>
                            <option value="جاري العمل عليه">جاري العمل عليه</option>
                            <option value="تم الانتهاء من تحضيره">تم الانتهاء من تحضيره</option>
                          </select>
                        </td>

                        {/* حالة التوصيل (delivery_status) */}
                        <td className="p-2.5 text-center">
                          <select
                            value={tx.deliveryStatus || 'فى انتظار انتهاء التحضير'}
                            disabled={isReturned}
                            onChange={async (e) => {
                              const val = e.target.value;
                              await updateTransactionOrderStatus(tx.id, tx.orderId, { deliveryStatus: val });
                            }}
                            className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none transition-colors cursor-pointer ${
                              (tx.deliveryStatus || 'فى انتظار انتهاء التحضير') === 'تم التوصيل'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : (tx.deliveryStatus || 'فى انتظار انتهاء التحضير') === 'فى الشحن'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                : 'bg-slate-100 text-slate-800 border-slate-300'
                            }`}
                          >
                            <option value="فى انتظار انتهاء التحضير">فى انتظار انتهاء التحضير</option>
                            <option value="فى الشحن">فى الشحن</option>
                            <option value="تم التوصيل">تم التوصيل</option>
                          </select>
                        </td>

                        {/* حالة الطلب (order_status) */}
                        <td className="p-2.5 text-center">
                          <select
                            value={tx.orderStatus || (isReturned ? 'مرتجع' : 'يتم تحضيره')}
                            onChange={async (e) => {
                              const val = e.target.value;
                              await updateTransactionOrderStatus(tx.id, tx.orderId, { orderStatus: val });
                            }}
                            className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none transition-colors cursor-pointer ${
                              (tx.orderStatus || (isReturned ? 'مرتجع' : 'يتم تحضيره')) === 'تم توصيله'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : (tx.orderStatus || (isReturned ? 'مرتجع' : 'يتم تحضيره')) === 'يتم توصيله'
                                ? 'bg-purple-50 text-purple-800 border-purple-300'
                                : (tx.orderStatus || (isReturned ? 'مرتجع' : 'يتم تحضيره')) === 'مرتجع'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            <option value="يتم تحضيره">يتم تحضيره</option>
                            <option value="يتم توصيله">يتم توصيله</option>
                            <option value="تم توصيله">تم توصيله</option>
                            <option value="مرتجع">مرتجع</option>
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setViewingReceipt(tx)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              {isRtl ? 'التفاصيل' : 'Details'}
                            </button>
                            
                            {!isReturned && (
                              <button
                                onClick={async () => {
                                  if (window.confirm(isRtl ? 'هل تريد عمل مرتجع لهذه الفاتورة وإعادة المنتجات للمخزون؟' : 'Return this transaction and restore stock?')) {
                                    // --- 1. RECORD FINANCIAL TRANSACTION FIRST (SYNC WITH SUPABASE) ---
                                    const methodMapping: Record<PaymentMethod, string> = {
                                      Cash: 'Cash',
                                      Card: 'E_Wallet',
                                      'Bank Transfer': 'Bank',
                                      Invoice: 'Credit'
                                    };
                                    const dbMethod = methodMapping[tx.paymentMethod] || 'Cash';
                                    const txName = `${tx.customerName || (isRtl ? 'عميل نقدي' : 'Cash')} فاتورة مرتجع`;

                                    // Using absolute value for amount to avoid DB constraints, 
                                    // the 'Return_Trans' type identifies it as a deduction.
                                    const finRes = await addFinancialTransactionToSupabase({
                                      amount: tx.total, 
                                      method: dbMethod,
                                      notice: `مرتجع للفاتورة رقم ${tx.receiptNo}`,
                                      type: 'Return_Trans',
                                      name: getFormattedTxName(isRtl ? 'فاتورة مرتجع' : 'Return Invoice', tx.customerName || (isRtl ? 'عميل نقدي' : 'Cash'))
                                    });
                                    
                                    if (!finRes.success) {
                                      console.error('❌ Failed to record return transaction:', finRes.error);
                                      alert(isRtl ? `فشل تسجيل التحويل المالي للمرتجع: ${finRes.error}` : `Failed to record return transaction: ${finRes.error}`);
                                      return; // Stop if financial record fails to keep data consistent
                                    }
                                    // ------------------------------------------------------------------

                                    // 2. Update Supabase Stock
                                    for (const item of tx.items) {
                                      const catalogItem = fastItems.find(fi => fi.id === item.originalFastItemId || fi.name === item.name);
                                      if (catalogItem) {
                                        const newQty = catalogItem.stockQuantity + item.quantity;
                                        const cost = catalogItem.costPrice || catalogItem.price || 0;
                                        const isProduct = catalogItem.inventoryType === 'finished_goods';
                                        await updateStockQuantityInSupabase(catalogItem.id, newQty, cost, isProduct);
                                      }
                                    }
                                    
                                    // 3. Update Supabase Orders Status to 'مرتجع'
                                    if (tx.orderId) {
                                      await updateOrderStatusInSupabase(tx.orderId, { orderStatus: 'مرتجع' });
                                    }

                                    // 4. Update Local State
                                    returnTransactionItems(tx.items, tx.receiptNo, 'Customer Return');
                                    setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, status: 'Returned', orderStatus: 'مرتجع' } : t));
                                    
                                    alert(isRtl ? 'تم إرجاع الفاتورة وتحديث المخزون بنجاح!' : 'Transaction returned and stock updated!');
                                  }

                                }}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                {isRtl ? 'مرتجع' : 'Return'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

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
                placeholder={
                  isRtl 
                    ? (paymentMethod === 'Cash' ? 'ادخل اسم العميل' : 
                       paymentMethod === 'Card' ? 'رقم هاتف المحفظة' : 
                       paymentMethod === 'Bank Transfer' ? 'اطلب الرقم المرجعي للتحويل' : 
                       'ادخل اسم الشخص الذى طلب الاجل')
                    : 'Additional notes...'
                }
                className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-400/70"
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
              {(viewingReceipt.customerPhone1 || viewingReceipt.customerPhone2) && (
                <div className="flex justify-between text-slate-600">
                  <span>{isRtl ? 'أرقام الهاتف:' : 'Phone Numbers:'}</span>
                  <span className="font-mono font-bold text-slate-700">
                    {viewingReceipt.customerPhone1} {viewingReceipt.customerPhone2 ? `• ${viewingReceipt.customerPhone2}` : ''}
                  </span>
                </div>
              )}
              {viewingReceipt.customerAddress && (
                <div className="flex justify-between text-slate-600">
                  <span>{isRtl ? 'العنوان:' : 'Address:'}</span>
                  <span className="font-medium text-slate-700">{viewingReceipt.customerAddress}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>{isRtl ? 'طريقة الدفع:' : 'Payment:'}</span>
                <span className="font-semibold">{viewingReceipt.paymentMethod}</span>
              </div>
              
              {/* Order Statuses from public.orders */}
              <div className="grid grid-cols-3 gap-1.5 pt-2 mt-1 border-t border-slate-100 text-[10px]">
                <div className="flex flex-col items-center bg-blue-50/80 p-1.5 rounded-lg border border-blue-100">
                  <span className="text-slate-500">{isRtl ? 'التحضير' : 'Prep'}</span>
                  <span className="font-bold text-blue-800">{viewingReceipt.preparingStatus || 'تم البدء فيه'}</span>
                </div>
                <div className="flex flex-col items-center bg-indigo-50/80 p-1.5 rounded-lg border border-indigo-100">
                  <span className="text-slate-500">{isRtl ? 'التوصيل' : 'Delivery'}</span>
                  <span className="font-bold text-indigo-800">{viewingReceipt.deliveryStatus || 'فى انتظار انتهاء التحضير'}</span>
                </div>
                <div className="flex flex-col items-center bg-purple-50/80 p-1.5 rounded-lg border border-purple-100">
                  <span className="text-slate-500">{isRtl ? 'حالة الطلب' : 'Status'}</span>
                  <span className="font-bold text-purple-800">{viewingReceipt.orderStatus || 'يتم تحضيره'}</span>
                </div>
              </div>
            </div>

            {/* Line items list (order_items: Item_Name, unit_price, quantity_items, total_item_price) */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100/90 px-3 py-1.5 text-[10px] font-bold text-slate-600 flex justify-between items-center border-b border-slate-200">
                <span className="flex-1">{isRtl ? 'المنتج (Item_Name)' : 'Item Name'}</span>
                <span className="w-16 text-center">{isRtl ? 'السعر' : 'Unit Price'}</span>
                <span className="w-14 text-center">{isRtl ? 'الكمية' : 'Qty'}</span>
                <span className="w-20 text-left font-mono">{isRtl ? 'الإجمالي' : 'Total'}</span>
              </div>
              <div className="flex flex-col divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {viewingReceipt.items.map((it: StagedItem, idx: number) => (
                  <div key={idx} className="px-3 py-2 bg-white flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                    <span className="flex-1 font-bold text-slate-800 truncate">{it.name}</span>
                    <span className="w-16 text-center text-slate-600 font-mono text-[11px]">${it.unitPrice.toFixed(2)}</span>
                    <span className="w-14 text-center text-slate-800 font-mono font-bold text-[11px]">{it.quantity}</span>
                    <span className="w-20 text-left font-mono font-extrabold text-indigo-700 text-[11px]">
                      ${(it.unitPrice * it.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
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

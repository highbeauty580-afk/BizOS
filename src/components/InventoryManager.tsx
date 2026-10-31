import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FastItem, StockMovement, MovementType, Customer } from '../types';

export const InventoryManager: React.FC = () => {
  const {
    language,
    customPalette,
    fastItems,
    addFastItem,
    updateFastItem,
    deleteFastItem,
    restockItem,
    stockMovements,
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  } = useApp();

  const isRtl = language === 'ar';

  // Main Section Tab: 'inventory' | 'customers'
  const [mainTab, setMainTab] = useState<'inventory' | 'customers'>('inventory');

  // Customer Management State
  const [custSearchTerm, setCustSearchTerm] = useState('');
  const [isAddEditCustModalOpen, setIsAddEditCustModalOpen] = useState(false);
  const [editingCust, setEditingCust] = useState<Customer | null>(null);
  const [custFormName, setCustFormName] = useState('');
  const [custFormPhone, setCustFormPhone] = useState('');
  const [custFormCompany, setCustFormCompany] = useState('');
  const [custFormEmail, setCustFormEmail] = useState('');
  const [custFormError, setCustFormError] = useState('');

  // Local Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'excess' | 'normal'>('all');

  // Modal States
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FastItem | null>(null);

  // Form State for Add / Edit Product
  const [formName, setFormName] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState<'Retail' | 'Service' | 'Wholesale' | 'Other'>('Retail');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formStockQuantity, setFormStockQuantity] = useState<string>('');
  const [formMinStock, setFormMinStock] = useState<string>('10');
  const [formMaxStock, setFormMaxStock] = useState<string>('100');
  const [formUnit, setFormUnit] = useState('قطعة');
  const [formError, setFormError] = useState('');

  // Quick Restock Modal State
  const [restockItemTarget, setRestockItemTarget] = useState<FastItem | null>(null);
  const [restockQty, setRestockQty] = useState<string>('');
  const [restockReason, setRestockReason] = useState('');

  // Stock Movement Log Modal State
  const [viewLogItem, setViewLogItem] = useState<FastItem | null | 'all'>(null);
  const [logTypeFilter, setLogTypeFilter] = useState<string>('all');

  // Metrics Calculations
  const totalProducts = fastItems.length;
  
  const lowStockItems = fastItems.filter((i) => {
    const min = i.minStock ?? 10;
    return i.stockQuantity <= min;
  });

  const excessStockItems = fastItems.filter((i) => {
    const min = i.minStock ?? 10;
    const max = i.maxStock ?? 100;
    return i.stockQuantity > max && i.stockQuantity > min;
  });

  const normalStockItems = fastItems.filter((i) => {
    const min = i.minStock ?? 10;
    const max = i.maxStock ?? 100;
    return i.stockQuantity > min && i.stockQuantity <= max;
  });

  // Filter Catalog Items for Table Display
  const filteredItems = fastItems.filter((item) => {
    const min = item.minStock ?? 10;
    const max = item.maxStock ?? 100;

    // Search filter
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.nameAr && item.nameAr.includes(searchTerm)) ||
      (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()));

    // Category filter
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'low') {
      matchesStatus = item.stockQuantity <= min;
    } else if (statusFilter === 'excess') {
      matchesStatus = item.stockQuantity > max;
    } else if (statusFilter === 'normal') {
      matchesStatus = item.stockQuantity > min && item.stockQuantity <= max;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Open Add Product Modal
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormNameAr('');
    setFormCode(`PRD-${Math.floor(100 + Math.random() * 900)}`);
    setFormCategory('Retail');
    setFormPrice('25.00');
    setFormStockQuantity('20');
    setFormMinStock('10');
    setFormMaxStock('100');
    setFormUnit('قطعة');
    setFormError('');
    setIsAddEditModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditModal = (item: FastItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormNameAr(item.nameAr || '');
    setFormCode(item.code || '');
    setFormCategory(item.category);
    setFormPrice(item.price.toString());
    setFormStockQuantity(item.stockQuantity.toString());
    setFormMinStock((item.minStock ?? 10).toString());
    setFormMaxStock((item.maxStock ?? 100).toString());
    setFormUnit(item.unit || 'قطعة');
    setFormError('');
    setIsAddEditModalOpen(true);
  };

  // Submit Add / Edit Product Form with strict validation
  const handleSubmitProductForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const priceNum = parseFloat(formPrice);
    const stockNum = parseInt(formStockQuantity, 10);
    const minNum = parseInt(formMinStock, 10);
    const maxNum = parseInt(formMaxStock, 10);

    if (!formName.trim()) {
      setFormError(isRtl ? 'يرجى إدخال اسم المنتج باللغة الإنجليزية أو العربية' : 'Please enter product name.');
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError(isRtl ? 'السعر يجب أن يكون رقماً موجباً' : 'Price must be a positive number.');
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      setFormError(isRtl ? 'الكمية لا يمكن أن تكون سالبة' : 'Stock quantity cannot be negative.');
      return;
    }
    if (isNaN(minNum) || minNum < 0) {
      setFormError(isRtl ? 'الحد الأدنى لا يمكن أن يكون سالباً' : 'Minimum stock threshold cannot be negative.');
      return;
    }
    if (isNaN(maxNum) || maxNum < 0) {
      setFormError(isRtl ? 'الحد الأعلى لا يمكن أن يكون سالباً' : 'Maximum stock threshold cannot be negative.');
      return;
    }
    if (maxNum <= minNum) {
      setFormError(isRtl ? 'عفواً! يجب أن يكون الحد الأعلى أكبر تماماً من الحد الأدنى' : 'Maximum threshold must be strictly greater than minimum threshold.');
      return;
    }

    if (editingItem) {
      // Update
      updateFastItem(editingItem.id, {
        name: formName.trim(),
        nameAr: formNameAr.trim() || undefined,
        code: formCode.trim() || undefined,
        category: formCategory,
        price: priceNum,
        stockQuantity: stockNum,
        minStock: minNum,
        maxStock: maxNum,
        unit: formUnit.trim() || 'قطعة',
      });
    } else {
      // Create new
      addFastItem({
        name: formName.trim(),
        nameAr: formNameAr.trim() || undefined,
        code: formCode.trim() || undefined,
        category: formCategory,
        price: priceNum,
        stockQuantity: stockNum,
        minStock: minNum,
        maxStock: maxNum,
        unit: formUnit.trim() || 'قطعة',
      });
    }

    setIsAddEditModalOpen(false);
  };

  // Quick Restock Handler
  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItemTarget) return;

    const qty = parseInt(restockQty, 10);
    if (isNaN(qty) || qty <= 0) return;

    restockItem(
      restockItemTarget.id,
      qty,
      restockReason.trim() || (isRtl ? 'إضافة شحنة وتوريد جديد للمخزون' : 'Stock Replenishment')
    );

    setRestockItemTarget(null);
    setRestockQty('');
    setRestockReason('');
  };

  // Filtered Customers List
  const filteredCustomers = customers.filter((cust) => {
    const term = custSearchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      cust.name.toLowerCase().includes(term) ||
      cust.phone.includes(term) ||
      (cust.company && cust.company.toLowerCase().includes(term)) ||
      (cust.email && cust.email.toLowerCase().includes(term))
    );
  });

  // Open Add Customer Modal
  const handleOpenAddCustModal = () => {
    setEditingCust(null);
    setCustFormName('');
    setCustFormPhone('');
    setCustFormCompany('');
    setCustFormEmail('');
    setCustFormError('');
    setIsAddEditCustModalOpen(true);
  };

  // Open Edit Customer Modal
  const handleOpenEditCustModal = (cust: Customer) => {
    setEditingCust(cust);
    setCustFormName(cust.name);
    setCustFormPhone(cust.phone);
    setCustFormCompany(cust.company || '');
    setCustFormEmail(cust.email || '');
    setCustFormError('');
    setIsAddEditCustModalOpen(true);
  };

  // Submit Customer Form
  const handleSubmitCustForm = (e: React.FormEvent) => {
    e.preventDefault();
    setCustFormError('');

    if (!custFormName.trim()) {
      setCustFormError(isRtl ? 'يرجى إدخال اسم العميل' : 'Please enter customer name.');
      return;
    }

    if (editingCust) {
      updateCustomer(editingCust.id, {
        name: custFormName.trim(),
        phone: custFormPhone.trim() || '0000000000',
        company: custFormCompany.trim() || undefined,
        email: custFormEmail.trim() || undefined,
      });
    } else {
      addCustomer({
        name: custFormName.trim(),
        phone: custFormPhone.trim() || '0000000000',
        company: custFormCompany.trim() || undefined,
        email: custFormEmail.trim() || undefined,
      });
    }

    setIsAddEditCustModalOpen(false);
  };

  // Filtered Stock Movements for Modal
  const displayedMovements = stockMovements.filter((m) => {
    const matchesItem = viewLogItem === 'all' || !viewLogItem ? true : m.itemId === viewLogItem.id;
    const matchesType = logTypeFilter === 'all' ? true : m.type === logTypeFilter;
    return matchesItem && matchesType;
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* 1. TOP HEADER & NAVIGATION TITLE WITH TABS */}
      <div
        style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
        className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
            style={{ backgroundColor: customPalette.primaryAccent }}
          >
            <span className="material-symbols-outlined text-2xl">
              {mainTab === 'inventory' ? 'inventory_2' : 'group'}
            </span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>
                {mainTab === 'inventory'
                  ? (isRtl ? 'إدارة المخزون والمنتجات' : 'Inventory & Stock Management')
                  : (isRtl ? 'قاعدة بيانات العملاء' : 'Customer Database')}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                {mainTab === 'inventory' ? `${totalProducts} ${isRtl ? 'صنف' : 'items'}` : `${customers.length} ${isRtl ? 'عميل' : 'clients'}`}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {mainTab === 'inventory'
                ? (isRtl
                    ? 'تحديد الحدود الأدنى والأقصى، متابعة التنبيهات التلقائية، وتتبع سجل حركة البيع والتوريد.'
                    : 'Manage stock thresholds, min/max alerts, and full inventory movement tracking.')
                : (isRtl
                    ? 'عرض وحفظ وتحديث بيانات جميع العملاء المسجلين في النظام لاستخدامهم المباشر في المبيعات.'
                    : 'View, add, and manage customer records integrated with the sales cashier.')}
            </p>
          </div>
        </div>

        {/* TOP TAB SWITCHER: (المخزون والمنتجات | قاعدة العملاء) & GLOBAL ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* View Tab Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setMainTab('inventory')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                mainTab === 'inventory'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-base text-indigo-600">inventory_2</span>
              <span>{isRtl ? 'جدول المخزون' : 'Inventory'}</span>
            </button>

            <button
              onClick={() => setMainTab('customers')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                mainTab === 'customers'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-base text-indigo-600">group</span>
              <span>{isRtl ? 'قاعدة العملاء' : 'Customer Database'}</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                {customers.length}
              </span>
            </button>
          </div>

          {/* Action Button based on View */}
          {mainTab === 'inventory' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewLogItem('all')}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-slate-600">history</span>
                <span>{isRtl ? 'سجل الحركة' : 'Stock Log'}</span>
              </button>

              <button
                onClick={handleOpenAddModal}
                style={{ backgroundColor: customPalette.primaryAccent }}
                className="px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-1 cursor-pointer active:scale-98 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-base">add_box</span>
                <span>+ {isRtl ? 'منتج جديد' : 'New Product'}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleOpenAddCustModal}
              style={{ backgroundColor: customPalette.primaryAccent }}
              className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer active:scale-98 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              <span>+ {isRtl ? 'إضافة عميل جديد' : 'Add New Customer'}</span>
            </button>
          )}
        </div>
      </div>

      {/* MAIN VIEW CONTENT: INVENTORY VIEW VS CUSTOMER DATABASE VIEW */}
      {mainTab === 'inventory' ? (
        <>
          {/* 2. SUMMARY METRICS CARDS BAR (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Catalog Items */}
            <div
              style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
              className="p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500">{isRtl ? 'إجمالي المنتجات' : 'Total Items'}</span>
                <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{totalProducts}</span>
                <span className="text-[10px] text-slate-400 mt-0.5">{isRtl ? 'منتجات مسجلة بالنظام' : 'Registered catalog items'}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined">inventory</span>
              </div>
            </div>

            {/* Card 2: Low Stock Alert (🔴) */}
            <div
              onClick={() => setStatusFilter('low')}
              style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                lowStockItems.length > 0 ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200/80'
              }`}
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  <span>{isRtl ? 'مخزون منخفض (تنبيه حرج)' : 'Low Stock (Critical)'}</span>
                </span>
                <span className="text-2xl font-extrabold text-rose-600 font-mono mt-1">{lowStockItems.length}</span>
                <span className="text-[10px] text-rose-600 font-medium mt-0.5">
                  {isRtl ? 'منتجات وصلت أو تحت الحد الأدنى' : 'Items at or below min threshold'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined">warning</span>
              </div>
            </div>

            {/* Card 3: Excess Stock Alert (🟢) */}
            <div
              onClick={() => setStatusFilter('excess')}
              style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                excessStockItems.length > 0 ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200/80'
              }`}
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>{isRtl ? 'مخزون زائد (تخزين مرتفع)' : 'Excess Stock (Overstock)'}</span>
                </span>
                <span className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">{excessStockItems.length}</span>
                <span className="text-[10px] text-emerald-600 font-medium mt-0.5">
                  {isRtl ? 'منتجات تجاوزت الحد الأعلى' : 'Items exceeding max threshold'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined">trending_up</span>
              </div>
            </div>

            {/* Card 4: Normal Stock (🔵) */}
            <div
              onClick={() => setStatusFilter('normal')}
              style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
              className="p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-600">{isRtl ? 'مخزون ضمن الحدود (طبيعي)' : 'Optimal Stock (Normal)'}</span>
                <span className="text-2xl font-extrabold text-slate-800 font-mono mt-1">{normalStockItems.length}</span>
                <span className="text-[10px] text-slate-400 mt-0.5">{isRtl ? 'كمية متوازنة تماماً' : 'Balanced inventory level'}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
            </div>
          </div>

          {/* 3. SEARCH & CONTROLS BAR */}
          <div
            style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
            className="p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3"
          >
            {/* Search Engine */}
            <div className="relative w-full md:w-80">
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isRtl ? 'ابحث باسم المنتج أو الكود...' : 'Search product or code...'}
                className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Status Filter Tabs (الكل | مخزون منخفض 🔴 | مخزون زائد 🟢 | طبيعي 🔵) */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto w-full md:w-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isRtl ? 'الكل' : 'All'} ({totalProducts})
              </button>

              <button
                onClick={() => setStatusFilter('low')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  statusFilter === 'low' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                <span>🔴 {isRtl ? 'منخفض' : 'Low'}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">{lowStockItems.length}</span>
              </button>

              <button
                onClick={() => setStatusFilter('excess')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  statusFilter === 'excess' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <span>🟢 {isRtl ? 'زائد' : 'Excess'}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">{excessStockItems.length}</span>
              </button>

              <button
                onClick={() => setStatusFilter('normal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'normal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isRtl ? 'طبيعي' : 'Normal'} ({normalStockItems.length})
              </button>
            </div>
          </div>

          {/* 4. PRODUCT INVENTORY TABLE */}
          <div
            style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
            className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
          >
            {filteredItems.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
                <span className="font-bold text-slate-600">{isRtl ? 'لا توجد منتجات مطابقة لفلتر البحث' : 'No products match search filter'}</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-700 font-bold">
                      <th className="p-3.5">{isRtl ? 'المنتج والكود' : 'Product & Code'}</th>
                      <th className="p-3.5">{isRtl ? 'الفئة' : 'Category'}</th>
                      <th className="p-3.5">{isRtl ? 'السعر ($)' : 'Price ($)'}</th>
                      <th className="p-3.5">{isRtl ? 'الكمية الحالية' : 'Current Stock'}</th>
                      <th className="p-3.5">{isRtl ? 'الحد الأدنى' : 'Min Threshold'}</th>
                      <th className="p-3.5">{isRtl ? 'الحد الأعلى' : 'Max Threshold'}</th>
                      <th className="p-3.5">{isRtl ? 'حالة المخزون' : 'Stock Status'}</th>
                      <th className="p-3.5 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => {
                      const min = item.minStock ?? 10;
                      const max = item.maxStock ?? 100;
                      const current = item.stockQuantity;

                      const isLow = current <= min;
                      const isExcess = current > max;
                      const isNormal = !isLow && !isExcess;

                      // Percentage ratio relative to max limit
                      const fillPct = Math.min(100, Math.round((current / max) * 100));

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Product Name & Code */}
                          <td className="p-3.5">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{isRtl && item.nameAr ? item.nameAr : item.name}</span>
                              <span className="text-[10px] font-mono text-slate-400 font-semibold">{item.code || `ID-${item.id}`}</span>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="p-3.5 font-medium text-slate-600">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                              {item.category}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="p-3.5 font-extrabold text-indigo-700 font-mono text-xs">
                            ${item.price.toFixed(2)}
                          </td>

                          {/* Current Stock */}
                          <td className="p-3.5 font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-extrabold text-sm ${isLow ? 'text-rose-600' : isExcess ? 'text-emerald-600' : 'text-slate-900'}`}>
                                {current}
                              </span>
                              <span className="text-[10px] text-slate-400">{item.unit || 'قطعة'}</span>
                            </div>
                          </td>

                          {/* Min Threshold */}
                          <td className="p-3.5 font-mono font-semibold text-slate-600">
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-md text-[11px]">
                              {min}
                            </span>
                          </td>

                          {/* Max Threshold */}
                          <td className="p-3.5 font-mono font-semibold text-slate-600">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200/80 rounded-md text-[11px]">
                              {max}
                            </span>
                          </td>

                          {/* Stock Status Badge & Progress Bar */}
                          <td className="p-3.5">
                            <div className="flex flex-col gap-1 min-w-[130px]">
                              {isLow && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] w-fit">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                                  <span>{isRtl ? '🔴 مخزون منخفض' : '🔴 Low Stock'}</span>
                                </span>
                              )}

                              {isExcess && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] w-fit">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                  <span>{isRtl ? '🟢 مخزون زائد' : '🟢 Excess Stock'}</span>
                                </span>
                              )}

                              {isNormal && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 font-semibold text-[10px] w-fit">
                                  <span>🔵 {isRtl ? 'ضمن الحدود' : 'Normal Stock'}</span>
                                </span>
                              )}

                              {/* Progress bar */}
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-0.5">
                                <div
                                  style={{ width: `${fillPct}%` }}
                                  className={`h-full rounded-full transition-all ${
                                    isLow ? 'bg-rose-500' : isExcess ? 'bg-emerald-500' : 'bg-indigo-600'
                                  }`}
                                ></div>
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Quick Restock Button */}
                              <button
                                onClick={() => {
                                  setRestockItemTarget(item);
                                  setRestockQty('20');
                                  setRestockReason('');
                                }}
                                title={isRtl ? 'إضافة وتوريد شحنة كمية جديدة' : 'Quick Restock'}
                                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] transition-colors flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>+</span>
                                <span>{isRtl ? 'توريد' : 'Restock'}</span>
                              </button>

                              {/* Edit Details & Thresholds */}
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                title={isRtl ? 'تعديل بيانات المنتج وحدود المخزون' : 'Edit Thresholds'}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>

                              {/* View Log */}
                              <button
                                onClick={() => setViewLogItem(item)}
                                title={isRtl ? 'عرض سجل حركة هذا المنتج' : 'View Item Log'}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-base">history</span>
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => {
                                  if (window.confirm(isRtl ? `هل أنت تأكد من حذف المنتج (${item.name})؟` : `Delete product ${item.name}?`)) {
                                    deleteFastItem(item.id);
                                  }
                                }}
                                title={isRtl ? 'حذف المنتج' : 'Delete'}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
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
        </>
      ) : (
        /* CUSTOMER DATABASE VIEW (قاعدة العملاء) */
        <>
          {/* Metrics Summary Bar for Customers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
              className="p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500">{isRtl ? 'إجمالي قاعدة العملاء' : 'Total Customers'}</span>
                <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{customers.length}</span>
                <span className="text-[10px] text-slate-400 mt-0.5">{isRtl ? 'عملاء مسجلون بالنظام' : 'Active client records'}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined">groups</span>
              </div>
            </div>

            <div
              style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
              className="p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500">{isRtl ? 'حسابات الشركات والشركاء' : 'Corporate Accounts'}</span>
                <span className="text-2xl font-extrabold text-indigo-700 font-mono mt-1">
                  {customers.filter((c) => c.company && c.company !== 'مبيعات نقدية').length}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">{isRtl ? 'مؤسسات وشركات تجارية' : 'Commercial entities'}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined">domain</span>
              </div>
            </div>

            <div
              style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
              className="p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500">{isRtl ? 'الأفراد والعملاء المباشرون' : 'Individual Accounts'}</span>
                <span className="text-2xl font-extrabold text-slate-800 font-mono mt-1">
                  {customers.filter((c) => !c.company || c.company === 'مبيعات نقدية').length}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">{isRtl ? 'حسابات أفراد ونقدي' : 'Individual customers'}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined">person</span>
              </div>
            </div>
          </div>

          {/* Search Controls for Customer Database */}
          <div
            style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
            className="p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3"
          >
            <div className="relative w-full md:w-96">
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
              <input
                type="text"
                value={custSearchTerm}
                onChange={(e) => setCustSearchTerm(e.target.value)}
                placeholder={isRtl ? 'ابحث باسم العميل، رقم الهاتف، أو الشركة...' : 'Search customer by name, phone, or company...'}
                className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleOpenAddCustModal}
              style={{ backgroundColor: customPalette.primaryAccent }}
              className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer active:scale-98 w-full md:w-auto justify-center"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              <span>+ {isRtl ? 'إضافة عميل جديد' : 'Add New Customer'}</span>
            </button>
          </div>

          {/* Customer Table */}
          <div
            style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
            className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
          >
            {filteredCustomers.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-4xl text-slate-300">group_off</span>
                <span className="font-bold text-slate-600">{isRtl ? 'لا يوجد عملاء مطابقون للبحث' : 'No matching customers found'}</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-700 font-bold">
                      <th className="p-3.5">{isRtl ? 'العميل' : 'Customer Name'}</th>
                      <th className="p-3.5">{isRtl ? 'رقم الهاتف' : 'Phone'}</th>
                      <th className="p-3.5">{isRtl ? 'الشركة / المنشأة' : 'Company / Entity'}</th>
                      <th className="p-3.5">{isRtl ? 'البريد الإلكتروني' : 'Email'}</th>
                      <th className="p-3.5 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Name */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                              {cust.name.substring(0, 1)}
                            </div>
                            <span className="font-bold text-slate-900">{cust.name}</span>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="p-3.5 font-mono text-slate-700 dir-ltr font-semibold">
                          📞 {cust.phone}
                        </td>

                        {/* Company */}
                        <td className="p-3.5 text-slate-600 font-medium">
                          {cust.company ? (
                            <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 font-bold text-[10px]">
                              🏢 {cust.company}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">{isRtl ? 'حساب فردي' : 'Individual'}</span>
                          )}
                        </td>

                        {/* Email */}
                        <td className="p-3.5 font-mono text-slate-600">
                          {cust.email || '—'}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditCustModal(cust)}
                              title={isRtl ? 'تعديل بيانات العميل' : 'Edit Customer'}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(isRtl ? `هل أنت تأكد من حذف العميل (${cust.name})؟` : `Delete customer ${cust.name}?`)) {
                                  deleteCustomer(cust.id);
                                }
                              }}
                              title={isRtl ? 'حذف العميل' : 'Delete Customer'}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL 0: ADD / EDIT CUSTOMER MODAL (نافذة إضافة وتعديل العملاء) */}
      {isAddEditCustModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">person_add</span>
                <span>
                  {editingCust
                    ? (isRtl ? `تعديل بيانات العميل: ${editingCust.name}` : `Edit Customer: ${editingCust.name}`)
                    : (isRtl ? 'إضافة عميل جديد إلى قاعدة البيانات' : 'Add New Customer')}
                </span>
              </h3>
              <button onClick={() => setIsAddEditCustModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {custFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <span>⚠️</span>
                <span>{custFormError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCustForm} className="flex flex-col gap-3 text-xs font-medium">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">{isRtl ? 'اسم العميل ثلاثي / التجاري' : 'Customer Full Name'}</label>
                <input
                  type="text"
                  required
                  value={custFormName}
                  onChange={(e) => setCustFormName(e.target.value)}
                  placeholder={isRtl ? 'مثال: شركة الخليج للتجارة' : 'John Doe'}
                  className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'رقم الهاتف' : 'Phone Number'}</label>
                  <input
                    type="text"
                    value={custFormPhone}
                    onChange={(e) => setCustFormPhone(e.target.value)}
                    placeholder="+966 50 000 0000"
                    className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'الشركة / المنشأة' : 'Company / Entity'}</label>
                  <input
                    type="text"
                    value={custFormCompany}
                    onChange={(e) => setCustFormCompany(e.target.value)}
                    placeholder={isRtl ? 'مؤسسة الابتكار' : 'Acme Corp'}
                    className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">{isRtl ? 'البريد الإلكتروني' : 'Email Address'}</label>
                <input
                  type="email"
                  value={custFormEmail}
                  onChange={(e) => setCustFormEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditCustModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: customPalette.primaryAccent }}
                  className="px-5 py-2 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingCust ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'حفظ العميل' : 'Add Customer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT PRODUCT & THRESHOLDS MODAL */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 flex flex-col gap-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">inventory_2</span>
                <span>
                  {editingItem
                    ? (isRtl ? `تعديل المنتج والحدود: ${editingItem.name}` : `Edit Product: ${editingItem.name}`)
                    : (isRtl ? 'إضافة منتج جديد وتحديد الحدود' : 'Add New Product')}
                </span>
              </h3>
              <button onClick={() => setIsAddEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form Error Banner */}
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitProductForm} className="flex flex-col gap-3 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'اسم المنتج (إنجليزي)' : 'Name (En)'}</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Coffee Beans 500g"
                    className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'اسم المنتج (عربي)' : 'Name (Ar)'}</label>
                  <input
                    type="text"
                    value={formNameAr}
                    onChange={(e) => setFormNameAr(e.target.value)}
                    placeholder="بن قهوة فاخر"
                    className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'كود المنتج (Barcode/Code)' : 'Product Code'}</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="PRD-101"
                    className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'الفئة / القسم' : 'Category'}</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="h-9 px-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Retail">{isRtl ? 'تجزئة (Retail)' : 'Retail'}</option>
                    <option value="Service">{isRtl ? 'خدمات (Service)' : 'Service'}</option>
                    <option value="Wholesale">{isRtl ? 'جملة (Wholesale)' : 'Wholesale'}</option>
                    <option value="Other">{isRtl ? 'أخرى (Other)' : 'Other'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'سعر البيع ($)' : 'Unit Price ($)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'وحدة القياس' : 'Unit'}</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="قطعة / علبة / كجم"
                    className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* THRESHOLDS SECTION (الكمية الحالية، الحد الأدنى، الحد الأعلى) */}
              <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex flex-col gap-2 mt-1">
                <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">tune</span>
                  <span>{isRtl ? 'إعداد كميات وحدود المخزون (Thresholds)' : 'Stock Thresholds Setup'}</span>
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-700">{isRtl ? 'الكمية الحالية' : 'Current Qty'}</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formStockQuantity}
                      onChange={(e) => setFormStockQuantity(e.target.value)}
                      className="h-9 px-2 text-center rounded-xl bg-white border border-indigo-200 font-mono font-extrabold text-xs text-slate-900"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-amber-800">{isRtl ? 'الحد الأدنى' : 'Min Limit'}</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formMinStock}
                      onChange={(e) => setFormMinStock(e.target.value)}
                      className="h-9 px-2 text-center rounded-xl bg-white border border-amber-300 font-mono font-extrabold text-xs text-amber-900"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-indigo-800">{isRtl ? 'الحد الأعلى' : 'Max Limit'}</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formMaxStock}
                      onChange={(e) => setFormMaxStock(e.target.value)}
                      className="h-9 px-2 text-center rounded-xl bg-white border border-indigo-300 font-mono font-extrabold text-xs text-indigo-900"
                    />
                  </div>
                </div>
                <span className="text-[9px] text-slate-500 italic mt-0.5">
                  {isRtl
                    ? '* الحد الأدنى: ينبّه باللون الأحمر. الحد الأعلى: ينبّه باللون الأخضر.'
                    : '* Min limit triggers red alert. Max limit triggers green alert.'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: customPalette.primaryAccent }}
                  className="px-5 py-2 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingItem ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'إضافة المنتج' : 'Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK RESTOCK MODAL */}
      {restockItemTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">add_box</span>
                <span>{isRtl ? `توريد وإضافة كمية: ${restockItemTarget.name}` : `Restock: ${restockItemTarget.name}`}</span>
              </h3>
              <button onClick={() => setRestockItemTarget(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmRestock} className="flex flex-col gap-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-emerald-900">
                <span>{isRtl ? 'الكمية الحالية للمنتج:' : 'Current Stock:'}</span>
                <span className="font-mono font-extrabold text-sm">{restockItemTarget.stockQuantity} {restockItemTarget.unit || 'قطعة'}</span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">{isRtl ? 'الكمية المضافة الجديدة' : 'Quantity to Add'}</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="20"
                  className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-sm text-center focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">{isRtl ? 'السبب / رقم أمر التوريد' : 'Reason / PO Number'}</label>
                <input
                  type="text"
                  value={restockReason}
                  onChange={(e) => setRestockReason(e.target.value)}
                  placeholder={isRtl ? 'استلام شحنة جديدة من المورد...' : 'Purchase order PO-102...'}
                  className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRestockItemTarget(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {isRtl ? 'تأكيد التوريد والإضافة' : 'Confirm Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: STOCK MOVEMENT LOG MODAL (سجل الحركة لكل منتج أو كلي) */}
      {viewLogItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 flex flex-col gap-4 animate-scale-up max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex flex-col">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600">history</span>
                  <span>
                    {viewLogItem === 'all'
                      ? (isRtl ? 'سجل حركة المخزون الكلي' : 'Global Stock Movement Log')
                      : (isRtl ? `سجل حركة: ${viewLogItem.name}` : `Stock Log: ${viewLogItem.name}`)}
                  </span>
                </h3>
              </div>
              <button onClick={() => setViewLogItem(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Filter by Movement Type */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-600">{isRtl ? 'تصفية حسب نوع الحركة:' : 'Filter by type:'}</span>
              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  onClick={() => setLogTypeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${
                    logTypeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isRtl ? 'الكل' : 'All'}
                </button>
                <button
                  onClick={() => setLogTypeFilter('sale')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${
                    logTypeFilter === 'sale' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700'
                  }`}
                >
                  {isRtl ? 'بيع (الكاشير)' : 'Sales'}
                </button>
                <button
                  onClick={() => setLogTypeFilter('restock')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${
                    logTypeFilter === 'restock' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {isRtl ? 'توريد وإضافة' : 'Restock'}
                </button>
                <button
                  onClick={() => setLogTypeFilter('return')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${
                    logTypeFilter === 'return' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {isRtl ? 'إرجاع' : 'Returns'}
                </button>
              </div>
            </div>

            {/* Movements List Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200/80 rounded-xl">
              {displayedMovements.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {isRtl ? 'لا توجد حركات مخزنية مسجلة لهذا العرض' : 'No recorded movements for this view'}
                </div>
              ) : (
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold sticky top-0">
                      <th className="p-3">{isRtl ? 'التاريخ والوقت' : 'Date & Time'}</th>
                      <th className="p-3">{isRtl ? 'المنتج' : 'Product'}</th>
                      <th className="p-3">{isRtl ? 'نوع الحركة' : 'Type'}</th>
                      <th className="p-3 text-center">{isRtl ? 'التغيير' : 'Change'}</th>
                      <th className="p-3 font-mono">{isRtl ? 'قبل ➔ بعد' : 'Before ➔ After'}</th>
                      <th className="p-3">{isRtl ? 'السبب / الملاحظة' : 'Reason'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedMovements.map((m) => {
                      const isNegative = m.quantityChange < 0;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60">
                          <td className="p-3 font-mono text-[11px] text-slate-500">{m.date} {m.time}</td>
                          <td className="p-3 font-bold text-slate-800">{m.itemName}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              m.type === 'sale' ? 'bg-indigo-50 text-indigo-700' :
                              m.type === 'restock' ? 'bg-emerald-50 text-emerald-700' :
                              m.type === 'return' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {m.type === 'sale' ? (isRtl ? '🛒 بيع' : 'Sale') :
                               m.type === 'restock' ? (isRtl ? '📥 توريد' : 'Restock') :
                               m.type === 'return' ? (isRtl ? '↩️ إرجاع' : 'Return') : (isRtl ? '⚙️ تعديل' : 'Adjustment')}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono font-extrabold">
                            <span className={isNegative ? 'text-rose-600' : 'text-emerald-600'}>
                              {isNegative ? m.quantityChange : `+${m.quantityChange}`}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-600">
                            {m.quantityBefore} ➔ <span className="font-bold text-slate-900">{m.quantityAfter}</span>
                          </td>
                          <td className="p-3 text-slate-600 max-w-xs truncate">{m.reason}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setViewLogItem(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

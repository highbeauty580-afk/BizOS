import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FastItem,
  StockMovement,
  Customer,
  InventoryType,
  WipBatch,
  WipStage,
  WipMaterialUsage,
} from '../types';

export const InventoryManager: React.FC = () => {
  const {
    language,
    customPalette,
    fastItems,
    addFastItem,
    updateFastItem,
    deleteFastItem,
    restockItem,
    wipBatches,
    startWipBatch,
    updateWipBatchStage,
    recordWipScrap,
    completeWipBatch,
    deleteWipBatch,
    stockMovements,
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  } = useApp();

  const isRtl = language === 'ar';

  // Main View Mode: 'inventory' | 'customers'
  const [mainTab, setMainTab] = useState<'inventory' | 'customers'>('inventory');

  // 4 Internal Inventory Tabs: 'all' (الكل - Default) | 'raw_material' | 'work_in_progress' | 'finished_goods'
  const [inventoryTab, setInventoryTab] = useState<'all' | 'raw_material' | 'work_in_progress' | 'finished_goods'>('all');

  // Customer Search & Form State
  const [custSearchTerm, setCustSearchTerm] = useState('');
  const [isAddEditCustModalOpen, setIsAddEditCustModalOpen] = useState(false);
  const [editingCust, setEditingCust] = useState<Customer | null>(null);
  const [custFormName, setCustFormName] = useState('');
  const [custFormPhone, setCustFormPhone] = useState('');
  const [custFormCompany, setCustFormCompany] = useState('');
  const [custFormEmail, setCustFormEmail] = useState('');
  const [custFormError, setCustFormError] = useState('');

  // Local Search & Filter State for Inventory Items
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'excess' | 'normal'>('all');

  // Modal States for Items
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [modalInventoryTypeTarget, setModalInventoryTypeTarget] = useState<InventoryType>('finished_goods');
  const [editingItem, setEditingItem] = useState<FastItem | null>(null);

  // Form State for Items
  const [formName, setFormName] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Retail');
  const [formPrice, setFormPrice] = useState<string>('0');
  const [formCostPrice, setFormCostPrice] = useState<string>('0');
  const [formStockQuantity, setFormStockQuantity] = useState<string>('0');
  const [formMinStock, setFormMinStock] = useState<string>('10');
  const [formMaxStock, setFormMaxStock] = useState<string>('100');
  const [formUnit, setFormUnit] = useState('قطعة');
  const [formError, setFormError] = useState('');

  // Quick Restock Modal State
  const [restockItemTarget, setRestockItemTarget] = useState<FastItem | null>(null);
  const [restockQty, setRestockQty] = useState<string>('');
  const [restockReason, setRestockReason] = useState('');

  // --- NEW WIP MANUFACTURING BATCH MODAL STATES ---
  const [isStartWipModalOpen, setIsStartWipModalOpen] = useState(false);
  const [wipFinishedGoodId, setWipFinishedGoodId] = useState<string>('');
  const [wipTargetQty, setWipTargetQty] = useState<string>('50');
  const [wipTargetCompletionDate, setWipTargetCompletionDate] = useState<string>('');
  const [wipNotes, setWipNotes] = useState<string>('');
  const [wipSelectedMaterials, setWipSelectedMaterials] = useState<WipMaterialUsage[]>([]);
  const [wipModalError, setWipModalError] = useState<string>('');

  // Complete WIP Batch Modal State
  const [completeWipTarget, setCompleteWipTarget] = useState<WipBatch | null>(null);
  const [completeActualQty, setCompleteActualQty] = useState<string>('');
  const [completeScrapQty, setCompleteScrapQty] = useState<string>('0');

  // Record Scrap Modal State
  const [scrapWipTarget, setScrapWipTarget] = useState<WipBatch | null>(null);
  const [scrapInputQty, setScrapInputQty] = useState<string>('1');

  // Stock Movement Log Modal State
  const [viewLogItem, setViewLogItem] = useState<FastItem | null | 'all'>(null);
  const [logTypeFilter, setLogTypeFilter] = useState<string>('all');

  // Separated Inventory Lists
  const rawMaterials = fastItems.filter((i) => i.inventoryType === 'raw_material');
  const finishedGoods = fastItems.filter((i) => i.inventoryType !== 'raw_material');
  const activeWipBatches = wipBatches.filter((b) => b.status === 'in_progress');

  // Metric Threshold Alerts across items
  const lowStockItems = fastItems.filter((i) => i.stockQuantity <= (i.minStock ?? 10));
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

  // Filtered Catalog Items based on Tab & Status & Search
  const displayableItems = fastItems.filter((item) => {
    // 1. Internal Tab Filter
    if (inventoryTab === 'raw_material' && item.inventoryType !== 'raw_material') return false;
    if (inventoryTab === 'finished_goods' && item.inventoryType === 'raw_material') return false;
    if (inventoryTab === 'work_in_progress') return false; // WIP batches displayed separately

    // 2. Search
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      item.name.toLowerCase().includes(term) ||
      (item.nameAr && item.nameAr.includes(term)) ||
      (item.code && item.code.toLowerCase().includes(term));

    // 3. Status Filter
    const min = item.minStock ?? 10;
    const max = item.maxStock ?? 100;
    let matchesStatus = true;
    if (statusFilter === 'low') matchesStatus = item.stockQuantity <= min;
    if (statusFilter === 'excess') matchesStatus = item.stockQuantity > max;
    if (statusFilter === 'normal') matchesStatus = item.stockQuantity > min && item.stockQuantity <= max;

    return matchesSearch && matchesStatus;
  });

  // Open Add Modal with specific inventoryType
  const handleOpenAddModal = (targetType: InventoryType = 'finished_goods') => {
    setEditingItem(null);
    setModalInventoryTypeTarget(targetType);
    setFormName('');
    setFormNameAr('');
    setFormCode(targetType === 'raw_material' ? `RM-${Math.floor(100 + Math.random() * 900)}` : `PRD-${Math.floor(100 + Math.random() * 900)}`);
    setFormCategory(targetType === 'raw_material' ? 'Raw Materials' : 'Retail');
    setFormPrice(targetType === 'raw_material' ? '15.00' : '50.00');
    setFormCostPrice(targetType === 'raw_material' ? '10.00' : '25.00');
    setFormStockQuantity('50');
    setFormMinStock('10');
    setFormMaxStock('200');
    setFormUnit(targetType === 'raw_material' ? 'كجم' : 'قطعة');
    setFormError('');
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: FastItem) => {
    setEditingItem(item);
    setModalInventoryTypeTarget(item.inventoryType || 'finished_goods');
    setFormName(item.name);
    setFormNameAr(item.nameAr || '');
    setFormCode(item.code || '');
    setFormCategory(item.category);
    setFormPrice(item.price.toString());
    setFormCostPrice((item.costPrice ?? 0).toString());
    setFormStockQuantity(item.stockQuantity.toString());
    setFormMinStock((item.minStock ?? 10).toString());
    setFormMaxStock((item.maxStock ?? 100).toString());
    setFormUnit(item.unit || 'قطعة');
    setFormError('');
    setIsAddEditModalOpen(true);
  };

  // Submit Add / Edit Product Form
  const handleSubmitProductForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const priceNum = parseFloat(formPrice);
    const costNum = parseFloat(formCostPrice);
    const stockNum = parseInt(formStockQuantity, 10);
    const minNum = parseInt(formMinStock, 10);
    const maxNum = parseInt(formMaxStock, 10);

    if (!formName.trim()) {
      setFormError(isRtl ? 'يرجى إدخال اسم الصنف باللغة الإنجليزية أو العربية' : 'Please enter item name.');
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError(isRtl ? 'السعر يجب أن يكون رقماً موجباً' : 'Price must be positive.');
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
    if (isNaN(maxNum) || maxNum <= minNum) {
      setFormError(isRtl ? 'يجب أن يكون الحد الأعلى أكبر تماماً من الحد الأدنى' : 'Max threshold must be strictly greater than min threshold.');
      return;
    }

    if (editingItem) {
      updateFastItem(editingItem.id, {
        name: formName.trim(),
        nameAr: formNameAr.trim() || undefined,
        code: formCode.trim() || undefined,
        category: formCategory,
        inventoryType: modalInventoryTypeTarget,
        price: priceNum,
        costPrice: isNaN(costNum) ? 0 : costNum,
        stockQuantity: stockNum,
        minStock: minNum,
        maxStock: maxNum,
        unit: formUnit.trim() || 'قطعة',
      });
    } else {
      addFastItem({
        name: formName.trim(),
        nameAr: formNameAr.trim() || undefined,
        code: formCode.trim() || undefined,
        category: formCategory,
        inventoryType: modalInventoryTypeTarget,
        price: priceNum,
        costPrice: isNaN(costNum) ? 0 : costNum,
        stockQuantity: stockNum,
        minStock: minNum,
        maxStock: maxNum,
        unit: formUnit.trim() || 'قطعة',
      });
    }

    setIsAddEditModalOpen(false);
  };

  // Open Start WIP Manufacturing Modal
  const handleOpenStartWipModal = () => {
    const defaultFg = finishedGoods[0] || fastItems[0];
    setWipFinishedGoodId(defaultFg ? defaultFg.id : '');
    setWipTargetQty('50');
    const defaultCompletion = new Date();
    defaultCompletion.setDate(defaultCompletion.getDate() + 7);
    setWipTargetCompletionDate(defaultCompletion.toISOString().split('T')[0]);
    setWipNotes('');
    setWipModalError('');

    // Pre-fill initial raw materials row if available
    if (rawMaterials.length > 0) {
      setWipSelectedMaterials([
        {
          rawMaterialId: rawMaterials[0].id,
          rawMaterialName: rawMaterials[0].nameAr || rawMaterials[0].name,
          quantityUsed: 10,
          unit: rawMaterials[0].unit || 'كجم',
        },
      ]);
    } else {
      setWipSelectedMaterials([]);
    }

    setIsStartWipModalOpen(true);
  };

  // Submit Start WIP Manufacturing Batch
  const handleSubmitStartWip = (e: React.FormEvent) => {
    e.preventDefault();
    setWipModalError('');

    const targetQtyNum = parseInt(wipTargetQty, 10);
    if (isNaN(targetQtyNum) || targetQtyNum <= 0) {
      setWipModalError(isRtl ? 'يرجى إدخال كمية مستهدفة صحيحة أكبر من صفر' : 'Target quantity must be greater than zero.');
      return;
    }

    const targetGood = fastItems.find((i) => i.id === wipFinishedGoodId);
    if (!targetGood) {
      setWipModalError(isRtl ? 'يرجى اختيار المنتج النهائي المستهدف بالتصنيع' : 'Please select target finished product.');
      return;
    }

    // Validate raw material stock availability
    for (const mat of wipSelectedMaterials) {
      const stockItem = rawMaterials.find((r) => r.id === mat.rawMaterialId);
      if (stockItem && stockItem.stockQuantity < mat.quantityUsed) {
        setWipModalError(
          isRtl
            ? `عفواً! كمية المادة الخام (${stockItem.nameAr || stockItem.name}) المتاحة بالمخزون (${stockItem.stockQuantity} ${stockItem.unit}) أقل من المطلوب (${mat.quantityUsed} ${mat.unit}).`
            : `Insufficient raw material stock for ${stockItem.name}.`
        );
        return;
      }
    }

    startWipBatch({
      finishedGoodId: targetGood.id,
      finishedGoodName: targetGood.nameAr || targetGood.name,
      targetQuantity: targetQtyNum,
      rawMaterialsUsed: wipSelectedMaterials,
      stage: 'preparation',
      startDate: new Date().toISOString().split('T')[0],
      targetCompletionDate: wipTargetCompletionDate || undefined,
      notes: wipNotes.trim() || undefined,
    });

    setIsStartWipModalOpen(false);
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

  // Submit Complete WIP Batch
  const handleConfirmCompleteWip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeWipTarget) return;

    const actualQty = parseInt(completeActualQty, 10);
    const scrapQty = parseInt(completeScrapQty, 10) || 0;

    if (isNaN(actualQty) || actualQty < 0) return;

    completeWipBatch(completeWipTarget.id, actualQty, scrapQty);
    setCompleteWipTarget(null);
  };

  // Submit Record Scrap
  const handleConfirmRecordScrap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapWipTarget) return;

    const scrapQty = parseInt(scrapInputQty, 10);
    if (isNaN(scrapQty) || scrapQty <= 0) return;

    recordWipScrap(scrapWipTarget.id, scrapQty);
    setScrapWipTarget(null);
  };

  // Customer Management Handlers
  const handleOpenAddCustModal = () => {
    setEditingCust(null);
    setCustFormName('');
    setCustFormPhone('');
    setCustFormCompany('');
    setCustFormEmail('');
    setCustFormError('');
    setIsAddEditCustModalOpen(true);
  };

  const handleOpenEditCustModal = (cust: Customer) => {
    setEditingCust(cust);
    setCustFormName(cust.name);
    setCustFormPhone(cust.phone);
    setCustFormCompany(cust.company || '');
    setCustFormEmail(cust.email || '');
    setCustFormError('');
    setIsAddEditCustModalOpen(true);
  };

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

  const filteredCustomers = customers.filter((cust) => {
    const term = custSearchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      cust.name.toLowerCase().includes(term) ||
      cust.phone.includes(term) ||
      (cust.company && cust.company.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* 1. TOP PAGE HEADER BAR WITH MAIN VIEW SWITCHER */}
      <div
        style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
        className="p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
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
                  ? (isRtl ? 'إدارة المخزون والتصنيع الشاملة' : 'Comprehensive Inventory & WIP')
                  : (isRtl ? 'قاعدة بيانات العملاء' : 'Customer Database')}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                {mainTab === 'inventory'
                  ? `${fastItems.length} ${isRtl ? 'صنف' : 'items'} • ${activeWipBatches.length} ${isRtl ? 'تصنيع قائم' : 'WIP'}`
                  : `${customers.length} ${isRtl ? 'عميل' : 'clients'}`}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {mainTab === 'inventory'
                ? (isRtl
                    ? 'إدارة المواد الخام، المنتجات تحت التصنيع، والمنتجات الجاهزة مع التنبيهات المباشرة الربط مع المبيعات.'
                    : 'Manage Raw Materials, Work in Progress, and Finished Goods integrated with sales.')
                : (isRtl
                    ? 'إدارة وحفظ سجلات العملاء والشركات لاستخدامهم المباشر في المبيعات.'
                    : 'Manage customer records for POS integration.')}
            </p>
          </div>
        </div>

        {/* View Switcher: Inventory vs Customer Database */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setMainTab('inventory')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mainTab === 'inventory'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-base text-indigo-600">inventory_2</span>
              <span>{isRtl ? 'المخزون والتصنيع' : 'Inventory & WIP'}</span>
            </button>

            <button
              onClick={() => setMainTab('customers')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mainTab === 'customers'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-base text-indigo-600">group</span>
              <span>{isRtl ? 'قاعدة العملاء' : 'Customers'}</span>
            </button>
          </div>
        </div>
      </div>

      {mainTab === 'inventory' ? (
        <>
          {/* 2. REQUIRED 4 INTERNAL INVENTORY TABS (الكل | المواد الخام | تحت التصنيع | المنتجات الجاهزة) */}
          <div
            style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
            className="p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3"
          >
            {/* 4 Internal Navigation Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200 overflow-x-auto w-full md:w-auto">
              {/* Tab 1: الكل (All - Default Tab) */}
              <button
                onClick={() => setInventoryTab('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  inventoryTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <span className="material-symbols-outlined text-base">apps</span>
                <span>{isRtl ? 'الكل' : 'All Items'}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${inventoryTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'}`}>
                  {fastItems.length + activeWipBatches.length}
                </span>
              </button>

              {/* Tab 2: المواد الخام (Raw Materials) */}
              <button
                onClick={() => setInventoryTab('raw_material')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  inventoryTab === 'raw_material'
                    ? 'bg-amber-600 text-white shadow-sm font-extrabold'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <span className="material-symbols-outlined text-base">category</span>
                <span>{isRtl ? 'المواد الخام' : 'Raw Materials'}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${inventoryTab === 'raw_material' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'}`}>
                  {rawMaterials.length}
                </span>
              </button>

              {/* Tab 3: تحت التصنيع (Work in Progress - WIP) */}
              <button
                onClick={() => setInventoryTab('work_in_progress')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  inventoryTab === 'work_in_progress'
                    ? 'bg-purple-600 text-white shadow-sm font-extrabold'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <span className="material-symbols-outlined text-base">precision_manufacturing</span>
                <span>{isRtl ? 'تحت التصنيع' : 'Work in Progress'}</span>
                {activeWipBatches.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-md bg-purple-200 text-purple-900 font-extrabold text-[10px]">
                    {activeWipBatches.length}
                  </span>
                )}
              </button>

              {/* Tab 4: المنتجات الجاهزة (Finished Goods) */}
              <button
                onClick={() => setInventoryTab('finished_goods')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  inventoryTab === 'finished_goods'
                    ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <span className="material-symbols-outlined text-base">inventory</span>
                <span>{isRtl ? 'المنتجات الجاهزة' : 'Finished Goods'}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${inventoryTab === 'finished_goods' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'}`}>
                  {finishedGoods.length}
                </span>
              </button>
            </div>

            {/* Contextual Action Buttons depending on active tab */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setViewLogItem('all')}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-slate-600">history</span>
                <span className="hidden sm:inline">{isRtl ? 'سجل الحركة' : 'Stock Log'}</span>
              </button>

              {inventoryTab === 'raw_material' ? (
                <button
                  onClick={() => handleOpenAddModal('raw_material')}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  <span>+ {isRtl ? 'إضافة مادة خام' : 'Add Raw Material'}</span>
                </button>
              ) : inventoryTab === 'work_in_progress' ? (
                <button
                  onClick={handleOpenStartWipModal}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-base">play_circle</span>
                  <span>+ {isRtl ? 'بدء تشغيلة تصنيع' : 'Start WIP Batch'}</span>
                </button>
              ) : (
                <button
                  onClick={() => handleOpenAddModal('finished_goods')}
                  style={{ backgroundColor: customPalette.primaryAccent }}
                  className="px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-base">add_box</span>
                  <span>+ {isRtl ? 'منتج جاهز جديد' : 'New Finished Good'}</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. METRIC SUMMARY CARDS WITH ALERTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Total Catalog Items */}
            <div
              style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
              className="p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500">{isRtl ? 'إجمالي أصناف المخزون' : 'Total Items'}</span>
                <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{fastItems.length}</span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {rawMaterials.length} {isRtl ? 'خام' : 'raw'} • {finishedGoods.length} {isRtl ? 'جاهز' : 'goods'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined">inventory_2</span>
              </div>
            </div>

            {/* Metric 2: Low Stock Alert (🔴) */}
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
                  <span>{isRtl ? '🔴 تنبيه حد أدنى (منخفض)' : '🔴 Low Stock Alert'}</span>
                </span>
                <span className="text-2xl font-extrabold text-rose-600 font-mono mt-1">{lowStockItems.length}</span>
                <span className="text-[10px] text-rose-600 font-medium mt-0.5">
                  {isRtl ? 'أصناف أو مواد وصلن للحد الأدنى' : 'Items at or below min limit'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined">warning</span>
              </div>
            </div>

            {/* Metric 3: Excess Stock Alert (🟢) */}
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
                  <span>{isRtl ? '🟢 تجاوز حد أقصى (زائد)' : '🟢 Overstock Alert'}</span>
                </span>
                <span className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">{excessStockItems.length}</span>
                <span className="text-[10px] text-emerald-600 font-medium mt-0.5">
                  {isRtl ? 'أصناف تجاوزت الحد الأعلى' : 'Items exceeding max limit'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined">trending_up</span>
              </div>
            </div>

            {/* Metric 4: Work in Progress Active Batches */}
            <div
              onClick={() => setInventoryTab('work_in_progress')}
              style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
              className="p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-purple-700">{isRtl ? 'تشجيلات جاري تصنيعها' : 'Active WIP Batches'}</span>
                <span className="text-2xl font-extrabold text-purple-900 font-mono mt-1">{activeWipBatches.length}</span>
                <span className="text-[10px] text-purple-600 font-medium mt-0.5">{isRtl ? 'دفعة قيد الإنتاج' : 'Active production lines'}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined">precision_manufacturing</span>
              </div>
            </div>
          </div>

          {/* 4. TAB-SPECIFIC VIEW DISPLAY */}
          {inventoryTab === 'work_in_progress' ? (
            /* --- TAB 3: WORK IN PROGRESS (تحت التصنيع) VIEW --- */
            <div className="flex flex-col gap-4">
              <div
                style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
                className="p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-600 text-lg">precision_manufacturing</span>
                    <span>{isRtl ? 'إدارة ومتابعة تشغيلات الإنتاج تحت التصنيع (Work in Progress)' : 'Work in Progress Management'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isRtl
                      ? 'خصم تلقائي للمواد الخام المستخدمة عند بدء التشغيلة، وتجهيز المنتجات المكتملة لتتحول تلقائياً إلى المنتجات الجاهزة.'
                      : 'Automatic raw material deduction upon batch start and auto-addition to finished goods upon batch completion.'}
                  </p>
                </div>

                <button
                  onClick={handleOpenStartWipModal}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-base">play_circle</span>
                  <span>+ {isRtl ? 'بدء تشغيلة تصنيع جديدة' : 'Start New WIP Batch'}</span>
                </button>
              </div>

              {/* Active Batches Table / Cards */}
              {wipBatches.length === 0 ? (
                <div className="p-12 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center flex flex-col items-center justify-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-purple-300">precision_manufacturing</span>
                  <p className="text-xs font-bold text-slate-700">
                    {isRtl ? 'لا توجد تشغيلات تصنيع حالياً' : 'No manufacturing batches recorded yet.'}
                  </p>
                  <button
                    onClick={handleOpenStartWipModal}
                    className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
                  >
                    + {isRtl ? 'بدء أول تشغيلة تصنيع' : 'Start First Batch'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {wipBatches.map((batch) => {
                    const isCompleted = batch.status === 'completed';

                    return (
                      <div
                        key={batch.id}
                        style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
                        className={`p-5 rounded-2xl border transition-all shadow-xs flex flex-col gap-4 ${
                          isCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-purple-200 bg-white'
                        }`}
                      >
                        {/* Batch Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-3">
                            <span className={`w-3 h-3 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-purple-600 animate-pulse'}`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900">{batch.finishedGoodName}</h4>
                                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                  {batch.batchNo}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500">
                                {isRtl ? 'تاريخ البدء:' : 'Started:'} {batch.startDate}
                                {batch.targetCompletionDate && ` • ${isRtl ? 'التاريخ المستهدف:' : 'Target:'} ${batch.targetCompletionDate}`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Status Badge */}
                            {isCompleted ? (
                              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                <span>{isRtl ? 'مكتمل ومرحّل للمنتجات الجاهزة' : 'Completed & Moved'}</span>
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-extrabold text-xs flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                                <span>{isRtl ? 'جاري التصنيع' : 'In Progress'}</span>
                              </span>
                            )}

                            <button
                              onClick={() => deleteWipBatch(batch.id)}
                              title={isRtl ? 'حذف التشغيلة' : 'Delete Batch'}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Batch Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                          {/* Target Quantity */}
                          <div className="flex flex-col">
                            <span className="text-slate-500 font-medium">{isRtl ? 'الكمية المستهدفة:' : 'Target Qty:'}</span>
                            <span className="font-extrabold text-slate-900 font-mono text-sm mt-0.5">{batch.targetQuantity} قطعة</span>
                          </div>

                          {/* Completed Quantity */}
                          <div className="flex flex-col">
                            <span className="text-slate-500 font-medium">{isRtl ? 'الكمية المكتملة الفعلية:' : 'Completed Qty:'}</span>
                            <span className="font-extrabold text-emerald-700 font-mono text-sm mt-0.5">
                              {batch.completedQuantity || (isCompleted ? batch.targetQuantity : 0)} قطعة
                            </span>
                          </div>

                          {/* Scrapped Waste */}
                          <div className="flex flex-col">
                            <span className="text-slate-500 font-medium">{isRtl ? 'الهالك أثناء التصنيع:' : 'Scrapped / Spoilage:'}</span>
                            <span className={`font-extrabold font-mono text-sm mt-0.5 ${batch.scrappedQuantity > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                              {batch.scrappedQuantity || 0} قطعة
                            </span>
                          </div>

                          {/* Stage Dropdown Selector */}
                          <div className="flex flex-col">
                            <span className="text-slate-500 font-medium">{isRtl ? 'مرحلة التصنيع الحالية:' : 'Current Stage:'}</span>
                            {isCompleted ? (
                              <span className="font-bold text-emerald-700 text-xs mt-1">إكتمال نهائي والتسليم للمخزن</span>
                            ) : (
                              <select
                                value={batch.stage}
                                onChange={(e) => updateWipBatchStage(batch.id, e.target.value as WipStage)}
                                className="mt-1 bg-white border border-purple-300 rounded-lg px-2 py-1 text-xs font-bold text-purple-900 focus:outline-none"
                              >
                                <option value="preparation">{isRtl ? '1. التجهيز والتحضير' : '1. Preparation'}</option>
                                <option value="processing">{isRtl ? '2. الخياطة والقص / المعالجة' : '2. Processing'}</option>
                                <option value="assembly">{isRtl ? '3. التجميع والتركيب' : '3. Assembly'}</option>
                                <option value="quality_check">{isRtl ? '4. الفحص وضمان الجودة' : '4. Quality Check'}</option>
                                <option value="packaging">{isRtl ? '5. التغليف والإنهاء' : '5. Packaging'}</option>
                              </select>
                            )}
                          </div>
                        </div>

                        {/* Raw Materials Consumed Summary */}
                        {batch.rawMaterialsUsed && batch.rawMaterialsUsed.length > 0 && (
                          <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-2">
                            <span className="text-[11px] font-bold text-slate-500">
                              {isRtl ? 'المواد الخام المخصومة والمستهلكة في هذه التشغيلة:' : 'Raw Materials Consumed:'}
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {batch.rawMaterialsUsed.map((rm, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-semibold flex items-center gap-1">
                                  <span>📦 {rm.rawMaterialName}:</span>
                                  <span className="font-bold font-mono text-amber-900">{rm.quantityUsed} {rm.unit}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions for In-Progress Batches */}
                        {!isCompleted && (
                          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            {/* Record Scrap Button */}
                            <button
                              onClick={() => {
                                setScrapWipTarget(batch);
                                setScrapInputQty('1');
                              }}
                              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">delete_sweep</span>
                              <span>{isRtl ? 'تسجيل هالك' : 'Record Scrap'}</span>
                            </button>

                            {/* Complete Manufacturing Button */}
                            <button
                              onClick={() => {
                                setCompleteWipTarget(batch);
                                setCompleteActualQty(batch.targetQuantity.toString());
                                setCompleteScrapQty((batch.scrappedQuantity || 0).toString());
                              }}
                              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                              <span>{isRtl ? 'إكتمال التصنيع وترحيل للمنتجات الجاهزة' : 'Complete & Move to Finished Goods'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* --- TABS 1, 2, 4: ALL ITEMS, RAW MATERIALS, OR FINISHED GOODS TABLE VIEW --- */
            <div className="flex flex-col gap-4">
              {/* Search & Status Filters */}
              <div
                style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
                className="p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3"
              >
                <div className="relative w-full md:w-80">
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={isRtl ? 'ابحث باسم الصنف أو الكود...' : 'Search by name or code...'}
                    className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Status Filter Badges (🔴 منخفض | 🟢 زائد | 🔵 طبيعي) */}
                <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200 overflow-x-auto w-full md:w-auto">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isRtl ? 'الكل' : 'All'}
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

              {/* Table Display */}
              <div
                style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
                className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
              >
                {displayableItems.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
                    <span className="font-bold text-slate-600">{isRtl ? 'لا توجد أصناف مطابقة لفلتر التصفية' : 'No items match search query'}</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-700 font-bold">
                          <th className="p-3.5">{isRtl ? 'اسم الصنف والكود' : 'Item & Code'}</th>
                          <th className="p-3.5">{isRtl ? 'نوع التصنيف' : 'Classification'}</th>
                          <th className="p-3.5">{isRtl ? 'سعر البيع / التكلفة' : 'Price / Cost'}</th>
                          <th className="p-3.5">{isRtl ? 'الكمية الحالية' : 'Current Stock'}</th>
                          <th className="p-3.5">{isRtl ? 'الحد الأدنى' : 'Min Limit'}</th>
                          <th className="p-3.5">{isRtl ? 'الحد الأعلى' : 'Max Limit'}</th>
                          <th className="p-3.5">{isRtl ? 'حالة التنبيه' : 'Alert Status'}</th>
                          <th className="p-3.5 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayableItems.map((item) => {
                          const min = item.minStock ?? 10;
                          const max = item.maxStock ?? 100;
                          const current = item.stockQuantity;

                          const isLow = current <= min;
                          const isExcess = current > max;
                          const isNormal = !isLow && !isExcess;
                          const isRaw = item.inventoryType === 'raw_material';

                          const fillPct = Math.min(100, Math.round((current / max) * 100));

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Name & Code */}
                              <td className="p-3.5">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900">{isRtl && item.nameAr ? item.nameAr : item.name}</span>
                                  <span className="text-[10px] font-mono text-slate-400 font-semibold">{item.code || `ID-${item.id}`}</span>
                                </div>
                              </td>

                              {/* Classification Badge (مادة خام | منتج جاهز) */}
                              <td className="p-3.5 font-medium">
                                {isRaw ? (
                                  <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center gap-1 w-fit">
                                    <span>📦 {isRtl ? 'مادة خام' : 'Raw Material'}</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 font-bold text-[10px] flex items-center gap-1 w-fit">
                                    <span>🛒 {isRtl ? 'منتج جاهز' : 'Finished Good'}</span>
                                  </span>
                                )}
                              </td>

                              {/* Price */}
                              <td className="p-3.5 font-mono">
                                <div className="flex flex-col">
                                  <span className="font-extrabold text-slate-900">${item.price.toFixed(2)}</span>
                                  {item.costPrice !== undefined && item.costPrice > 0 && (
                                    <span className="text-[10px] text-slate-400">{isRtl ? 'تكلفة:' : 'Cost:'} ${item.costPrice.toFixed(2)}</span>
                                  )}
                                </div>
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

                              {/* Min Limit */}
                              <td className="p-3.5 font-mono font-semibold">
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-md text-[11px]">
                                  {min}
                                </span>
                              </td>

                              {/* Max Limit */}
                              <td className="p-3.5 font-mono font-semibold">
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200/80 rounded-md text-[11px]">
                                  {max}
                                </span>
                              </td>

                              {/* Alert Status Pill */}
                              <td className="p-3.5">
                                <div className="flex flex-col gap-1 min-w-[130px]">
                                  {isLow && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] w-fit">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                                      <span>🔴 {isRtl ? 'مخزون منخفض' : 'Low Stock'}</span>
                                    </span>
                                  )}

                                  {isExcess && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] w-fit">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                      <span>🟢 {isRtl ? 'مخزون زائد' : 'Excess Stock'}</span>
                                    </span>
                                  )}

                                  {isNormal && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 font-semibold text-[10px] w-fit">
                                      <span>🔵 {isRtl ? 'طبيعي' : 'Normal Stock'}</span>
                                    </span>
                                  )}

                                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-0.5">
                                    <div
                                      style={{ width: `${fillPct}%` }}
                                      className={`h-full rounded-full transition-all ${
                                        isLow ? 'bg-rose-500' : isExcess ? 'bg-emerald-500' : 'bg-indigo-600'
                                      }`}
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="p-3.5 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* Quick Restock */}
                                  <button
                                    onClick={() => {
                                      setRestockItemTarget(item);
                                      setRestockQty('20');
                                      setRestockReason('');
                                    }}
                                    title={isRtl ? 'تغذية وتوريد شحنة كمية جديدة' : 'Restock'}
                                    className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] transition-colors flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <span>+</span>
                                    <span>{isRtl ? 'توريد' : 'Restock'}</span>
                                  </button>

                                  {/* Edit Details */}
                                  <button
                                    onClick={() => handleOpenEditModal(item)}
                                    title={isRtl ? 'تعديل بيانات الصنف والحدود' : 'Edit'}
                                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-base">edit</span>
                                  </button>

                                  {/* Delete */}
                                  <button
                                    onClick={() => {
                                      if (window.confirm(isRtl ? `تأكيد حذف الصنف (${item.name})؟` : `Delete item ${item.name}?`)) {
                                        deleteFastItem(item.id);
                                      }
                                    }}
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
            </div>
          )}
        </>
      ) : (
        /* CUSTOMER DATABASE VIEW */
        <div className="flex flex-col gap-4">
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
                placeholder={isRtl ? 'ابحث باسم العميل أو رقم الهاتف...' : 'Search customer by name or phone...'}
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
                      <th className="p-3.5">{isRtl ? 'الشركة / المنشأة' : 'Company'}</th>
                      <th className="p-3.5 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                              {cust.name.substring(0, 1)}
                            </div>
                            <span className="font-bold text-slate-900">{cust.name}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-700 font-semibold dir-ltr">📞 {cust.phone}</td>
                        <td className="p-3.5 text-slate-600 font-medium">
                          {cust.company ? (
                            <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 font-bold text-[10px]">🏢 {cust.company}</span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">{isRtl ? 'حساب فردي' : 'Individual'}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleOpenEditCustModal(cust)} className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100">
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                            <button onClick={() => deleteCustomer(cust.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600">
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
        </div>
      )}

      {/* --- MODAL 1: ADD / EDIT INVENTORY ITEM MODAL --- */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem
                  ? (isRtl ? `تعديل صنف: (${editingItem.name})` : 'Edit Item')
                  : (isRtl
                      ? modalInventoryTypeTarget === 'raw_material'
                        ? 'إضافة مادة خام جديدة'
                        : 'إضافة منتج جاهز جديد'
                      : 'Add New Item')}
              </h3>
              <button onClick={() => setIsAddEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSubmitProductForm} className="flex flex-col gap-3.5">
              {/* Type Switcher */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">{isRtl ? 'تصنيف الصنف المخزني:' : 'Inventory Type:'}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalInventoryTypeTarget('raw_material')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      modalInventoryTypeTarget === 'raw_material'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    📦 {isRtl ? 'مادة خام (تصنيع)' : 'Raw Material'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalInventoryTypeTarget('finished_goods')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      modalInventoryTypeTarget === 'finished_goods'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    🛒 {isRtl ? 'منتج جاهز (بيع)' : 'Finished Good'}
                  </button>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'الاسم بالإنجليزية *' : 'English Name *'}</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    className="p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'الاسم بالعربية' : 'Arabic Name'}</label>
                  <input
                    type="text"
                    value={formNameAr}
                    onChange={(e) => setFormNameAr(e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Code & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'كود الصنف / الباركوم' : 'Code / SKU'}</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'وحدة القياس (قطعة، كجم، إلخ)' : 'Unit'}</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'سعر البيع ($)' : 'Selling Price ($)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">{isRtl ? 'تكلفة الشراء / الإنتاج ($)' : 'Cost Price ($)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Quantities & Min / Max Thresholds */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-800">{isRtl ? 'الكمية المتاحة' : 'Current Stock'}</label>
                  <input
                    type="number"
                    value={formStockQuantity}
                    onChange={(e) => setFormStockQuantity(e.target.value)}
                    className="p-2 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-amber-800">🔴 {isRtl ? 'الحد الأدنى' : 'Min Limit'}</label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="p-2 rounded-xl border border-amber-300 text-xs font-mono font-bold bg-amber-50 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-indigo-800">🟢 {isRtl ? 'الحد الأعلى' : 'Max Limit'}</label>
                  <input
                    type="number"
                    value={formMaxStock}
                    onChange={(e) => setFormMaxStock(e.target.value)}
                    className="p-2 rounded-xl border border-indigo-300 text-xs font-mono font-bold bg-indigo-50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  style={{ backgroundColor: customPalette.primaryAccent }}
                  className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-90"
                >
                  {editingItem ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'إضافة الصنف للمخزون' : 'Add to Inventory')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: START NEW WIP MANUFACTURING BATCH --- */}
      {isStartWipModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 flex flex-col gap-4 border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600">precision_manufacturing</span>
                <h3 className="text-base font-bold text-slate-900">
                  {isRtl ? 'بدء تشغيلة تصنيع جديدة (Work in Progress)' : 'Start New WIP Manufacturing Batch'}
                </h3>
              </div>
              <button onClick={() => setIsStartWipModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {wipModalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                ⚠️ {wipModalError}
              </div>
            )}

            <form onSubmit={handleSubmitStartWip} className="flex flex-col gap-4">
              {/* Target Finished Product */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-800">{isRtl ? 'المنتج النهائي المستهدف تصنيعه *' : 'Target Finished Good *'}</label>
                <select
                  value={wipFinishedGoodId}
                  onChange={(e) => setWipFinishedGoodId(e.target.value)}
                  required
                  className="p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:border-purple-600"
                >
                  {finishedGoods.map((fg) => (
                    <option key={fg.id} value={fg.id}>
                      {fg.nameAr || fg.name} (المخزون الحالي: {fg.stockQuantity} {fg.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Quantity & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-800">{isRtl ? 'الكمية المستهدفة للإنتاج *' : 'Target Quantity *'}</label>
                  <input
                    type="number"
                    value={wipTargetQty}
                    onChange={(e) => setWipTargetQty(e.target.value)}
                    required
                    min="1"
                    className="p-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-800">{isRtl ? 'تاريخ الإكتمال المتوقع' : 'Target Completion Date'}</label>
                  <input
                    type="date"
                    value={wipTargetCompletionDate}
                    onChange={(e) => setWipTargetCompletionDate(e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Select Raw Materials to Consume */}
              <div className="flex flex-col gap-2 bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                    <span>📦 {isRtl ? 'المواد الخام المستخدمة (سيتم خصمها فوراً من المخزون):' : 'Raw Materials Consumed:'}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (rawMaterials.length > 0) {
                        const first = rawMaterials[0];
                        setWipSelectedMaterials((prev) => [
                          ...prev,
                          { rawMaterialId: first.id, rawMaterialName: first.nameAr || first.name, quantityUsed: 5, unit: first.unit || 'كجم' },
                        ]);
                      }
                    }}
                    className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-0.5"
                  >
                    <span>+ {isRtl ? 'إضافة مادة خام' : 'Add Material'}</span>
                  </button>
                </div>

                {wipSelectedMaterials.length === 0 ? (
                  <p className="text-[11px] text-amber-700 italic">{isRtl ? 'لم يتم تحديد مواد خام مخصومة لهذه التشغيلة.' : 'No raw materials selected.'}</p>
                ) : (
                  <div className="flex flex-col gap-2 mt-1">
                    {wipSelectedMaterials.map((mat, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-amber-200">
                        <select
                          value={mat.rawMaterialId}
                          onChange={(e) => {
                            const selectedR = rawMaterials.find((r) => r.id === e.target.value);
                            if (selectedR) {
                              setWipSelectedMaterials((prev) =>
                                prev.map((m, i) =>
                                  i === idx
                                    ? {
                                        ...m,
                                        rawMaterialId: selectedR.id,
                                        rawMaterialName: selectedR.nameAr || selectedR.name,
                                        unit: selectedR.unit || 'كجم',
                                      }
                                    : m
                                )
                              );
                            }
                          }}
                          className="flex-1 bg-amber-50/40 border border-slate-200 rounded-lg p-1.5 text-xs font-bold"
                        >
                          {rawMaterials.map((rm) => (
                            <option key={rm.id} value={rm.id}>
                              {rm.nameAr || rm.name} (المتاح: {rm.stockQuantity} {rm.unit})
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          value={mat.quantityUsed}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setWipSelectedMaterials((prev) =>
                              prev.map((m, i) => (i === idx ? { ...m, quantityUsed: val } : m))
                            );
                          }}
                          className="w-20 bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-bold"
                        />

                        <span className="text-xs text-slate-500 font-bold shrink-0">{mat.unit}</span>

                        <button
                          type="button"
                          onClick={() => setWipSelectedMaterials((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">{isRtl ? 'ملاحظات وتفاصيل التشغيلة' : 'Notes'}</label>
                <input
                  type="text"
                  value={wipNotes}
                  onChange={(e) => setWipNotes(e.target.value)}
                  placeholder={isRtl ? 'مثال: معالجة شحنة الخياطة والطباعة' : 'Batch details...'}
                  className="p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStartWipModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md"
                >
                  🚀 {isRtl ? 'بدء تشغيلة التصنيع والخصم' : 'Start WIP & Deduct Raw Materials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: COMPLETE WIP BATCH & MOVE TO FINISHED GOODS --- */}
      {completeWipTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                <span>{isRtl ? 'إكتمال تصنيع التشغيلة وترحيلها' : 'Complete Batch & Move to Finished Goods'}</span>
              </h3>
              <button onClick={() => setCompleteWipTarget(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {isRtl
                ? `سيتم تحويل كمية المنتجات المكتملة من تشغيلة (${completeWipTarget.finishedGoodName}) مباشرة إلى قسم المنتجات الجاهزة لتصبح متاحة في المبيعات.`
                : `Completed items will be transferred directly to Finished Goods stock.`}
            </p>

            <form onSubmit={handleConfirmCompleteWip} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-800">{isRtl ? 'الكمية الفعلية المكتملة السليمة *' : 'Actual Completed Quantity *'}</label>
                <input
                  type="number"
                  value={completeActualQty}
                  onChange={(e) => setCompleteActualQty(e.target.value)}
                  required
                  min="0"
                  className="p-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-rose-800">{isRtl ? 'كمية الهالك النهائي (إن وجد)' : 'Scrapped Quantity'}</label>
                <input
                  type="number"
                  value={completeScrapQty}
                  onChange={(e) => setCompleteScrapQty(e.target.value)}
                  min="0"
                  className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-mono font-bold focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompleteWipTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
                >
                  ✅ {isRtl ? 'إكتمال الترحيل للمخزون الجاهز' : 'Complete & Move Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: RECORD SCRAP DURING WIP --- */}
      {scrapWipTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-600">delete_sweep</span>
                <span>{isRtl ? 'تسجيل هالك أثناء التصنيع' : 'Record WIP Scrap / Spoilage'}</span>
              </h3>
              <button onClick={() => setScrapWipTarget(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmRecordScrap} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-800">{isRtl ? 'كمية التالف / الهالك المراد تسجيلها' : 'Scrapped Quantity'}</label>
                <input
                  type="number"
                  value={scrapInputQty}
                  onChange={(e) => setScrapInputQty(e.target.value)}
                  required
                  min="1"
                  className="p-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setScrapWipTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
                >
                  {isRtl ? 'تسجيل الهالك' : 'Confirm Scrap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 5: QUICK RESTOCK MODAL --- */}
      {restockItemTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {isRtl ? `تغذية وتوريد شحنة جديدة: (${restockItemTarget.nameAr || restockItemTarget.name})` : 'Stock Replenishment'}
              </h3>
              <button onClick={() => setRestockItemTarget(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmRestock} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-800">{isRtl ? 'الكمية المضافة لشحنة التوريد *' : 'Quantity to Add *'}</label>
                <input
                  type="number"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  required
                  min="1"
                  className="p-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">{isRtl ? 'سبب التوريد أو رقم الفاتورة' : 'Reason / Invoice No'}</label>
                <input
                  type="text"
                  value={restockReason}
                  onChange={(e) => setRestockReason(e.target.value)}
                  placeholder={isRtl ? 'مثال: توريد شحنة المورد الفترية' : 'Replenishment reason'}
                  className="p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRestockItemTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
                >
                  + {isRtl ? 'تأكيد التوريد والزيادة' : 'Confirm Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 6: STOCK MOVEMENT LOG MODAL --- */}
      {viewLogItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 flex flex-col gap-4 border border-slate-200 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">history</span>
                <span>
                  {viewLogItem === 'all'
                    ? (isRtl ? 'سجل كافة حرصات المخزون والتصنيع' : 'All Stock Movements')
                    : (isRtl ? `سجل حركة الصنف: (${viewLogItem.nameAr || viewLogItem.name})` : 'Item Movement History')}
                </span>
              </h3>
              <button onClick={() => setViewLogItem(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-3">{isRtl ? 'التاريخ والوقت' : 'Date & Time'}</th>
                    <th className="p-3">{isRtl ? 'اسم الصنف' : 'Item'}</th>
                    <th className="p-3">{isRtl ? 'نوع الحركة' : 'Type'}</th>
                    <th className="p-3">{isRtl ? 'التغير' : 'Change'}</th>
                    <th className="p-3">{isRtl ? 'الرصيد بعد' : 'Balance After'}</th>
                    <th className="p-3">{isRtl ? 'السبب / التشغيلة' : 'Reason / Reference'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {stockMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 text-xs italic">
                        {isRtl ? 'لا توجد حرصات مسجلة بعد.' : 'No stock movements recorded yet.'}
                      </td>
                    </tr>
                  ) : (
                    stockMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/70">
                        <td className="p-3 text-slate-600">{m.date} {m.time}</td>
                        <td className="p-3 font-bold text-slate-900 font-sans">{m.itemName}</td>
                        <td className="p-3 font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.type === 'sale'
                              ? 'bg-rose-100 text-rose-800'
                              : m.type === 'restock'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {m.type === 'sale' ? 'بيع' : m.type === 'restock' ? 'توريد/إنتاج' : 'تسوية/خصم'}
                          </span>
                        </td>
                        <td className={`p-3 font-bold ${m.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                        </td>
                        <td className="p-3 font-bold text-slate-900">{m.quantityAfter}</td>
                        <td className="p-3 text-slate-600 font-sans">{m.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setViewLogItem(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700">
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

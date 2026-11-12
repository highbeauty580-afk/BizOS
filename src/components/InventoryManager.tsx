import React, { useState, useEffect } from 'react';
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
import {
  fetchProductsFromSupabase,
  addProductToSupabase,
  updateProductInSupabase,
  deleteProductFromSupabase,
} from '../lib/productsService';
import {
  fetchStockFromSupabase,
  addStockToSupabase,
  updateStockQuantityInSupabase,
} from '../lib/stockService';
import { addFinancialTransactionToSupabase } from '../lib/transactionsService';

export const InventoryManager: React.FC = () => {
  const {
    language,
    customPalette,
    fastItems,
    setFastItems,
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
    returnTransactionItems,
  } = useApp();

  const isRtl = language === 'ar';

  // --- FINANCIAL TRANSACTION STATE FOR INVENTORY ACTIONS ---
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Bank Transfer' | 'Invoice'>('Cash');
  const [paymentNotice, setPaymentNotice] = useState('');


  // Dynamic Categories State
  const [categories, setCategories] = useState<string[]>([
    'Retail',
    'Service',
    'Wholesale',
    'أجهزة ومعدات',
    'ملابس وموضة',
    'أغذية ومشروبات',
    'أخرى',
  ]);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryOldName, setEditingCategoryOldName] = useState<string | null>(null);
  const [editingCategoryNewName, setEditingCategoryNewName] = useState<string>('');
  const [managingCategoryTarget, setManagingCategoryTarget] = useState<string | null>(null);
  const [categorySearchTerm, setCategorySearchTerm] = useState<string>('');

  // Main View Mode: 'inventory' | 'customers'
  const [mainTab, setMainTab] = useState<'inventory' | 'customers'>('inventory');

  // 4 Internal Inventory Tabs: 'all' (الكل - Default) | 'raw_material' | 'work_in_progress' | 'finished_goods'
  const [inventoryTab, setInventoryTab] = useState<'all' | 'raw_material' | 'work_in_progress' | 'finished_goods'>('all');

  // Customer Search & Form State
  const [custSearchTerm, setCustSearchTerm] = useState('');
  const [isAddEditCustModalOpen, setIsAddEditCustModalOpen] = useState(false);
  const [editingCust, setEditingCust] = useState<Customer | null>(null);
  const [deletingCustTarget, setDeletingCustTarget] = useState<Customer | null>(null);
  const [custFormName, setCustFormName] = useState('');
  const [custFormPhone, setCustFormPhone] = useState('');
  const [custFormCompany, setCustFormCompany] = useState('');
  const [custFormEmail, setCustFormEmail] = useState('');
  const [custFormError, setCustFormError] = useState('');
  const [deletingItemTarget, setDeletingItemTarget] = useState<FastItem | null>(null);

  // Local Search & Filter State for Inventory Items
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'excess' | 'normal'>('all');

  // Modal States for Items
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [modalInventoryTypeTarget, setModalInventoryTypeTarget] = useState<InventoryType>('finished_goods');
  const [editingItem, setEditingItem] = useState<FastItem | null>(null);

  // Form State for Items (Product Name, Category, Description, Unit Wholesale Cost, Unit Retail Price, Product Code)
  const [formName, setFormName] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Retail');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<string>('0');
  const [formCostPrice, setFormCostPrice] = useState<string>('0');
  const [formStockQuantity, setFormStockQuantity] = useState<string>('50');
  const [formMinStock, setFormMinStock] = useState<string>('10');
  const [formMaxStock, setFormMaxStock] = useState<string>('100');
  const [formUnit, setFormUnit] = useState('قطعة');
  const [formImageUrl, setFormImageUrl] = useState('');
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

  // Helper for image file upload from device
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(isRtl ? 'حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت' : 'File is too large, please select an image under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

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
    setFormCategory(targetType === 'raw_material' ? 'Raw Materials' : categories[0] || 'Retail');
    setFormDescription('');
    setFormPrice(targetType === 'raw_material' ? '15.00' : '50.00');
    setFormCostPrice(targetType === 'raw_material' ? '10.00' : '25.00');
    setFormStockQuantity('0');
    setFormMinStock('10');
    setFormMaxStock('200');
    setFormUnit(targetType === 'raw_material' ? 'كجم' : 'قطعة');
    setFormImageUrl('');
    setFormError('');
    setPaymentMethod('Cash');
    setPaymentNotice('');
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
    setFormDescription(item.description || '');
    setFormPrice(item.price.toString());
    setFormCostPrice((item.costPrice ?? 0).toString());
    setFormStockQuantity(item.stockQuantity.toString());
    setFormMinStock((item.minStock ?? 10).toString());
    setFormMaxStock((item.maxStock ?? 100).toString());
    setFormUnit(item.unit || 'قطعة');
    setFormImageUrl(item.imageUrl || '');
    setFormError('');
    setPaymentMethod('Cash');
    setPaymentNotice('');
    setIsAddEditModalOpen(true);
  };

  // Helper to format transaction name: "[Action] [Item Name] [DayOfMonth] [Month] [DayOfWeek] [H:M:S]"
  const getFormattedTxName = (actionPrefix: string, itemName: string) => {
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
    
    return `${actionPrefix} (${itemName}) ${dayOfMonth} ${monthName} ${dayName} ${timeStr}`;
  };


  // Submit Add / Edit Product Form
  const handleSubmitProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const priceNum = parseFloat(formPrice);
    const costNum = parseFloat(formCostPrice);
    const stockNum = parseInt(formStockQuantity, 10);
    const minNum = parseInt(formMinStock, 10);
    const maxNum = parseInt(formMaxStock, 10);

    if (!formName.trim()) {
      setFormError(isRtl ? 'يرجى إدخال الاسم' : 'Please enter item name.');
      return;
    }

    if (editingItem) {
      updateFastItem(editingItem.id, {
        name: formName.trim(),
        nameAr: formNameAr.trim() || undefined,
        code: formCode.trim() || undefined,
        category: formCategory,
        inventoryType: modalInventoryTypeTarget,
        price: isNaN(priceNum) ? 0 : priceNum,
        costPrice: isNaN(costNum) ? 0 : costNum,
        description: formDescription.trim() || undefined,
        imageUrl: formImageUrl.trim() || undefined,
        stockQuantity: isNaN(stockNum) ? 0 : stockNum,
        minStock: isNaN(minNum) ? 10 : minNum,
        maxStock: isNaN(maxNum) ? 100 : maxNum,
        unit: formUnit.trim() || 'قطعة',
      });
      
      const isProduct = modalInventoryTypeTarget === 'finished_goods';
      await updateStockQuantityInSupabase(editingItem.id, isNaN(stockNum) ? 0 : stockNum, isNaN(costNum) ? 0 : costNum, isProduct);
      
      if (isProduct && editingItem.product_pk) {
        await updateProductInSupabase(editingItem.product_pk, {
          unit_cost: isNaN(costNum) ? 0 : costNum,
          unit_price: isNaN(priceNum) ? 0 : priceNum,
          product_name: formName.trim(),
          product_code: formCode.trim() || undefined,
          product_type: formCategory,
          product_description: formDescription.trim() || undefined,
          measure_ptype: formUnit.trim() || 'قطعة',
        });
      }

      alert(isRtl ? 'تم تحديث بيانات الصنف بالمخزون بنجاح!' : 'Stock item updated successfully!');
      setIsAddEditModalOpen(false);
    } else {
      // CHECK IF ITEM ALREADY EXISTS (RE-SUPPLY LOGIC)
      const existingItem = fastItems.find(i => 
        i.name.toLowerCase() === formName.trim().toLowerCase() || 
        (i.nameAr && i.nameAr === formNameAr.trim())
      );

      if (existingItem) {
        const addedQty = isNaN(stockNum) ? 0 : stockNum;
        const newTotalQty = existingItem.stockQuantity + addedQty;
        const targetCost = isNaN(costNum) ? (existingItem.costPrice || 0) : costNum;
        
        const isProduct = existingItem.inventoryType === 'finished_goods';
        const res = await updateStockQuantityInSupabase(existingItem.id, newTotalQty, targetCost, isProduct);
        
        if (res.success) {
          // Record Financial Transaction for Re-supply
          const methodMapping: Record<string, string> = { Cash: 'Cash', Card: 'E_Wallet', 'Bank Transfer': 'Bank', Invoice: 'Credit' };
          const actionPrefix = isProduct ? (isRtl ? 'توريد منتج' : 'Reload stock') : (isRtl ? 'توريد مادة خام' : 'Reload material');
          const txType = isProduct ? 'Reload_stock_Trans' : 'ReLoad_material_Trans';
          
          await addFinancialTransactionToSupabase({
            amount: targetCost * addedQty,
            method: methodMapping[paymentMethod] || 'Cash',
            notice: paymentNotice.trim() || (isRtl ? 'تجديد توريد للمخزون' : 'Stock supply reload'),
            type: txType,
            name: getFormattedTxName(isProduct ? (isRtl ? 'بضاعة توريد منتج' : 'Reload stock') : (isRtl ? 'بضاعة توريد ماده خام' : 'Reload material'), existingItem.nameAr || existingItem.name),
            stock_fk: existingItem.stock_pk || existingItem.id
          });

          if (isProduct && existingItem.product_pk) {
            await updateProductInSupabase(existingItem.product_pk, {
              unit_cost: targetCost,
              unit_price: isNaN(priceNum) ? existingItem.price : priceNum
            });
          }

          updateFastItem(existingItem.id, {
            stockQuantity: newTotalQty,
            costPrice: targetCost,
            price: modalInventoryTypeTarget === 'finished_goods' ? (isNaN(priceNum) ? existingItem.price : priceNum) : targetCost,
            amount: targetCost * newTotalQty
          });
          alert(isRtl ? 'تم تحديث الكمية للصنف الموجود مسبقاً بنجاح وتسجيل المعاملة المالية!' : 'Existing item updated and financial transaction recorded!');
          setIsAddEditModalOpen(false);
          return;
        } else {
          alert(isRtl ? `فشل تحديث الصنف: ${res.error}` : `Update failed: ${res.error}`);
          return;
        }
      }

      if (modalInventoryTypeTarget === 'raw_material') {
        // Adding Raw Material to public.stock table
        const stockParams: any = {
          stock_name: formName.trim(),
          stock_type: 'Raw material',
          minimum_limit: isNaN(minNum) ? 10 : minNum,
          maximum_limit: isNaN(maxNum) ? 100 : maxNum,
          quantity: isNaN(stockNum) ? 0 : stockNum,
          stock_cost: isNaN(costNum) ? 0 : costNum,
          stock_code: formCode.trim() || undefined,
          measure_stype: formUnit.trim() || 'كجم',
        };

        const res = await addStockToSupabase(stockParams);

        if (!res.success || !res.data) {
          alert(isRtl ? `خطأ في السيرفر: ${res.error}` : `Server Error: ${res.error}`);
          setFormError(res.error || (isRtl ? 'فشل حفظ المادة الخام' : 'Failed to save raw material'));
          return;
        }

        // Record Financial Transaction for New Raw Material
        const methodMapping: Record<string, string> = { Cash: 'Cash', Card: 'E_Wallet', 'Bank Transfer': 'Bank', Invoice: 'Credit' };
        await addFinancialTransactionToSupabase({
          amount: (isNaN(costNum) ? 0 : costNum) * (isNaN(stockNum) ? 0 : stockNum),
          method: methodMapping[paymentMethod] || 'Cash',
          notice: paymentNotice.trim() || (isRtl ? 'مادة خام جديدة' : 'New Raw Material'),
          type: 'New_Material_Trans',
          name: getFormattedTxName(isRtl ? 'بضاعة ماده خام جديدة' : 'New Material', formName.trim()),
          stock_fk: res.data?.stock_pk || res.data?.id
        });

        const createdRawMat: FastItem = {
          id: res.data.stock_pk || res.data.id || `rm-${Date.now()}`,
          name: formName.trim(),
          nameAr: formNameAr.trim() || formName.trim(),
          code: formCode.trim() || undefined,
          category: 'Raw Materials',
          inventoryType: 'raw_material',
          price: isNaN(costNum) ? 0 : costNum,
          costPrice: isNaN(costNum) ? 0 : costNum,
          stockQuantity: isNaN(stockNum) ? 0 : stockNum,
          minStock: isNaN(minNum) ? 10 : minNum,
          maxStock: isNaN(maxNum) ? 100 : maxNum,
          unit: formUnit.trim() || 'كجم',
          amount: (isNaN(costNum) ? 0 : costNum) * (isNaN(stockNum) ? 0 : stockNum)
        };

        setFastItems((prev) => [createdRawMat, ...prev]);
        setIsAddEditModalOpen(false);
      } else {
        // Adding Finished Good to public.products & public.stock
        const productParams = {
          product_name: formName.trim(),
          product_type: formCategory || 'Retail',
          product_description: formDescription.trim() || undefined,
          unit_cost: isNaN(costNum) ? 0 : costNum,
          unit_price: isNaN(priceNum) ? 0 : priceNum,
          product_code: formCode.trim() || undefined,
          measure_ptype: formUnit.trim() || 'قطعة',
        };

        const res = await addProductToSupabase(productParams);

        if (!res.success || !res.data) {
          alert(isRtl ? `خطأ في السيرفر: ${res.error}` : `Server Error: ${res.error}`);
          setFormError(res.error || (isRtl ? 'فشل حفظ المنتج' : 'Failed to save product'));
          return;
        }

        const createdProduct = res.data;

        // Also create matching stock row in public.stock
        const stockParams: any = {
          stock_name: formName.trim(),
          stock_type: 'Stocked Product',
          minimum_limit: isNaN(minNum) ? 10 : minNum,
          maximum_limit: isNaN(maxNum) ? 200 : maxNum,
          quantity: isNaN(stockNum) ? 0 : stockNum,
          stock_cost: isNaN(costNum) ? 0 : costNum,
          product_fk: createdProduct.id, 
          stock_code: formCode.trim() || undefined,
          measure_stype: formUnit.trim() || 'قطعة',
        };
        const stockRes = await addStockToSupabase(stockParams);

        // Record Financial Transaction for New Finished Good
        const methodMapping: Record<string, string> = { Cash: 'Cash', Card: 'E_Wallet', 'Bank Transfer': 'Bank', Invoice: 'Credit' };
        await addFinancialTransactionToSupabase({
          amount: (isNaN(costNum) ? 0 : costNum) * (isNaN(stockNum) ? 0 : stockNum),
          method: methodMapping[paymentMethod] || 'Cash',
          notice: paymentNotice.trim() || (isRtl ? 'منتج جديد للمخزون' : 'New Product Stock'),
          type: 'New_Stock_Trans',
          name: getFormattedTxName(isRtl ? 'بضاعة منتج جديد' : 'New Product', formName.trim()),
          stock_fk: stockRes.data?.stock_pk || stockRes.data?.id || createdProduct.id
        });

        // Update local createdProduct with quantities before adding to state
        const enrichedProduct: FastItem = {
          ...createdProduct,
          imageUrl: formImageUrl.trim() || undefined,
          stockQuantity: isNaN(stockNum) ? 0 : stockNum,
          minStock: isNaN(minNum) ? 10 : minNum,
          maxStock: isNaN(maxNum) ? 200 : maxNum,
          amount: (isNaN(costNum) ? 0 : costNum) * (isNaN(stockNum) ? 0 : stockNum)
        };

        alert(isRtl ? 'تم حفظ المنتج بنجاح في قاعدة البيانات وتسجيل المعاملة المالية!' : 'Product saved and financial transaction recorded!');
        setFastItems((prev) => [enrichedProduct, ...prev]);
        setIsAddEditModalOpen(false);
      }
    }


  };

  // Automatically include any categories present in fastItems
  useEffect(() => {
    const itemCats = fastItems.map((i) => i.category).filter(Boolean);
    const unique = Array.from(new Set([...categories, ...itemCats]));
    if (unique.length !== categories.length) {
      setCategories(unique);
    }
  }, [fastItems]);

  // Category Handlers ("إدارة وتعديل الأصناف")
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const catName = newCategoryName.trim();
    if (!catName) return;

    if (!categories.includes(catName)) {
      setCategories((prev) => [...prev, catName]);
    }
    setFormCategory(catName);
    setNewCategoryName('');
    alert(isRtl ? `تم إضافة صنف جديد: (${catName}) بنجاح!` : `New category (${catName}) added!`);
  };

  const handleStartRenameCategory = (catName: string) => {
    setEditingCategoryOldName(catName);
    setEditingCategoryNewName(catName);
  };

  const handleSaveRenameCategory = (oldCatName: string) => {
    const trimmed = editingCategoryNewName.trim();
    if (!trimmed || trimmed === oldCatName) {
      setEditingCategoryOldName(null);
      return;
    }

    // 1. Update categories list
    setCategories((prev) => prev.map((c) => (c === oldCatName ? trimmed : c)));

    // 2. Update all items belonging to oldCatName
    const itemsInCat = fastItems.filter((i) => i.category === oldCatName);
    itemsInCat.forEach((item) => {
      updateFastItem(item.id, { category: trimmed });
    });

    if (formCategory === oldCatName) {
      setFormCategory(trimmed);
    }

    setEditingCategoryOldName(null);
    alert(
      isRtl
        ? `تم تعديل مسمى الصنف من (${oldCatName}) إلى (${trimmed}) وتحديث ${itemsInCat.length} عنصر بنجاح!`
        : `Category renamed to (${trimmed}) and ${itemsInCat.length} items updated!`
    );
  };

  const handleDeleteCategory = (catToDelete: string) => {
    const itemsInCat = fastItems.filter((i) => i.category === catToDelete);
    const confirmMsg =
      itemsInCat.length > 0
        ? isRtl
          ? `الصنف (${catToDelete}) يحتوي على ${itemsInCat.length} عنصر. عند الحذف سيتم تحويل هذه العناصر إلى صنف (أخرى). هل تريد الحذف؟`
          : `Category (${catToDelete}) contains ${itemsInCat.length} items. They will be moved to 'Other'. Continue?`
        : isRtl
        ? `هل أنت متأكد من حذف الصنف (${catToDelete})؟`
        : `Delete category (${catToDelete})?`;

    if (!window.confirm(confirmMsg)) return;

    // Move items to 'أخرى'
    itemsInCat.forEach((item) => {
      updateFastItem(item.id, { category: 'أخرى' });
    });

    // Remove category from array
    setCategories((prev) => prev.filter((c) => c !== catToDelete));

    if (formCategory === catToDelete) {
      setFormCategory('أخرى');
    }
  };

  const handleMoveItemToCategory = (itemId: string, newCatName: string) => {
    updateFastItem(itemId, { category: newCatName });
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

    // SYNC WITH SUPABASE: Deduct Raw Materials
    wipSelectedMaterials.forEach(async (mat) => {
      const stockItem = rawMaterials.find((r) => r.id === mat.rawMaterialId);
      if (stockItem) {
        const newQty = stockItem.stockQuantity - mat.quantityUsed;
        const cost = stockItem.costPrice || stockItem.price || 0;
        await updateStockQuantityInSupabase(stockItem.id, newQty, cost, false);
      }
    });

    setIsStartWipModalOpen(false);
    alert(isRtl ? 'تم بدء تشغيلة التصنيع وخصم المواد الخام من المخزون!' : 'WIP Batch started and raw materials deducted!');
  };

  // Quick Restock Handler
  const handleConfirmRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItemTarget) return;

    const qty = parseInt(restockQty, 10);
    if (isNaN(qty) || qty <= 0) return;

    const newStockQty = restockItemTarget.stockQuantity + qty;
    const cost = restockItemTarget.costPrice || restockItemTarget.price || 0;

    restockItem(
      restockItemTarget.id,
      qty,
      restockReason.trim() || (isRtl ? 'إضافة شحنة وتوريد جديد للمخزون' : 'Stock Replenishment')
    );

    // Mapped update to public.stock in Supabase
    const isProduct = restockItemTarget.inventoryType === 'finished_goods';
    await updateStockQuantityInSupabase(restockItemTarget.id, newStockQty, cost, isProduct);

    // Record Financial Transaction for Restock
    const methodMapping: Record<string, string> = { Cash: 'Cash', Card: 'E_Wallet', 'Bank Transfer': 'Bank', Invoice: 'Credit' };
    const txType = isProduct ? 'Reload_stock_Trans' : 'ReLoad_material_Trans';

    await addFinancialTransactionToSupabase({
      amount: cost * qty,
      method: methodMapping[paymentMethod] || 'Cash',
      notice: paymentNotice.trim() || (isRtl ? 'توريد كمية للمخزون' : 'Stock Replenishment'),
      type: txType,
      name: getFormattedTxName(isProduct ? (isRtl ? 'بضاعة توريد منتج' : 'Reload stock') : (isRtl ? 'بضاعة توريد ماده خام' : 'Reload material'), restockItemTarget.nameAr || restockItemTarget.name),
      stock_fk: restockItemTarget.stock_pk || restockItemTarget.id
    });

    alert(isRtl ? `تم توريد (${qty}) قطعة للمخزون وحفظ المعاملة المالية بنجاح!` : `Restocked ${qty} items and recorded financial transaction!`);

    setRestockItemTarget(null);
    setRestockQty('');
    setRestockReason('');
    setPaymentNotice('');
  };


  // Submit Complete WIP Batch
  const handleConfirmCompleteWip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeWipTarget) return;

    const actualQty = parseInt(completeActualQty, 10);
    const scrapQty = parseInt(completeScrapQty, 10) || 0;

    if (isNaN(actualQty) || actualQty < 0) return;

    completeWipBatch(completeWipTarget.id, actualQty, scrapQty);
    
    // SYNC WITH SUPABASE: Add Finished Good to stock
    const targetGood = fastItems.find(i => i.id === completeWipTarget.finishedGoodId);
    if (targetGood) {
      const newQty = targetGood.stockQuantity + actualQty;
      const cost = targetGood.costPrice || targetGood.price || 0;
      updateStockQuantityInSupabase(targetGood.id, newQty, cost, true);
    }

    setCompleteWipTarget(null);
    alert(isRtl ? 'تم إكمال التشغيلة وإضافة المنتج النهائي للمخزون!' : 'WIP Batch completed and added to finished goods!');
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
                <span className="text-xs font-semibold text-purple-700">{isRtl ? 'تشغيلات جاري تصنيعها' : 'Active WIP Batches'}</span>
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
                          <th className="p-3.5">{isRtl ? 'الصورة والصنف والكود' : 'Image, Item & Code'}</th>
                          <th className="p-3.5">{isRtl ? 'نوع التصنيف' : 'Classification'}</th>
                          <th className="p-3.5">{isRtl ? 'سعر التكلفة / البيع' : 'Cost / Price'}</th>
                          <th className="p-3.5">{isRtl ? 'الكمية الحالية' : 'Current Stock'}</th>
                          <th className="p-3.5">{isRtl ? 'القيمة الإجمالية (Amount)' : 'Total Amount'}</th>
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
                          const unitCost = item.costPrice ?? item.price ?? 0;
                          // Use amount from DB if available, otherwise local calculation
                          const recordedAmount = item.amount !== undefined ? item.amount : (unitCost * current);

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Name & Code with Image Thumbnail */}
                              <td className="p-3.5">
                                <div className="flex items-center gap-3">
                                  {/* Item Image Thumbnail Box */}
                                  <div className="w-10 h-10 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 shadow-2xs">
                                    {item.imageUrl ? (
                                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="material-symbols-outlined text-indigo-500 text-lg select-none">
                                        {isRaw ? 'view_in_ar' : 'package_2'}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-slate-900 truncate">{isRtl && item.nameAr ? item.nameAr : item.name}</span>
                                    <span className="text-[10px] font-mono text-slate-400 font-semibold">{item.code || `ID-${item.id}`}</span>
                                  </div>
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

                              {/* Price / Cost */}
                              <td className="p-3.5 font-mono">
                                <div className="flex flex-col">
                                  <span className="font-extrabold text-slate-900">${unitCost.toFixed(2)}</span>
                                  {!isRaw && (
                                    <span className="text-[10px] text-emerald-700 font-semibold">{isRtl ? 'بيع:' : 'Retail:'} ${item.price.toFixed(2)}</span>
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

                              {/* Total Calculated Amount (Recorded in DB) */}
                              <td className="p-3.5 font-mono">
                                <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200/50 shadow-sm inline-flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[10px] text-indigo-400">database</span>
                                  <span>${recordedAmount.toFixed(2)}</span>
                                </span>
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
                                    onClick={() => setDeletingItemTarget(item)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title={isRtl ? 'حذف الصنف' : 'Delete Item'}
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
        /* CUSTOMER DATABASE VIEW - Matching Image 1 Design */
        <div className="flex flex-col gap-5 w-full">
          {/* 1. Header Banner Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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

            <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
              <button
                onClick={handleOpenAddCustModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                <span>{isRtl ? '+ إضافة عميل جديد' : '+ Add New Customer'}</span>
              </button>

              <button
                onClick={() => setMainTab('customers')}
                className="px-3.5 py-2 bg-white text-indigo-900 font-bold text-xs rounded-xl shadow-2xs border border-slate-200/80 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-indigo-600">group</span>
                <span>{isRtl ? 'قاعدة العملاء' : 'Customer DB'}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold">
                  {customers.length}
                </span>
              </button>

              <button
                onClick={() => setMainTab('inventory')}
                className="px-3.5 py-2 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-slate-500">inventory_2</span>
                <span>{isRtl ? 'جدول المخزون' : 'Inventory Table'}</span>
              </button>
            </div>
          </div>

          {/* 2. Three Summary Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-600">
                  {isRtl ? 'إجمالي قاعدة العملاء' : 'Total Customer Base'}
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {customers.length}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {isRtl ? 'عملاء مسجلون بالنظام' : 'Registered clients in system'}
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">group</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-600">
                  {isRtl ? 'حسابات الشركات والشركاء' : 'Companies & Partners'}
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {customers.filter((c) => Boolean(c.company)).length}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {isRtl ? 'مؤسسات وشركات تجارية' : 'Commercial entities'}
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">domain</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-600">
                  {isRtl ? 'الأفراد والعملاء المباشرون' : 'Individuals & Direct'}
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {customers.filter((c) => !c.company).length}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {isRtl ? 'حسابات أفراد ونقدي' : 'Individual accounts'}
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">person</span>
              </div>
            </div>
          </div>

          {/* 3. Search and Action Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={handleOpenAddCustModal}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              <span>{isRtl ? '+ إضافة عميل جديد' : '+ Add New Customer'}</span>
            </button>

            <div className="relative w-full sm:w-96">
              <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={custSearchTerm}
                onChange={(e) => setCustSearchTerm(e.target.value)}
                placeholder={isRtl ? 'ابحث باسم العميل، رقم الهاتف، أو الشركة...' : 'Search by name, phone, or company...'}
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 shadow-2xs"
              />
            </div>
          </div>

          {/* 4. Main Customer Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 min-h-[220px] flex flex-col justify-center">
            {filteredCustomers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-4xl text-slate-300">
                  no_accounts
                </span>
                <span className="font-bold text-slate-500 text-sm">
                  {isRtl ? 'لا يوجد عملاء مطابقون للبحث' : 'No matching customers found'}
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-700 font-bold">
                      <th className="p-3.5">{isRtl ? 'العميل' : 'Customer Name'}</th>
                      <th className="p-3.5">{isRtl ? 'رقم الهاتف' : 'Phone'}</th>
                      <th className="p-3.5">{isRtl ? 'الشركة / المنشأة' : 'Company'}</th>
                      <th className="p-3.5">{isRtl ? 'البريد الإلكتروني' : 'Email'}</th>
                      <th className="p-3.5 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {cust.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-900">{cust.name}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-700 font-semibold">{cust.phone || '—'}</td>
                        <td className="p-3.5 text-slate-600 font-medium">
                          {cust.company ? (
                            <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 font-bold text-[10px]">🏢 {cust.company}</span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">{isRtl ? 'حساب فردي' : 'Individual'}</span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 text-[11px]">{cust.email || '—'}</td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditCustModal(cust)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title={isRtl ? 'تعديل' : 'Edit'}
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                            <button
                              onClick={() => setDeletingCustTarget(cust)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title={isRtl ? 'حذف العميل' : 'Delete Customer'}
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
              {/* 1. اسم المادة/المنتج (Name) */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-800">
                  {modalInventoryTypeTarget === 'raw_material'
                    ? (isRtl ? 'اسم المادة الخام *' : 'Raw Material Name *')
                    : (isRtl ? 'اسم المنتج *' : 'Product Name *')}
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={
                    modalInventoryTypeTarget === 'raw_material'
                      ? (isRtl ? 'أدخل اسم المادة الخام...' : 'Enter raw material name...')
                      : (isRtl ? 'أدخل اسم المنتج...' : 'Enter product name...')
                  }
                  required
                  className="p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 2. صنف المنتج (Product Category Dropdown) - للمنتجات الجاهزة فقط */}
              {modalInventoryTypeTarget === 'finished_goods' && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">{isRtl ? 'صنف المنتج *' : 'Product Category *'}</label>
                    <button
                      type="button"
                      onClick={() => setIsAddCategoryModalOpen(true)}
                      className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-0.5 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>+</span>
                      <span>{isRtl ? 'إنشاء صنف' : 'Create Category'}</span>
                    </button>
                  </div>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map((cat, idx) => (
                      <option key={idx} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 3. وصف المنتج - للمنتجات الجاهزة فقط */}
              {modalInventoryTypeTarget === 'finished_goods' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-800">{isRtl ? 'وصف المنتج (اختياري)' : 'Product Description (Optional)'}</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder={isRtl ? 'أدخل وصفاً تفصيلياً للمنتج...' : 'Enter product description...'}
                    className="p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              )}

              {/* 4 & 5. الأسعار: للمواد الخام سعر التكلفة/الجملة فقط، وللمنتجات الجاهزة السعران */}
              <div className={`grid gap-3 ${modalInventoryTypeTarget === 'raw_material' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-800">
                    {modalInventoryTypeTarget === 'raw_material'
                      ? (isRtl ? 'سعر المادة الخام / التكلفة ($) *' : 'Raw Material Cost ($) *')
                      : (isRtl ? 'سعر قطعة المنتج جملة ($) *' : 'Wholesale Unit Cost ($) *')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    placeholder="0.00"
                    required
                    className="p-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {modalInventoryTypeTarget === 'finished_goods' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-800">{isRtl ? 'سعر قطعة المنتج للمستهلك ($) *' : 'Retail Unit Price ($) *'}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="0.00"
                      required
                      className="p-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* 6. كود الصنف & وحدة القياس */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-800">{isRtl ? 'الكود / الباركوم' : 'Code / SKU'}</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="SKU-101"
                    className="p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-800">{isRtl ? 'وحدة القياس' : 'Unit'}</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder={modalInventoryTypeTarget === 'raw_material' ? 'كجم' : 'قطعة'}
                    className="p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* 7. صورة المنتج / المادة الخام (رفع من الجهاز أو إدخال رابط) */}
              <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-600 text-sm">image</span>
                    <span>
                      {modalInventoryTypeTarget === 'raw_material'
                        ? (isRtl ? 'صورة المادة الخام (اختياري)' : 'Raw Material Image (Optional)')
                        : (isRtl ? 'صورة المنتج (اختياري)' : 'Product Image (Optional)')}
                    </span>
                  </label>
                  {formImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200 transition-colors cursor-pointer"
                    >
                      ✕ {isRtl ? 'إزالة الصورة' : 'Remove Image'}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Option A: Upload file from device */}
                  <label className="flex-1 min-w-[130px] px-3 py-2 bg-white hover:bg-indigo-50/80 border border-slate-300 hover:border-indigo-400 rounded-xl text-xs font-bold text-indigo-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs">
                    <span className="material-symbols-outlined text-base">upload_file</span>
                    <span>{isRtl ? 'رفع من الجهاز' : 'Upload File'}</span>
                    <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                  </label>

                  {/* Option B: Direct URL Input */}
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder={isRtl ? 'أو ضع رابط الصورة هنا...' : 'Or paste image URL...'}
                    className="flex-[2] min-w-[170px] p-2 rounded-xl bg-white border border-slate-300 text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Preview Thumbnail Box */}
                {formImageUrl && (
                  <div className="flex items-center gap-2.5 mt-1 pt-2 border-t border-slate-200/80">
                    <div className="w-12 h-12 rounded-xl border border-slate-300 overflow-hidden shrink-0 bg-white flex items-center justify-center shadow-xs">
                      <img
                        src={formImageUrl}
                        alt="معاينة"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {isRtl ? 'معاينة صورة الصنف المحددة بنجاح' : 'Image preview selected successfully'}
                    </span>
                  </div>
                )}
              </div>

              {/* Quantities & Min / Max Thresholds (للمواد الخام دائماً، وللمنتجات الجاهزة عند الإضافة أو التعديل) */}
              {(modalInventoryTypeTarget === 'raw_material' || !editingItem || editingItem) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-800">
                      {!editingItem && modalInventoryTypeTarget === 'finished_goods' 
                        ? (isRtl ? 'الكمية المبدئية' : 'Initial Quantity')
                        : (isRtl ? 'الكمية المتاحة' : 'Current Stock')}
                    </label>
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
              )}

              {/* FINANCIAL TOTAL & PAYMENT METHOD (Only for NEW ITEMS or RE-SUPPLY if logic allowed it here) */}
              {!editingItem && (
                <>
                  <div className="p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl flex flex-col items-center justify-center text-center gap-1">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                      {isRtl ? 'إجمالي تكلفة الشحنة / الكمية المبدئية' : 'Total Shipment / Initial Cost'}
                    </span>
                    <span className="text-2xl font-black text-indigo-900 font-mono">
                      ${(parseFloat(formCostPrice) * parseFloat(formStockQuantity) || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-700">{isRtl ? 'طريقة دفع تكلفة الشراء' : 'Payment Method'}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                      {(['Cash', 'Card', 'Bank Transfer', 'Invoice'] as const).map((pm) => {
                        const labelsAr: Record<string, string> = {
                          Cash: '💵 نقدي',
                          Card: '💳 إلكتروني',
                          'Bank Transfer': '🏦 تحويل',
                          Invoice: '📄 آجل',
                        };
                        const isSelected = paymentMethod === pm;
                        return (
                          <button
                            key={pm}
                            type="button"
                            onClick={() => setPaymentMethod(pm)}
                            className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
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

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">{isRtl ? 'ملحوظة الدفع (إجباري) *' : 'Payment Notice (Required) *'}</label>
                    <input
                      type="text"
                      value={paymentNotice}
                      onChange={(e) => setPaymentNotice(e.target.value)}
                      required
                      placeholder={
                        isRtl 
                          ? (paymentMethod === 'Cash' ? 'ادخل اسم العميل' : 
                             paymentMethod === 'Card' ? 'رقم هاتف المحفظة' : 
                             paymentMethod === 'Bank Transfer' ? 'اطلب الرقم المرجعي للتحويل' : 
                             'ادخل اسم الشخص الذى طلب الاجل')
                          : 'Enter payment details...'
                      }
                      className="p-2.5 rounded-xl bg-white border border-slate-300 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-400/70"
                    />
                  </div>
                </>
              )}


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
                  className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-90 cursor-pointer"
                >
                  {editingItem ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'إضافة المنتج إلى Supabase' : 'Save Product to Supabase')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL FOR CREATE & MANAGE CATEGORIES (إدارة وإنشاء أصناف المنتجات والمواد الخام) --- */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 flex flex-col gap-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">category</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isRtl ? 'إدارة وأصناف المنتجات والمواد الخام' : 'Manage Product & Material Categories'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isRtl ? 'إنشاء أصناف جديدة، تعديل مسماها، وحذفها أو تعديل المنتجات المنتمية لها' : 'Create, edit names, delete, or manage items in categories'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddCategoryModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* 1. Add New Category Form */}
            <form onSubmit={handleCreateCategory} className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 flex flex-col gap-3">
              <label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-indigo-600 text-sm">add_circle</span>
                {isRtl ? 'إنشاء صنف جديد' : 'Create New Category'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={isRtl ? 'أدخل اسم الصنف الجديد (مثال: مستلزمات طبية، زيوت، كرتون...)' : 'Enter category name...'}
                  required
                  className="flex-1 p-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  style={{ backgroundColor: customPalette.primaryAccent }}
                  className="px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-95 cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  {isRtl ? 'إضافة الصنف' : 'Add Category'}
                </button>
              </div>
            </form>

            {/* 2. Search & Filter Available Categories */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-slate-500 text-sm">list</span>
                  {isRtl ? 'جميع الأصناف المتاحة بالمخزون' : 'All Available Categories'}
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {categories.length}
                  </span>
                </h4>
                <div className="relative w-48">
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">search</span>
                  <input
                    type="text"
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    placeholder={isRtl ? 'بحث في الأصناف...' : 'Filter categories...'}
                    className="w-full pr-8 pl-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Categories List */}
              <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
                {categories
                  .filter((cat) => !categorySearchTerm.trim() || cat.toLowerCase().includes(categorySearchTerm.trim().toLowerCase()))
                  .map((cat) => {
                    const itemsInCat = fastItems.filter((i) => i.category === cat);
                    const isEditing = editingCategoryOldName === cat;
                    const isManagingItems = managingCategoryTarget === cat;

                    return (
                      <div key={cat} className="flex flex-col gap-2 p-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
                        <div className="flex items-center justify-between gap-3">
                          {/* Category Name & Count */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="material-symbols-outlined text-slate-400 text-base">folder</span>
                            {isEditing ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editingCategoryNewName}
                                  onChange={(e) => setEditingCategoryNewName(e.target.value)}
                                  className="p-1.5 bg-white border border-indigo-500 rounded-lg text-xs font-bold flex-1 focus:outline-none"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveRenameCategory(cat)}
                                  className="px-2.5 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-700 cursor-pointer"
                                >
                                  {isRtl ? 'حفظ' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCategoryOldName(null)}
                                  className="px-2.5 py-1 bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg hover:bg-slate-300 cursor-pointer"
                                >
                                  {isRtl ? 'إلغاء' : 'Cancel'}
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 truncate">{cat}</span>
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                                  {itemsInCat.length} {isRtl ? 'منتج/مادة خام' : 'items'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {!isEditing && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Manage Items in Category */}
                              <button
                                type="button"
                                onClick={() => setManagingCategoryTarget(isManagingItems ? null : cat)}
                                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                                  isManagingItems
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                                title={isRtl ? 'عرض وتعديل المنتجات المنتمية لهذا الصنف' : 'Manage Included Items'}
                              >
                                <span className="material-symbols-outlined text-xs">format_list_bulleted</span>
                                {isRtl ? 'المنتجات' : 'Items'}
                              </button>

                              {/* Rename Category Name */}
                              <button
                                type="button"
                                onClick={() => handleStartRenameCategory(cat)}
                                className="p-1.5 rounded-xl bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                                title={isRtl ? 'تعديل مسمى الصنف' : 'Rename Category'}
                              >
                                <span className="material-symbols-outlined text-xs">edit</span>
                              </button>

                              {/* Delete Category */}
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat)}
                                className="p-1.5 rounded-xl bg-white text-red-600 border border-slate-200 hover:bg-red-50 cursor-pointer"
                                title={isRtl ? 'حذف الصنف' : 'Delete Category'}
                              >
                                <span className="material-symbols-outlined text-xs">delete</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Expandable Items List inside Category */}
                        {isManagingItems && (
                          <div className="mt-2 pt-2 border-t border-slate-200 flex flex-col gap-2 bg-white p-3 rounded-xl">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                              <span>{isRtl ? `العناصر المنتمية لصنف (${cat}):` : `Items in (${cat}):`}</span>
                              <span className="text-[10px] text-slate-400">
                                {isRtl ? 'يمكنك نقل أي عنصر لصنف آخر هنا' : 'Reassign item category'}
                              </span>
                            </div>

                            {itemsInCat.length === 0 ? (
                              <div className="text-[11px] text-slate-400 italic py-2 text-center">
                                {isRtl ? 'لا توجد منتجات أو مواد خام تحت هذا الصنف حالياً' : 'No items under this category'}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                                {itemsInCat.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="material-symbols-outlined text-slate-400 text-sm">
                                        {item.inventoryType === 'raw_material' ? 'raw_material' : 'inventory_2'}
                                      </span>
                                      <span className="font-bold text-slate-800">{item.nameAr || item.name}</span>
                                      <span className="text-[10px] text-slate-400 font-mono">({item.code || item.id.slice(-4)})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-slate-500">{isRtl ? 'تحويل إلى:' : 'Move to:'}</span>
                                      <select
                                        value={item.category}
                                        onChange={(e) => handleMoveItemToCategory(item.id, e.target.value)}
                                        className="text-[11px] font-bold p-1 bg-white border border-slate-300 rounded-md focus:outline-none"
                                      >
                                        {categories.map((targetCat) => (
                                          <option key={targetCat} value={targetCat}>
                                            {targetCat}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add existing item from other categories to this category */}
                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                              <span className="text-[11px] font-bold text-indigo-700 shrink-0">
                                {isRtl ? 'إضافة عنصر لهذا الصنف:' : 'Add item to this category:'}
                              </span>
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleMoveItemToCategory(e.target.value, cat);
                                    e.target.value = '';
                                  }
                                }}
                                className="text-[11px] font-bold p-1.5 bg-slate-50 border border-indigo-200 text-indigo-900 rounded-lg flex-1 focus:outline-none"
                              >
                                <option value="" disabled>
                                  {isRtl ? 'اختر عنصراً لنقله لهذا الصنف...' : 'Select item to move here...'}
                                </option>
                                {fastItems
                                  .filter((i) => i.category !== cat)
                                  .map((otherItem) => (
                                    <option key={otherItem.id} value={otherItem.id}>
                                      {otherItem.nameAr || otherItem.name} ({otherItem.category})
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddCategoryModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
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

              {/* FINANCIAL TOTAL & PAYMENT METHOD FOR RESTOCK */}
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col items-center justify-center text-center gap-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  {isRtl ? 'إجمالي تكلفة شحنة التوريد' : 'Total Restock Cost'}
                </span>
                <span className="text-2xl font-black text-emerald-900 font-mono">
                  ${((restockItemTarget.costPrice || restockItemTarget.price || 0) * (parseInt(restockQty, 10) || 0)).toFixed(2)}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700">{isRtl ? 'طريقة دفع تكلفة التوريد' : 'Payment Method'}</label>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {(['Cash', 'Card', 'Bank Transfer', 'Invoice'] as const).map((pm) => {
                    const labelsAr: Record<string, string> = {
                      Cash: '💵 نقدي',
                      Card: '💳 إلكتروني',
                      'Bank Transfer': '🏦 تحويل',
                      Invoice: '📄 آجل',
                    };
                    const isSelected = paymentMethod === pm;
                    return (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => setPaymentMethod(pm)}
                        className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
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

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">{isRtl ? 'ملحوظة الدفع (إجباري) *' : 'Payment Notice (Required) *'}</label>
                <input
                  type="text"
                  value={paymentNotice}
                  onChange={(e) => setPaymentNotice(e.target.value)}
                  required
                  placeholder={
                    isRtl 
                      ? (paymentMethod === 'Cash' ? 'ادخل اسم العميل' : 
                         paymentMethod === 'Card' ? 'رقم هاتف المحفظة' : 
                         paymentMethod === 'Bank Transfer' ? 'اطلب الرقم المرجعي للتحويل' : 
                         'ادخل اسم الشخص الذى طلب الاجل')
                      : 'Enter payment details...'
                  }
                  className="p-2.5 rounded-xl bg-white border border-slate-300 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-400/70"
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

      {/* --- MODAL 7: ADD / EDIT CUSTOMER MODAL (Matching Image 23) --- */}
      {isAddEditCustModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 flex flex-col gap-6 max-h-[90vh] overflow-y-auto animate-scale-up border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-indigo-600 text-2xl">
                  {editingCust ? 'edit_square' : 'person_add'}
                </span>
                <h3 className="font-bold text-lg text-slate-900">
                  {editingCust
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
                  setIsAddEditCustModalOpen(false);
                  setEditingCust(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xl p-1 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {custFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                ⚠️ {custFormError}
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSubmitCustForm} className="flex flex-col gap-4 text-xs font-medium">
              {/* Field 1: Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-800 text-xs">
                  {isRtl ? 'اسم العميل ثلاثي / التجاري' : 'Customer Full Name / Commercial Name'}
                </label>
                <input
                  type="text"
                  required
                  value={custFormName}
                  onChange={(e) => setCustFormName(e.target.value)}
                  placeholder={isRtl ? 'مثال: شركة الخليج للتجارة' : 'e.g. Gulf Trading Company'}
                  className="w-full h-11 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Field 2 & 3: Phone & Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-800 text-xs">
                    {isRtl ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={custFormPhone}
                    onChange={(e) => setCustFormPhone(e.target.value)}
                    placeholder="+966 50 000 0000"
                    className="w-full h-11 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-800 text-xs">
                    {isRtl ? 'الشركة / المنشأة' : 'Company / Entity'}
                  </label>
                  <input
                    type="text"
                    value={custFormCompany}
                    onChange={(e) => setCustFormCompany(e.target.value)}
                    placeholder={isRtl ? 'مؤسسة الابتكار' : 'Innovation Est.'}
                    className="w-full h-11 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Field 4: Email */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-800 text-xs">
                  {isRtl ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  value={custFormEmail}
                  onChange={(e) => setCustFormEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full h-11 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center gap-3 pt-3 mt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-sm transition-transform active:scale-95 cursor-pointer"
                >
                  {isRtl ? 'حفظ العميل' : 'Save Customer'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAddEditCustModalOpen(false);
                    setEditingCust(null);
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

      {/* --- MODAL 8: CONFIRM DELETE CUSTOMER MODAL --- */}
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
                ? `هل أنت متأكد من حذف العميل (${deletingCustTarget.name}) من قاعدة البيانات؟ لا يمكن التراجع عن هذه العملية.`
                : `Are you sure you want to delete customer (${deletingCustTarget.name}) from the database? This action cannot be undone.`}
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

      {/* --- MODAL 9: CONFIRM DELETE ITEM MODAL --- */}
      {deletingItemTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4 border border-slate-100 animate-scale-up">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">delete_forever</span>
              </div>
              <h3 className="font-bold text-base text-slate-900">
                {isRtl ? 'تأكيد حذف الصنف' : 'Confirm Item Deletion'}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {isRtl
                ? `هل أنت متأكد من حذف الصنف (${deletingItemTarget.nameAr || deletingItemTarget.name}) من المخزون؟`
                : `Are you sure you want to delete item (${deletingItemTarget.name})?`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingItemTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={() => {
                  deleteFastItem(deletingItemTarget.id);
                  setDeletingItemTarget(null);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                {isRtl ? 'حذف الصنف' : 'Delete Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

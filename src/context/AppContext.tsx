import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  PageId,
  Language,
  ColorTheme,
  ThemeConfig,
  CustomPalette,
  Customer,
  FastItem,
  StagedItem,
  Transaction,
  PendingSale,
  OperationStep,
  FinanceItem,
  Employee,
  MarketingMixP,
  BuyerPersona,
  StockMovement,
  Expense,
  ExpenseCategory,
  WipStage,
  WipBatch,
} from '../types';
import {
  fetchCustomersFromSupabase,
  addCustomerToSupabase,
  updateCustomerStatusInSupabase,
  updateCustomerCreditLimitInSupabase,
  deleteCustomerFromSupabase,
} from '../lib/customersService';
import {
  fetchProductsFromSupabase,
  addProductToSupabase,
  updateProductInSupabase,
  deleteProductFromSupabase,
} from '../lib/productsService';
import {
  fetchStockFromSupabase,
  fetchCombinedInventoryFromSupabase,
  addStockToSupabase,
  updateStockQuantityInSupabase,
} from '../lib/stockService';
import {
  fetchExpenseTransactionsFromSupabase,
  fetchSalesTransactionsFromSupabase,
  addFinancialTransactionToSupabase,
  updateFinancialTransactionInSupabase,
  deleteFinancialTransactionInSupabase,
} from '../lib/transactionsService';
import {
  fetchOrdersFromSupabase,
  fetchOrderItemsFromSupabase,
  addOrderToSupabase,
  updateOrderStatusInSupabase,
  DEFAULT_DELIVERY_STATUS,
  DEFAULT_PREPARING_STATUS,
  DEFAULT_ORDER_STATUS,
} from '../lib/ordersService';
import { isSupabaseConfigured } from '../lib/supabase';
import { TenantWithMembership, setCurrentActiveTenantId } from '../lib/tenantsService';
import { useAuth } from './AuthContext';

export const THEME_CONFIGS: Record<ColorTheme, ThemeConfig> = {
  indigo: {
    id: 'indigo',
    nameEn: 'Indigo Minimal',
    nameAr: 'إينديجو مينيمل',
    primary: '#3525cd',
    primaryHover: '#2a1cb2',
    primaryLight: '#eaedff',
    primaryText: '#3525cd',
  },
  emerald: {
    id: 'emerald',
    nameEn: 'Emerald Precision',
    nameAr: 'زمردي دقيق',
    primary: '#059669',
    primaryHover: '#047857',
    primaryLight: '#ecfdf5',
    primaryText: '#059669',
  },
  slate: {
    id: 'slate',
    nameEn: 'Executive Slate',
    nameAr: 'رمادي تنفيذي',
    primary: '#0f172a',
    primaryHover: '#1e293b',
    primaryLight: '#f1f5f9',
    primaryText: '#0f172a',
  },
  cobalt: {
    id: 'cobalt',
    nameEn: 'Cobalt Enterprise',
    nameAr: 'أزرق كوبالت',
    primary: '#0051d5',
    primaryHover: '#003ea8',
    primaryLight: '#dbe1ff',
    primaryText: '#0051d5',
  },
  crimson: {
    id: 'crimson',
    nameEn: 'Crimson Authority',
    nameAr: 'قرمزي داكن',
    primary: '#b91c1c',
    primaryHover: '#991b1b',
    primaryLight: '#fef2f2',
    primaryText: '#b91c1c',
  },
  teal: {
    id: 'teal',
    nameEn: 'Teal Modern',
    nameAr: 'تركوازي عصري',
    primary: '#0d9488',
    primaryHover: '#0f766e',
    primaryLight: '#f0fdfa',
    primaryText: '#0d9488',
  },
};

export const DEFAULT_CUSTOM_PALETTE: CustomPalette = {
  primaryAccent: '#3525cd',
  topBarBg: '#ffffff',
  topBarText: '#0f172a',
  sidebarBg: '#ffffff',
  sidebarText: '#334155',
  pageBg: '#faf8ff',
  surfaceBg: '#ffffff',
};

const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat-0', nameAr: 'بضاعة', nameEn: 'Merchandise / Stock', isDefault: true },
  { id: 'cat-1', nameAr: 'الإيجار', nameEn: 'Rent', isDefault: true },
  { id: 'cat-2', nameAr: 'الرواتب والأجور', nameEn: 'Salaries & Wages', isDefault: true },
  { id: 'cat-3', nameAr: 'الكهرباء والمياه', nameEn: 'Electricity & Water', isDefault: true },
  { id: 'cat-4', nameAr: 'النقل والمواصلات', nameEn: 'Transportation', isDefault: true },
  { id: 'cat-5', nameAr: 'الصيانة', nameEn: 'Maintenance', isDefault: true },
  { id: 'cat-6', nameAr: 'التسويق والإعلانات', nameEn: 'Marketing & Advertising', isDefault: true },
  { id: 'cat-7', nameAr: 'مصروفات أخرى', nameEn: 'Other Expenses', isDefault: true },
];

const DEFAULT_MARKETING_MIX: MarketingMixP[] = [
  {
    id: 'product',
    titleEn: 'Product (المنتج)',
    titleAr: 'المنتج — Product',
    subtitleEn: 'Value Proposition & Offerings',
    subtitleAr: 'القيمة المضافة والخصائص المميزة',
    descriptionEn: '',
    descriptionAr: '',
    bulletPoints: [],
  },
  {
    id: 'price',
    titleEn: 'Price (السعر)',
    titleAr: 'السعر — Price',
    subtitleEn: 'Pricing Strategy & Payment Terms',
    subtitleAr: 'استراتيجية التسعير وشروط الدفع',
    descriptionEn: '',
    descriptionAr: '',
    bulletPoints: [],
  },
  {
    id: 'place',
    titleEn: 'Place (التوزيع)',
    titleAr: 'التوزيع — Place',
    subtitleEn: 'Channels & Distribution Logistics',
    subtitleAr: 'قنوات البيع والتوزيع واللوجستية',
    descriptionEn: '',
    descriptionAr: '',
    bulletPoints: [],
  },
  {
    id: 'promotion',
    titleEn: 'Promotion (الترويج)',
    titleAr: 'الترويج — Promotion',
    subtitleEn: 'Campaigns & Marketing Touchpoints',
    subtitleAr: 'الحملات الإعلانية والتواصل مع العملاء',
    descriptionEn: '',
    descriptionAr: '',
    bulletPoints: [],
  },
];

const DEFAULT_BUYER_PERSONA: BuyerPersona = {
  name: '',
  title: '',
  titleAr: '',
  age: '',
  gender: '',
  occupation: '',
  incomeLevel: '',
  demographics: [],
  profileDescription: '',
  profileDescriptionAr: '',
  needsAndGoals: [],
  motivationsAndPains: [],
  buyingChannels: [],
};

// Context Types
interface AppContextType {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
  themeConfig: ThemeConfig;
  customPalette: CustomPalette;
  updateCustomPalette: (palette: Partial<CustomPalette>) => void;
  businessName: string;
  setBusinessName: (name: string) => void;

  // Supabase State & Health
  isLoading: boolean;
  fetchError: string | null;
  isSyncing: boolean;

  // Customers
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  addCustomer: (cust: Omit<Customer, 'id'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Sales & Inventory
  dailySalesTarget: number;
  updateDailyTarget: (val: number) => void;
  fastItems: FastItem[];
  setFastItems: React.Dispatch<React.SetStateAction<FastItem[]>>;
  addFastItem: (item: Omit<FastItem, 'id'>) => void;
  updateFastItem: (id: string, data: Partial<FastItem>) => void;
  updateFastItemStock: (id: string, newStock: number) => void;
  deleteFastItem: (id: string) => void;
  restockItem: (id: string, qtyToAdd: number, reason: string) => void;
  stockMovements: StockMovement[];
  setStockMovements: React.Dispatch<React.SetStateAction<StockMovement[]>>;
  returnTransactionItems: (items: StagedItem[], referenceNo: string, reason: string) => void;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransactionNote: (id: string, note: string) => void;
  updateTransactionOrderStatus: (
    txId: string,
    orderId: string | number | undefined,
    updates: { deliveryStatus?: string; preparingStatus?: string; orderStatus?: string }
  ) => Promise<void>;

  // Work in Progress (WIP / Manufacturing) State
  wipBatches: WipBatch[];
  setWipBatches: React.Dispatch<React.SetStateAction<WipBatch[]>>;
  startWipBatch: (batchData: Omit<WipBatch, 'id' | 'batchNo' | 'completedQuantity' | 'scrappedQuantity' | 'status'>) => void;
  updateWipBatchStage: (id: string, stage: WipStage, notes?: string) => void;
  recordWipScrap: (id: string, scrappedQty: number) => void;
  completeWipBatch: (id: string, completedQty: number, scrappedQty?: number) => void;
  deleteWipBatch: (id: string) => void;

  // Pending / Held Sales State
  pendingSales: PendingSale[];
  holdSale: (sale: Omit<PendingSale, 'id' | 'heldAt' | 'date'>) => void;
  restorePendingSale: (id: string) => PendingSale | undefined;
  cancelPendingSale: (id: string) => void;
  deductStockForTransaction: (items: StagedItem[]) => void;

  // Operations State
  operationSteps: OperationStep[];
  setOperationSteps: React.Dispatch<React.SetStateAction<OperationStep[]>>;
  addStep: (step: Omit<OperationStep, 'id' | 'stepNumber'>) => void;
  updateStep: (id: string, step: Partial<OperationStep>) => void;
  deleteStep: (id: string) => void;
  reorderStep: (id: string, direction: 'up' | 'down') => void;

  // Finance State
  financeItems: FinanceItem[];
  setFinanceItems: React.Dispatch<React.SetStateAction<FinanceItem[]>>;
  addFinanceItem: (item: Omit<FinanceItem, 'id'>) => void;
  updateFinanceItem: (id: string, item: Partial<FinanceItem>) => void;
  deleteFinanceItem: (id: string) => void;

  // Expenses State
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  expenseCategories: ExpenseCategory[];
  addExpense: (expense: Omit<Expense, 'id' | 'receiptNo' | 'createdAt'>) => void;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  settleExpense: (id: string, paymentMethod: 'Cash' | 'E_Wallet' | 'Bank') => void;
  addExpenseCategory: (nameAr: string, nameEn?: string) => void;
  updateExpenseCategory: (id: string, nameAr: string, nameEn?: string) => void;
  deleteExpenseCategory: (id: string) => void;

  // HR State
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, emp: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  // Marketing State
  marketingMix: MarketingMixP[];
  buyerPersona: BuyerPersona;
  updateMarketingP: (id: string, data: Partial<MarketingMixP>) => void;
  updateBuyerPersona: (data: Partial<BuyerPersona>) => void;
  clearMarketingData: () => void;

  // Multi-Tenant Workspace State
  activeTenant: TenantWithMembership | null;
  isConsultantUser: boolean;
  selectTenant: (tenant: TenantWithMembership | null, isConsultant?: boolean) => void;

  // Portal (Login & Project Selection) Theme Mode
  isDarkPortal: boolean;
  toggleDarkPortal: () => void;

  // Global Helpers
  resetToDefault: () => void;
  refreshDataFromSupabase: (overrideTenantId?: string) => Promise<void>;
  refreshInventoryFromSupabase: (overrideTenantId?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [language, setLanguage] = useState<Language>('ar');
  const [theme, setTheme] = useState<ColorTheme>('indigo');
  const [customPalette, setCustomPalette] = useState<CustomPalette>(DEFAULT_CUSTOM_PALETTE);
  const [businessName, setBusinessName] = useState<string>('Profness Enterprise');
  const [activeTenant, setActiveTenant] = useState<TenantWithMembership | null>(null);
  const [isConsultantUser, setIsConsultantUser] = useState<boolean>(false);
  const [isDarkPortal, setIsDarkPortal] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('profness_login_theme');
      return saved ? saved === 'dark' : true;
    } catch {
      return true;
    }
  });

  const toggleDarkPortal = () => {
    setIsDarkPortal((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('profness_login_theme', next ? 'dark' : 'light');
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Pure In-Memory React State (Exclusively synchronized with Supabase DB)
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dailySalesTarget, setDailySalesTarget] = useState<number>(5000.0);
  const [fastItems, setFastItems] = useState<FastItem[]>([]);
  const [wipBatches, setWipBatches] = useState<WipBatch[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [operationSteps, setOperationSteps] = useState<OperationStep[]>([]);
  const [financeItems, setFinanceItems] = useState<FinanceItem[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [marketingMix, setMarketingMix] = useState<MarketingMixP[]>(DEFAULT_MARKETING_MIX);
  const [buyerPersona, setBuyerPersona] = useState<BuyerPersona>(DEFAULT_BUYER_PERSONA);

  // Set HTML dir attribute on language change
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Central Supabase Data Fetching Scoped by Active Tenant
  const refreshDataFromSupabase = async (overrideTenantId?: string) => {
    const targetTenantId = overrideTenantId ?? activeTenant?.tenantId;
    if (!targetTenantId) {
      setIsLoading(false);
      return;
    }

    setCurrentActiveTenantId(targetTenantId);
    setIsLoading(true);
    setFetchError(null);

    if (!isSupabaseConfigured) {
      setFetchError('لم يتم تكوين متغيرات بيئة Supabase في التطبيق.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch Customers
      const custRes = await fetchCustomersFromSupabase(targetTenantId);
      if (custRes.error) {
        console.warn('Supabase fetch customers warning:', custRes.error);
      } else if (custRes.data) {
        setCustomers(custRes.data);
      }

      // 2. Fetch Products & Stock (unified Supabase merge)
      const invRes = await fetchCombinedInventoryFromSupabase(targetTenantId);
      if (invRes.error) {
        console.warn('Supabase fetch products/stock warning:', invRes.error);
      }
      setFastItems(invRes.data);

      // 3. Fetch Expense Transactions
      const expRes = await fetchExpenseTransactionsFromSupabase(targetTenantId);
      if (expRes.data) {
        setExpenses(expRes.data);
      }

      // 4. Fetch Sales Transactions, Orders & Order Items from Supabase
      const salesRes = await fetchSalesTransactionsFromSupabase(targetTenantId);
      const ordersRes = await fetchOrdersFromSupabase(targetTenantId);
      const orderItemsRes = await fetchOrderItemsFromSupabase();

      const ordersList = ordersRes.data || [];
      const orderItemsList = orderItemsRes.data || [];
      let txList: Transaction[] = (salesRes.data || []) as Transaction[];

      // Link orders and order_items with transactions
      txList = txList.map((tx) => {
        const matchedOrder = ordersList.find(
          (o) => o.id === tx.orderId || (o.customerName === tx.customerName && Math.abs(o.totalPrice - tx.total) < 0.01)
        );

        // Find items in public.order_items for this order
        const orderKey = matchedOrder?.orderPk ?? matchedOrder?.id ?? tx.orderId;
        const matchingItems = orderItemsList.filter(
          (it) => String(it.order_fk) === String(orderKey) || (tx.orderId && String(it.order_fk) === String(tx.orderId))
        );

        const restoredItems: StagedItem[] = matchingItems.length > 0
          ? matchingItems.map((mi) => ({
              id: `item-${mi.id || Math.random()}`,
              name: mi.Item_Name,
              category: 'Retail',
              unitPrice: mi.unit_price,
              quantity: mi.quantity_items,
              discountPct: 0,
            }))
          : tx.items;

        const summary = matchingItems.length > 0
          ? matchingItems.map((i) => `${i.quantity_items}x ${i.Item_Name}`).join(', ')
          : tx.itemsSummary;

        if (matchedOrder) {
          return {
            ...tx,
            orderId: matchedOrder.id,
            items: restoredItems.length > 0 ? restoredItems : tx.items,
            itemsSummary: summary || tx.itemsSummary,
            customerPhone1: matchedOrder.customerPhone1 || tx.customerPhone1,
            customerPhone2: matchedOrder.customerPhone2 || tx.customerPhone2,
            customerAddress: matchedOrder.customerAddress || tx.customerAddress,
            deliveryStatus: matchedOrder.deliveryStatus || tx.deliveryStatus || DEFAULT_DELIVERY_STATUS,
            preparingStatus: matchedOrder.preparingStatus || tx.preparingStatus || DEFAULT_PREPARING_STATUS,
            orderStatus: matchedOrder.orderStatus || tx.orderStatus || (tx.status === 'Returned' ? 'مرتجع' : DEFAULT_ORDER_STATUS),
          };
        }
        return {
          ...tx,
          items: restoredItems.length > 0 ? restoredItems : tx.items,
          itemsSummary: summary || tx.itemsSummary,
          deliveryStatus: tx.deliveryStatus || DEFAULT_DELIVERY_STATUS,
          preparingStatus: tx.preparingStatus || DEFAULT_PREPARING_STATUS,
          orderStatus: tx.orderStatus || (tx.status === 'Returned' ? 'مرتجع' : DEFAULT_ORDER_STATUS),
        };
      });

      // Any order not in transactions yet, add as transaction with its items from order_items
      ordersList.forEach((order) => {
        const alreadyInTx = txList.some(
          (t) => t.orderId === order.id || (t.customerName === order.customerName && Math.abs(t.total - order.totalPrice) < 0.01)
        );
        if (!alreadyInTx) {
          const matchingItems = orderItemsList.filter(
            (it) => String(it.order_fk) === String(order.orderPk) || String(it.order_fk) === String(order.id)
          );
          const restoredItems: StagedItem[] = matchingItems.map((mi) => ({
            id: `item-${mi.id || Math.random()}`,
            name: mi.Item_Name,
            category: 'Retail',
            unitPrice: mi.unit_price,
            quantity: mi.quantity_items,
            discountPct: 0,
          }));
          const summaryStr = matchingItems.length > 0
            ? matchingItems.map((i) => `${i.quantity_items}x ${i.Item_Name}`).join(', ')
            : `طلب من ${order.customerName}`;

          txList.push({
            id: `ord-tx-${order.id}`,
            orderId: order.id,
            receiptNo: `ORD-${String(order.id).slice(-4)}`,
            time: order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            itemsSummary: summaryStr,
            items: restoredItems,
            subtotal: order.totalPrice,
            tax: 0,
            total: order.totalPrice,
            paymentMethod: (order.paymentMethod as any) || 'Cash',
            status: order.orderStatus === 'مرتجع' ? 'Returned' : 'Completed',
            shiftNotes: '',
            cashier: 'الكاشير الرئيسية',
            customerName: order.customerName,
            customerPhone1: order.customerPhone1,
            customerPhone2: order.customerPhone2,
            customerAddress: order.customerAddress,
            deliveryStatus: order.deliveryStatus,
            preparingStatus: order.preparingStatus,
            orderStatus: order.orderStatus,
          });
        }
      });

      setTransactions(txList);

      setFetchError(null);
    } catch (err: any) {
      console.error('❌ Error refreshing Supabase data in AppContext:', err);
      setFetchError(err?.message || 'حدث خطأ أثناء الاتصال بقاعدة بيانات Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  // Dedicated lightweight live inventory sync (used by POS / Inventory views on mount & focus)
  const refreshInventoryFromSupabase = async (overrideTenantId?: string) => {
    const targetTenantId = overrideTenantId ?? activeTenant?.tenantId;
    if (!targetTenantId || !isSupabaseConfigured) return;

    setCurrentActiveTenantId(targetTenantId);
    const invRes = await fetchCombinedInventoryFromSupabase(targetTenantId);
    if (!invRes.productsError && !invRes.stockError) {
      setFastItems(invRes.data);
    } else {
      console.warn('⚠️ refreshInventoryFromSupabase partial error:', invRes.stockError || invRes.productsError);
      if (!invRes.productsError && invRes.data.length > 0) {
        setFastItems((prev) => {
          if (prev.length === 0) return invRes.data;
          return invRes.data.map((item) => {
            const existing = prev.find(
              (p) => p.id === item.id || (item.product_pk && p.product_pk === item.product_pk)
            );
            return existing
              ? { ...item, stockQuantity: existing.stockQuantity, stock_pk: existing.stock_pk || item.stock_pk }
              : item;
          });
        });
      }
    }
  };

  const { user } = useAuth();

  const selectTenant = (tenant: TenantWithMembership | null, isConsultant?: boolean) => {
    if (typeof isConsultant === 'boolean') {
      setIsConsultantUser(isConsultant);
    }

    if (!tenant) {
      setCurrentActiveTenantId(null);
      setActiveTenant(null);
      setCustomers([]);
      setFastItems([]);
      setTransactions([]);
      setExpenses([]);
      setPendingSales([]);
      setFetchError(null);
      return;
    }

    setCurrentActiveTenantId(tenant.tenantId);
    setActiveTenant(tenant);
    setBusinessName(tenant.name);
    setCurrentPage('home');
    setCustomers([]);
    setFastItems([]);
    setTransactions([]);
    setExpenses([]);
    setPendingSales([]);
  };

  useEffect(() => {
    if (user && activeTenant) {
      refreshDataFromSupabase(activeTenant.tenantId);
    } else if (!user) {
      setCurrentActiveTenantId(null);
      setActiveTenant(null);
      setIsConsultantUser(false);
      setCustomers([]);
      setFastItems([]);
      setTransactions([]);
      setExpenses([]);
      setPendingSales([]);
    }
  }, [user, activeTenant?.tenantId]);

  const updateCustomPalette = (data: Partial<CustomPalette>) => {
    setCustomPalette((prev) => ({ ...prev, ...data }));
  };

  // Customer Handlers (Supabase Primary Source of Truth)
  const addCustomer = (custData: Omit<Customer, 'id'>): Customer => {
    const tempId = `cust-${Date.now()}`;
    const newCust: Customer = { ...custData, id: tempId };
    setCustomers((prev) => [newCust, ...prev]);

    setIsSyncing(true);
    addCustomerToSupabase({
      name: custData.name,
      phone1: custData.phone,
      phone2: custData.phone2,
      address: custData.address || '',
      email: custData.email,
      type: custData.type || 'Individual',
      status: custData.status || 'Active',
      creditLimit: custData.creditLimit,
    })
      .then((res) => {
        if (res.success && res.data) {
          setCustomers((prev) => prev.map((c) => (c.id === tempId ? res.data! : c)));
        } else if (res.error) {
          console.error('Error saving customer to Supabase:', res.error);
        }
      })
      .finally(() => setIsSyncing(false));

    return newCust;
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );

    setIsSyncing(true);
    const promises: Promise<any>[] = [];
    if (data.status) {
      promises.push(updateCustomerStatusInSupabase(id, data.status));
    }
    if (data.creditLimit !== undefined) {
      promises.push(updateCustomerCreditLimitInSupabase(id, data.creditLimit));
    }
    Promise.all(promises).finally(() => setIsSyncing(false));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setIsSyncing(true);
    deleteCustomerFromSupabase(id).finally(() => setIsSyncing(false));
  };

  // Sales Target & Inventory Stock Handlers (Supabase Synchronized)
  const updateDailyTarget = (val: number) => setDailySalesTarget(val);

  const addFastItem = (itemData: Omit<FastItem, 'id'>) => {
    const tempId = `fi-${Date.now()}`;
    const newItem: FastItem = {
      ...itemData,
      id: tempId,
      minStock: itemData.minStock ?? 10,
      maxStock: itemData.maxStock ?? 100,
      stockQuantity: itemData.stockQuantity ?? 0,
      unit: itemData.unit || 'قطعة',
    };
    setFastItems((prev) => [...prev, newItem]);

    setIsSyncing(true);
    if (itemData.inventoryType === 'raw_material') {
      addStockToSupabase({
        stock_name: itemData.name,
        stock_type: 'Raw material',
        minimum_limit: itemData.minStock ?? 10,
        maximum_limit: itemData.maxStock ?? 100,
        quantity: itemData.stockQuantity ?? 0,
        stock_cost: itemData.costPrice || itemData.price || 0,
        measure_stype: itemData.unit || 'قطعة',
        stock_code: itemData.code,
        tenant_id: activeTenant?.tenantId,
      }).then(() => refreshInventoryFromSupabase(activeTenant?.tenantId)).finally(() => setIsSyncing(false));
    } else {
      addProductToSupabase({
        product_name: itemData.name,
        product_type: itemData.category || 'Retail',
        product_description: itemData.description,
        unit_cost: itemData.costPrice || 0,
        unit_price: itemData.price || 0,
        product_code: itemData.code,
        measure_ptype: itemData.unit || 'قطعة',
        tenant_id: activeTenant?.tenantId,
      }).then(() => refreshInventoryFromSupabase(activeTenant?.tenantId)).finally(() => setIsSyncing(false));
    }
  };

  const updateFastItem = (id: string, data: Partial<FastItem>) => {
    setFastItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );

    const target = fastItems.find((i) => i.id === id);
    if (!target) return;

    setIsSyncing(true);
    const syncPromises: Promise<any>[] = [];

    if (target.product_pk) {
      syncPromises.push(
        updateProductInSupabase(target.product_pk, {
          product_name: data.name,
          product_type: data.category,
          unit_cost: data.costPrice,
          unit_price: data.price,
          product_code: data.code,
          measure_ptype: data.unit,
        })
      );
    }

    if (data.stockQuantity !== undefined || data.costPrice !== undefined) {
      const cost = data.costPrice ?? target.costPrice ?? target.price ?? 0;
      const qty = data.stockQuantity ?? target.stockQuantity ?? 0;
      const stockOpts = {
        stockPk: target.stock_pk,
        productFk: target.product_pk,
        itemName: data.name ?? target.name,
        isRawMaterial: target.inventoryType === 'raw_material',
        unit: data.unit ?? target.unit,
        code: data.code ?? target.code,
        minStock: data.minStock ?? target.minStock,
        maxStock: data.maxStock ?? target.maxStock,
        tenantId: activeTenant?.tenantId,
      };
      if (target.stock_pk) {
        syncPromises.push(updateStockQuantityInSupabase(target.stock_pk, qty, cost, false, stockOpts));
      } else if (target.product_pk) {
        syncPromises.push(updateStockQuantityInSupabase(target.product_pk, qty, cost, true, stockOpts));
      } else {
        syncPromises.push(updateStockQuantityInSupabase(target.id, qty, cost, target.inventoryType !== 'raw_material', stockOpts));
      }
    }

    Promise.all(syncPromises).finally(() => setIsSyncing(false));
  };

  const updateFastItemStock = (id: string, newStock: number) => {
    updateFastItem(id, { stockQuantity: newStock });
  };

  const restockItem = (itemId: string, qtyToAdd: number, reason: string) => {
    if (qtyToAdd <= 0) return;
    const target = fastItems.find((item) => item.id === itemId);
    if (!target) return;

    const newQty = target.stockQuantity + qtyToAdd;
    const cost = target.costPrice || target.price || 0;

    updateFastItem(itemId, { stockQuantity: newQty, amount: newQty * cost });
  };

  const deleteFastItem = (id: string) => {
    const target = fastItems.find((i) => i.id === id);
    setFastItems((prev) => prev.filter((i) => i.id !== id));

    if (target?.product_pk) {
      setIsSyncing(true);
      deleteProductFromSupabase(target.product_pk).finally(() => setIsSyncing(false));
    }
  };

  // WIP Handlers
  const startWipBatch = (
    batchData: Omit<WipBatch, 'id' | 'batchNo' | 'completedQuantity' | 'scrappedQuantity' | 'status'>
  ) => {
    const now = new Date();
    const batchNo = `WIP-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newBatch: WipBatch = {
      ...batchData,
      id: `wip-${Date.now()}`,
      batchNo,
      completedQuantity: 0,
      scrappedQuantity: 0,
      status: 'in_progress',
    };
    setWipBatches((prev) => [newBatch, ...prev]);

    // Deduct Raw Materials from stock
    batchData.rawMaterialsUsed.forEach((usage) => {
      const mat = fastItems.find((i) => i.id === usage.rawMaterialId);
      if (mat) {
        const newQty = Math.max(0, mat.stockQuantity - usage.quantityUsed);
        updateFastItem(mat.id, { stockQuantity: newQty });
      }
    });
  };

  const updateWipBatchStage = (id: string, stage: WipStage, notes?: string) => {
    setWipBatches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, stage, notes: notes !== undefined ? notes : b.notes } : b))
    );
  };

  const recordWipScrap = (id: string, scrappedQty: number) => {
    if (scrappedQty <= 0) return;
    setWipBatches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, scrappedQuantity: (b.scrappedQuantity || 0) + scrappedQty } : b))
    );
  };

  const completeWipBatch = (id: string, completedQty: number, scrappedQty: number = 0) => {
    let finishedGoodId = '';
    setWipBatches((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          finishedGoodId = b.finishedGoodId;
          return {
            ...b,
            status: 'completed',
            completedQuantity: completedQty,
            scrappedQuantity: (b.scrappedQuantity || 0) + scrappedQty,
          };
        }
        return b;
      })
    );

    if (finishedGoodId) {
      const fg = fastItems.find((i) => i.id === finishedGoodId);
      if (fg) {
        const newQty = fg.stockQuantity + completedQty;
        updateFastItem(fg.id, { stockQuantity: newQty });
      }
    }
  };

  const deleteWipBatch = (id: string) => {
    setWipBatches((prev) => prev.filter((b) => b.id !== id));
  };

  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = { ...tx, id: `tx-${Date.now()}` };
    setTransactions((prev) => [newTx, ...prev]);

    setIsSyncing(true);
    addFinancialTransactionToSupabase({
      amount: tx.total,
      method: tx.paymentMethod,
      notice: JSON.stringify(tx.items),
      type: 'Sales_Trans',
      name: `${tx.customerName || 'عميل نقدي'} - ${tx.itemsSummary}`,
    }).finally(() => setIsSyncing(false));
  };

  const updateTransactionNote = (id: string, note: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, shiftNotes: note } : t))
    );
  };

  const updateTransactionOrderStatus = async (
    txId: string,
    orderId: string | number | undefined,
    updates: { deliveryStatus?: string; preparingStatus?: string; orderStatus?: string }
  ) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === txId) {
          return {
            ...t,
            deliveryStatus: updates.deliveryStatus !== undefined ? updates.deliveryStatus : t.deliveryStatus,
            preparingStatus: updates.preparingStatus !== undefined ? updates.preparingStatus : t.preparingStatus,
            orderStatus: updates.orderStatus !== undefined ? updates.orderStatus : t.orderStatus,
            status: updates.orderStatus === 'مرتجع' ? 'Returned' : t.status,
          };
        }
        return t;
      })
    );

    if (orderId) {
      setIsSyncing(true);
      await updateOrderStatusInSupabase(orderId, updates);
      setIsSyncing(false);
    }
  };

  // Pending Sales Handlers
  const holdSale = (saleData: Omit<PendingSale, 'id' | 'heldAt' | 'date'>) => {
    const now = new Date();
    const newPending: PendingSale = {
      ...saleData,
      id: `ps-${Date.now()}`,
      heldAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: now.toISOString().split('T')[0],
    };
    setPendingSales((prev) => [newPending, ...prev]);
  };

  const restorePendingSale = (id: string) => {
    const target = pendingSales.find((s) => s.id === id);
    if (target) {
      setPendingSales((prev) => prev.filter((s) => s.id !== id));
    }
    return target;
  };

  const cancelPendingSale = (id: string) => {
    setPendingSales((prev) => prev.filter((s) => s.id !== id));
  };

  const deductStockForTransaction = (items: StagedItem[]) => {
    items.forEach((staged) => {
      const catalogItem = fastItems.find(
        (ci) => ci.id === staged.originalFastItemId || ci.name === staged.name
      );
      if (catalogItem) {
        const newQty = Math.max(0, catalogItem.stockQuantity - staged.quantity);
        updateFastItem(catalogItem.id, { stockQuantity: newQty });
      }
    });
  };

  const returnTransactionItems = (items: StagedItem[], referenceNo: string, reason: string) => {
    items.forEach((staged) => {
      const catalogItem = fastItems.find(
        (ci) => ci.id === staged.originalFastItemId || ci.name === staged.name
      );
      if (catalogItem) {
        const newQty = catalogItem.stockQuantity + staged.quantity;
        updateFastItem(catalogItem.id, { stockQuantity: newQty });
      }
    });
  };

  // Operations Handlers
  const addStep = (step: Omit<OperationStep, 'id' | 'stepNumber'>) => {
    setOperationSteps((prev) => {
      const newStepNum = prev.length + 1;
      const newStep: OperationStep = { ...step, id: `step-${Date.now()}`, stepNumber: newStepNum };
      return [...prev, newStep];
    });
  };

  const updateStep = (id: string, data: Partial<OperationStep>) => {
    setOperationSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  const deleteStep = (id: string) => {
    setOperationSteps((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return filtered.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    });
  };

  const reorderStep = (id: string, direction: 'up' | 'down') => {
    setOperationSteps((prev) => {
      const index = prev.findIndex((s) => s.id === id);
      if (index < 0) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const newArr = [...prev];
      const temp = newArr[index];
      newArr[index] = newArr[targetIndex];
      newArr[targetIndex] = temp;

      return newArr.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    });
  };

  // Finance Handlers
  const addFinanceItem = (item: Omit<FinanceItem, 'id'>) => {
    const newItem: FinanceItem = { ...item, id: `f-${Date.now()}` };
    setFinanceItems((prev) => [...prev, newItem]);
  };

  const updateFinanceItem = (id: string, data: Partial<FinanceItem>) => {
    setFinanceItems((prev) => prev.map((f) => (f.id === id ? { ...f, ...data } : f)));
  };

  const deleteFinanceItem = (id: string) => {
    setFinanceItems((prev) => prev.filter((f) => f.id !== id));
  };

  // Expenses Handlers (Supabase Synchronized)
  const addExpense = (expenseData: Omit<Expense, 'id' | 'receiptNo' | 'createdAt'>) => {
    const now = new Date();
    const receiptNo = `EXP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      receiptNo,
      createdAt: now.toISOString(),
      status: expenseData.paymentMethod === 'Credit' ? 'Unpaid' : 'Paid',
    };
    setExpenses((prev) => [newExpense, ...prev]);

    setIsSyncing(true);
    addFinancialTransactionToSupabase({
      amount: expenseData.amount,
      method: expenseData.paymentMethod,
      notice: expenseData.paymentNotice || expenseData.notes || '',
      type: expenseData.category,
      name: expenseData.notes || expenseData.category,
    })
      .then(() => refreshDataFromSupabase())
      .finally(() => setIsSyncing(false));
  };

  const updateExpense = (id: string, data: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...data } : e))
    );

    const target = expenses.find((e) => e.id === id);
    if (!target) return;

    const targetPk = target.transaction_pk || id;
    setIsSyncing(true);
    updateFinancialTransactionInSupabase(targetPk, {
      amount: data.amount ?? target.amount,
      method: data.paymentMethod ?? target.paymentMethod,
      notice: data.paymentNotice ?? target.paymentNotice,
      type: data.category ?? target.category,
      name: data.notes ?? target.notes ?? 'Expense',
    }).finally(() => setIsSyncing(false));
  };

  const deleteExpense = (id: string) => {
    const target = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));

    if (target) {
      const targetPk = target.transaction_pk || id;
      setIsSyncing(true);
      deleteFinancialTransactionInSupabase(targetPk).finally(() => setIsSyncing(false));
    }
  };

  const settleExpense = (id: string, paymentMethod: 'Cash' | 'E_Wallet' | 'Bank') => {
    const today = new Date().toISOString().split('T')[0];
    updateExpense(id, {
      status: 'Paid',
      settledDate: today,
      settledPaymentMethod: paymentMethod,
      paymentMethod: paymentMethod,
    });
  };

  const addExpenseCategory = (nameAr: string, nameEn?: string) => {
    if (!nameAr.trim()) return;
    const newCategory: ExpenseCategory = {
      id: `cat-${Date.now()}`,
      nameAr: nameAr.trim(),
      nameEn: nameEn?.trim() || nameAr.trim(),
      isDefault: false,
    };
    setExpenseCategories((prev) => [...prev, newCategory]);
  };

  const updateExpenseCategory = (id: string, nameAr: string, nameEn?: string) => {
    setExpenseCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, nameAr: nameAr.trim(), nameEn: nameEn?.trim() || nameAr.trim() } : c))
    );
  };

  const deleteExpenseCategory = (id: string) => {
    setExpenseCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // HR Handlers
  const addEmployee = (emp: Omit<Employee, 'id'>) => {
    const newEmp: Employee = { ...emp, id: `emp-${Date.now()}` };
    setEmployees((prev) => [...prev, newEmp]);
  };

  const updateEmployee = (id: string, data: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  // Marketing Handlers
  const updateMarketingP = (id: string, data: Partial<MarketingMixP>) => {
    setMarketingMix((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  const updateBuyerPersona = (data: Partial<BuyerPersona>) => {
    setBuyerPersona((prev) => ({ ...prev, ...data }));
  };

  const clearMarketingData = () => {
    setMarketingMix(DEFAULT_MARKETING_MIX);
    setBuyerPersona(DEFAULT_BUYER_PERSONA);
  };

  const resetToDefault = () => {
    setFastItems([]);
    setCustomers([]);
    setTransactions([]);
    setPendingSales([]);
    setOperationSteps([]);
    setFinanceItems([]);
    setExpenses([]);
    setEmployees([]);
    refreshDataFromSupabase();
  };

  const baseTheme = THEME_CONFIGS[theme] || THEME_CONFIGS.indigo;
  const themeConfig: ThemeConfig = {
    ...baseTheme,
    primary: customPalette.primaryAccent || baseTheme.primary,
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        language,
        setLanguage,
        theme,
        setTheme,
        themeConfig,
        customPalette,
        updateCustomPalette,
        businessName,
        setBusinessName,

        isLoading,
        fetchError,
        isSyncing,

        customers,
        setCustomers,
        addCustomer,
        updateCustomer,
        deleteCustomer,

        dailySalesTarget,
        updateDailyTarget,
        fastItems,
        setFastItems,
        addFastItem,
        updateFastItem,
        updateFastItemStock,
        deleteFastItem,
        restockItem,
        stockMovements,
        setStockMovements,
        wipBatches,
        setWipBatches,
        startWipBatch,
        updateWipBatchStage,
        recordWipScrap,
        completeWipBatch,
        deleteWipBatch,
        returnTransactionItems,
        transactions,
        setTransactions,
        addTransaction,
        updateTransactionNote,
        updateTransactionOrderStatus,

        pendingSales,
        holdSale,
        restorePendingSale,
        cancelPendingSale,
        deductStockForTransaction,

        operationSteps,
        setOperationSteps,
        addStep,
        updateStep,
        deleteStep,
        reorderStep,

        financeItems,
        setFinanceItems,
        addFinanceItem,
        updateFinanceItem,
        deleteFinanceItem,

        expenses,
        setExpenses,
        expenseCategories,
        addExpense,
        updateExpense,
        deleteExpense,
        settleExpense,
        addExpenseCategory,
        updateExpenseCategory,
        deleteExpenseCategory,

        employees,
        setEmployees,
        addEmployee,
        updateEmployee,
        deleteEmployee,

        marketingMix,
        buyerPersona,
        updateMarketingP,
        updateBuyerPersona,
        clearMarketingData,

        activeTenant,
        isConsultantUser,
        selectTenant,

        isDarkPortal,
        toggleDarkPortal,

        resetToDefault,
        refreshDataFromSupabase,
        refreshInventoryFromSupabase,
      }}
    >
      {fetchError && (
        <div className="bg-red-500 text-white p-3 text-sm flex items-center justify-between px-4 z-50">
          <div>
            <strong>خطأ الاتصال بقاعدة البيانات (Supabase):</strong> {fetchError}
          </div>
          <button
            onClick={() => refreshDataFromSupabase()}
            className="bg-white text-red-600 hover:bg-red-100 font-bold px-3 py-1 rounded text-xs transition"
          >
            إعادة المحاولة
          </button>
        </div>
      )}
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

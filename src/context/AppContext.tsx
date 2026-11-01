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
  ExpensePaymentMethod,
  ExpensePaymentStatus,
  InventoryType,
  WipStage,
  WipStatus,
  WipMaterialUsage,
  WipBatch,
} from '../types';

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

// Canvas Color Extraction helper
export const extractPaletteFromImage = (dataUrl: string): Promise<Partial<CustomPalette>> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve({});

      canvas.width = 80;
      canvas.height = 80;
      ctx.drawImage(img, 0, 0, 80, 80);

      const imageData = ctx.getImageData(0, 0, 80, 80).data;
      const colorCounts: Record<string, number> = {};

      for (let i = 0; i < imageData.length; i += 16) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];

        if (a < 128) continue;
        const qR = Math.round(r / 20) * 20;
        const qG = Math.round(g / 20) * 20;
        const qB = Math.round(b / 20) * 20;

        const hex = `#${((1 << 24) + (qR << 16) + (qG << 8) + qB).toString(16).slice(1)}`;
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }

      const sortedColors = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a]);

      const primary = sortedColors[0] || '#3525cd';
      const secondary = sortedColors[1] || '#0f172a';

      resolve({
        primaryAccent: primary,
        topBarBg: '#ffffff',
        topBarText: '#0f172a',
        sidebarBg: secondary,
        sidebarText: '#ffffff',
        pageBg: '#f8fafc',
        surfaceBg: '#ffffff',
        brandLogoUrl: dataUrl,
      });
    };
    img.onerror = () => resolve({});
  });
};

// Default Customers Data
const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'شركة الأمل للتجارة',
    phone: '+966 50 123 4567',
    email: 'info@alamal.com',
    company: 'مجموعة الأمل التجارية',
    taxNumber: '310123456700003',
  },
  {
    id: 'cust-2',
    name: 'عبدالله محمد الغامدي',
    phone: '+966 55 987 6543',
    email: 'abdullah@example.com',
    company: 'مؤسسة الغامدي للمقاولات',
    taxNumber: '300987654300003',
  },
  {
    id: 'cust-3',
    name: 'سارة خالد العتيبي',
    phone: '+966 54 456 7890',
    email: 'sara.k@example.com',
  },
];

// Default Initial Data: Raw Materials & Finished Goods Inventory
const DEFAULT_FAST_ITEMS: FastItem[] = [
  // 1. Raw Materials (المواد الخام المستخدمة في التصنيع)
  {
    id: 'rm-1',
    name: 'Cotton Fabric (High Grade)',
    nameAr: 'قماش قطني فاخر',
    category: 'Raw Materials',
    inventoryType: 'raw_material',
    price: 15.00,
    costPrice: 10.00,
    stockQuantity: 250,
    minStock: 50,
    maxStock: 500,
    code: 'RM-COTTON-01',
    unit: 'متر',
  },
  {
    id: 'rm-2',
    name: 'Sewing Threads (Spools)',
    nameAr: 'خيوط حياكة ممتازة',
    category: 'Raw Materials',
    inventoryType: 'raw_material',
    price: 4.50,
    costPrice: 2.50,
    stockQuantity: 12,
    minStock: 20,
    maxStock: 100,
    code: 'RM-THREAD-02',
    unit: 'بكرة',
  },
  {
    id: 'rm-3',
    name: 'Raw Specialty Coffee Beans',
    nameAr: 'حبوب بن إثيوبي خام',
    category: 'Raw Materials',
    inventoryType: 'raw_material',
    price: 35.00,
    costPrice: 25.00,
    stockQuantity: 180,
    minStock: 40,
    maxStock: 300,
    code: 'RM-COFFEE-03',
    unit: 'كجم',
  },
  {
    id: 'rm-4',
    name: 'Carton Packaging Boxes',
    nameAr: 'عبوات تغليف كرتونية',
    category: 'Raw Materials',
    inventoryType: 'raw_material',
    price: 2.00,
    costPrice: 1.20,
    stockQuantity: 550,
    minStock: 100,
    maxStock: 500,
    code: 'RM-BOX-04',
    unit: 'عبوة',
  },

  // 2. Finished Goods (المنتجات الجاهزة للبيع)
  {
    id: 'fg-1',
    name: 'Classic Formal Cotton Shirt',
    nameAr: 'قميص رسمي قطني',
    category: 'Retail',
    inventoryType: 'finished_goods',
    price: 120.00,
    costPrice: 55.00,
    stockQuantity: 45,
    minStock: 10,
    maxStock: 100,
    code: 'PRD-SHIRT-01',
    unit: 'قطعة',
  },
  {
    id: 'fg-2',
    name: 'Specialty Coffee Beans (250g)',
    nameAr: 'عبوة أظرف قهوة مختصة (250ج)',
    category: 'Retail',
    inventoryType: 'finished_goods',
    price: 65.00,
    costPrice: 30.00,
    stockQuantity: 8,
    minStock: 15,
    maxStock: 80,
    code: 'PRD-COFFEE-02',
    unit: 'علبة',
  },
  {
    id: 'fg-3',
    name: 'Genuine Leather Jacket',
    nameAr: 'جاكيت جلد طبيعي',
    category: 'Retail',
    inventoryType: 'finished_goods',
    price: 450.00,
    costPrice: 210.00,
    stockQuantity: 95,
    minStock: 10,
    maxStock: 50,
    code: 'PRD-JACKET-03',
    unit: 'قطعة',
  },
  {
    id: 'fg-4',
    name: 'Perfume Sandalwood & Musk (100ml)',
    nameAr: 'عطر خشب الصندل والمسك',
    category: 'Retail',
    inventoryType: 'finished_goods',
    price: 210.00,
    costPrice: 85.00,
    stockQuantity: 30,
    minStock: 10,
    maxStock: 60,
    code: 'PRD-PERFUME-04',
    unit: 'زجاجة',
  },
];

// Default Work in Progress (تحت التصنيع)
const DEFAULT_WIP_BATCHES: WipBatch[] = [
  {
    id: 'wip-1',
    batchNo: 'WIP-2026-001',
    finishedGoodId: 'fg-1',
    finishedGoodName: 'قميص رسمي قطني',
    targetQuantity: 50,
    completedQuantity: 0,
    scrappedQuantity: 2,
    rawMaterialsUsed: [
      { rawMaterialId: 'rm-1', rawMaterialName: 'قماش قطني فاخر', quantityUsed: 100, unit: 'متر' },
      { rawMaterialId: 'rm-2', rawMaterialName: 'خيوط حياكة ممتازة', quantityUsed: 15, unit: 'بكرة' },
    ],
    stage: 'processing',
    status: 'in_progress',
    startDate: '2026-10-28',
    targetCompletionDate: '2026-11-05',
    notes: 'جاري مرحلة الخياطة والتجهيز الأولي للدفعة',
  },
  {
    id: 'wip-2',
    batchNo: 'WIP-2026-002',
    finishedGoodId: 'fg-2',
    finishedGoodName: 'عبوة أظرف قهوة مختصة (250ج)',
    targetQuantity: 40,
    completedQuantity: 0,
    scrappedQuantity: 0,
    rawMaterialsUsed: [
      { rawMaterialId: 'rm-3', rawMaterialName: 'حبوب بن إثيوبي خام', quantityUsed: 10, unit: 'كجم' },
      { rawMaterialId: 'rm-4', rawMaterialName: 'عبوات تغليف كرتونية', quantityUsed: 40, unit: 'عبوة' },
    ],
    stage: 'packaging',
    status: 'in_progress',
    startDate: '2026-10-30',
    targetCompletionDate: '2026-11-02',
    notes: 'مرحلة التحمير والتغليف النهائي',
  },
];

const DEFAULT_STOCK_MOVEMENTS: StockMovement[] = [];

const DEFAULT_PENDING_SALES: PendingSale[] = [];

const DEFAULT_TRANSACTIONS: Transaction[] = [];

const DEFAULT_OPERATIONS_STEPS: OperationStep[] = [];

const DEFAULT_FINANCE_ITEMS: FinanceItem[] = [];

const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat-1', nameAr: 'الإيجار', nameEn: 'Rent', isDefault: true },
  { id: 'cat-2', nameAr: 'الرواتب والأجور', nameEn: 'Salaries & Wages', isDefault: true },
  { id: 'cat-3', nameAr: 'الكهرباء والمياه', nameEn: 'Electricity & Water', isDefault: true },
  { id: 'cat-4', nameAr: 'النقل والمواصلات', nameEn: 'Transportation', isDefault: true },
  { id: 'cat-5', nameAr: 'الصيانة', nameEn: 'Maintenance', isDefault: true },
  { id: 'cat-6', nameAr: 'التسويق والإعلانات', nameEn: 'Marketing & Advertising', isDefault: true },
  { id: 'cat-7', nameAr: 'مصروفات أخرى', nameEn: 'Other Expenses', isDefault: true },
];

const DEFAULT_EXPENSES: Expense[] = [];

const DEFAULT_EMPLOYEES: Employee[] = [];

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

  // Customer State
  customers: Customer[];
  addCustomer: (cust: Omit<Customer, 'id'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Sales & Inventory State
  dailySalesTarget: number;
  updateDailyTarget: (val: number) => void;
  fastItems: FastItem[];
  addFastItem: (item: Omit<FastItem, 'id'>) => void;
  updateFastItem: (id: string, data: Partial<FastItem>) => void;
  updateFastItemStock: (id: string, newStock: number) => void;
  deleteFastItem: (id: string) => void;
  restockItem: (id: string, qtyToAdd: number, reason: string) => void;
  stockMovements: StockMovement[];
  returnTransactionItems: (items: StagedItem[], referenceNo: string, reason: string) => void;
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransactionNote: (id: string, note: string) => void;

  // Work in Progress (WIP / Manufacturing) State
  wipBatches: WipBatch[];
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
  addStep: (step: Omit<OperationStep, 'id' | 'stepNumber'>) => void;
  updateStep: (id: string, step: Partial<OperationStep>) => void;
  deleteStep: (id: string) => void;
  reorderStep: (id: string, direction: 'up' | 'down') => void;

  // Finance State
  financeItems: FinanceItem[];
  addFinanceItem: (item: Omit<FinanceItem, 'id'>) => void;
  updateFinanceItem: (id: string, item: Partial<FinanceItem>) => void;
  deleteFinanceItem: (id: string) => void;

  // Expenses State
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  addExpense: (expense: Omit<Expense, 'id' | 'receiptNo' | 'createdAt'>) => void;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  settleExpense: (id: string, paymentMethod: 'Cash' | 'Electronic') => void;
  addExpenseCategory: (nameAr: string, nameEn?: string) => void;
  updateExpenseCategory: (id: string, nameAr: string, nameEn?: string) => void;
  deleteExpenseCategory: (id: string) => void;

  // HR State
  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, emp: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  // Marketing State
  marketingMix: MarketingMixP[];
  buyerPersona: BuyerPersona;
  updateMarketingP: (id: string, data: Partial<MarketingMixP>) => void;
  updateBuyerPersona: (data: Partial<BuyerPersona>) => void;
  clearMarketingData: () => void;

  // Global Helpers
  resetToDefault: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<ColorTheme>('indigo');
  const [customPalette, setCustomPalette] = useState<CustomPalette>(DEFAULT_CUSTOM_PALETTE);
  const [businessName, setBusinessName] = useState<string>('My Business');

  // Customers
  const [customers, setCustomers] = useState<Customer[]>(DEFAULT_CUSTOMERS);

  // Sales & Inventory
  const [dailySalesTarget, setDailySalesTarget] = useState<number>(5000.0);
  const [fastItems, setFastItems] = useState<FastItem[]>(DEFAULT_FAST_ITEMS);
  const [wipBatches, setWipBatches] = useState<WipBatch[]>(DEFAULT_WIP_BATCHES);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(DEFAULT_STOCK_MOVEMENTS);
  const [transactions, setTransactions] = useState<Transaction[]>(DEFAULT_TRANSACTIONS);
  const [pendingSales, setPendingSales] = useState<PendingSale[]>(DEFAULT_PENDING_SALES);

  // Operations
  const [operationSteps, setOperationSteps] = useState<OperationStep[]>(DEFAULT_OPERATIONS_STEPS);

  // Finance
  const [financeItems, setFinanceItems] = useState<FinanceItem[]>(DEFAULT_FINANCE_ITEMS);

  // Expenses
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [expenses, setExpenses] = useState<Expense[]>(DEFAULT_EXPENSES);

  // HR
  const [employees, setEmployees] = useState<Employee[]>(DEFAULT_EMPLOYEES);

  // Marketing
  const [marketingMix, setMarketingMix] = useState<MarketingMixP[]>(DEFAULT_MARKETING_MIX);
  const [buyerPersona, setBuyerPersona] = useState<BuyerPersona>(DEFAULT_BUYER_PERSONA);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      localStorage.removeItem('bizos_state_v1'); // clear legacy state
      const saved = localStorage.getItem('bizos_state_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.customPalette) setCustomPalette(parsed.customPalette);
        if (parsed.businessName) setBusinessName(parsed.businessName);
        if (parsed.customers) setCustomers(parsed.customers);
        if (parsed.dailySalesTarget) setDailySalesTarget(parsed.dailySalesTarget);
        if (parsed.fastItems) setFastItems(parsed.fastItems);
        if (parsed.wipBatches) setWipBatches(parsed.wipBatches);
        if (parsed.stockMovements) setStockMovements(parsed.stockMovements);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.pendingSales) setPendingSales(parsed.pendingSales);
        if (parsed.operationSteps) setOperationSteps(parsed.operationSteps);
        if (parsed.financeItems) setFinanceItems(parsed.financeItems);
        if (parsed.expenseCategories) setExpenseCategories(parsed.expenseCategories);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.employees) setEmployees(parsed.employees);
        if (parsed.marketingMix) {
          const cleanedMix = parsed.marketingMix.map((p: MarketingMixP) => {
            const isLegacyDescription =
              p.descriptionAr?.includes('منتجات وحلول') ||
              p.descriptionAr?.includes('تسعير تنافسي') ||
              p.descriptionAr?.includes('منظومة توزيع') ||
              p.descriptionAr?.includes('استراتيجية ترويج') ||
              p.descriptionEn?.includes('Premium grade') ||
              p.descriptionEn?.includes('Competitive value-based') ||
              p.descriptionEn?.includes('Omnichannel presence') ||
              p.descriptionEn?.includes('Targeted multi-channel');

            if (isLegacyDescription) {
              return {
                ...p,
                descriptionAr: '',
                descriptionEn: '',
                bulletPoints: [],
              };
            }
            return p;
          });
          setMarketingMix(cleanedMix);
        }
        if (parsed.buyerPersona) {
          // If loaded persona contains legacy mock name or title, reset to clean default
          if (
            parsed.buyerPersona.name === 'Abdullah Al-Harbi' ||
            parsed.buyerPersona.profileDescriptionAr?.includes('عبد الله يدير')
          ) {
            setBuyerPersona(DEFAULT_BUYER_PERSONA);
          } else {
            setBuyerPersona(parsed.buyerPersona);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load bizos_state from localStorage:', err);
    }
  }, []);

  // Sync to LocalStorage on changes
  useEffect(() => {
    try {
      const stateToSave = {
        language,
        theme,
        customPalette,
        businessName,
        customers,
        dailySalesTarget,
        fastItems,
        wipBatches,
        stockMovements,
        transactions,
        pendingSales,
        operationSteps,
        financeItems,
        expenseCategories,
        expenses,
        employees,
        marketingMix,
        buyerPersona,
      };
      localStorage.setItem('bizos_state_v2', JSON.stringify(stateToSave));
    } catch (err) {
      console.warn('Failed to save bizos_state to localStorage:', err);
    }
  }, [
    language,
    theme,
    customPalette,
    businessName,
    customers,
    dailySalesTarget,
    fastItems,
    wipBatches,
    stockMovements,
    transactions,
    pendingSales,
    operationSteps,
    financeItems,
    expenseCategories,
    expenses,
    employees,
    marketingMix,
    buyerPersona,
  ]);

  // Set HTML dir attribute on language change
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const updateCustomPalette = (data: Partial<CustomPalette>) => {
    setCustomPalette((prev) => ({ ...prev, ...data }));
  };

  // Customer Handlers
  const addCustomer = (custData: Omit<Customer, 'id'>): Customer => {
    const newCust: Customer = { ...custData, id: `cust-${Date.now()}` };
    setCustomers((prev) => [newCust, ...prev]);
    return newCust;
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Sales Handlers
  const updateDailyTarget = (val: number) => setDailySalesTarget(val);

  const addFastItem = (itemData: Omit<FastItem, 'id'>) => {
    const newId = `fi-${Date.now()}`;
    const newItem: FastItem = {
      ...itemData,
      id: newId,
      minStock: itemData.minStock ?? 10,
      maxStock: itemData.maxStock ?? 100,
      stockQuantity: itemData.stockQuantity ?? 0,
      unit: itemData.unit || 'قطعة',
    };

    setFastItems((prev) => [...prev, newItem]);

    // Log initial stock creation if quantity > 0
    if (newItem.stockQuantity > 0) {
      const now = new Date();
      const logEntry: StockMovement = {
        id: `sm-${Date.now()}`,
        itemId: newId,
        itemName: newItem.nameAr || newItem.name,
        type: 'restock',
        quantityChange: newItem.stockQuantity,
        quantityBefore: 0,
        quantityAfter: newItem.stockQuantity,
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reason: 'إضافة منتج جديد وتحديد المخزون الافتتاحي',
      };
      setStockMovements((prev) => [logEntry, ...prev]);
    }
  };

  const updateFastItem = (id: string, data: Partial<FastItem>) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setFastItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const oldStock = item.stockQuantity;
          const newStock = data.stockQuantity !== undefined ? data.stockQuantity : oldStock;

          if (data.stockQuantity !== undefined && data.stockQuantity !== oldStock) {
            const diff = newStock - oldStock;
            const logEntry: StockMovement = {
              id: `sm-${Date.now()}`,
              itemId: item.id,
              itemName: data.nameAr || data.name || item.nameAr || item.name,
              type: diff > 0 ? 'restock' : 'adjustment',
              quantityChange: diff,
              quantityBefore: oldStock,
              quantityAfter: newStock,
              date: dateStr,
              time: timeStr,
              reason: diff > 0 ? 'تعديل وتوريد كمية جديدة' : 'تعديل تسوية مخزنية يدوية',
            };
            setStockMovements((prevLogs) => [logEntry, ...prevLogs]);
          }

          return { ...item, ...data };
        }
        return item;
      })
    );
  };

  const updateFastItemStock = (id: string, newStock: number) => {
    updateFastItem(id, { stockQuantity: newStock });
  };

  const restockItem = (itemId: string, qtyToAdd: number, reason: string) => {
    if (qtyToAdd <= 0) return;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setFastItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const oldStock = item.stockQuantity;
          const newStock = oldStock + qtyToAdd;

          const logEntry: StockMovement = {
            id: `sm-${Date.now()}`,
            itemId: item.id,
            itemName: item.nameAr || item.name,
            type: 'restock',
            quantityChange: qtyToAdd,
            quantityBefore: oldStock,
            quantityAfter: newStock,
            date: dateStr,
            time: timeStr,
            reason: reason.trim() || 'إضافة وتوريد شحنة جديدة للمخزون',
          };
          setStockMovements((prevLogs) => [logEntry, ...prevLogs]);

          return { ...item, stockQuantity: newStock };
        }
        return item;
      })
    );
  };

  const deleteFastItem = (id: string) => {
    setFastItems((prev) => prev.filter((i) => i.id !== id));
  };

  // WIP & Manufacturing Handlers
  const startWipBatch = (
    batchData: Omit<WipBatch, 'id' | 'batchNo' | 'completedQuantity' | 'scrappedQuantity' | 'status'>
  ) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const batchNo = `WIP-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Deduct raw materials used from inventory
    if (batchData.rawMaterialsUsed && batchData.rawMaterialsUsed.length > 0) {
      setFastItems((prevItems) =>
        prevItems.map((catalogItem) => {
          const used = batchData.rawMaterialsUsed.find((rm) => rm.rawMaterialId === catalogItem.id);
          if (used) {
            const currentStock = catalogItem.stockQuantity;
            const updatedStock = Math.max(0, currentStock - used.quantityUsed);

            const logEntry: StockMovement = {
              id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              itemId: catalogItem.id,
              itemName: catalogItem.nameAr || catalogItem.name,
              type: 'adjustment',
              quantityChange: -used.quantityUsed,
              quantityBefore: currentStock,
              quantityAfter: updatedStock,
              date: dateStr,
              time: timeStr,
              reason: `بدء تشغيلة تصنيع (${batchNo}) - خصم مواد خام`,
              referenceNo: batchNo,
            };
            setStockMovements((prevLogs) => [logEntry, ...prevLogs]);

            return { ...catalogItem, stockQuantity: updatedStock };
          }
          return catalogItem;
        })
      );
    }

    // 2. Create new WIP Batch
    const newBatch: WipBatch = {
      ...batchData,
      id: `wip-${Date.now()}`,
      batchNo,
      completedQuantity: 0,
      scrappedQuantity: 0,
      status: 'in_progress',
    };

    setWipBatches((prev) => [newBatch, ...prev]);
  };

  const updateWipBatchStage = (id: string, stage: WipStage, notes?: string) => {
    setWipBatches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, stage, notes: notes !== undefined ? notes : b.notes } : b))
    );
  };

  const recordWipScrap = (id: string, scrappedQty: number) => {
    if (scrappedQty <= 0) return;
    setWipBatches((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          return {
            ...b,
            scrappedQuantity: (b.scrappedQuantity || 0) + scrappedQty,
          };
        }
        return b;
      })
    );
  };

  const completeWipBatch = (id: string, completedQty: number, scrappedQty: number = 0) => {
    const targetBatch = wipBatches.find((b) => b.id === id);
    if (!targetBatch || targetBatch.status === 'completed') return; // Prevent double completion

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Mark batch as completed
    setWipBatches((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          return {
            ...b,
            status: 'completed',
            completedQuantity: completedQty,
            scrappedQuantity: (b.scrappedQuantity || 0) + scrappedQty,
            completedDate: dateStr,
          };
        }
        return b;
      })
    );

    // 2. Add completed finished goods to Finished Goods inventory
    if (completedQty > 0) {
      setFastItems((prevItems) =>
        prevItems.map((catalogItem) => {
          if (catalogItem.id === targetBatch.finishedGoodId || catalogItem.name === targetBatch.finishedGoodName) {
            const currentStock = catalogItem.stockQuantity;
            const updatedStock = currentStock + completedQty;

            const logEntry: StockMovement = {
              id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              itemId: catalogItem.id,
              itemName: catalogItem.nameAr || catalogItem.name,
              type: 'restock',
              quantityChange: completedQty,
              quantityBefore: currentStock,
              quantityAfter: updatedStock,
              date: dateStr,
              time: timeStr,
              reason: `إكتمال تشغيلة تصنيع (${targetBatch.batchNo}) - إضافة إلى المنتجات الجاهزة`,
              referenceNo: targetBatch.batchNo,
            };
            setStockMovements((prevLogs) => [logEntry, ...prevLogs]);

            return { ...catalogItem, stockQuantity: updatedStock };
          }
          return catalogItem;
        })
      );
    }
  };

  const deleteWipBatch = (id: string) => {
    setWipBatches((prev) => prev.filter((b) => b.id !== id));
  };

  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = { ...tx, id: `tx-${Date.now()}` };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const updateTransactionNote = (id: string, note: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, shiftNotes: note } : t))
    );
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
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setFastItems((prevItems) =>
      prevItems.map((catalogItem) => {
        const matched = items.filter(
          (staged) => staged.originalFastItemId === catalogItem.id || staged.name === catalogItem.name
        );
        if (matched.length > 0) {
          const totalQtyDeducted = matched.reduce((sum, item) => sum + item.quantity, 0);
          const currentStock = catalogItem.stockQuantity ?? 50;
          const updatedStock = Math.max(0, currentStock - totalQtyDeducted);

          const logEntry: StockMovement = {
            id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            itemId: catalogItem.id,
            itemName: catalogItem.nameAr || catalogItem.name,
            type: 'sale',
            quantityChange: -totalQtyDeducted,
            quantityBefore: currentStock,
            quantityAfter: updatedStock,
            date: dateStr,
            time: timeStr,
            reason: 'عملية بيع مؤكدة عبر الكاشير',
          };
          setStockMovements((prevLogs) => [logEntry, ...prevLogs]);

          return { ...catalogItem, stockQuantity: updatedStock };
        }
        return catalogItem;
      })
    );
  };

  const returnTransactionItems = (items: StagedItem[], referenceNo: string, reason: string) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setFastItems((prevItems) =>
      prevItems.map((catalogItem) => {
        const matched = items.filter(
          (staged) => staged.originalFastItemId === catalogItem.id || staged.name === catalogItem.name
        );
        if (matched.length > 0) {
          const totalQtyReturned = matched.reduce((sum, item) => sum + item.quantity, 0);
          const currentStock = catalogItem.stockQuantity;
          const updatedStock = currentStock + totalQtyReturned;

          const logEntry: StockMovement = {
            id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            itemId: catalogItem.id,
            itemName: catalogItem.nameAr || catalogItem.name,
            type: 'return',
            quantityChange: totalQtyReturned,
            quantityBefore: currentStock,
            quantityAfter: updatedStock,
            date: dateStr,
            time: timeStr,
            reason: reason || `إرجاع عملية بيع ملغاة ${referenceNo}`,
            referenceNo,
          };
          setStockMovements((prevLogs) => [logEntry, ...prevLogs]);

          return { ...catalogItem, stockQuantity: updatedStock };
        }
        return catalogItem;
      })
    );
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

  // Expenses Handlers
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
  };

  const updateExpense = (id: string, data: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const updated = { ...e, ...data, updatedAt: new Date().toISOString() };
          if (data.paymentMethod && data.paymentMethod !== 'Credit' && e.paymentMethod === 'Credit') {
            updated.status = 'Paid';
          }
          return updated;
        }
        return e;
      })
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const settleExpense = (id: string, paymentMethod: 'Cash' | 'Electronic') => {
    const today = new Date().toISOString().split('T')[0];
    setExpenses((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            status: 'Paid',
            settledDate: today,
            settledPaymentMethod: paymentMethod,
            updatedAt: new Date().toISOString(),
          };
        }
        return e;
      })
    );
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
    setEmployees((prev) => {
      const deletedEmp = prev.find((e) => e.id === id);
      const fallbackManagerId = deletedEmp ? deletedEmp.directManagerId : null;

      return prev
        .filter((e) => e.id !== id)
        .map((e) => (e.directManagerId === id ? { ...e, directManagerId: fallbackManagerId } : e));
    });
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

  // Reset function
  const resetToDefault = () => {
    if (window.confirm('Reset all business data to initial defaults?')) {
      setDailySalesTarget(5000.0);
      setFastItems(DEFAULT_FAST_ITEMS);
      setTransactions(DEFAULT_TRANSACTIONS);
      setPendingSales(DEFAULT_PENDING_SALES);
      setOperationSteps(DEFAULT_OPERATIONS_STEPS);
      setFinanceItems(DEFAULT_FINANCE_ITEMS);
      setEmployees(DEFAULT_EMPLOYEES);
      setMarketingMix(DEFAULT_MARKETING_MIX);
      setBuyerPersona(DEFAULT_BUYER_PERSONA);
      setCustomPalette(DEFAULT_CUSTOM_PALETTE);
      localStorage.removeItem('bizos_state_v1');
      localStorage.removeItem('bizos_state_v2');
    }
  };

  // Theme config mapped or overridden by customPalette.primaryAccent
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

        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,

        dailySalesTarget,
        updateDailyTarget,
        fastItems,
        addFastItem,
        updateFastItem,
        updateFastItemStock,
        deleteFastItem,
        restockItem,
        stockMovements,
        wipBatches,
        startWipBatch,
        updateWipBatchStage,
        recordWipScrap,
        completeWipBatch,
        deleteWipBatch,
        returnTransactionItems,
        transactions,
        addTransaction,
        updateTransactionNote,

        pendingSales,
        holdSale,
        restorePendingSale,
        cancelPendingSale,
        deductStockForTransaction,

        operationSteps,
        addStep,
        updateStep,
        deleteStep,
        reorderStep,

        financeItems,
        addFinanceItem,
        updateFinanceItem,
        deleteFinanceItem,

        expenses,
        expenseCategories,
        addExpense,
        updateExpense,
        deleteExpense,
        settleExpense,
        addExpenseCategory,
        updateExpenseCategory,
        deleteExpenseCategory,

        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,

        marketingMix,
        buyerPersona,
        updateMarketingP,
        updateBuyerPersona,
        clearMarketingData,

        resetToDefault,
      }}
    >
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

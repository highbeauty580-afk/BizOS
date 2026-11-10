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

// Clean default states without any mock data or localStorage
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

  // Global Helpers
  resetToDefault: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [language, setLanguage] = useState<Language>('ar');
  const [theme, setTheme] = useState<ColorTheme>('indigo');
  const [customPalette, setCustomPalette] = useState<CustomPalette>(DEFAULT_CUSTOM_PALETTE);
  const [businessName, setBusinessName] = useState<string>('BizOS Enterprise');

  // Pure React State (No localStorage, No sessionStorage, No mock data)
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
  };

  const updateFastItem = (id: string, data: Partial<FastItem>) => {
    setFastItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
  };

  const updateFastItemStock = (id: string, newStock: number) => {
    updateFastItem(id, { stockQuantity: newStock });
  };

  const restockItem = (itemId: string, qtyToAdd: number, reason: string) => {
    if (qtyToAdd <= 0) return;
    setFastItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const newQty = item.stockQuantity + qtyToAdd;
          const cost = item.costPrice || item.price || 0;
          return { ...item, stockQuantity: newQty, amount: newQty * cost };
        }
        return item;
      })
    );
  };


  const deleteFastItem = (id: string) => {
    setFastItems((prev) => prev.filter((i) => i.id !== id));
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

    // Deduct Raw Materials from local stock
    setFastItems((prevItems) =>
      prevItems.map((item) => {
        const usage = batchData.rawMaterialsUsed.find((m) => m.rawMaterialId === item.id);
        if (usage) {
          const newQty = Math.max(0, item.stockQuantity - usage.quantityUsed);
          const cost = item.costPrice || item.price || 0;
          return { ...item, stockQuantity: newQty, amount: newQty * cost };
        }
        return item;
      })
    );
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

    // Add Finished Good to local stock
    if (finishedGoodId) {
      setFastItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id === finishedGoodId) {
            const newQty = item.stockQuantity + completedQty;
            const cost = item.costPrice || item.price || 0;
            return { ...item, stockQuantity: newQty, amount: newQty * cost };
          }
          return item;
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
    setFastItems((prevItems) =>
      prevItems.map((catalogItem) => {
        const matched = items.filter(
          (staged) => staged.originalFastItemId === catalogItem.id || staged.name === catalogItem.name
        );
        if (matched.length > 0) {
          const totalQtyDeducted = matched.reduce((sum, item) => sum + item.quantity, 0);
          const newQty = Math.max(0, catalogItem.stockQuantity - totalQtyDeducted);
          const cost = catalogItem.costPrice || catalogItem.price || 0;
          return { ...catalogItem, stockQuantity: newQty, amount: newQty * cost };
        }
        return catalogItem;
      })
    );
  };

  const returnTransactionItems = (items: StagedItem[], referenceNo: string, reason: string) => {
    setFastItems((prevItems) =>
      prevItems.map((catalogItem) => {
        const matched = items.filter(
          (staged) => staged.originalFastItemId === catalogItem.id || staged.name === catalogItem.name
        );
        if (matched.length > 0) {
          const totalQtyReturned = matched.reduce((sum, item) => sum + item.quantity, 0);
          const newQty = catalogItem.stockQuantity + totalQtyReturned;
          const cost = catalogItem.costPrice || catalogItem.price || 0;
          return { ...catalogItem, stockQuantity: newQty, amount: newQty * cost };
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
      prev.map((e) => (e.id === id ? { ...e, ...data } : e))
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const settleExpense = (id: string, paymentMethod: 'Cash' | 'E_Wallet' | 'Bank') => {
    const today = new Date().toISOString().split('T')[0];
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'Paid', settledDate: today, settledPaymentMethod: paymentMethod } : e))
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

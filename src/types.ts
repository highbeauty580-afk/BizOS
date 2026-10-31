/**
 * BizOS Types Definition
 */

export type PageId = 'home' | 'operations' | 'finance' | 'hr' | 'marketing';

export type Language = 'en' | 'ar';

export type ColorTheme = 'indigo' | 'emerald' | 'slate' | 'cobalt' | 'crimson' | 'teal';

export interface ThemeConfig {
  id: ColorTheme;
  nameEn: string;
  nameAr: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryText: string;
}

export interface CustomPalette {
  primaryAccent: string;  // اللون الرئيسي للأزرار والمؤشرات (Hex e.g. #3525CD)
  topBarBg: string;       // لون الجزء العلوي (Hex e.g. #FFFFFF)
  topBarText: string;     // لون نص الجزء العلوي (Hex e.g. #0F172A)
  sidebarBg: string;      // لون القائمة الجانبية (Hex e.g. #FFFFFF)
  sidebarText: string;    // لون نص القائمة الجانبية (Hex e.g. #334155)
  pageBg: string;         // لون خلفية الصفحة (Hex e.g. #FAF8FF)
  surfaceBg: string;      // لون الكروت والأسطح (Hex e.g. #FFFFFF)
  brandLogoUrl?: string;  // صورة البراند المرفوعة
}

// 1. Home / POS Sales Types
export type PaymentMethod = 'Cash' | 'Card' | 'Bank Transfer' | 'Invoice';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  taxNumber?: string;
}

export interface FastItem {
  id: string;
  name: string;
  nameAr?: string;
  category: 'Retail' | 'Service' | 'Wholesale' | 'Other';
  price: number;
  icon?: string;
  stockQuantity: number;
  minStock: number; // الحد الأدنى للمخزون
  maxStock: number; // الحد الأعلى للمخزون
  code?: string;
  unit?: string;     // الوحدة (قطعة، علبة، إلخ)
}

export type MovementType = 'sale' | 'restock' | 'return' | 'adjustment';

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: MovementType;
  quantityChange: number; // e.g. -2 or +15
  quantityBefore: number;
  quantityAfter: number;
  date: string;
  time: string;
  reason: string;
  referenceNo?: string;
}

export interface StagedItem {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  quantity: number;
  discountPct: number;
  note?: string;
  originalFastItemId?: string; // Links to registered item for inventory deduction
}

export interface Transaction {
  id: string;
  receiptNo: string;
  time: string;
  date: string;
  itemsSummary: string;
  items: StagedItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: 'Completed' | 'Refunded' | 'Pending';
  shiftNotes: string;
  cashier: string;
  amountPaid?: number;
  changeDue?: number;
  customerName?: string;
}

export interface PendingSale {
  id: string;
  heldAt: string;
  date: string;
  customerName?: string;
  notes?: string;
  items: StagedItem[];
  subtotal: number;
  tax: number;
  total: number;
}


// 2. Operations Types
export type StepStatus = 'pending' | 'in_progress' | 'completed';

export interface OperationStep {
  id: string;
  stepNumber: number;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  assignedTo: string;
  duration: string;
  category: string;
  status: StepStatus;
}

// 3. Finance Types
export type FinanceSection = 'income' | 'balance' | 'cashflow';

export interface FinanceItem {
  id: string;
  section: FinanceSection;
  subsection: string; // e.g. "Revenue", "COGS", "Operating Expenses", "Current Assets", etc.
  subsectionAr?: string;
  title: string;
  titleAr?: string;
  amount: number;
  isNegative?: boolean; // Subtracts from total if true
}

export type ExpensePaymentMethod = 'Cash' | 'Electronic' | 'Credit';
export type ExpensePaymentStatus = 'Paid' | 'Unpaid';

export interface ExpenseCategory {
  id: string;
  nameAr: string;
  nameEn?: string;
  isDefault?: boolean;
}

export interface Expense {
  id: string;
  receiptNo: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  paymentMethod: ExpensePaymentMethod; // Cash | Electronic | Credit
  status: ExpensePaymentStatus; // Paid | Unpaid
  settledDate?: string;
  settledPaymentMethod?: 'Cash' | 'Electronic';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// 4. Human Resources Types
export interface Employee {
  id: string;
  name: string;
  nameAr?: string;
  title: string;
  titleAr?: string;
  department: string;
  departmentAr?: string;
  directManagerId: string | null; // null for CEO / Root
  email: string;
  phone: string;
  avatarUrl?: string;
}

// 5. Marketing Types
export interface MarketingMixP {
  id: 'product' | 'price' | 'place' | 'promotion';
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  bulletPoints: string[];
}

export interface BuyerPersona {
  name: string;
  title: string;
  titleAr?: string;
  age: string;
  gender: string;
  occupation: string;
  incomeLevel: string;
  demographics: string[];
  profileDescription: string;
  profileDescriptionAr?: string;
  needsAndGoals: string[];
  motivationsAndPains: string[];
  buyingChannels: string[];
}

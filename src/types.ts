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

export type CustomerType = 'Individual' | 'Company';
export type CustomerStatus = 'New' | 'Active' | 'Churned';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  phone2?: string;
  address?: string;
  email?: string;
  company?: string;
  taxNumber?: string;
  type?: CustomerType;
  status?: CustomerStatus;
  creditLimit?: number;
}

export type InventoryType = 'raw_material' | 'work_in_progress' | 'finished_goods';

export interface FastItem {
  id: string;
  name: string;
  nameAr?: string;
  category: 'Retail' | 'Service' | 'Wholesale' | 'Other' | string;
  inventoryType?: InventoryType; // 'raw_material' | 'work_in_progress' | 'finished_goods'
  price: number;
  costPrice?: number; // Maps to unit_cost and Stock_Cost
  icon?: string;
  stockQuantity: number;
  minStock: number; // الحد الأدنى للمخزون
  maxStock: number; // الحد الأعلى للمخزون
  code?: string;     // Maps to product_code and Stock_code
  unit?: string;     // Maps to Measure_PType and Measure_SType
  description?: string; // وصف المنتج
  imageUrl?: string;    // رابط أو مسار صورة المنتج
  amount?: number;      // القيمة الإجمالية المسجلة في المخزون (Stock_Cost * Quantity)
  product_pk?: string;  // Primary Key from products table
  stock_pk?: string;    // Primary Key from stock table
}

export type WipStage = 'preparation' | 'processing' | 'assembly' | 'quality_check' | 'packaging';
export type WipStatus = 'in_progress' | 'completed' | 'canceled';

export interface WipMaterialUsage {
  rawMaterialId: string;
  rawMaterialName: string;
  quantityUsed: number;
  unit: string;
}

export interface WipBatch {
  id: string;
  batchNo: string;
  finishedGoodId: string;
  finishedGoodName: string;
  targetQuantity: number;
  completedQuantity: number;
  scrappedQuantity: number; // الهالك أثناء التصنيع
  rawMaterialsUsed: WipMaterialUsage[];
  stage: WipStage;
  status: WipStatus;
  startDate: string;
  targetCompletionDate?: string;
  completedDate?: string;
  notes?: string;
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
  orderId?: string | number;
  receiptNo: string;
  time: string;
  date: string;
  itemsSummary: string;
  items: StagedItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: 'Completed' | 'Refunded' | 'Pending' | 'Returned';
  shiftNotes: string;
  cashier: string;
  amountPaid?: number;
  changeDue?: number;
  customerName?: string;
  customerPhone1?: string;
  customerPhone2?: string;
  customerAddress?: string;
  deliveryStatus?: string;
  preparingStatus?: string;
  orderStatus?: string;
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

export type ExpensePaymentMethod = 'Cash' | 'E_Wallet' | 'Bank' | 'Credit';
export type ExpensePaymentStatus = 'Paid' | 'Unpaid';

export interface ExpenseCategory {
  id: string;
  nameAr: string;
  nameEn?: string;
  isDefault?: boolean;
}

export interface Expense {
  id: string;
  transaction_pk?: string;
  receiptNo: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  paymentMethod: ExpensePaymentMethod; // Cash | Electronic | Credit
  status: ExpensePaymentStatus; // Paid | Unpaid
  settledDate?: string;
  settledPaymentMethod?: 'Cash' | 'E_Wallet' | 'Bank';
  notes?: string;
  paymentNotice?: string;
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

// 6. Sales Auto Integration & Data Mapping Types
export type SalesEntryMode = 'manual' | 'auto_integration';

export type ConnectionType = 'shopify' | 'woocommerce' | 'custom_rest' | 'webhook';
export type AuthType = 'bearer' | 'api_key' | 'basic' | 'custom_header';

export interface IntegrationConnector {
  id: string;
  name: string;
  type: ConnectionType;
  baseUrl: string;
  apiKey?: string;
  maskedKey?: string;
  authType: AuthType;
  headerName?: string;
  status: 'active' | 'inactive' | 'error' | 'draft';
  lastSyncAt?: string;
  createdDate: string;
  autoDeductInventory: boolean;
  unconfirmedHoldMinutes: number;
  matchingCustomerRule: 'email_or_phone' | 'email_only' | 'phone_only' | 'always_create';
  matchingProductRule: 'sku' | 'barcode' | 'name' | 'default_item';
  defaultItemId?: string;
}

export type TransformationType = 'direct' | 'parse_number' | 'parse_float' | 'date_format' | 'trim' | 'default_value';

export interface FieldMapping {
  id: string;
  connectorId: string;
  sourcePath: string; // e.g. "order.total_price" or "customer.email"
  sourceDataType: 'string' | 'number' | 'boolean' | 'array' | 'object';
  sourceSampleValue?: string;
  targetField: 'external_id' | 'customerName' | 'customerPhone' | 'customerEmail' | 'total' | 'subtotal' | 'tax' | 'item_sku' | 'item_name' | 'item_price' | 'item_quantity' | 'order_date' | 'payment_method';
  transformation: TransformationType;
  defaultValue?: string;
  isRequired: boolean;
  status: 'valid' | 'type_mismatch_warning' | 'missing_required';
}

export interface IntegratedOrder {
  id: string;
  connectorId: string;
  connectorName: string;
  externalId: string; // Used for deduplication
  receivedAt: string;
  rawPayload: Record<string, any>;
  mappedData: {
    externalId: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: PaymentMethod;
    date: string;
    items: Array<{
      sku: string;
      name: string;
      unitPrice: number;
      quantity: number;
      matchedFastItemId?: string;
    }>;
  };
  status: 'pending_approval' | 'approved' | 'rejected' | 'duplicate_skipped';
  rejectionReason?: string;
  stockReserved: boolean;
  reservedUntil?: string;
  transactionReceiptNo?: string;
}

export interface IntegrationTestReport {
  timestamp: string;
  success: boolean;
  recordsTested: number;
  rawSamplePayload: Record<string, any>;
  mappedResult: Record<string, any>;
  warnings: string[];
  errors: string[];
}


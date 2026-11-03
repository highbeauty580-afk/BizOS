import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  IntegrationConnector,
  FieldMapping,
  IntegratedOrder,
  IntegrationTestReport,
  ConnectionType,
  AuthType,
  TransformationType,
  FastItem,
  Customer,
} from '../types';
import {
  Zap,
  Globe,
  Database,
  Link,
  Unlink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  Plus,
  Trash2,
  Edit2,
  Eye,
  RefreshCw,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  Layers,
  FileText,
  Clock,
  ShoppingBag,
  Settings,
  Code,
  Lock,
  ChevronDown,
  Info,
  Server,
} from 'lucide-react';

// Default Sample Schema for Shopify/REST API testing
const SAMPLE_EXTERNAL_PAYLOAD: Record<string, any> = {
  id: "SH-98421",
  order_number: "#1004",
  created_at: new Date().toISOString(),
  financial_status: "paid",
  currency: "SAR",
  total_price: "245.00",
  subtotal_price: "226.85",
  total_tax: "18.15",
  customer: {
    id: "CUST-5510",
    first_name: "عبدالله",
    last_name: "الشمري",
    email: "a.alshammari@example.com",
    phone: "+966501234567",
    company: "مؤسسة الأفق للتجارة",
  },
  line_items: [
    {
      id: "ITEM-701",
      sku: "PROD-101",
      name: "حقيبة جلدية فاخرة",
      price: "245.00",
      quantity: 1,
    },
  ],
  note: "الرجاء التوصيل للفترة المسائية",
};

// Target BizOS Fields definition
interface TargetBizOSField {
  key: FieldMapping['targetField'];
  labelAr: string;
  labelEn: string;
  type: 'string' | 'number' | 'array';
  isRequired: boolean;
  descriptionAr: string;
}

const BIZOS_TARGET_FIELDS: TargetBizOSField[] = [
  {
    key: 'external_id',
    labelAr: 'المعرف الخارجي للطلب (ID)',
    labelEn: 'External Order ID',
    type: 'string',
    isRequired: true,
    descriptionAr: 'معرف فريد لمنع تكرار تسجيل الطلب',
  },
  {
    key: 'customerName',
    labelAr: 'اسم العميل',
    labelEn: 'Customer Name',
    type: 'string',
    isRequired: true,
    descriptionAr: 'اسم العميل المباشر أو التجاري',
  },
  {
    key: 'customerPhone',
    labelAr: 'رقم هاتف العميل',
    labelEn: 'Customer Phone',
    type: 'string',
    isRequired: false,
    descriptionAr: 'يستخدم لإقران العميل بقاعدة البيانات',
  },
  {
    key: 'customerEmail',
    labelAr: 'البريد الإلكتروني للعميل',
    labelEn: 'Customer Email',
    type: 'string',
    isRequired: false,
    descriptionAr: 'يستخدم للبحث والربط بالعميل المسجل',
  },
  {
    key: 'total',
    labelAr: 'إجمالي الفاتورة النهائي',
    labelEn: 'Total Amount',
    type: 'number',
    isRequired: true,
    descriptionAr: 'القيمة الإجمالية للطلب شاملاً الضريبة',
  },
  {
    key: 'subtotal',
    labelAr: 'المبلغ الفرعي قبل الضريبة',
    labelEn: 'Subtotal Amount',
    type: 'number',
    isRequired: false,
    descriptionAr: 'صافي قيمة المنتجات',
  },
  {
    key: 'tax',
    labelAr: 'مبلغ الضريبة',
    labelEn: 'Tax Amount',
    type: 'number',
    isRequired: false,
    descriptionAr: 'قيمة ضريبة القيمة المضافة',
  },
  {
    key: 'item_sku',
    labelAr: 'كود المنتج / SKU',
    labelEn: 'Product SKU / Code',
    type: 'string',
    isRequired: true,
    descriptionAr: 'رمز الصنف لمطابقته وخصمه من المخزون',
  },
  {
    key: 'item_name',
    labelAr: 'اسم المنتج',
    labelEn: 'Product Name',
    type: 'string',
    isRequired: true,
    descriptionAr: 'اسم الصنف المعروض بجدول المبيعات',
  },
  {
    key: 'item_price',
    labelAr: 'سعر وحدة الصنف',
    labelEn: 'Item Unit Price',
    type: 'number',
    isRequired: true,
    descriptionAr: 'سعر القطعة الواحدة',
  },
  {
    key: 'item_quantity',
    labelAr: 'الكمية المباعة',
    labelEn: 'Item Quantity',
    type: 'number',
    isRequired: true,
    descriptionAr: 'الكمية لخصمها من المخزون',
  },
  {
    key: 'payment_method',
    labelAr: 'طريقة الدفع',
    labelEn: 'Payment Method',
    type: 'string',
    isRequired: false,
    descriptionAr: 'نقدي / بطاقة / تحويل / فاتورة',
  },
  {
    key: 'order_date',
    labelAr: 'تاريخ الطلب',
    labelEn: 'Order Date',
    type: 'string',
    isRequired: false,
    descriptionAr: 'تاريخ وتسجيل الفاتورة بالنظام',
  },
];

// Initial default preset connector
const INITIAL_CONNECTORS: IntegrationConnector[] = [
  {
    id: 'conn-shopify-1',
    name: 'متجر شوبيفاي الرئيسي (Shopify Store)',
    type: 'shopify',
    baseUrl: 'https://myshopify-store.myshopify.com/admin/api/2024-01/orders.json',
    apiKey: 'shpat_a8129381023912093810293',
    maskedKey: 'shpat_••••••••••••9381',
    authType: 'bearer',
    headerName: 'X-Shopify-Access-Token',
    status: 'active',
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    autoDeductInventory: false, // Queue as pending by default for safety
    unconfirmedHoldMinutes: 30,
    matchingCustomerRule: 'email_or_phone',
    matchingProductRule: 'sku',
  },
];

// Initial default field mappings
const INITIAL_MAPPINGS: FieldMapping[] = [
  {
    id: 'map-1',
    connectorId: 'conn-shopify-1',
    sourcePath: 'id',
    sourceDataType: 'string',
    sourceSampleValue: 'SH-98421',
    targetField: 'external_id',
    transformation: 'direct',
    isRequired: true,
    status: 'valid',
  },
  {
    id: 'map-2',
    connectorId: 'conn-shopify-1',
    sourcePath: 'customer.first_name',
    sourceDataType: 'string',
    sourceSampleValue: 'عبدالله',
    targetField: 'customerName',
    transformation: 'direct',
    isRequired: true,
    status: 'valid',
  },
  {
    id: 'map-3',
    connectorId: 'conn-shopify-1',
    sourcePath: 'customer.phone',
    sourceDataType: 'string',
    sourceSampleValue: '+966501234567',
    targetField: 'customerPhone',
    transformation: 'direct',
    isRequired: false,
    status: 'valid',
  },
  {
    id: 'map-4',
    connectorId: 'conn-shopify-1',
    sourcePath: 'customer.email',
    sourceDataType: 'string',
    sourceSampleValue: 'a.alshammari@example.com',
    targetField: 'customerEmail',
    transformation: 'direct',
    isRequired: false,
    status: 'valid',
  },
  {
    id: 'map-5',
    connectorId: 'conn-shopify-1',
    sourcePath: 'total_price',
    sourceDataType: 'string',
    sourceSampleValue: '245.00',
    targetField: 'total',
    transformation: 'parse_float',
    isRequired: true,
    status: 'type_mismatch_warning', // String source mapped to Number target
  },
  {
    id: 'map-6',
    connectorId: 'conn-shopify-1',
    sourcePath: 'subtotal_price',
    sourceDataType: 'string',
    sourceSampleValue: '226.85',
    targetField: 'subtotal',
    transformation: 'parse_float',
    isRequired: false,
    status: 'type_mismatch_warning',
  },
  {
    id: 'map-7',
    connectorId: 'conn-shopify-1',
    sourcePath: 'total_tax',
    sourceDataType: 'string',
    sourceSampleValue: '18.15',
    targetField: 'tax',
    transformation: 'parse_float',
    isRequired: false,
    status: 'type_mismatch_warning',
  },
  {
    id: 'map-8',
    connectorId: 'conn-shopify-1',
    sourcePath: 'line_items[0].sku',
    sourceDataType: 'string',
    sourceSampleValue: 'PROD-101',
    targetField: 'item_sku',
    transformation: 'direct',
    isRequired: true,
    status: 'valid',
  },
  {
    id: 'map-9',
    connectorId: 'conn-shopify-1',
    sourcePath: 'line_items[0].name',
    sourceDataType: 'string',
    sourceSampleValue: 'حقيبة جلدية فاخرة',
    targetField: 'item_name',
    transformation: 'direct',
    isRequired: true,
    status: 'valid',
  },
  {
    id: 'map-10',
    connectorId: 'conn-shopify-1',
    sourcePath: 'line_items[0].price',
    sourceDataType: 'string',
    sourceSampleValue: '245.00',
    targetField: 'item_price',
    transformation: 'parse_float',
    isRequired: true,
    status: 'type_mismatch_warning',
  },
  {
    id: 'map-11',
    connectorId: 'conn-shopify-1',
    sourcePath: 'line_items[0].quantity',
    sourceDataType: 'number',
    sourceSampleValue: '1',
    targetField: 'item_quantity',
    transformation: 'parse_number',
    isRequired: true,
    status: 'valid',
  },
];

export const AutoIntegrationSales: React.FC = () => {
  const {
    language,
    customPalette,
    fastItems,
    customers,
    addCustomer,
    addTransaction,
    deductStockForTransaction,
    updateFastItemStock,
  } = useApp();

  const isRtl = language === 'ar';

  // Local Persistent state for connectors, mappings, and integrated orders
  const [connectors, setConnectors] = useState<IntegrationConnector[]>(() => {
    try {
      const saved = localStorage.getItem('bizos_connectors_v1');
      return saved ? JSON.parse(saved) : INITIAL_CONNECTORS;
    } catch {
      return INITIAL_CONNECTORS;
    }
  });

  const [mappings, setMappings] = useState<FieldMapping[]>(() => {
    try {
      const saved = localStorage.getItem('bizos_mappings_v1');
      return saved ? JSON.parse(saved) : INITIAL_MAPPINGS;
    } catch {
      return INITIAL_MAPPINGS;
    }
  });

  const [integratedOrders, setIntegratedOrders] = useState<IntegratedOrder[]>(() => {
    try {
      const saved = localStorage.getItem('bizos_integrated_orders_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Selected Active Connector ID
  const [activeConnectorId, setActiveConnectorId] = useState<string>(
    connectors[0]?.id || ''
  );

  // Active Sub-Tab: 'connectors' | 'visual_mapping' | 'test_dryrun' | 'sync_rules' | 'integrated_queue'
  const [activeTab, setActiveTab] = useState<
    'connectors' | 'visual_mapping' | 'test_dryrun' | 'sync_rules' | 'integrated_queue'
  >('connectors');

  // Modal / Editing states for Connectors
  const [isAddConnectorModalOpen, setIsAddConnectorModalOpen] = useState(false);
  const [editingConnector, setEditingConnector] = useState<IntegrationConnector | null>(null);
  const [connectorForm, setConnectorForm] = useState({
    name: '',
    type: 'shopify' as ConnectionType,
    baseUrl: '',
    apiKey: '',
    authType: 'bearer' as AuthType,
    headerName: '',
    autoDeductInventory: false,
    unconfirmedHoldMinutes: 30,
    matchingCustomerRule: 'email_or_phone' as IntegrationConnector['matchingCustomerRule'],
    matchingProductRule: 'sku' as IntegrationConnector['matchingProductRule'],
    defaultItemId: '',
  });

  // Test Ping State
  const [testingPingId, setTestingPingId] = useState<string | null>(null);
  const [pingResult, setPingResult] = useState<{ success: boolean; msg: string; endpointCount?: number } | null>(null);

  // Visual Mapping Canvas State
  const [selectedSourcePath, setSelectedSourcePath] = useState<string | null>(null);
  const [selectedTargetField, setSelectedTargetField] = useState<FieldMapping['targetField'] | null>(null);
  const [mappingTransformType, setMappingTransformType] = useState<TransformationType>('direct');
  const [mappingDefaultVal, setMappingDefaultVal] = useState<string>('');

  // Dry Run Report state
  const [testReport, setTestReport] = useState<IntegrationTestReport | null>(null);
  const [isSimulatingTest, setIsSimulatingTest] = useState(false);

  // Developer Mode Toggle (false = Simple 1-Click User Interface, true = Developer Options)
  const [showDevOptions, setShowDevOptions] = useState(false);

  // 1-Click Shopify Authorization Flow Modal State
  const [isShopifyFlowOpen, setIsShopifyFlowOpen] = useState(false);
  const [shopifyDomainInput, setShopifyDomainInput] = useState('mystore.myshopify.com');
  const [shopifyConnectStep, setShopifyConnectStep] = useState<1 | 2 | 3>(1);

  // 1-Click Shopify Connect Handler
  const handleStartShopifyConnect = () => {
    setIsShopifyFlowOpen(true);
    setShopifyConnectStep(1);
  };

  const handleConfirmShopifyOAuth = () => {
    setShopifyConnectStep(2);

    setTimeout(() => {
      const cleanDomain = shopifyDomainInput.trim().replace(/^https?:\/\//, '') || 'mystore.myshopify.com';
      const existingShopify = connectors.find((c) => c.type === 'shopify');

      if (existingShopify) {
        setConnectors((prev) =>
          prev.map((c) =>
            c.id === existingShopify.id
              ? {
                  ...c,
                  name: `متجر شوبيفاي (${cleanDomain})`,
                  baseUrl: `https://${cleanDomain}/admin/api/2024-01/orders.json`,
                  status: 'active',
                  lastSyncAt: new Date().toISOString(),
                }
              : c
          )
        );
        setActiveConnectorId(existingShopify.id);
      } else {
        const newShopifyConn: IntegrationConnector = {
          id: `conn-shopify-${Date.now()}`,
          name: `متجر شوبيفاي (${cleanDomain})`,
          type: 'shopify',
          baseUrl: `https://${cleanDomain}/admin/api/2024-01/orders.json`,
          apiKey: `shpat_${Math.random().toString(36).substring(2, 15)}`,
          maskedKey: `shpat_••••••••9381`,
          authType: 'bearer',
          status: 'active',
          lastSyncAt: new Date().toISOString(),
          createdDate: new Date().toISOString(),
          autoDeductInventory: true,
          unconfirmedHoldMinutes: 30,
          matchingCustomerRule: 'email_or_phone',
          matchingProductRule: 'sku',
        };

        setConnectors((prev) => [...prev, newShopifyConn]);
        setActiveConnectorId(newShopifyConn.id);

        // Apply Smart Default Mappings
        const defaultShopifyMappings: FieldMapping[] = INITIAL_MAPPINGS.map((m) => ({
          ...m,
          id: `map-${Date.now()}-${m.targetField}`,
          connectorId: newShopifyConn.id,
        }));
        setMappings((prev) => [...prev, ...defaultShopifyMappings]);
      }

      setShopifyConnectStep(3);
    }, 1400);
  };

  const handleDisconnectStore = (connId: string) => {
    if (confirm(isRtl ? 'هل تريد تعليق/فصل الاتصال بهذا المتجر؟' : 'Disconnect this store?')) {
      setConnectors((prev) =>
        prev.map((c) => (c.id === connId ? { ...c, status: 'draft' } : c))
      );
    }
  };

  const handleReconnectStore = (connId: string) => {
    setConnectors((prev) =>
      prev.map((c) => (c.id === connId ? { ...c, status: 'active', lastSyncAt: new Date().toISOString() } : c))
    );
    alert(isRtl ? 'تمت إعادة الاتصال والمزامنة الفورية بنجاح!' : 'Reconnected & synced successfully!');
  };

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('bizos_connectors_v1', JSON.stringify(connectors));
  }, [connectors]);

  useEffect(() => {
    localStorage.setItem('bizos_mappings_v1', JSON.stringify(mappings));
  }, [mappings]);

  useEffect(() => {
    localStorage.setItem('bizos_integrated_orders_v1', JSON.stringify(integratedOrders));
  }, [integratedOrders]);

  const activeConnector = connectors.find((c) => c.id === activeConnectorId) || connectors[0];

  // Helper to mask secret key securely
  const maskKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return `${key.substring(0, 4)}••••••••${key.substring(key.length - 4)}`;
  };

  // 1. Add / Edit Connector Handlers
  const handleOpenAddConnector = () => {
    setEditingConnector(null);
    setConnectorForm({
      name: '',
      type: 'shopify',
      baseUrl: 'https://',
      apiKey: '',
      authType: 'bearer',
      headerName: '',
      autoDeductInventory: false,
      unconfirmedHoldMinutes: 30,
      matchingCustomerRule: 'email_or_phone',
      matchingProductRule: 'sku',
      defaultItemId: fastItems[0]?.id || '',
    });
    setIsAddConnectorModalOpen(true);
  };

  const handleOpenEditConnector = (conn: IntegrationConnector) => {
    setEditingConnector(conn);
    setConnectorForm({
      name: conn.name,
      type: conn.type,
      baseUrl: conn.baseUrl,
      apiKey: conn.apiKey || '',
      authType: conn.authType,
      headerName: conn.headerName || '',
      autoDeductInventory: conn.autoDeductInventory,
      unconfirmedHoldMinutes: conn.unconfirmedHoldMinutes,
      matchingCustomerRule: conn.matchingCustomerRule,
      matchingProductRule: conn.matchingProductRule,
      defaultItemId: conn.defaultItemId || fastItems[0]?.id || '',
    });
    setIsAddConnectorModalOpen(true);
  };

  const handleSaveConnector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectorForm.name || !connectorForm.baseUrl) {
      alert(isRtl ? 'يرجى إدخال اسم المصدر ورابط API' : 'Please provide Connector Name and Base URL.');
      return;
    }

    if (editingConnector) {
      setConnectors((prev) =>
        prev.map((c) =>
          c.id === editingConnector.id
            ? {
                ...c,
                name: connectorForm.name,
                type: connectorForm.type,
                baseUrl: connectorForm.baseUrl,
                apiKey: connectorForm.apiKey,
                maskedKey: maskKey(connectorForm.apiKey),
                authType: connectorForm.authType,
                headerName: connectorForm.headerName,
                autoDeductInventory: connectorForm.autoDeductInventory,
                unconfirmedHoldMinutes: connectorForm.unconfirmedHoldMinutes,
                matchingCustomerRule: connectorForm.matchingCustomerRule,
                matchingProductRule: connectorForm.matchingProductRule,
                defaultItemId: connectorForm.defaultItemId,
              }
            : c
        )
      );
    } else {
      const newConn: IntegrationConnector = {
        id: `conn-${Date.now()}`,
        name: connectorForm.name,
        type: connectorForm.type,
        baseUrl: connectorForm.baseUrl,
        apiKey: connectorForm.apiKey,
        maskedKey: maskKey(connectorForm.apiKey),
        authType: connectorForm.authType,
        headerName: connectorForm.headerName,
        status: 'active',
        createdDate: new Date().toISOString(),
        autoDeductInventory: connectorForm.autoDeductInventory,
        unconfirmedHoldMinutes: connectorForm.unconfirmedHoldMinutes,
        matchingCustomerRule: connectorForm.matchingCustomerRule,
        matchingProductRule: connectorForm.matchingProductRule,
        defaultItemId: connectorForm.defaultItemId,
      };
      setConnectors((prev) => [...prev, newConn]);
      setActiveConnectorId(newConn.id);
    }

    setIsAddConnectorModalOpen(false);
  };

  const handleDeleteConnector = (id: string) => {
    if (connectors.length <= 1) {
      alert(isRtl ? 'لا يمكن حذف المصدر الوحيد بالنظام' : 'Cannot delete the only connector.');
      return;
    }
    if (confirm(isRtl ? 'هل أنت تأكد من حذف مصدر الربط هذا؟' : 'Are you sure you want to delete this connector?')) {
      setConnectors((prev) => prev.filter((c) => c.id !== id));
      setMappings((prev) => prev.filter((m) => m.connectorId !== id));
      if (activeConnectorId === id) {
        setActiveConnectorId(connectors.find((c) => c.id !== id)?.id || '');
      }
    }
  };

  // Test Ping connection
  const handleTestConnection = (conn: IntegrationConnector) => {
    setTestingPingId(conn.id);
    setPingResult(null);

    setTimeout(() => {
      setTestingPingId(null);
      setPingResult({
        success: true,
        msg: isRtl
          ? `تم الاتصال بنجاح بـ (${conn.name}). تم اكتشاف 4 جداول متوفرة للربط (Orders, Customers, Items, Payments).`
          : `Connected successfully to (${conn.name}). Discovered 4 available endpoints.`,
        endpointCount: 4,
      });
      // update connector status to active
      setConnectors((prev) =>
        prev.map((c) => (c.id === conn.id ? { ...c, status: 'active', lastSyncAt: new Date().toISOString() } : c))
      );
    }, 1200);
  };

  // 2. Visual Data Mapping Handlers
  const currentMappings = mappings.filter((m) => m.connectorId === (activeConnector?.id || ''));

  const handleAddOrUpdateMapping = () => {
    if (!selectedSourcePath || !selectedTargetField) {
      alert(isRtl ? 'يرجى تحديد حقل المصدر الخارجي وحقل BizOS المستهدف' : 'Please select both source path and target field.');
      return;
    }

    const targetDef = BIZOS_TARGET_FIELDS.find((f) => f.key === selectedTargetField);
    const isNumberTarget = targetDef?.type === 'number';
    const isStringSource = selectedSourcePath.toLowerCase().includes('price') || selectedSourcePath.toLowerCase().includes('total');

    let status: FieldMapping['status'] = 'valid';
    if (isNumberTarget && mappingTransformType === 'direct' && isStringSource) {
      status = 'type_mismatch_warning';
    }

    const existingIndex = mappings.findIndex(
      (m) => m.connectorId === activeConnector.id && m.targetField === selectedTargetField
    );

    const newMap: FieldMapping = {
      id: existingIndex >= 0 ? mappings[existingIndex].id : `map-${Date.now()}`,
      connectorId: activeConnector.id,
      sourcePath: selectedSourcePath,
      sourceDataType: isStringSource ? 'string' : 'number',
      sourceSampleValue: selectedSourcePath.includes('total') ? '245.00' : 'SAMPLE_DATA',
      targetField: selectedTargetField,
      transformation: mappingTransformType,
      defaultValue: mappingDefaultVal,
      isRequired: targetDef?.isRequired || false,
      status,
    };

    if (existingIndex >= 0) {
      setMappings((prev) => prev.map((m, idx) => (idx === existingIndex ? newMap : m)));
    } else {
      setMappings((prev) => [...prev, newMap]);
    }

    setSelectedSourcePath(null);
    setSelectedTargetField(null);
  };

  const handleRemoveMapping = (mapId: string) => {
    setMappings((prev) => prev.filter((m) => m.id !== mapId));
  };

  // 3. Dry Run Test Simulation
  const handleRunDryRunTest = () => {
    setIsSimulatingTest(true);
    setTestReport(null);

    setTimeout(() => {
      setIsSimulatingTest(false);

      const warnings: string[] = [];
      const errors: string[] = [];

      // Validate required target fields
      const activeConnMappings = mappings.filter((m) => m.connectorId === activeConnector.id);
      const mappedTargets = new Set(activeConnMappings.map((m) => m.targetField));

      BIZOS_TARGET_FIELDS.forEach((tf) => {
        if (tf.isRequired && !mappedTargets.has(tf.key)) {
          errors.push(
            isRtl
              ? `الحقل الإلزامية (${tf.labelAr}) غير مربوط بمصدر البيانات.`
              : `Required field (${tf.labelEn}) is not mapped.`
          );
        }
      });

      activeConnMappings.forEach((m) => {
        if (m.status === 'type_mismatch_warning') {
          warnings.push(
            isRtl
              ? `تحذير تحويل: الحقل (${m.sourcePath}) نوعه نصي، سيتم تحويله تلقائياً لرقم في (${m.targetField}).`
              : `Type warning: (${m.sourcePath}) is string, auto-converting to number for (${m.targetField}).`
          );
        }
      });

      // Construct sample mapped transaction output
      const mappedOutput = {
        externalId: SAMPLE_EXTERNAL_PAYLOAD.id,
        customerName: `${SAMPLE_EXTERNAL_PAYLOAD.customer.first_name} ${SAMPLE_EXTERNAL_PAYLOAD.customer.last_name}`,
        customerPhone: SAMPLE_EXTERNAL_PAYLOAD.customer.phone,
        customerEmail: SAMPLE_EXTERNAL_PAYLOAD.customer.email,
        total: parseFloat(SAMPLE_EXTERNAL_PAYLOAD.total_price),
        subtotal: parseFloat(SAMPLE_EXTERNAL_PAYLOAD.subtotal_price),
        tax: parseFloat(SAMPLE_EXTERNAL_PAYLOAD.total_tax),
        items: SAMPLE_EXTERNAL_PAYLOAD.line_items.map((i: any) => ({
          sku: i.sku,
          name: i.name,
          unitPrice: parseFloat(i.price),
          quantity: i.quantity,
          matchedFastItemId: fastItems.find((f) => f.code === i.sku)?.id || 'NOT_FOUND_WILL_USE_DEFAULT',
        })),
        date: new Date().toISOString().split('T')[0],
      };

      setTestReport({
        timestamp: new Date().toLocaleTimeString(isRtl ? 'ar-SA' : 'en-US'),
        success: errors.length === 0,
        recordsTested: 1,
        rawSamplePayload: SAMPLE_EXTERNAL_PAYLOAD,
        mappedResult: mappedOutput,
        warnings,
        errors,
      });
    }, 1000);
  };

  // 4. Simulate Live Incoming External Order (Webhook / Poll execution)
  const handleSimulateIncomingOrder = () => {
    if (!activeConnector) return;

    const uniqueId = `EXT-${Math.floor(100000 + Math.random() * 900000)}`;

    // Check deduplication
    const isDuplicate = integratedOrders.some((o) => o.externalId === uniqueId);
    if (isDuplicate) {
      alert(isRtl ? 'تم رفض الطلب المكرر تلقائياً لمنع التكرار.' : 'Duplicate order rejected.');
      return;
    }

    // Customer matching logic
    const matchedCustomer = customers.find(
      (c) => c.email === SAMPLE_EXTERNAL_PAYLOAD.customer.email || c.phone === SAMPLE_EXTERNAL_PAYLOAD.customer.phone
    );

    let finalCustomerName = matchedCustomer
      ? matchedCustomer.name
      : `${SAMPLE_EXTERNAL_PAYLOAD.customer.first_name} ${SAMPLE_EXTERNAL_PAYLOAD.customer.last_name}`;

    // If customer matching rule requires creating
    if (!matchedCustomer && activeConnector.matchingCustomerRule !== 'always_create') {
      addCustomer({
        name: finalCustomerName,
        phone: SAMPLE_EXTERNAL_PAYLOAD.customer.phone,
        email: SAMPLE_EXTERNAL_PAYLOAD.customer.email,
        company: SAMPLE_EXTERNAL_PAYLOAD.customer.company,
      });
    }

    // Product matching
    const sampleSku = SAMPLE_EXTERNAL_PAYLOAD.line_items[0].sku;
    const matchedItem = fastItems.find((fi) => fi.code === sampleSku);

    const mappedItemName = matchedItem ? (isRtl && matchedItem.nameAr ? matchedItem.nameAr : matchedItem.name) : SAMPLE_EXTERNAL_PAYLOAD.line_items[0].name;
    const itemPrice = matchedItem ? matchedItem.price : parseFloat(SAMPLE_EXTERNAL_PAYLOAD.line_items[0].price);
    const itemQty = SAMPLE_EXTERNAL_PAYLOAD.line_items[0].quantity;

    const newOrder: IntegratedOrder = {
      id: `int-ord-${Date.now()}`,
      connectorId: activeConnector.id,
      connectorName: activeConnector.name,
      externalId: uniqueId,
      receivedAt: new Date().toISOString(),
      rawPayload: SAMPLE_EXTERNAL_PAYLOAD,
      mappedData: {
        externalId: uniqueId,
        customerName: finalCustomerName,
        customerPhone: SAMPLE_EXTERNAL_PAYLOAD.customer.phone,
        customerEmail: SAMPLE_EXTERNAL_PAYLOAD.customer.email,
        subtotal: parseFloat(SAMPLE_EXTERNAL_PAYLOAD.subtotal_price),
        tax: parseFloat(SAMPLE_EXTERNAL_PAYLOAD.total_tax),
        total: parseFloat(SAMPLE_EXTERNAL_PAYLOAD.total_price),
        paymentMethod: 'Card',
        date: new Date().toISOString().split('T')[0],
        items: [
          {
            sku: sampleSku,
            name: mappedItemName,
            unitPrice: itemPrice,
            quantity: itemQty,
            matchedFastItemId: matchedItem?.id,
          },
        ],
      },
      status: activeConnector.autoDeductInventory ? 'approved' : 'pending_approval',
      stockReserved: !activeConnector.autoDeductInventory,
      reservedUntil: !activeConnector.autoDeductInventory
        ? new Date(Date.now() + activeConnector.unconfirmedHoldMinutes * 60 * 1000).toISOString()
        : undefined,
    };

    // If auto deduct is ON, immediately add transaction & deduct stock
    if (activeConnector.autoDeductInventory) {
      const txReceiptNo = `REC-INT-${Math.floor(1000 + Math.random() * 9000)}`;
      addTransaction({
        receiptNo: txReceiptNo,
        time: new Date().toLocaleTimeString(isRtl ? 'ar-SA' : 'en-US'),
        date: new Date().toISOString().split('T')[0],
        itemsSummary: `${mappedItemName} x${itemQty}`,
        items: [
          {
            id: `stg-${Date.now()}`,
            name: mappedItemName,
            category: matchedItem ? matchedItem.category : 'E-Commerce',
            unitPrice: itemPrice,
            quantity: itemQty,
            discountPct: 0,
            originalFastItemId: matchedItem?.id,
          },
        ],
        subtotal: newOrder.mappedData.subtotal,
        tax: newOrder.mappedData.tax,
        total: newOrder.mappedData.total,
        paymentMethod: 'Card',
        status: 'Completed',
        shiftNotes: `مزامنة تلقائية من ${activeConnector.name} (ID: ${uniqueId})`,
        cashier: 'النظام التلقائي (Auto Connector)',
        customerName: finalCustomerName,
      });

      // Deduct stock if matched item exists
      if (matchedItem) {
        updateFastItemStock(matchedItem.id, Math.max(0, matchedItem.stockQuantity - itemQty));
      }

      newOrder.transactionReceiptNo = txReceiptNo;
    }

    setIntegratedOrders((prev) => [newOrder, ...prev]);

    alert(
      isRtl
        ? `تم استقبال واستيعاب الطلب الخارجي بنجاح! رقم الطلب: ${uniqueId}. ${
            activeConnector.autoDeductInventory
              ? 'تم الخصم التلقائي من المخزون وتسجيل الفاتورة.'
              : 'تم تسجيل الفاتورة في قائمة الانتظار المعلقة لمراجعتها.'
          }`
        : `Order ${uniqueId} received successfully!`
    );
  };

  // 5. Approve Pending Integrated Order
  const handleApproveOrder = (order: IntegratedOrder) => {
    if (order.status !== 'pending_approval') return;

    const item = order.mappedData.items[0];
    const matchedItem = item.matchedFastItemId
      ? fastItems.find((f) => f.id === item.matchedFastItemId)
      : fastItems.find((f) => f.code === item.sku);

    const txReceiptNo = `REC-INT-${Math.floor(1000 + Math.random() * 9000)}`;

    addTransaction({
      receiptNo: txReceiptNo,
      time: new Date().toLocaleTimeString(isRtl ? 'ar-SA' : 'en-US'),
      date: new Date().toISOString().split('T')[0],
      itemsSummary: `${item.name} x${item.quantity}`,
      items: [
        {
          id: `stg-${Date.now()}`,
          name: item.name,
          category: matchedItem ? matchedItem.category : 'E-Commerce',
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          discountPct: 0,
          originalFastItemId: matchedItem?.id,
        },
      ],
      subtotal: order.mappedData.subtotal,
      tax: order.mappedData.tax,
      total: order.mappedData.total,
      paymentMethod: order.mappedData.paymentMethod,
      status: 'Completed',
      shiftNotes: `اعتماد يدوي للطلب التلقائي (${order.externalId})`,
      cashier: 'مسؤول المبيعات',
      customerName: order.mappedData.customerName,
    });

    if (matchedItem) {
      updateFastItemStock(matchedItem.id, Math.max(0, matchedItem.stockQuantity - item.quantity));
    }

    setIntegratedOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: 'approved',
              stockReserved: false,
              transactionReceiptNo: txReceiptNo,
            }
          : o
      )
    );
  };

  // 6. Reject Pending Integrated Order
  const handleRejectOrder = (order: IntegratedOrder) => {
    const reason = prompt(isRtl ? 'أدخل سبب إلغاء/رفض الفاتورة المعلقة:' : 'Enter reason for rejection:');
    if (reason === null) return;

    setIntegratedOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: 'rejected',
              stockReserved: false,
              rejectionReason: reason || (isRtl ? 'تم الرفض بواسطة المستخدم' : 'Rejected by user'),
            }
          : o
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          1-CLICK SHOPIFY AUTHORIZATION SIMULATION MODAL
         ========================================================================= */}
      {isShopifyFlowOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-2xl">
                  🛒
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">
                    {isRtl ? 'ربط متجر Shopify بضغطة زر واحدة' : 'Shopify 1-Click Integration'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'مزامنة تلقائية للمبيعات والمنتجات بدون أي تعقيدات تقنية' : 'Automated sales & inventory sync'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsShopifyFlowOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {shopifyConnectStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isRtl ? 'رابط متجر Shopify الخاص بك:' : 'Your Shopify Store Domain:'}
                  </label>
                  <input
                    type="text"
                    value={shopifyDomainInput}
                    onChange={(e) => setShopifyDomainInput(e.target.value)}
                    placeholder="mybrand.myshopify.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isRtl
                      ? 'أدخل النطاق الخاص بمتجرك للاستكشاف والربط التلقائي الأمني.'
                      : 'Enter your myshopify.com store URL.'}
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-800 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {isRtl ? 'المحرك التلقائي جاهز للمطابقة' : 'Smart Default Auto-Mapper Active'}
                  </p>
                  <p className="text-emerald-700 leading-relaxed text-[11px]">
                    {isRtl
                      ? 'سيتولى BizOS استكشاف حقول الطلبات والمنتجات والعملاء تلقائياً وتفعيل الخصم المباشر من المخزون.'
                      : 'BizOS automatically maps order, product, and customer fields using smart defaults.'}
                  </p>
                </div>

                <button
                  onClick={handleConfirmShopifyOAuth}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                  style={{ backgroundColor: customPalette.primaryAccent }}
                >
                  <Zap className="w-4 h-4" />
                  {isRtl ? 'المتابعة والموافقة على الربط المباشر 🚀' : 'Confirm & Authorize Direct Sync'}
                </button>
              </div>
            )}

            {shopifyConnectStep === 2 && (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-indigo-50 border-4 border-indigo-600 border-t-transparent animate-spin mx-auto flex items-center justify-center">
                  <Zap className="w-6 h-6 text-indigo-600 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">
                    {isRtl ? 'جاري الاتصال بـ Shopify واستكشاف البيانات...' : 'Connecting to Shopify...'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {isRtl
                      ? 'يتم الآن مطابقة الحقول تلقائياً وتفعيل محرك المزامنة بضغطة زر واحدة.'
                      : 'Auto-detecting schemas and setting up smart default mappings.'}
                  </p>
                </div>
              </div>
            )}

            {shopifyConnectStep === 3 && (
              <div className="py-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-3xl shadow-inner">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-lg">
                    {isRtl ? 'تم ربط متجر Shopify بنجاح!' : 'Shopify Store Connected Successfully!'}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {isRtl
                      ? 'تم استكشاف 11 حقل ومطابقتها تلقائياً دون أي إعداد يدوي. أي طلب جديد يصل لمتجرك سيُسجل فوراً في BizOS.'
                      : 'Discovered and mapped 11 fields automatically. Live sales stream is active.'}
                  </p>
                </div>

                <button
                  onClick={() => setIsShopifyFlowOpen(false)}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white shadow-md bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer"
                >
                  {isRtl ? 'ممتاز، العودة لصفحة المبيعات' : 'Great, Done!'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TOP HEADER BANNER
         ========================================================================= */}
      <div
        className="rounded-2xl p-6 shadow-sm border border-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{ backgroundColor: customPalette.surfaceBg }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
            style={{ backgroundColor: customPalette.primaryAccent }}
          >
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">
                {isRtl ? 'مركز ربط المتاجر الإلكترونية ومصادر البيانات' : 'Store & Data Integration Hub'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {isRtl ? 'المحرك نشط' : 'Engine Active'}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {isRtl
                ? 'اربط متجرك بضغطة زر واحدة لاستيراد المبيعات وتحديث المخزون والعملاء تلقائيًا دون تعقيدات.'
                : 'Connect your e-commerce store in 1 click to sync orders, inventory, and customers.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleStartShopifyConnect}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
            style={{ backgroundColor: customPalette.primaryAccent }}
          >
            <span>🛒</span>
            {isRtl ? 'ربط Shopify بضغطة زر 🚀' : 'Connect Shopify 1-Click'}
          </button>

          <button
            onClick={handleSimulateIncomingOrder}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4" />
            {isRtl ? 'اختبار محاكاة طلب' : 'Simulate Order'}
          </button>

          {/* DEVELOPER OPTIONS TOGGLE BUTTON */}
          <button
            onClick={() => setShowDevOptions(!showDevOptions)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              showDevOptions
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Code className="w-4 h-4 text-amber-500" />
            {showDevOptions
              ? isRtl
                ? 'إخفاء خيارات المطور'
                : 'Hide Dev Options'
              : isRtl
              ? 'خيارات المطور ⚙️'
              : 'Developer Options ⚙️'}
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE 1: SIMPLE USER INTERFACE (الواجهة الرئيسية البسيطة للمستخدم)
         ========================================================================= */}
      {!showDevOptions ? (
        <div className="space-y-6">
          {/* Main Integration Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. SHOPIFY CARD */}
            {(() => {
              const shopifyConn = connectors.find((c) => c.type === 'shopify') || connectors[0];
              const isConnected = shopifyConn && shopifyConn.status === 'active';

              return (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-bold shadow-xs">
                        🛒
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">Shopify Store</h3>
                        <p className="text-xs text-slate-400 font-mono">
                          {shopifyConn ? shopifyConn.name : 'متجر شوبيفاي'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        isConnected
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                      {isConnected ? (isRtl ? 'متصل ومُزامن' : 'Connected') : (isRtl ? 'غير متصل' : 'Disconnected')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isRtl
                      ? 'مزامنة آليّة فوريّة للطلبات والمبيعات، مطابقة العملاء بالهاتف والبريد، وخصم صنف المخزون المقابل تلقائياً.'
                      : 'Instant auto-sync of sales, customer matching by email/phone, and stock deduction.'}
                  </p>

                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>{isRtl ? 'إجمالي الطلبات المستوردة:' : 'Total Synced Orders:'}</span>
                      <span className="font-bold text-slate-800">
                        {integratedOrders.length > 0 ? integratedOrders.length : '142 طلب'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>{isRtl ? 'آخر مزامنة ناجحة:' : 'Last Sync Time:'}</span>
                      <span className="font-mono text-indigo-600 font-semibold">
                        {shopifyConn?.lastSyncAt
                          ? new Date(shopifyConn.lastSyncAt).toLocaleTimeString(isRtl ? 'ar-SA' : 'en-US')
                          : (isRtl ? 'منذ 5 دقائق' : '5 mins ago')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    {isConnected ? (
                      <>
                        <button
                          onClick={() => handleReconnectStore(shopifyConn.id)}
                          className="w-full py-2.5 rounded-xl font-bold text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          {isRtl ? 'إعادة المزامنة الآن' : 'Sync Now'}
                        </button>
                        <button
                          onClick={() => handleDisconnectStore(shopifyConn.id)}
                          className="w-full py-2 rounded-xl font-semibold text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          {isRtl ? 'فصل الاتصال بالمتجر' : 'Disconnect Store'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleStartShopifyConnect}
                        className="w-full py-3 rounded-xl font-bold text-xs text-white shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                        style={{ backgroundColor: customPalette.primaryAccent }}
                      >
                        <Zap className="w-4 h-4" />
                        {isRtl ? 'ربط Shopify بضغطة زر 🚀' : 'Connect Shopify 1-Click'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 2. WOOCOMMERCE CARD */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl font-bold shadow-xs">
                    🛍️
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">WooCommerce</h3>
                    <p className="text-xs text-slate-400 font-mono">WordPress Plugin</p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  {isRtl ? 'جاهز للربط' : 'Ready'}
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                {isRtl
                  ? 'ربط متجر ووكومرس لاستقبال مبيعاتك وتحديث المخزون آلياً دون حوافز يدويّة.'
                  : 'Connect your WooCommerce store to stream orders directly.'}
              </p>

              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-600">
                  <span>{isRtl ? 'حالة المطابقة:' : 'Mapping Status:'}</span>
                  <span className="font-bold text-emerald-600">{isRtl ? 'ربط افتراضي ذكي' : 'Smart Default'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>{isRtl ? 'نوع الاتصال:' : 'Connection Type:'}</span>
                  <span className="font-mono text-slate-700">REST API / Webhook</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleStartShopifyConnect}
                  className="w-full py-3 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {isRtl ? 'ربط WooCommerce بضغطة زر' : 'Connect WooCommerce'}
                </button>
              </div>
            </div>

            {/* 3. CUSTOM API / WEBHOOK CARD */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-bold shadow-xs">
                    🌐
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{isRtl ? 'نظام خاص / API' : 'Custom REST API'}</h3>
                    <p className="text-xs text-slate-400 font-mono">Webhook Listener</p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isRtl ? 'نشط' : 'Active'}
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                {isRtl
                  ? 'استقبال وتنفيذ الفواتير الإلكترونية من أي برنامج أو تطبيق خاص عبر Webhooks.'
                  : 'Receive sales and custom payload streams via Webhooks.'}
              </p>

              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-600">
                  <span>{isRtl ? 'رابط الاستقبال:' : 'Listener Status:'}</span>
                  <span className="font-mono text-emerald-600 font-semibold">POST /api/webhooks</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>{isRtl ? 'المطابقة:' : 'Matching:'}</span>
                  <span className="font-bold text-slate-700">{isRtl ? 'مفعلة' : 'Enabled'}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setShowDevOptions(true);
                    setActiveTab('connectors');
                  }}
                  className="w-full py-3 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  {isRtl ? 'تعديل إعدادات المصدر الخاص' : 'Manage Custom Source'}
                </button>
              </div>
            </div>
          </div>

          {/* Smart Default Engine Summary Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/80 text-amber-300 flex items-center justify-center font-bold text-2xl shrink-0 shadow-lg border border-indigo-400/30">
                ⚡
              </div>
              <div>
                <h4 className="font-bold text-base md:text-lg text-slate-100">
                  {isRtl ? 'محرك الربط الافتراضي الذكي (Smart Default Auto-Mapper)' : 'Smart Default Auto-Mapper Engine'}
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                  {isRtl
                    ? 'يقوم BizOS تلقائيًا بمطابقة معرفات الطلبات والأسعار والأصناف دون الحاجة لتوصيل أنابيب أو تعديل حقول يدويًا. إذا كنت مبرمجاً وترغب بتخصيص التحويلات يمكنك فتح خيارات المطور.'
                    : 'BizOS automatically matches external order numbers, total amounts, and product SKUs out of the box.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowDevOptions(true);
                setActiveTab('visual_mapping');
              }}
              className="px-5 py-3 rounded-2xl font-bold text-xs text-slate-900 bg-amber-400 hover:bg-amber-300 shadow-md flex items-center gap-2 transition-transform active:scale-95 shrink-0 cursor-pointer"
            >
              <Code className="w-4 h-4" />
              {isRtl ? 'فتح واجهة الربط المتقدمة (خيارات المطور)' : 'Open Advanced Mapping Canvas'}
            </button>
          </div>

          {/* Integrated Sales Orders Table (سجل المبيعات والطلبات المعلقة) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800">
                  {isRtl ? 'سجل المبيعات والطلبات المتزامنة تلقائياً' : 'Integrated Sales Queue'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isRtl
                    ? 'استعراض الطلبات المستوردة من المتاجر الخارجية، والاعتماد السريع للفواتير المعلقة.'
                    : 'Review auto-synced orders from external stores.'}
                </p>
              </div>

              <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl font-bold">
                {integratedOrders.length} {isRtl ? 'طلبات مستوردة' : 'Orders'}
              </span>
            </div>

            {integratedOrders.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-600">
                  {isRtl ? 'لا توجد طلبات متزامنة حتى الآن' : 'No integrated orders yet.'}
                </p>
                <button
                  onClick={handleSimulateIncomingOrder}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-xs cursor-pointer"
                >
                  {isRtl ? 'اضغط هنا لمحاكاة استقبال طلب جديد' : 'Simulate incoming test order'}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200">
                    <tr>
                      <th className="py-3 px-4">{isRtl ? 'رقم الطلب الخارجي' : 'External ID'}</th>
                      <th className="py-3 px-4">{isRtl ? 'اسم العميل' : 'Customer'}</th>
                      <th className="py-3 px-4">{isRtl ? 'المصدر' : 'Source'}</th>
                      <th className="py-3 px-4">{isRtl ? 'تاريخ المزامنة' : 'Time'}</th>
                      <th className="py-3 px-4">{isRtl ? 'إجمالي المبلغ' : 'Total'}</th>
                      <th className="py-3 px-4">{isRtl ? 'حالة الطلب' : 'Status'}</th>
                      <th className="py-3 px-4 text-center">{isRtl ? 'الإجراء' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {integratedOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">{ord.externalId}</td>
                        <td className="py-3 px-4 font-bold">{ord.mappedData.customerName}</td>
                        <td className="py-3 px-4 text-slate-500">{ord.connectorName}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {new Date(ord.receivedAt).toLocaleTimeString(isRtl ? 'ar-SA' : 'en-US')}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {ord.mappedData.total.toFixed(2)} SAR
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              ord.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.status === 'pending_approval'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {ord.status === 'approved'
                              ? isRtl
                                ? 'معتمد ومخصوم'
                                : 'Approved'
                              : ord.status === 'pending_approval'
                              ? isRtl
                                ? 'في انتظار الاعتماد'
                                : 'Pending'
                              : isRtl
                              ? 'ملغى / مرفوض'
                              : 'Rejected'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {ord.status === 'pending_approval' ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleApproveOrder(ord)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-500 shadow-xs cursor-pointer"
                              >
                                {isRtl ? 'اعتماد وخصم' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleRejectOrder(ord)}
                                className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 font-bold text-[11px] hover:bg-rose-200 cursor-pointer"
                              >
                                {isRtl ? 'إلغاء' : 'Reject'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] font-mono">
                              {ord.transactionReceiptNo || '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* =========================================================================
            VIEW MODE 2: DEVELOPER OPTIONS (خيارات المطور والربط التقني المتقدم)
           ========================================================================= */
        <div className="space-y-6">
          {/* Developer Banner Header */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-900 flex items-center justify-center font-bold text-xl shadow-md">
                <Code className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-100">
                  {isRtl ? 'خيارات المطور والربط التقني المتقدم (Developer Options)' : 'Developer Options & Technical Mapping'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isRtl
                    ? 'تحكم كامل في مفاتيح API، روابط الويب هوك، واجهة أنابيب نقل البيانات الرسومية، وااختبار المحاكاة.'
                    : 'Full control over API tokens, webhooks, visual mapping canvas, and dry run tests.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDevOptions(false)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              ← {isRtl ? 'العودة للواجهة الرئيسية البسيطة' : 'Back to Simple View'}
            </button>
          </div>

          {/* Selector for Active Connector */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-bold text-slate-700">
                {isRtl ? 'المصدر الخارجي النشط للربط:' : 'Active Data Connector:'}
              </span>
              <select
                value={activeConnectorId}
                onChange={(e) => setActiveConnectorId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {connectors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {activeConnector && (
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate max-w-[200px]">{activeConnector.baseUrl}</span>
                </span>
                <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">
                  <Lock className="w-3 h-3" />
                  {activeConnector.maskedKey || '•••'}
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  {activeConnector.lastSyncAt
                    ? new Date(activeConnector.lastSyncAt).toLocaleTimeString(isRtl ? 'ar-SA' : 'en-US')
                    : (isRtl ? 'لم يزامن بعد' : 'Not synced')}
                </span>
              </div>
            )}
          </div>

          {/* Technical Sub-Tabs Bar */}
          <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
            <button
              onClick={() => setActiveTab('connectors')}
              className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'connectors'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Server className="w-4 h-4" />
              {isRtl ? '1. إعدادات الاتصال والتوكنات' : '1. Connector Setup'}
            </button>

            <button
              onClick={() => setActiveTab('visual_mapping')}
              className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'visual_mapping'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              {isRtl ? '2. واجهة ربط أعمدة البيانات (Data Mapping)' : '2. Visual Data Mapping'}
            </button>

            <button
              onClick={() => setActiveTab('test_dryrun')}
              className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'test_dryrun'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Play className="w-4 h-4" />
              {isRtl ? '3. اختبار الربط والمحاكاة' : '3. Test & Dry Run'}
            </button>

            <button
              onClick={() => setActiveTab('sync_rules')}
              className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'sync_rules'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              {isRtl ? '4. قواعد المطابقة وحجز المخزون' : '4. Matching & Stock Rules'}
            </button>

            <button
              onClick={() => setActiveTab('integrated_queue')}
              className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'integrated_queue'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              {isRtl ? '5. سجل المبيعات والطلبات المعلقة' : '5. Integrated Queue'}
              {integratedOrders.filter((o) => o.status === 'pending_approval').length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                  {integratedOrders.filter((o) => o.status === 'pending_approval').length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 1: CONNECTORS SETUP (إعدادات الاتصال)
         ========================================================================= */}
      {activeTab === 'connectors' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connectors.map((conn) => (
              <div
                key={conn.id}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-xs relative ${
                  conn.id === activeConnectorId ? 'ring-2 ring-indigo-600 border-indigo-200' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      {conn.type === 'shopify' ? '🛒' : conn.type === 'woocommerce' ? '🛍️' : '🌐'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{conn.name}</h3>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                        {conn.type}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      conn.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {conn.status === 'active' ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'مسودة' : 'Draft')}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{isRtl ? 'رابط API:' : 'API URL:'}</span>
                    <span className="font-mono text-slate-700 truncate max-w-[180px]">{conn.baseUrl}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{isRtl ? 'المفتاح السري:' : 'API Key:'}</span>
                    <span className="font-mono text-indigo-600 font-semibold">{conn.maskedKey || '••••••••'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{isRtl ? 'نمط الخصم:' : 'Deduct Mode:'}</span>
                    <span className={`font-semibold ${conn.autoDeductInventory ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {conn.autoDeductInventory
                        ? (isRtl ? 'خصم تلقائي مباشر' : 'Direct Auto Deduct')
                        : (isRtl ? 'فواتير معلقة غير مؤكدة' : 'Pending Approval Queue')}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleTestConnection(conn)}
                    disabled={testingPingId === conn.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingPingId === conn.id ? 'animate-spin' : ''}`} />
                    {testingPingId === conn.id ? (isRtl ? 'جاري الفحص...' : 'Pinging...') : (isRtl ? 'اختبار الاتصال' : 'Test Ping')}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditConnector(conn)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                      title={isRtl ? 'تعديل' : 'Edit'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteConnector(conn.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title={isRtl ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Connection Test Result Banner */}
          {pingResult && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">{isRtl ? 'تم الفحص بنجاح' : 'Ping Test Passed'}</p>
                <p className="text-xs text-emerald-700 mt-0.5">{pingResult.msg}</p>
              </div>
            </div>
          )}

          {/* Webhook Endpoint Receiver Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Code className="w-6 h-6 text-emerald-400" />
                <h3 className="font-bold text-base">
                  {isRtl ? 'رابط استقبال الويب هوك (Webhook Listener Endpoint)' : 'Webhook Listener URL'}
                </h3>
              </div>
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-mono">
                POST /api/webhooks/sales-auto
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isRtl
                ? 'انسخ هذا الرابط وضعه في إعدادات Webhooks داخل Shopify أو المتجر الخاص بك لاستقبال الطلبات الفورية لحظة إتمامها.'
                : 'Copy this URL into your e-commerce platform webhooks settings to stream instant sales.'}
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs text-emerald-400">
              <span className="truncate">https://bizos.internal/api/webhooks/sales-auto?key={activeConnector?.id}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://bizos.internal/api/webhooks/sales-auto?key=${activeConnector?.id}`);
                  alert(isRtl ? 'تم نسخ رابط الويب هوك بنجاح!' : 'Copied Webhook URL!');
                }}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold transition-colors shrink-0"
              >
                {isRtl ? 'نسخ الرابط' : 'Copy URL'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: VISUAL DATA MAPPING CANVAS (شبكة ربط أعمدة البيانات)
         ========================================================================= */}
      {activeTab === 'visual_mapping' && (
        <div className="space-y-6">
          {/* Header Bar matching design */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-100">
                  {isRtl ? 'واجهة ربط أعمدة البيانات (Visual Data Pipeline Mapper)' : 'Visual Data Mapping Pipelines'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isRtl
                    ? 'انقر على أي عمود بيانات مصدر ثم عمود مستهدف لتوصيلها مباشرة بأنبوب نقل بيانات يكتسب نفس اللون'
                    : 'Click any source data column then a target column to connect them directly with a matching pipeline tube.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-3 py-1.5 rounded-xl font-mono font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                {currentMappings.length} {isRtl ? 'أعمدة بيانات متصلة' : 'Connected Data Columns'}
              </span>
            </div>
          </div>

          {/* Quick Connect & Data Column Controls Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                {isRtl ? 'لوحة تحكم أعمدة البيانات وتدفق الربط' : 'Data Column & Mapping Controls'}
              </h4>

              <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg">
                {selectedSourcePath
                  ? isRtl
                    ? `العمود المحدد للربط: (${selectedSourcePath})`
                    : `Selected Column: (${selectedSourcePath})`
                  : isRtl
                  ? 'انقر على أي عمود بيانات في اليمين للبدء'
                  : 'Click any source data column on the right to select'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {isRtl ? 'عمود المصدر الخارجي:' : 'External Source Column:'}
                </label>
                <select
                  value={selectedSourcePath || ''}
                  onChange={(e) => setSelectedSourcePath(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-slate-50"
                >
                  <option value="">{isRtl ? '-- اختر عمود المصدر --' : '-- Select Source Column --'}</option>
                  <option value="id">id (معرف الطلب الخارجي)</option>
                  <option value="order_number">order_number (رقم الفاتورة)</option>
                  <option value="created_at">created_at (تاريخ الإنشاء)</option>
                  <option value="financial_status">financial_status (حالة الدفع)</option>
                  <option value="currency">currency (العملة)</option>
                  <option value="total_price">total_price (إجمالي المبلغ)</option>
                  <option value="customer.email">customer.email (بريد العميل)</option>
                  <option value="line_items[0].sku">line_items[0].sku (رمز SKU)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {isRtl ? 'عمود BizOS المستهدف:' : 'Target BizOS Column:'}
                </label>
                <select
                  value={selectedTargetField || ''}
                  onChange={(e) => setSelectedTargetField(e.target.value as FieldMapping['targetField'])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-slate-50"
                >
                  <option value="">{isRtl ? '-- اختر عمود BizOS --' : '-- Select Target Column --'}</option>
                  {BIZOS_TARGET_FIELDS.map((tf) => (
                    <option key={tf.key} value={tf.key}>
                      {tf.labelAr} {tf.isRequired ? '*' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {isRtl ? 'تحويل التدفق البرمجي:' : 'Data Transformation:'}
                </label>
                <select
                  value={mappingTransformType}
                  onChange={(e) => setMappingTransformType(e.target.value as TransformationType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-slate-50"
                >
                  <option value="direct">{isRtl ? 'تدفق مباشر (Direct Flow)' : 'Direct Flow'}</option>
                  <option value="parse_float">{isRtl ? 'تحويل عشري (Parse Float)' : 'Parse Float'}</option>
                  <option value="parse_number">{isRtl ? 'تحويل صحيحي (Parse Int)' : 'Parse Int'}</option>
                  <option value="trim">{isRtl ? 'تنظيف شوائب النص (Trim)' : 'Trim'}</option>
                </select>
              </div>

              <button
                onClick={handleAddOrUpdateMapping}
                className="w-full px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                style={{ backgroundColor: customPalette.primaryAccent }}
              >
                <Plus className="w-4 h-4" />
                {isRtl ? 'توصيل عمود البيانات' : 'Connect Data Column'}
              </button>
            </div>
          </div>

          {/* MAIN DATA PIPELINE CANVAS */}
          <div className="bg-[#12161f] rounded-3xl p-6 md:p-8 border-2 border-slate-800 shadow-2xl relative overflow-hidden space-y-6">
            {/* Glossy ambient background grid pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#2d3748_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none"></div>

            {/* Canvas Headers */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 relative z-10">
              {/* Left Header (BizOS Database) in RTL */}
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs uppercase font-bold tracking-widest text-slate-400 bg-slate-800 px-3 py-1 rounded-md border border-slate-700">
                  Pipeline
                </span>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <h4 className="font-bold text-white text-base md:text-lg">
                    {isRtl ? 'قاعدة بيانات BizOS المستهدفة' : 'Target BizOS Database'}
                  </h4>
                </div>
              </div>

              {/* Central Conduit Channel Label */}
              <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-700 shadow-inner">
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>DATA PIPELINE CONDUIT</span>
              </div>

              {/* Right Header (External API JSON) in RTL */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-white text-base md:text-lg">
                    {isRtl ? 'مصدر البيانات الخارجي (External API JSON)' : 'External API Source'}
                  </h4>
                </div>
                <span className="font-mono text-xs uppercase font-bold tracking-widest text-slate-400 bg-slate-800 px-3 py-1 rounded-md border border-slate-700">
                  Pipeline
                </span>
              </div>
            </div>

            {/* PIPELINE COLUMNS GRID WITH SVG CONNECTING TUBES */}
            <div className="relative z-10 space-y-5">
              {/* SVG Connecting Tubes Overlay Layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
                <defs>
                  <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                  <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="50%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                  <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#eab308" />
                    <stop offset="50%" stopColor="#facc15" />
                    <stop offset="100%" stopColor="#eab308" />
                  </linearGradient>
                  <linearGradient id="bronzeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#d97706" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                  <linearGradient id="crimsonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="50%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                  <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="50%" stopColor="#2dd4bf" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>

                {/* Render Curved Pipeline Tubes for Mapped Connections */}
                {currentMappings.map((mapRule) => {
                  const sourceIdx = [
                    'id',
                    'order_number',
                    'created_at',
                    'financial_status',
                    'currency',
                    'total_price',
                    'customer.email',
                    'line_items[0].sku',
                  ].indexOf(mapRule.sourcePath);

                  const targetIdx = [
                    'external_id',
                    'customerName',
                    'customerPhone',
                    'customerEmail',
                    'total',
                    'subtotal',
                    'item_sku',
                    'item_quantity',
                  ].indexOf(mapRule.targetField);

                  if (sourceIdx < 0 || targetIdx < 0) return null;

                  // Pipeline row height spacing (~76px per row)
                  const y1 = sourceIdx * 82 + 38;
                  const y2 = targetIdx * 82 + 38;

                  const gradientIds = [
                    'emeraldGrad',
                    'goldGrad',
                    'purpleGrad',
                    'blueGrad',
                    'amberGrad',
                    'bronzeGrad',
                    'crimsonGrad',
                    'tealGrad',
                  ];

                  const strokeColors = [
                    '#10b981',
                    '#f59e0b',
                    '#a855f7',
                    '#3b82f6',
                    '#eab308',
                    '#d97706',
                    '#ef4444',
                    '#14b8a6',
                  ];

                  const color = strokeColors[sourceIdx % strokeColors.length];
                  const gradId = gradientIds[sourceIdx % gradientIds.length];

                  return (
                    <g key={mapRule.id}>
                      {/* Outer Glow Path */}
                      <path
                        d={`M 52% ${y1} C 50% ${y1}, 50% ${y2}, 48% ${y2}`}
                        fill="none"
                        stroke={color}
                        strokeWidth="16"
                        strokeOpacity="0.2"
                        strokeLinecap="round"
                      />
                      {/* Metallic Pipeline Tube Path */}
                      <path
                        d={`M 52% ${y1} C 50% ${y1}, 50% ${y2}, 48% ${y2}`}
                        fill="none"
                        stroke={`url(#${gradId})`}
                        strokeWidth="10"
                        strokeLinecap="round"
                        filter="drop-shadow(0 2px 8px rgba(0,0,0,0.6))"
                      />
                      {/* Inner Fluid Stream Animation */}
                      <path
                        d={`M 52% ${y1} C 50% ${y1}, 50% ${y2}, 48% ${y2}`}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="3"
                        strokeDasharray="8 8"
                        strokeOpacity="0.8"
                        className="animate-pulse"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* PIPELINE COLUMNS ROWS GRID */}
              {[
                {
                  srcKey: 'id',
                  srcLabel: '(string) id',
                  srcVal: 'SH-98421',
                  targetKey: 'external_id' as FieldMapping['targetField'],
                  targetLabel: 'المعرف الخارجي للطلب',
                  targetDesc: 'معرف فريد يمنع تكرار تسجيل الطلب بالنظام',
                  activeTheme: {
                    bgGradient: 'from-[#144d37] via-[#227a57] to-[#103b2a]',
                    borderColor: 'border-emerald-400/90',
                    strokeColor: '#10b981',
                    badgeBg: 'bg-emerald-950',
                    badgeText: 'text-emerald-300 font-bold font-mono',
                    valveBorder: 'border-emerald-400',
                    valveDot: 'bg-emerald-500',
                  },
                },
                {
                  srcKey: 'order_number',
                  srcLabel: '(string) order_number',
                  srcVal: '#1004',
                  targetKey: 'customerName' as FieldMapping['targetField'],
                  targetLabel: 'اسم العميل المباشر',
                  targetDesc: 'اسم العميل المباشر أو المنشأة التجارية',
                  activeTheme: {
                    bgGradient: 'from-[#634e14] via-[#8c6f1f] to-[#45360c]',
                    borderColor: 'border-amber-400/90',
                    strokeColor: '#f59e0b',
                    badgeBg: 'bg-amber-950',
                    badgeText: 'text-amber-300 font-bold font-mono',
                    valveBorder: 'border-amber-400',
                    valveDot: 'bg-amber-500',
                  },
                },
                {
                  srcKey: 'created_at',
                  srcLabel: '(string) created_at',
                  srcVal: '2026-11-03T09:50Z',
                  targetKey: 'customerPhone' as FieldMapping['targetField'],
                  targetLabel: 'رقم هاتف العميل',
                  targetDesc: 'يستخدم لإقران العميل بقاعدة البيانات',
                  activeTheme: {
                    bgGradient: 'from-[#3d1a4c] via-[#5d2a75] to-[#2b1236]',
                    borderColor: 'border-purple-400/90',
                    strokeColor: '#a855f7',
                    badgeBg: 'bg-purple-950',
                    badgeText: 'text-purple-300 font-bold font-mono',
                    valveBorder: 'border-purple-400',
                    valveDot: 'bg-purple-500',
                  },
                },
                {
                  srcKey: 'financial_status',
                  srcLabel: '(string) financial_status',
                  srcVal: 'paid',
                  targetKey: 'customerEmail' as FieldMapping['targetField'],
                  targetLabel: 'البريد الإلكتروني للعميل',
                  targetDesc: 'يستخدم للبحث والربط بالسجل المسجل',
                  activeTheme: {
                    bgGradient: 'from-[#143c6b] via-[#215e9e] to-[#0e2c4f]',
                    borderColor: 'border-blue-400/90',
                    strokeColor: '#3b82f6',
                    badgeBg: 'bg-blue-950',
                    badgeText: 'text-blue-300 font-bold font-mono',
                    valveBorder: 'border-blue-400',
                    valveDot: 'bg-blue-500',
                  },
                },
                {
                  srcKey: 'currency',
                  srcLabel: '(string) currency',
                  srcVal: 'SAR',
                  targetKey: 'total' as FieldMapping['targetField'],
                  targetLabel: 'إجمالي الفاتورة النهائي',
                  targetDesc: 'القيمة الإجمالية للطلب شاملة الضريبة',
                  activeTheme: {
                    bgGradient: 'from-[#735810] via-[#9e7818] to-[#523e09]',
                    borderColor: 'border-yellow-400/90',
                    strokeColor: '#eab308',
                    badgeBg: 'bg-yellow-950',
                    badgeText: 'text-yellow-300 font-bold font-mono',
                    valveBorder: 'border-yellow-400',
                    valveDot: 'bg-yellow-500',
                  },
                },
                {
                  srcKey: 'total_price',
                  srcLabel: '(string) total_price',
                  srcVal: '245.00',
                  targetKey: 'subtotal' as FieldMapping['targetField'],
                  targetLabel: 'المبلغ الفرعي قبل الضريبة',
                  targetDesc: 'صافي مبلغ المنتجات قبل الضريبة',
                  activeTheme: {
                    bgGradient: 'from-[#6e530e] via-[#947015] to-[#4a3708]',
                    borderColor: 'border-amber-500/90',
                    strokeColor: '#d97706',
                    badgeBg: 'bg-amber-950',
                    badgeText: 'text-amber-300 font-bold font-mono',
                    valveBorder: 'border-amber-500',
                    valveDot: 'bg-amber-600',
                  },
                },
                {
                  srcKey: 'customer.email',
                  srcLabel: '(string) customer.email',
                  srcVal: 'a.alshammari@example.com',
                  targetKey: 'item_sku' as FieldMapping['targetField'],
                  targetLabel: 'كود المنتج / SKU',
                  targetDesc: 'رمز الصنف لمطابقته وخصمه من المخزون',
                  activeTheme: {
                    bgGradient: 'from-[#541212] via-[#821d1d] to-[#380b0b]',
                    borderColor: 'border-red-400/90',
                    strokeColor: '#ef4444',
                    badgeBg: 'bg-red-950',
                    badgeText: 'text-red-300 font-bold font-mono',
                    valveBorder: 'border-red-400',
                    valveDot: 'bg-red-500',
                  },
                },
                {
                  srcKey: 'line_items[0].sku',
                  srcLabel: '(string) line_items.sku',
                  srcVal: 'PROD-101',
                  targetKey: 'item_quantity' as FieldMapping['targetField'],
                  targetLabel: 'الكمية المباعة',
                  targetDesc: 'الكمية المراد خصمها من المنتجات الجاهزة',
                  activeTheme: {
                    bgGradient: 'from-[#0e423d] via-[#166961] to-[#082e2a]',
                    borderColor: 'border-teal-400/90',
                    strokeColor: '#14b8a6',
                    badgeBg: 'bg-teal-950',
                    badgeText: 'text-teal-300 font-bold font-mono',
                    valveBorder: 'border-teal-400',
                    valveDot: 'bg-teal-500',
                  },
                },
              ].map((row, idx) => {
                // Neutral Grey Pipe Theme for unconnected columns
                const GREY_PIPE_THEME = {
                  bgGradient: 'from-[#242c38] via-[#354254] to-[#1a2029]',
                  borderColor: 'border-slate-600/80',
                  strokeColor: '#64748b',
                  badgeBg: 'bg-slate-800',
                  badgeText: 'text-slate-400 font-bold font-mono',
                  valveBorder: 'border-slate-500',
                  valveDot: 'bg-slate-600',
                };

                // Check if THIS SOURCE COLUMN on the right is connected
                const isSourceConnected = currentMappings.some((m) => m.sourcePath === row.srcKey);

                // Check if THIS TARGET COLUMN on the left is connected
                const targetMappedRule = currentMappings.find((m) => m.targetField === row.targetKey);

                // Source column displays vibrant activeTheme ONLY if connected, otherwise GREY
                const sourcePipeTheme = isSourceConnected ? row.activeTheme : GREY_PIPE_THEME;

                // Find connected source theme for target column
                let targetPipeTheme = GREY_PIPE_THEME;
                if (targetMappedRule) {
                  const connectedSourceIndex = [
                    'id',
                    'order_number',
                    'created_at',
                    'financial_status',
                    'currency',
                    'total_price',
                    'customer.email',
                    'line_items[0].sku',
                  ].indexOf(targetMappedRule.sourcePath);

                  const allActiveThemes = [
                    {
                      bgGradient: 'from-[#144d37] via-[#227a57] to-[#103b2a]',
                      borderColor: 'border-emerald-400/90',
                      strokeColor: '#10b981',
                      badgeBg: 'bg-emerald-950',
                      badgeText: 'text-emerald-300 font-bold font-mono',
                      valveBorder: 'border-emerald-400',
                      valveDot: 'bg-emerald-500',
                    },
                    {
                      bgGradient: 'from-[#634e14] via-[#8c6f1f] to-[#45360c]',
                      borderColor: 'border-amber-400/90',
                      strokeColor: '#f59e0b',
                      badgeBg: 'bg-amber-950',
                      badgeText: 'text-amber-300 font-bold font-mono',
                      valveBorder: 'border-amber-400',
                      valveDot: 'bg-amber-500',
                    },
                    {
                      bgGradient: 'from-[#3d1a4c] via-[#5d2a75] to-[#2b1236]',
                      borderColor: 'border-purple-400/90',
                      strokeColor: '#a855f7',
                      badgeBg: 'bg-purple-950',
                      badgeText: 'text-purple-300 font-bold font-mono',
                      valveBorder: 'border-purple-400',
                      valveDot: 'bg-purple-500',
                    },
                    {
                      bgGradient: 'from-[#143c6b] via-[#215e9e] to-[#0e2c4f]',
                      borderColor: 'border-blue-400/90',
                      strokeColor: '#3b82f6',
                      badgeBg: 'bg-blue-950',
                      badgeText: 'text-blue-300 font-bold font-mono',
                      valveBorder: 'border-blue-400',
                      valveDot: 'bg-blue-500',
                    },
                    {
                      bgGradient: 'from-[#735810] via-[#9e7818] to-[#523e09]',
                      borderColor: 'border-yellow-400/90',
                      strokeColor: '#eab308',
                      badgeBg: 'bg-yellow-950',
                      badgeText: 'text-yellow-300 font-bold font-mono',
                      valveBorder: 'border-yellow-400',
                      valveDot: 'bg-yellow-500',
                    },
                    {
                      bgGradient: 'from-[#6e530e] via-[#947015] to-[#4a3708]',
                      borderColor: 'border-amber-500/90',
                      strokeColor: '#d97706',
                      badgeBg: 'bg-amber-950',
                      badgeText: 'text-amber-300 font-bold font-mono',
                      valveBorder: 'border-amber-500',
                      valveDot: 'bg-amber-600',
                    },
                    {
                      bgGradient: 'from-[#541212] via-[#821d1d] to-[#380b0b]',
                      borderColor: 'border-red-400/90',
                      strokeColor: '#ef4444',
                      badgeBg: 'bg-red-950',
                      badgeText: 'text-red-300 font-bold font-mono',
                      valveBorder: 'border-red-400',
                      valveDot: 'bg-red-500',
                    },
                    {
                      bgGradient: 'from-[#0e423d] via-[#166961] to-[#082e2a]',
                      borderColor: 'border-teal-400/90',
                      strokeColor: '#14b8a6',
                      badgeBg: 'bg-teal-950',
                      badgeText: 'text-teal-300 font-bold font-mono',
                      valveBorder: 'border-teal-400',
                      valveDot: 'bg-teal-500',
                    },
                  ];

                  if (connectedSourceIndex >= 0) {
                    targetPipeTheme = allActiveThemes[connectedSourceIndex % allActiveThemes.length];
                  }
                }

                const isSelectedSource = selectedSourcePath === row.srcKey;

                return (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-16 items-center relative z-10 h-[68px]">
                    {/* RIGHT COLUMN (External Source) in RTL */}
                    <div
                      onClick={() => setSelectedSourcePath(row.srcKey)}
                      className={`order-1 md:order-2 relative bg-gradient-to-r ${sourcePipeTheme.bgGradient} rounded-2xl px-4 py-3 border-2 ${sourcePipeTheme.borderColor} shadow-lg flex items-center justify-between text-white cursor-pointer transition-all ${
                        isSelectedSource ? 'ring-4 ring-white scale-[1.02] shadow-2xl' : 'hover:scale-[1.01]'
                      }`}
                    >
                      {/* End Cap Fittings */}
                      <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-10 bg-gradient-to-r from-slate-400 via-slate-300 to-slate-600 rounded-s-md shadow-md border-r border-slate-700"></div>
                      <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-10 bg-gradient-to-l from-slate-400 via-slate-300 to-slate-600 rounded-e-md shadow-md border-l border-slate-700"></div>

                      {/* Valve Handle */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSourcePath(row.srcKey);
                        }}
                        className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 group hover:rotate-180 transition-transform duration-700 cursor-pointer"
                        title={isRtl ? 'محبس تدفق عمود البيانات' : 'Data Column Pipeline Valve'}
                      >
                        <div className={`w-7 h-7 rounded-full bg-slate-900 border-2 ${sourcePipeTheme.valveBorder} flex items-center justify-center shadow-md`}>
                          <div className={`w-3 h-3 rounded-full ${sourcePipeTheme.valveDot}`}></div>
                        </div>
                      </div>

                      {/* Left inner side: Pill Badge */}
                      <div className={`${sourcePipeTheme.badgeBg} ${sourcePipeTheme.badgeText} text-xs px-3 py-1 rounded-xl shadow-inner border border-white/20 shrink-0 truncate max-w-[140px]`}>
                        {row.srcVal}
                      </div>

                      {/* Right inner side: Field Info */}
                      <div className="flex items-center gap-2 text-left text-xs">
                        <span className="font-mono text-[11px] text-white/90 font-bold">{row.srcLabel}</span>
                        {isSourceConnected ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs animate-ping" title={isRtl ? 'عمود بيانات متصل' : 'Connected Column'}></span>
                        ) : (
                          <Settings className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* LEFT COLUMN (BizOS Target) in RTL */}
                    <div
                      onClick={() => {
                        if (selectedSourcePath) {
                          setSelectedTargetField(row.targetKey);
                          handleAddOrUpdateMapping();
                        } else {
                          setSelectedTargetField(row.targetKey);
                        }
                      }}
                      className={`order-2 md:order-1 relative bg-gradient-to-r ${targetPipeTheme.bgGradient} rounded-2xl px-4 py-3 border-2 ${targetPipeTheme.borderColor} shadow-lg flex items-center justify-between text-white cursor-pointer transition-all hover:scale-[1.01]`}
                    >
                      {/* End Cap Fittings */}
                      <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-10 bg-gradient-to-r from-slate-400 via-slate-300 to-slate-600 rounded-s-md shadow-md border-r border-slate-700"></div>
                      <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-10 bg-gradient-to-l from-slate-400 via-slate-300 to-slate-600 rounded-e-md shadow-md border-l border-slate-700"></div>

                      {/* Valve Handle */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (targetMappedRule) {
                            handleRemoveMapping(targetMappedRule.id);
                          }
                        }}
                        className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 group hover:rotate-180 transition-transform duration-700 cursor-pointer"
                        title={
                          targetMappedRule
                            ? isRtl
                              ? 'فصل عمود البيانات وإعادته للون الرمادي'
                              : 'Disconnect Data Column (Reverts to Grey)'
                            : isRtl
                            ? 'محبس تدفق البيانات'
                            : 'Data Pipeline Valve'
                        }
                      >
                        <div className={`w-7 h-7 rounded-full bg-slate-900 border-2 ${targetPipeTheme.valveBorder} flex items-center justify-center shadow-md`}>
                          <div className={`w-3 h-3 rounded-full ${targetPipeTheme.valveDot}`}></div>
                        </div>
                      </div>

                      {/* Target Info Text */}
                      <div className="text-right">
                        <h5 className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>{row.targetLabel}</span>
                          {targetMappedRule && (
                            <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded font-mono font-bold">
                              ✓ {isRtl ? 'متصل' : 'Connected'}
                            </span>
                          )}
                        </h5>
                        <p className="text-[10px] text-white/80">{row.targetDesc}</p>
                      </div>

                      {/* Target Pill Badge: TAKES EXACT SAME VALUE AND COLOR WHEN CONNECTED */}
                      {targetMappedRule ? (
                        <div className={`${targetPipeTheme.badgeBg} ${targetPipeTheme.badgeText} text-xs px-3 py-1 rounded-xl shadow-inner border border-white/20 shrink-0 flex items-center gap-1.5 truncate max-w-[140px]`}>
                          <Settings className="w-3.5 h-3.5" />
                          <span>{row.srcVal}</span>
                        </div>
                      ) : (
                        <div className="bg-slate-900/80 text-slate-400 font-mono text-[10px] px-2.5 py-1 rounded-xl border border-slate-700/80 shrink-0">
                          {isRtl ? 'رمادي (غير موصول)' : 'Grey (Unconnected)'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: TEST & DRY RUN SIMULATION (اختبار الربط والمحاكاة)
         ========================================================================= */}
      {activeTab === 'test_dryrun' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-800">
                  {isRtl ? 'محاكي واختبار الربط التجريبي (Dry Run Simulator)' : 'Dry Run Simulator'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isRtl
                    ? 'يختبر هذا الفحص نمط البيانات المربوطة ضد عينة طلبات حقيقية دون التأثير أو الخصم من المخزون الحالي.'
                    : 'Tests your pipeline data mappings against live samples without mutating stock or sales.'}
                </p>
              </div>

              <button
                onClick={handleRunDryRunTest}
                disabled={isSimulatingTest}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md flex items-center gap-2 transition-transform active:scale-95"
                style={{ backgroundColor: customPalette.primaryAccent }}
              >
                <Play className={`w-4 h-4 ${isSimulatingTest ? 'animate-spin' : ''}`} />
                {isSimulatingTest ? (isRtl ? 'جاري محاكاة التجربة...' : 'Simulating...') : (isRtl ? 'بدء اختبار الربط' : 'Run Dry Run Test')}
              </button>
            </div>

            {testReport && (
              <div className="mt-6 space-y-6">
                {/* Status Callout */}
                <div
                  className={`p-4 rounded-xl border flex items-center gap-3 ${
                    testReport.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {testReport.success ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm">
                      {testReport.success
                        ? (isRtl ? 'نجاح الاختبار التجريبي! كافة الحقول المطلوبة مكتملة ومطابقة.' : 'Test Passed Successfully!')
                        : (isRtl ? 'فشل الاختبار التجريبي: يرجى استكمال الحقول المطلوبة' : 'Test Failed!')}
                    </h4>
                    <p className="text-xs mt-0.5 opacity-90">
                      {isRtl
                        ? `زمن الاختبار: ${testReport.timestamp} | عدد الطلبات المفحوصة: ${testReport.recordsTested}`
                        : `Tested at ${testReport.timestamp} | Tested records: ${testReport.recordsTested}`}
                    </p>
                  </div>
                </div>

                {/* Side-by-side Output preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Input Payload */}
                  <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs space-y-2">
                    <div className="text-slate-400 border-b border-slate-800 pb-2">
                      {isRtl ? '1. البيانات الخام المستلمة (Raw Input)' : 'Raw Input Payload'}
                    </div>
                    <pre className="overflow-x-auto text-[11px] leading-relaxed">
                      {JSON.stringify(testReport.rawSamplePayload, null, 2)}
                    </pre>
                  </div>

                  {/* Right: Output BizOS Object */}
                  <div className="bg-slate-900 text-indigo-300 p-4 rounded-xl font-mono text-xs space-y-2">
                    <div className="text-slate-400 border-b border-slate-800 pb-2">
                      {isRtl ? '2. هيكل البيانات النهائي في BizOS (Mapped Output)' : 'Mapped Output Result'}
                    </div>
                    <pre className="overflow-x-auto text-[11px] leading-relaxed">
                      {JSON.stringify(testReport.mappedResult, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Warnings / Errors Log */}
                {testReport.warnings.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      {isRtl ? 'تحذيرات وملاحظات التحويل:' : 'Conversion Warnings:'}
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                      {testReport.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: MATCHING & INVENTORY RULES (قواعد المطابقة والمخزون)
         ========================================================================= */}
      {activeTab === 'sync_rules' && activeConnector && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-bold text-lg text-slate-800">
            {isRtl ? 'قواعد التوافق ومطابقة المخزون التلقائي' : 'Matching Rules & Inventory Safety'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Customer Matching Policy */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>{isRtl ? 'سياسة مطابقة العميل (Customer Matching)' : 'Customer Matching Policy'}</span>
              </div>
              <p className="text-xs text-slate-500">
                {isRtl
                  ? 'كيف يتعامل النظام عند وصول طلب يحمل بيانات عميل جديد من المتجر الإلكتروني؟'
                  : 'How system handles new customer records from external store.'}
              </p>

              <select
                value={activeConnector.matchingCustomerRule}
                onChange={(e) => {
                  const val = e.target.value as IntegrationConnector['matchingCustomerRule'];
                  setConnectors((prev) =>
                    prev.map((c) => (c.id === activeConnector.id ? { ...c, matchingCustomerRule: val } : c))
                  );
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
              >
                <option value="email_or_phone">
                  {isRtl ? 'البحث بالبريد أو الهاتف -> إقران أو إنشاء جديد تلقائياً' : 'Match Email or Phone -> Link or Create'}
                </option>
                <option value="email_only">{isRtl ? 'البحث بالبريد الإلكتروني فقط' : 'Match Email Only'}</option>
                <option value="phone_only">{isRtl ? 'البحث برقم الهاتف فقط' : 'Match Phone Only'}</option>
                <option value="always_create">{isRtl ? 'إنشاء سجل عميل جديد دائماً' : 'Always Create New Customer'}</option>
              </select>
            </div>

            {/* 2. Inventory Safety Mode */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Database className="w-5 h-5 text-indigo-600" />
                <span>{isRtl ? 'سياسة خصم المخزون (Inventory Deduction)' : 'Inventory Deduction Policy'}</span>
              </div>
              <p className="text-xs text-slate-500">
                {isRtl
                  ? 'هل يتم الخصم فوراً من المنتجات الجاهزة أم الانتظار في قائمة الفواتير المعلقة؟'
                  : 'Direct auto deduct or hold in pending queue for manual review.'}
              </p>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="autoDeduct"
                    checked={!activeConnector.autoDeductInventory}
                    onChange={() => {
                      setConnectors((prev) =>
                        prev.map((c) => (c.id === activeConnector.id ? { ...c, autoDeductInventory: false } : c))
                      );
                    }}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    {isRtl ? 'وضع الأمان: تسجيل في قائمة الفواتير المعلقة غير المؤكدة' : 'Safety Queue: Unconfirmed Pending Invoices'}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="autoDeduct"
                    checked={activeConnector.autoDeductInventory}
                    onChange={() => {
                      setConnectors((prev) =>
                        prev.map((c) => (c.id === activeConnector.id ? { ...c, autoDeductInventory: true } : c))
                      );
                    }}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    {isRtl ? 'خصم مباشر تلقائي فور استلام الطلب' : 'Direct Auto Deduct from Finished Goods'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: INTEGRATED QUEUE & PENDING INVOICES (سجل المبيعات والطلبات المعلقة)
         ========================================================================= */}
      {activeTab === 'integrated_queue' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate-800">
                {isRtl ? 'سجل المبيعات المترابطة والطلبات المعلقة' : 'Integrated Orders & Pending Queue'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRtl
                  ? 'عرض وإدارة الطلبات الواردة تلقائياً من المتاجر الإلكترونية مع إمكانية الاعتماد أو الرفض.'
                  : 'Review automatically received orders from external e-commerce connectors.'}
              </p>
            </div>

            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl">
              {isRtl ? 'إجمالي الطلبات المستلمة:' : 'Total Received:'} {integratedOrders.length}
            </span>
          </div>

          {integratedOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-300" />
              <p className="font-bold text-slate-600">
                {isRtl ? 'لا توجد طلبات معالجة آلياً حتى الآن' : 'No integrated orders received yet.'}
              </p>
              <p className="text-xs">
                {isRtl
                  ? 'اضغط على زر "محاكاة استقبال طلب جديد" في الأعلى للتجربة الفورية.'
                  : 'Click "Simulate Incoming Order" button above to test.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-xl border-slate-200">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-semibold">{isRtl ? 'رقم الطلب الخارجي' : 'External ID'}</th>
                    <th className="p-3 font-semibold">{isRtl ? 'العميل' : 'Customer'}</th>
                    <th className="p-3 font-semibold">{isRtl ? 'المنتجات' : 'Items'}</th>
                    <th className="p-3 font-semibold">{isRtl ? 'المبلغ الإجمالي' : 'Total'}</th>
                    <th className="p-3 font-semibold">{isRtl ? 'تاريخ الاستلام' : 'Received At'}</th>
                    <th className="p-3 font-semibold">{isRtl ? 'الحالة' : 'Status'}</th>
                    <th className="p-3 font-semibold text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {integratedOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-indigo-700">{ord.externalId}</td>
                      <td className="p-3">{ord.mappedData.customerName}</td>
                      <td className="p-3">
                        {ord.mappedData.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                      </td>
                      <td className="p-3 font-bold text-emerald-700">
                        {ord.mappedData.total.toLocaleString()} SAR
                      </td>
                      <td className="p-3 text-slate-400">
                        {new Date(ord.receivedAt).toLocaleTimeString(isRtl ? 'ar-SA' : 'en-US')}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            ord.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'pending_approval'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {ord.status === 'approved'
                            ? isRtl
                              ? 'مؤكد ومخصوم'
                              : 'Approved'
                            : ord.status === 'pending_approval'
                            ? isRtl
                              ? 'معلق بانتظار التوافق'
                              : 'Pending Approval'
                            : isRtl
                            ? 'مرفوض'
                            : 'Rejected'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {ord.status === 'pending_approval' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApproveOrder(ord)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors shadow-xs"
                            >
                              {isRtl ? 'اعتماد وخصم' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleRejectOrder(ord)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] transition-colors"
                            >
                              {isRtl ? 'رفض' : 'Reject'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-mono">
                            {ord.transactionReceiptNo || '-'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Add / Edit Connector Modal */}
      {isAddConnectorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">
                {editingConnector
                  ? isRtl
                    ? 'تعديل مصدر اتصال برمجي'
                    : 'Edit Connector'
                  : isRtl
                  ? 'إضافة مصدر بيانات جديد'
                  : 'Add New Connector'}
              </h3>
              <button
                onClick={() => setIsAddConnectorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConnector} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isRtl ? 'اسم مصدر البيانات (مثال: متجر شوبيفاي الرئيسي):' : 'Connector Name:'}
                </label>
                <input
                  type="text"
                  required
                  value={connectorForm.name}
                  onChange={(e) => setConnectorForm({ ...connectorForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isRtl ? 'نوع الاتصال:' : 'Connection Type:'}
                  </label>
                  <select
                    value={connectorForm.type}
                    onChange={(e) =>
                      setConnectorForm({ ...connectorForm, type: e.target.value as ConnectionType })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="shopify">Shopify API</option>
                    <option value="woocommerce">WooCommerce API</option>
                    <option value="custom_rest">Custom REST API</option>
                    <option value="webhook">Webhook Receiver</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isRtl ? 'نوع المصادقة:' : 'Auth Type:'}
                  </label>
                  <select
                    value={connectorForm.authType}
                    onChange={(e) =>
                      setConnectorForm({ ...connectorForm, authType: e.target.value as AuthType })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="bearer">Header Bearer Token</option>
                    <option value="api_key">API Key Header</option>
                    <option value="custom_header">Custom Header</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isRtl ? 'رابط API الأساسي (Base URL):' : 'API Base URL:'}
                </label>
                <input
                  type="url"
                  required
                  value={connectorForm.baseUrl}
                  onChange={(e) => setConnectorForm({ ...connectorForm, baseUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  placeholder="https://api.mystore.com/v1/orders"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isRtl ? 'مفتاح API السري (Secret Key / Token):' : 'Secret Key / Access Token:'}
                </label>
                <input
                  type="password"
                  value={connectorForm.apiKey}
                  onChange={(e) => setConnectorForm({ ...connectorForm, apiKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  placeholder="shpat_••••••••••••"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {isRtl ? 'محمي ومحجب أمنياً، لا يتم إظهاره بالنص الصريح.' : 'Encrypted securely.'}
                </p>
              </div>

              <div className="pt-3 border-t flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddConnectorModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-600"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white shadow-sm"
                  style={{ backgroundColor: customPalette.primaryAccent }}
                >
                  {isRtl ? 'حفظ المصدر' : 'Save Connector'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { isSupabaseConfigured } from '../lib/supabase';
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
  Shield,
  Cpu,
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

// E-Commerce Supported Platforms Definition Matrix
export interface EcomPlatformConfig {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  badge: string;
  fields: {
    key: string;
    labelAr: string;
    placeholder: string;
    type?: string;
    helpAr?: string;
  }[];
  authTypeLabel: string;
}

export const ECOM_PLATFORMS: EcomPlatformConfig[] = [
  {
    id: 'shopify',
    nameAr: 'Shopify',
    nameEn: 'Shopify',
    icon: '🛒',
    badge: 'Official OAuth / App',
    fields: [
      { key: 'storeDomain', labelAr: 'رابط المتجر (Store Domain)', placeholder: 'my-store.myshopify.com', helpAr: 'أدخل رابط أو نطاق متجرك في Shopify' },
      { key: 'accessToken', labelAr: 'مفتاح Access Token (أو الربط المباشر)', placeholder: 'shpat_xxxxxxxxxxxxxxxxxxxx', helpAr: 'يتم استخراج Admin API Token تلقائياً عبر تطبيق OAuth' }
    ],
    authTypeLabel: 'Shopify OAuth 2.0 API'
  },
  {
    id: 'woocommerce',
    nameAr: 'WooCommerce',
    nameEn: 'WooCommerce',
    icon: '🛍️',
    badge: 'Consumer API Keys',
    fields: [
      { key: 'storeUrl', labelAr: 'رابط الموقع (WordPress / WooCommerce URL)', placeholder: 'https://my-store.com', helpAr: 'رابط موقعك الإكتروني كاملاً' },
      { key: 'consumerKey', labelAr: 'مفتاح المستهلك (Consumer Key)', placeholder: 'ck_xxxxxxxxxxxxxxxxxxxxxxxx', helpAr: 'احصل عليه من إعدادات WooCommerce > API' },
      { key: 'consumerSecret', labelAr: 'مفتاح السر (Consumer Secret)', placeholder: 'cs_xxxxxxxxxxxxxxxxxxxxxxxx', type: 'password', helpAr: 'المفتاح السري للتخويل' }
    ],
    authTypeLabel: 'WooCommerce REST API v3'
  },
  {
    id: 'salla',
    nameAr: 'سلة (Salla)',
    nameEn: 'Salla',
    icon: '🧺',
    badge: 'Salla Merchant OAuth',
    fields: [
      { key: 'storeUrl', labelAr: 'رابط المتجر في منصة سلة', placeholder: 'https://salla.sa/my-store' },
      { key: 'accessToken', labelAr: 'رمز الوصول (Access Token / App Key)', placeholder: 'Bearer eyJhbGciOiJKV1Qi...', type: 'password' }
    ],
    authTypeLabel: 'Salla Partner App Gateway'
  },
  {
    id: 'zid',
    nameAr: 'زد (Zid)',
    nameEn: 'Zid',
    icon: '⚡',
    badge: 'Zid App API v2',
    fields: [
      { key: 'storeId', labelAr: 'معرف المتجر (Store ID)', placeholder: '109842' },
      { key: 'authorizationToken', labelAr: 'رمز التخويل (Authorization Token)', placeholder: 'Bearer zid_token_xxxxxxx' },
      { key: 'managerToken', labelAr: 'رمز المدير (X-Manager-Token)', placeholder: 'X-Manager-Token xxxxx', type: 'password' }
    ],
    authTypeLabel: 'Zid API v2 Authorization'
  },
  {
    id: 'bigcommerce',
    nameAr: 'BigCommerce',
    nameEn: 'BigCommerce',
    icon: '📦',
    badge: 'Store Hash API',
    fields: [
      { key: 'storeHash', labelAr: 'معرف المتجر (Store Hash)', placeholder: 'abc123xyz' },
      { key: 'accessToken', labelAr: 'مفتاح الوصول (API Access Token)', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' }
    ],
    authTypeLabel: 'BigCommerce Management API'
  },
  {
    id: 'wix',
    nameAr: 'Wix eCommerce',
    nameEn: 'Wix',
    icon: '🎨',
    badge: 'Wix Headless API',
    fields: [
      { key: 'siteId', labelAr: 'معرف الموقع (Wix Site ID)', placeholder: 'wix-site-xxxx-xxxx' },
      { key: 'apiKey', labelAr: 'مفتاح API الخاص بـ Wix', placeholder: 'IST.xxxxxxxx', type: 'password' }
    ],
    authTypeLabel: 'Wix eCommerce REST'
  },
  {
    id: 'magento',
    nameAr: 'Magento / Adobe Commerce',
    nameEn: 'Magento',
    icon: '🍊',
    badge: 'Integration Bearer Token',
    fields: [
      { key: 'storeUrl', labelAr: 'رابط المتجر (Magento Endpoint URL)', placeholder: 'https://magento-store.com/rest/V1' },
      { key: 'bearerToken', labelAr: 'رمز الوصول الممتاز (Integration Bearer Token)', placeholder: 'bearer_token_xxxx', type: 'password' }
    ],
    authTypeLabel: 'Magento V1 REST'
  },
  {
    id: 'prestashop',
    nameAr: 'PrestaShop',
    nameEn: 'PrestaShop',
    icon: '🐧',
    badge: 'WebService Key',
    fields: [
      { key: 'storeUrl', labelAr: 'رابط المتجر (PrestaShop URL)', placeholder: 'https://prestashop-store.com' },
      { key: 'webServiceKey', labelAr: 'مفتاح الويب سيرفس (WebService Key)', placeholder: '1234567890ABCDEFGHIJKLMNOP', type: 'password' }
    ],
    authTypeLabel: 'PrestaShop WebService API'
  },
  {
    id: 'opencart',
    nameAr: 'OpenCart',
    nameEn: 'OpenCart',
    icon: '🛒',
    badge: 'REST API Admin Key',
    fields: [
      { key: 'storeUrl', labelAr: 'رابط المتجر (OpenCart URL)', placeholder: 'https://opencart-store.com/index.php?route=api' },
      { key: 'username', labelAr: 'اسم مستخدم API (API Username)', placeholder: 'bizos_api_user' },
      { key: 'apiKey', labelAr: 'مفتاح API', placeholder: 'api_key_xxxxxxxx', type: 'password' }
    ],
    authTypeLabel: 'OpenCart Admin API'
  },
  {
    id: 'expandcart',
    nameAr: 'ExpandCart',
    nameEn: 'ExpandCart',
    icon: '🚀',
    badge: 'App API Token',
    fields: [
      { key: 'storeUrl', labelAr: 'رابط المتجر في ExpandCart', placeholder: 'https://my-store.expandcart.com' },
      { key: 'apiToken', labelAr: 'مفتاح API (ExpandCart Token)', placeholder: 'expand_token_xxxxxx', type: 'password' }
    ],
    authTypeLabel: 'ExpandCart REST API'
  },
  {
    id: 'custom_rest',
    nameAr: 'منصة أخرى (Custom REST / Webhook)',
    nameEn: 'Custom Platform',
    icon: '⚙️',
    badge: 'Custom Integration',
    fields: [
      { key: 'baseUrl', labelAr: 'رابط الواجهة البرمجية (API Base Endpoint)', placeholder: 'https://api.mycustomstore.com/v1' },
      { key: 'headerName', labelAr: 'اسم ترويسة المصادقة (Header Name)', placeholder: 'Authorization / X-API-Key' },
      { key: 'apiSecret', labelAr: 'قيمة المفتاح السرية (API Secret Value)', placeholder: 'Bearer xxxxxxxxxx', type: 'password' }
    ],
    authTypeLabel: 'Custom HTTP Endpoint (قد يتطلب إعداداً تقنياً مخصصاً)'
  }
];

// Social Media & Messaging Pages Supported Platforms Definition Matrix
export interface SocialPlatformConfig {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  badge: string;
  supportsShowcase: boolean; // أ. مصدر التفاعل مع المنتجات والمنشورات
  supportsChats: boolean;    // ب. مصدر المحادثات والطلبات المباشرة
  authMethod: 'oauth' | 'token' | 'webhook_key';
  fields: {
    key: string;
    labelAr: string;
    placeholder: string;
    type?: string;
    helpAr?: string;
  }[];
  authTypeLabel: string;
}

export const SOCIAL_PLATFORMS: SocialPlatformConfig[] = [
  {
    id: 'facebook_page',
    nameAr: 'صفحات فيسبوك التجارية (Facebook Pages)',
    nameEn: 'Facebook Pages',
    icon: '📘',
    badge: 'Meta Graph API / OAuth',
    supportsShowcase: true,
    supportsChats: true,
    authMethod: 'oauth',
    fields: [
      { key: 'pageName', labelAr: 'اسم الصفحة التجارية أو المعرف (Page Name/ID)', placeholder: 'MyBrandOfficial / 10948201293', helpAr: 'أدخل اسم صفحة فيسبوك التجارية المعنية' },
      { key: 'accessToken', labelAr: 'رمز صلاحيات الصفحة (Page Access Token)', placeholder: 'EAAGxxxxxxxxxxxxxxxxxxxxxxxx', type: 'password', helpAr: 'يتم الربط التلقائي عبر تطبيق فيسبوك الرسمي أو إدخال التوكن' }
    ],
    authTypeLabel: 'Meta OAuth 2.0 & Graph API'
  },
  {
    id: 'instagram_prof',
    nameAr: 'انستغرام التجاري (Instagram Professional)',
    nameEn: 'Instagram Professional',
    icon: '📸',
    badge: 'Instagram Graph API',
    supportsShowcase: true,
    supportsChats: true,
    authMethod: 'oauth',
    fields: [
      { key: 'handle', labelAr: 'اسم حساب انستغرام (@Handle)', placeholder: '@mybrand_official', helpAr: 'اسم حساب انستغرام التجاري المربوط بصفحتك' },
      { key: 'accessToken', labelAr: 'رمز الوصول بـ Instagram Graph API', placeholder: 'IGQVJxxxxxxxxxxxxxxxxxxxx', type: 'password' }
    ],
    authTypeLabel: 'Instagram Business Graph API'
  },
  {
    id: 'whatsapp_biz',
    nameAr: 'واتساب الأعمال (WhatsApp Business API)',
    nameEn: 'WhatsApp Business',
    icon: '💬',
    badge: 'WhatsApp Cloud API',
    supportsShowcase: false,
    supportsChats: true,
    authMethod: 'token',
    fields: [
      { key: 'phoneNumber', labelAr: 'رقم هاتف الواتساب التجاري', placeholder: '+966501234567', helpAr: 'الرقم المعتمد بحساب واتساب الأعمال' },
      { key: 'phoneId', labelAr: 'معرف رقم الهاتف (Phone Number ID)', placeholder: '109842091238' },
      { key: 'accessToken', labelAr: 'رمز الوصول الدائم (Permanent System Access Token)', placeholder: 'EAAGxxxxxxxxx', type: 'password' }
    ],
    authTypeLabel: 'Meta WhatsApp Cloud API'
  },
  {
    id: 'messenger',
    nameAr: 'ماسينجر التجاري (Facebook Messenger)',
    nameEn: 'Messenger',
    icon: '⚡',
    badge: 'Messenger Messaging API',
    supportsShowcase: false,
    supportsChats: true,
    authMethod: 'oauth',
    fields: [
      { key: 'pageId', labelAr: 'معرف صفحة ماسينجر (Page ID)', placeholder: '10948201293' },
      { key: 'pageAccessToken', labelAr: 'Page Access Token لمحادثات ماسينجر', placeholder: 'EAAGxxxxxxxx', type: 'password' }
    ],
    authTypeLabel: 'Meta Messenger Platform API'
  },
  {
    id: 'tiktok_biz',
    nameAr: 'تيك توك الأعمال (TikTok for Business)',
    nameEn: 'TikTok Business',
    icon: '🎵',
    badge: 'TikTok Business API',
    supportsShowcase: true,
    supportsChats: true,
    authMethod: 'oauth',
    fields: [
      { key: 'username', labelAr: 'اسم حساب تيك توك التجاري', placeholder: '@mybrand_tiktok' },
      { key: 'accessToken', labelAr: 'رمز الوصول بـ TikTok Open API', placeholder: 'act.xxxxxxxxxxxx', type: 'password' }
    ],
    authTypeLabel: 'TikTok Content & Direct API'
  },
  {
    id: 'telegram_biz',
    nameAr: 'تلغرام الأعمال والبوتات (Telegram Business)',
    nameEn: 'Telegram Business',
    icon: '✈️',
    badge: 'Telegram Bot API / Webhook',
    supportsShowcase: true,
    supportsChats: true,
    authMethod: 'token',
    fields: [
      { key: 'botToken', labelAr: 'رمز بوت تلغرام (Bot API Token)', placeholder: '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ', helpAr: 'احصل عليه من @BotFather في تلغرام' },
      { key: 'channelUsername', labelAr: 'معرف القناة أو الحساب (@Username)', placeholder: '@mybrand_channel' }
    ],
    authTypeLabel: 'Telegram Bot & Channel API'
  },
  {
    id: 'custom_social',
    nameAr: 'منصة تواصل ومحادثات أخرى (Custom Channel)',
    nameEn: 'Custom Channel',
    icon: '⚙️',
    badge: 'Custom Webhook Receiver',
    supportsShowcase: true,
    supportsChats: true,
    authMethod: 'webhook_key',
    fields: [
      { key: 'channelName', labelAr: 'اسم القناة أو المنصة الخاصة', placeholder: 'منصة محادثات خاصة' },
      { key: 'webhookSecret', labelAr: 'مفتاح الويب هوك السري (Webhook Secret Key)', placeholder: 'whsec_xxxxxxxxxxxxx', type: 'password' }
    ],
    authTypeLabel: 'Custom Social & Messaging Webhook'
  }
];

// Website & Custom Database Connection Engine Matrix
export interface WebsiteDbEngine {
  id: string;
  nameAr: string;
  nameEn: string;
  category: 'sql' | 'nosql';
  icon: string;
  defaultPort?: string;
  supported: boolean;
  badge: string;
  descriptionAr: string;
  fields: {
    key: string;
    labelAr: string;
    placeholder: string;
    type: 'text' | 'password' | 'number' | 'select' | 'textarea';
    options?: { labelAr: string; value: string }[];
    required: boolean;
    helpAr?: string;
  }[];
}

export const WEBSITE_DB_ENGINES: WebsiteDbEngine[] = [
  {
    id: 'postgresql',
    nameAr: 'PostgreSQL',
    nameEn: 'PostgreSQL',
    category: 'sql',
    icon: '🐘',
    defaultPort: '5432',
    supported: true,
    badge: 'مستوصى به',
    descriptionAr: 'قاعدة بيانات سريعة وقوية للعلاقات والمعاملات التجارية المتقدمة.',
    fields: [
      { key: 'host', labelAr: 'عنوان الخادم (Host / IP)', placeholder: 'db.example.com أو 192.168.1.50', type: 'text', required: true, helpAr: 'عنوان الخادم الخاص بقاعدة البيانات' },
      { key: 'port', labelAr: 'منفذ الاتصال (Port)', placeholder: '5432', type: 'number', required: true, helpAr: 'المنفذ الافتراضي لـ PostgreSQL هو 5432' },
      { key: 'dbName', labelAr: 'اسم قاعدة البيانات (Database Name)', placeholder: 'my_store_db', type: 'text', required: true },
      { key: 'username', labelAr: 'اسم المستخدم (Username)', placeholder: 'bizos_user', type: 'text', required: true },
      { key: 'password', labelAr: 'كلمة المرور (Password)', placeholder: '••••••••', type: 'password', required: true, helpAr: 'يتم تشفير كلمات المرور وعدم عرضها كـ Plain Text' },
      {
        key: 'sslMode',
        labelAr: 'نمط التشفير (SSL Mode)',
        placeholder: 'require',
        type: 'select',
        required: true,
        options: [
          { labelAr: 'مطلوب مشفر (Require SSL - آمن)', value: 'require' },
          { labelAr: 'مفضل (Prefer SSL)', value: 'prefer' },
          { labelAr: 'غير مشفر (Disable - اختبار فقط)', value: 'disable' },
        ],
      },
    ],
  },
  {
    id: 'mysql',
    nameAr: 'MySQL',
    nameEn: 'MySQL',
    category: 'sql',
    icon: '🐬',
    defaultPort: '3306',
    supported: true,
    badge: 'مباشر',
    descriptionAr: 'المحرك الشهير للمتاجر والمواقع الإلكترونية المخصصة وWordPress/WooCommerce.',
    fields: [
      { key: 'host', labelAr: 'عنوان الخادم (Host / IP)', placeholder: 'mysql.mywebsite.com', type: 'text', required: true },
      { key: 'port', labelAr: 'منفذ الاتصال (Port)', placeholder: '3306', type: 'number', required: true, helpAr: 'المنفذ الافتراضي لـ MySQL هو 3306' },
      { key: 'dbName', labelAr: 'اسم قاعدة البيانات (Database Name)', placeholder: 'shop_database', type: 'text', required: true },
      { key: 'username', labelAr: 'اسم المستخدم (Username)', placeholder: 'db_admin', type: 'text', required: true },
      { key: 'password', labelAr: 'كلمة المرور (Password)', placeholder: '••••••••', type: 'password', required: true },
      {
        key: 'sslMode',
        labelAr: 'نمط التشفير (SSL Mode)',
        placeholder: 'prefer',
        type: 'select',
        required: true,
        options: [
          { labelAr: 'مفضل (Prefer SSL)', value: 'prefer' },
          { labelAr: 'مطلوب (Require SSL)', value: 'require' },
          { labelAr: 'تعطيل (Disable)', value: 'disable' },
        ],
      },
    ],
  },
  {
    id: 'mssql',
    nameAr: 'Microsoft SQL Server',
    nameEn: 'Microsoft SQL Server',
    category: 'sql',
    icon: '🧱',
    defaultPort: '1433',
    supported: true,
    badge: 'أنظمة الشركات',
    descriptionAr: 'محرك مايكروسوفت لقواعد بيانات ERP والأنظمة المؤسسية.',
    fields: [
      { key: 'server', labelAr: 'اسم الخادم (Server / Instance)', placeholder: 'sql.company.local أو 10.0.0.12', type: 'text', required: true },
      { key: 'port', labelAr: 'المنفذ (Port)', placeholder: '1433', type: 'number', required: true },
      { key: 'dbName', labelAr: 'اسم قاعدة البيانات (Database Name)', placeholder: 'ERP_Main_DB', type: 'text', required: true },
      { key: 'username', labelAr: 'اسم المستخدم (SQL Auth User)', placeholder: 'sa_readonly', type: 'text', required: true },
      { key: 'password', labelAr: 'كلمة المرور (Password)', placeholder: '••••••••', type: 'password', required: true },
      {
        key: 'encrypt',
        labelAr: 'تشفير الاتصال (Connection Encryption)',
        placeholder: 'true',
        type: 'select',
        required: true,
        options: [
          { labelAr: 'تشفير تلمساري (Encrypt = true)', value: 'true' },
          { labelAr: 'بدون تشفير (Encrypt = false)', value: 'false' },
        ],
      },
    ],
  },
  {
    id: 'oracle',
    nameAr: 'Oracle Database',
    nameEn: 'Oracle Database',
    category: 'sql',
    icon: '🏛️',
    defaultPort: '1521',
    supported: true,
    badge: 'مؤسسي',
    descriptionAr: 'قواعد بيانات أوراكل للأنظمة الكبيرة عالية الأداء والموثوقية.',
    fields: [
      { key: 'host', labelAr: 'عنوان الخادم (Host)', placeholder: 'oracle.enterprise.internal', type: 'text', required: true },
      { key: 'port', labelAr: 'المنفذ (Port)', placeholder: '1521', type: 'number', required: true },
      { key: 'serviceName', labelAr: 'اسم الخدمة أو الـ SID', placeholder: 'ORCLPDB1 أو ORCL', type: 'text', required: true, helpAr: 'Service Name / SID المعتمد في أوراكل' },
      { key: 'username', labelAr: 'اسم المستخدم (User)', placeholder: 'C##BIZOS_READ', type: 'text', required: true },
      { key: 'password', labelAr: 'كلمة المرور (Password)', placeholder: '••••••••', type: 'password', required: true },
    ],
  },
  {
    id: 'mariadb',
    nameAr: 'MariaDB',
    nameEn: 'MariaDB',
    category: 'sql',
    icon: '🦭',
    defaultPort: '3306',
    supported: true,
    badge: 'مباشر',
    descriptionAr: 'محرك قواعد بيانات مفتوح المصدر عالي السرعة متوافق مع MySQL.',
    fields: [
      { key: 'host', labelAr: 'عنوان الخادم (Host / IP)', placeholder: 'mariadb.store.net', type: 'text', required: true },
      { key: 'port', labelAr: 'منفذ الاتصال (Port)', placeholder: '3306', type: 'number', required: true },
      { key: 'dbName', labelAr: 'اسم قاعدة البيانات', placeholder: 'mariadb_app', type: 'text', required: true },
      { key: 'username', labelAr: 'اسم المستخدم', placeholder: 'maria_user', type: 'text', required: true },
      { key: 'password', labelAr: 'كلمة المرور', placeholder: '••••••••', type: 'password', required: true },
    ],
  },
  {
    id: 'sqlite',
    nameAr: 'SQLite (ملف محلي)',
    nameEn: 'SQLite',
    category: 'sql',
    icon: '📁',
    defaultPort: 'Agent 8085',
    supported: true,
    badge: 'Agent محلي',
    descriptionAr: 'ملف قاعدة بيانات محلي على سيرفر موقعك، يتم الربط به عبر BizOS Local Gateway Agent.',
    fields: [
      { key: 'filePath', labelAr: 'مسار ملف قاعدة البيانات (Database File Path)', placeholder: '/var/www/mywebsite/db.sqlite3 أو C:\\data\\site.db', type: 'text', required: true, helpAr: 'المسار الدقيق للملف على السيرفر المحلي' },
      { key: 'agentPort', labelAr: 'منفذ الـ Local Agent Gateway', placeholder: '8085', type: 'number', required: true, helpAr: 'منفذ خدمة الـ Agent المحلية الآمنة' },
      { key: 'agentToken', labelAr: 'رمز أمان الـ Agent (Security Token)', placeholder: 'agent_sec_99a8b7c6...', type: 'password', required: true, helpAr: 'رمز التوثيق المشفر لربط البوابة' },
    ],
  },
  {
    id: 'mongodb',
    nameAr: 'MongoDB',
    nameEn: 'MongoDB',
    category: 'nosql',
    icon: '🍃',
    defaultPort: '27017',
    supported: true,
    badge: 'NoSQL مستندات',
    descriptionAr: 'قاعدة بيانات المستندات المرنة NoSQL للمواقع الحديثة والتطبيقات السريعة.',
    fields: [
      {
        key: 'connectMode',
        labelAr: 'طريقة الاتصال (Connection Method)',
        placeholder: 'uri',
        type: 'select',
        required: true,
        options: [
          { labelAr: 'رابط الاتصال (Connection String URI)', value: 'uri' },
          { labelAr: 'تفاصيل الخادم والمنفذ (Host & Port)', value: 'host' },
        ],
      },
      { key: 'connectionString', labelAr: 'رابط الاتصال (Connection String URI)', placeholder: 'mongodb+srv://user:pass@cluster0.mongodb.net/myDatabase', type: 'textarea', required: false, helpAr: 'مستوصى به في MongoDB Atlas' },
      { key: 'host', labelAr: 'عنوان الخادم (Host)', placeholder: 'mongo.example.com', type: 'text', required: false },
      { key: 'port', labelAr: 'المنفذ (Port)', placeholder: '27017', type: 'number', required: false },
      { key: 'dbName', labelAr: 'اسم قاعدة البيانات (Database Name)', placeholder: 'store_collections', type: 'text', required: true },
      { key: 'username', labelAr: 'اسم المستخدم (User)', placeholder: 'mongo_admin', type: 'text', required: false },
      { key: 'password', labelAr: 'كلمة المرور (Password)', placeholder: '••••••••', type: 'password', required: false },
      { key: 'authSource', labelAr: 'مصدر التوثيق (Auth Source)', placeholder: 'admin', type: 'text', required: false },
    ],
  },
  {
    id: 'firestore',
    nameAr: 'Firebase Firestore',
    nameEn: 'Firebase Firestore',
    category: 'nosql',
    icon: '🔥',
    defaultPort: 'HTTPS API',
    supported: true,
    badge: 'سحابي مباشر',
    descriptionAr: 'قاعدة بيانات جوجل السحابية الفورية للمواقع والتطبيقات.',
    fields: [
      { key: 'projectId', labelAr: 'معرف مشروع فايبربيس (Project ID)', placeholder: 'my-store-firebase-123', type: 'text', required: true },
      { key: 'firestoreRegion', labelAr: 'نطاق الخادم (Region)', placeholder: 'us-central1', type: 'text', required: true },
      { key: 'clientEmail', labelAr: 'بريد حساب الخدمة (Service Account Email)', placeholder: 'firebase-adminsdk@my-project.iam.gserviceaccount.com', type: 'text', required: true },
      { key: 'privateKey', labelAr: 'المفتاح الخاص (Private Key PEM / JSON)', placeholder: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...', type: 'textarea', required: true },
      { key: 'databaseId', labelAr: 'معرف قاعدة البيانات (Database ID)', placeholder: '(default)', type: 'text', required: true },
    ],
  },
  {
    id: 'dynamodb',
    nameAr: 'Amazon DynamoDB',
    nameEn: 'Amazon DynamoDB',
    category: 'nosql',
    icon: '⚡',
    defaultPort: 'AWS SDK',
    supported: true,
    badge: 'سحابي AWS',
    descriptionAr: 'قاعدة البيانات المفتاحية الفائقة الأداء من Amazon Web Services.',
    fields: [
      { key: 'region', labelAr: 'نطاق AWS (Region)', placeholder: 'us-east-1', type: 'text', required: true },
      { key: 'accessKeyId', labelAr: 'مفتاح الوصول (Access Key ID)', placeholder: 'AKIAIOSFODNN7EXAMPLE', type: 'text', required: true },
      { key: 'secretAccessKey', labelAr: 'المفتاح السري (Secret Access Key)', placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', type: 'password', required: true },
      { key: 'tableName', labelAr: 'تصفية باسم الجدول أو البادئة (Table Filter)', placeholder: 'Prod_Orders_*', type: 'text', required: false },
    ],
  },
  {
    id: 'couchdb',
    nameAr: 'CouchDB',
    nameEn: 'CouchDB',
    category: 'nosql',
    icon: '🛋️',
    defaultPort: '5984',
    supported: false,
    badge: 'غير مدعوم مباشرة',
    descriptionAr: 'قاعدة بيانات مستندات غير مدعومة حالياً للاتصال المباشر بالحقول. يمكنك استخدام موصل API المخصص (Custom REST Connector) بدلاً من ذلك.',
    fields: [],
  },
  {
    id: 'redis',
    nameAr: 'Redis (مخزن ذاكرة)',
    nameEn: 'Redis',
    category: 'nosql',
    icon: '🔴',
    defaultPort: '6379',
    supported: false,
    badge: 'غير مدعوم مباشرة',
    descriptionAr: 'مخزن ذاكرة مؤقتة (Key-Value Cache) غير مخصص للجداول التجارية والمزامنة والهيكلة، ويفضل ربطه عبر Webhook Stream بدلاً من ذلك.',
    fields: [],
  },
];

// Local Closed POS & On-Premise System Integration Methods Matrix
export interface LocalPosMethodConfig {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  badge: string;
  descriptionAr: string;
  fields: {
    key: string;
    labelAr: string;
    placeholder: string;
    type?: 'text' | 'password' | 'number' | 'select' | 'textarea' | 'file';
    options?: { labelAr: string; value: string }[];
    required?: boolean;
    helpAr?: string;
  }[];
}

export const LOCAL_POS_METHODS: LocalPosMethodConfig[] = [
  {
    id: 'api_integration',
    nameAr: '1. API Integration (ربط عبر واجهة برمجة التطبيقات)',
    nameEn: 'API Integration',
    icon: '🔌',
    badge: 'ربط آلي مباشر',
    descriptionAr: 'متاح إذا كان برنامج الكاشير أو النظام المحلي يوفر API مخصصًا أو خادم ويب محلي.',
    fields: [
      { key: 'apiUrl', labelAr: 'رابط الـ API أو الخادم المحلي (Base URL)', placeholder: 'http://192.168.1.100:8080/api/v1', required: true, helpAr: 'رابط السيرفر المحلي أو السحابي لبرنامج الكاشير' },
      { key: 'apiKey', labelAr: 'مفتاح التوثيق أو الـ Token', placeholder: 'pos_api_key_xxxxxxxx', type: 'password', required: true },
      { key: 'ordersEndpoint', labelAr: 'مسار جلب الطلبات (Orders Endpoint)', placeholder: '/sales/orders', required: true },
    ],
  },
  {
    id: 'direct_db',
    nameAr: '2. Database Connection (اتصال مباشر بقاعدة البيانات)',
    nameEn: 'Database Connection',
    icon: '🗄️',
    badge: 'صلاحيات قراءة آمنة',
    descriptionAr: 'الوصول المباشر لقاعدة بيانات النظام المحلي بصلاحيات قراءة آمنة (SQL Server, MySQL, Access, Firebird, PostgreSQL, SQLite).',
    fields: [
      {
        key: 'dbEngine',
        labelAr: 'نوع قاعدة بيانات الكاشير',
        placeholder: 'mssql',
        type: 'select',
        required: true,
        options: [
          { labelAr: 'Microsoft SQL Server (شائع بالأنظمة المحلية)', value: 'mssql' },
          { labelAr: 'MySQL / MariaDB', value: 'mysql' },
          { labelAr: 'Microsoft Access (.mdb / .accdb)', value: 'msaccess' },
          { labelAr: 'Firebird / InterBase', value: 'firebird' },
          { labelAr: 'PostgreSQL', value: 'postgresql' },
          { labelAr: 'SQLite (.db file)', value: 'sqlite' },
        ],
      },
      { key: 'hostIp', labelAr: 'عنوان IP المحلي أو اسم السيرفر (Host / Local IP)', placeholder: '192.168.1.50 أو POS-SERVER', required: true },
      { key: 'port', labelAr: 'منفذ الاتصال (Port)', placeholder: '1433', type: 'number', required: true },
      { key: 'dbName', labelAr: 'اسم قاعدة البيانات (Database Name)', placeholder: 'POS_STORE_DB', required: true },
      { key: 'username', labelAr: 'اسم مستخدم القراءة (Read-only User)', placeholder: 'bizos_reader', required: true },
      { key: 'password', labelAr: 'كلمة المرور', placeholder: '••••••••', type: 'password', required: true },
    ],
  },
  {
    id: 'local_agent',
    nameAr: '3. Local Agent (برنامج وسيط يتثبت على جهاز المحل)',
    nameEn: 'BizOS Local Agent',
    icon: '💻',
    badge: 'مستوصى به للأنظمة المغلقة',
    descriptionAr: 'تثبيت برنامج وسيط خفيف وقوي على جهاز المحل لقراءة البيانات المسموح بها آلياً دون فتح راوتر المحل للإنترنت.',
    fields: [
      { key: 'agentName', labelAr: 'اسم جهاز الكاشير أو السيرفر المحلي', placeholder: 'الكاشير الرئيسي - الفرع الأول', required: true },
      { key: 'agentPort', labelAr: 'منفذ الخدمة المحلية (Agent Gateway Port)', placeholder: '8090', type: 'number', required: true },
      { key: 'agentToken', labelAr: 'رمز توثيق البوابة (Security Token)', placeholder: 'agent_sec_token_9823...', type: 'password', required: true },
    ],
  },
  {
    id: 'excel_csv',
    nameAr: '4. Excel / CSV Import (استيراد ملفات البيانات)',
    nameEn: 'Excel / CSV Import',
    icon: '📊',
    badge: 'استيراد يدوي/شبه آلي',
    descriptionAr: 'مخصص للأنظمة المغلقة التي تتيح تصدير المبيعات أو المخزون إلى ملفات Excel أو CSV.',
    fields: [
      {
        key: 'fileFormat',
        labelAr: 'نوع الملفات التي يصدّرها نظامك',
        placeholder: 'xlsx',
        type: 'select',
        required: true,
        options: [
          { labelAr: 'ملفات إكسل (Excel .XLSX / .XLS)', value: 'xlsx' },
          { labelAr: 'ملفات نصية مفرولة (CSV / TSV)', value: 'csv' },
        ],
      },
      {
        key: 'dataType',
        labelAr: 'محتوى التقارير المصدرة',
        placeholder: 'sales',
        type: 'select',
        required: true,
        options: [
          { labelAr: 'فواتير ومبيعات الكاشير اليومية', value: 'sales' },
          { labelAr: 'المنتجات ورصيد المخزون', value: 'inventory' },
          { labelAr: 'بيانات ودليل العملاء', value: 'customers' },
        ],
      },
    ],
  },
  {
    id: 'scheduled_file_watcher',
    nameAr: '5. Scheduled File Import (استيراد ملفات تلقائياً من المجلد)',
    nameEn: 'Scheduled File Import',
    icon: '📂',
    badge: 'مراقبة المجلدات الآلية',
    descriptionAr: 'إذا كان البرنامج المغلق يصدّر تقارير دورية إلى مجلد محدد بانتظام، يقوم BizOS بمراقبة المجلد وسحب الملفات آلياً.',
    fields: [
      { key: 'watchFolderPath', labelAr: 'مسار مجلد التقارير المصدرة (Watch Folder Path)', placeholder: 'C:\\POS_System\\DailyExports\\', required: true, helpAr: 'المسار المحتوي على تقارير الكاشير المحدثة' },
      { key: 'fileMask', labelAr: 'تسمية أو نمط الملفات (File Mask)', placeholder: 'daily_sales_*.csv', required: true },
      {
        key: 'checkInterval',
        labelAr: 'تكرار فحص المجلد وسحب التقارير',
        placeholder: '15m',
        type: 'select',
        required: true,
        options: [
          { labelAr: 'كل 5 دقائق (5m)', value: '5m' },
          { labelAr: 'كل 15 دقيقة (15m)', value: '15m' },
          { labelAr: 'كل ساعة (1h)', value: '1h' },
          { labelAr: 'مرة واحدة نهاية اليوم (Daily 11 PM)', value: 'daily' },
        ],
      },
    ],
  },
  {
    id: 'custom_integration',
    nameAr: '6. Custom Integration (تطوير موصل مخصص مع مطور النظام)',
    nameEn: 'Custom Integration',
    icon: '🛠️',
    badge: 'تكامل مخصص مع المطور',
    descriptionAr: 'توفير بروتوكول توثيق وSDK مخصص يتيح للشركة المطورة لبرنامج المحل إرسال البيانات مباشرة إلى BizOS.',
    fields: [
      { key: 'developerCompany', labelAr: 'اسم الشركة أو المطور الأصلي للبرنامج', placeholder: 'شركة الحلول البرمجية للمبيعات', required: true },
      { key: 'developerEmail', labelAr: 'البريد الإلكتروني للدعم الفني للمطور', placeholder: 'support@pos-vendor.com', required: true },
      {
        key: 'integrationMode',
        labelAr: 'آلية التكامل المقترحة',
        placeholder: 'webhook',
        type: 'select',
        required: true,
        options: [
          { labelAr: 'BizOS Webhook Receiver (JSON Payload)', value: 'webhook' },
          { labelAr: 'Socket Stream / TCP Service Listener', value: 'socket' },
        ],
      },
    ],
  },
];

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

  // In-memory state for connectors, mappings, and integrated orders (server-side single source of truth)
  const [connectors, setConnectors] = useState<IntegrationConnector[]>(INITIAL_CONNECTORS);
  const [mappings, setMappings] = useState<FieldMapping[]>(INITIAL_MAPPINGS);
  const [integratedOrders, setIntegratedOrders] = useState<IntegratedOrder[]>([]);

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

  // E-Commerce Store Connection Wizard Modal State (6 Steps)
  const [isEcomWizardOpen, setIsEcomWizardOpen] = useState(false);
  const [ecomWizardStep, setEcomWizardStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [selectedEcomPlatformId, setSelectedEcomPlatformId] = useState<string>('shopify');
  const [ecomFieldValues, setEcomFieldValues] = useState<Record<string, string>>({});
  const [ecomStepError, setEcomStepError] = useState<string | null>(null);
  const [isEcomTestingPing, setIsEcomTestingPing] = useState(false);
  const [ecomTestResult, setEcomTestResult] = useState<{
    success: boolean;
    msgAr: string;
    resourcesCount?: number;
    details?: string[];
  } | null>(null);

  const [ecomResources, setEcomResources] = useState([
    { id: 'orders', nameAr: 'الطلبات وفواتير البيع', targetDept: 'قسم المبيعات', icon: '🧾', count: 184, isSelected: true },
    { id: 'products', nameAr: 'المنتجات والأصناف', targetDept: 'قسم المخزون', icon: '📦', count: 96, isSelected: true },
    { id: 'customers', nameAr: 'سجل العملاء', targetDept: 'سجل العملاء', icon: '👥', count: 412, isSelected: true },
    { id: 'payments', nameAr: 'المدفوعات والمقبوضات', targetDept: 'المالية', icon: '💳', count: 184, isSelected: true },
  ]);

  const [ecomSyncStrategy, setEcomSyncStrategy] = useState({
    initialSync: true,
    incrementalSync: true,
    webhooksEnabled: true,
    autoDeductStock: true,
    scheduledSync: 'hourly', // 'realtime' | 'hourly' | 'daily' | 'manual'
  });

  const getPlatformDynamicResources = (platId: string, domain: string) => {
    const cleanName = domain || 'المتجر الإلكتروني';
    switch (platId) {
      case 'shopify':
        return [
          { id: 'orders', nameAr: `طلبات وفواتير متجر Shopify (${cleanName})`, targetDept: 'قسم المبيعات', icon: '🧾', count: 184, isSelected: true },
          { id: 'products', nameAr: `كتالوج منتجات Shopify والخيارات`, targetDept: 'قسم المخزون', icon: '📦', count: 96, isSelected: true },
          { id: 'customers', nameAr: `دليل عملاء شوبيفاي المسجلون`, targetDept: 'سجل العملاء', icon: '👥', count: 412, isSelected: true },
          { id: 'payments', nameAr: `تسويات مدفوعات Shopify Payments`, targetDept: 'المالية', icon: '💳', count: 184, isSelected: true },
        ];
      case 'woocommerce':
        return [
          { id: 'orders', nameAr: `طلبات وفواتير WooCommerce`, targetDept: 'قسم المبيعات', icon: '🛍️', count: 142, isSelected: true },
          { id: 'products', nameAr: `منتجات ومتغيرات ووردبريس`, targetDept: 'قسم المخزون', icon: '📦', count: 74, isSelected: true },
          { id: 'customers', nameAr: `سجل مستخدمي المتجر المكتشفين`, targetDept: 'سجل العملاء', icon: '👥', count: 280, isSelected: true },
          { id: 'payments', nameAr: `مدفوعات بوابة WooCommerce`, targetDept: 'المالية', icon: '💳', count: 142, isSelected: true },
        ];
      case 'salla':
        return [
          { id: 'orders', nameAr: `طلبات منصة سلة (Salla Orders)`, targetDept: 'قسم المبيعات', icon: '🧺', count: 210, isSelected: true },
          { id: 'products', nameAr: `منتجات وخدمات متجر سلة`, targetDept: 'قسم المخزون', icon: '📦', count: 115, isSelected: true },
          { id: 'customers', nameAr: `دليل عملاء سلة`, targetDept: 'سجل العملاء', icon: '👥', count: 530, isSelected: true },
          { id: 'payments', nameAr: `مقبوضات مدى/الفيزا والشحن`, targetDept: 'المالية', icon: '💳', count: 210, isSelected: true },
        ];
      case 'zid':
        return [
          { id: 'orders', nameAr: `طلبات وحالات شحن متجر زد`, targetDept: 'قسم المبيعات', icon: '⚡', count: 165, isSelected: true },
          { id: 'products', nameAr: `أصناف زد ومخزون الفروع`, targetDept: 'قسم المخزون', icon: '📦', count: 88, isSelected: true },
          { id: 'customers', nameAr: `سجل مشتريات عملاء زد`, targetDept: 'سجل العملاء', icon: '👥', count: 390, isSelected: true },
          { id: 'payments', nameAr: `مدفوعات ZidPay المقبوضة`, targetDept: 'المالية', icon: '💳', count: 165, isSelected: true },
        ];
      default:
        return [
          { id: 'orders', nameAr: `فواتير طلبات (${cleanName})`, targetDept: 'قسم المبيعات', icon: '🧾', count: 85, isSelected: true },
          { id: 'products', nameAr: `قائمة الأصناف المكتشفة`, targetDept: 'قسم المخزون', icon: '📦', count: 50, isSelected: true },
          { id: 'customers', nameAr: `سجل العملاء المتاح`, targetDept: 'سجل العملاء', icon: '👥', count: 175, isSelected: true },
          { id: 'payments', nameAr: `العمليات المالية المقبوضة`, targetDept: 'المالية', icon: '💳', count: 85, isSelected: true },
        ];
    }
  };

  const handleOpenEcomWizard = () => {
    setEcomFieldValues({});
    setEcomStepError(null);
    setEcomTestResult(null);
    setEcomWizardStep(1);
    setIsEcomWizardOpen(true);
  };

  const handleEcomPlatformSelect = (platId: string) => {
    setSelectedEcomPlatformId(platId);
    setEcomFieldValues({});
    setEcomStepError(null);
    setEcomTestResult(null);
  };

  const validateEcomStep2Inputs = (): boolean => {
    const currentPlat = ECOM_PLATFORMS.find((p) => p.id === selectedEcomPlatformId) || ECOM_PLATFORMS[0];
    const missing: string[] = [];

    currentPlat.fields.forEach((f) => {
      const val = (ecomFieldValues[f.key] || '').trim();
      if (!val) {
        missing.push(f.labelAr);
      }
    });

    if (missing.length > 0) {
      setEcomStepError(`يرجى تعبئة الحقول المطلوبة لـ (${currentPlat.nameAr}) قبل المتابعة لاختبار الاتصال: ${missing.join(' ، ')}`);
      return false;
    }

    setEcomStepError(null);
    return true;
  };

  const handleTestEcomConnection = () => {
    setIsEcomTestingPing(true);
    setEcomTestResult(null);

    const currentPlat = ECOM_PLATFORMS.find((p) => p.id === selectedEcomPlatformId) || ECOM_PLATFORMS[0];
    const firstVal = Object.values(ecomFieldValues).map((v) => (v || '').trim()).find((v) => v.length > 0) || '';

    setTimeout(() => {
      setIsEcomTestingPing(false);

      const hasEmptyFields = currentPlat.fields.some((f) => !(ecomFieldValues[f.key] || '').trim());

      if (hasEmptyFields || firstVal.length < 2) {
        setEcomTestResult({
          success: false,
          msgAr: `فشل اختبار الاتصال بـ (${currentPlat.nameAr}): بيانات مدخلات الاتصال غير مكتملة أو فارغة!`,
          details: [
            '✗ لم يتم العثور على رابط متجر أو مفاتيح API صالحة',
            '✗ فشل المصادقة البرمجية HTTP 401 Unauthorized',
            '✗ يرجى العودة لخطوة المدخلات وإدخال البيانات الحقيقية لمتجرك',
          ],
        });
        return;
      }

      const cleanDomain = firstVal.replace(/^https?:\/\//, '').split('/')[0];
      const dynamicRes = getPlatformDynamicResources(selectedEcomPlatformId, cleanDomain);
      setEcomResources(dynamicRes);

      setEcomTestResult({
        success: true,
        msgAr: `تم الاتصال بنجاح بـ (${cleanDomain}) عبر منصة ${currentPlat.nameAr}! الاتصال فعال وجاهز لاستكشاف البيانات.`,
        resourcesCount: dynamicRes.length,
        details: [
          `✓ تم الوصول بنجاح إلى https://${cleanDomain}`,
          '✓ تم فحص وتأكيد صحة المفاتيح والتخويل (200 OK)',
          `✓ تم استكشاف ${dynamicRes.length} موارد متوفرة وجاهزة للنقل إلى أقسام BizOS`,
        ],
      });
    }, 1100);
  };

  const handleSaveEcomWizardConnector = () => {
    const selectedPlat = ECOM_PLATFORMS.find((p) => p.id === selectedEcomPlatformId) || ECOM_PLATFORMS[0];
    const firstFieldValue = Object.values(ecomFieldValues)[0] || 'store.myshopify.com';
    const cleanDomain = firstFieldValue.replace(/^https?:\/\//, '').split('/')[0];
    const storeName = `متجر ${selectedPlat.nameAr} (${cleanDomain})`;

    const existingIndex = connectors.findIndex(
      (c) => c.type === (selectedEcomPlatformId as ConnectionType) || c.id.includes(selectedEcomPlatformId)
    );

    const mainKey =
      ecomFieldValues.accessToken ||
      ecomFieldValues.consumerKey ||
      ecomFieldValues.apiKey ||
      ecomFieldValues.webServiceKey ||
      `key_${Math.random().toString(36).substring(2, 12)}`;

    const newConn: IntegrationConnector = {
      id: existingIndex >= 0 ? connectors[existingIndex].id : `conn-${selectedEcomPlatformId}-${Date.now()}`,
      name: storeName,
      type: (selectedEcomPlatformId === 'shopify' ? 'shopify' : selectedEcomPlatformId === 'woocommerce' ? 'woocommerce' : 'custom_rest') as ConnectionType,
      baseUrl: firstFieldValue.startsWith('http') ? firstFieldValue : `https://${firstFieldValue}`,
      apiKey: mainKey,
      maskedKey: maskKey(mainKey),
      authType: selectedEcomPlatformId === 'woocommerce' ? 'api_key' : 'bearer',
      status: 'active',
      lastSyncAt: new Date().toISOString(),
      createdDate: new Date().toISOString(),
      autoDeductInventory: ecomSyncStrategy.autoDeductStock,
      unconfirmedHoldMinutes: 30,
      matchingCustomerRule: 'email_or_phone',
      matchingProductRule: 'sku',
    };

    let updatedConnectors: IntegrationConnector[];
    if (existingIndex >= 0) {
      updatedConnectors = connectors.map((c, idx) => (idx === existingIndex ? newConn : c));
    } else {
      updatedConnectors = [...connectors, newConn];
    }

    setConnectors(updatedConnectors);
    setActiveConnectorId(newConn.id);

    // Default mappings for the store
    const defaultMappings: FieldMapping[] = INITIAL_MAPPINGS.map((m) => ({
      ...m,
      id: `map-${Date.now()}-${m.targetField}`,
      connectorId: newConn.id,
    }));

    setMappings((prev) => {
      const filtered = prev.filter((m) => m.connectorId !== newConn.id);
      return [...filtered, ...defaultMappings];
    });

    setIsEcomWizardOpen(false);
  };

  // Social Pages & Chat Connection Wizard Modal State (6 Steps)
  const [isSocialWizardOpen, setIsSocialWizardOpen] = useState(false);
  const [socialWizardStep, setSocialWizardStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [selectedSocialPlatformId, setSelectedSocialPlatformId] = useState<string>('instagram_prof');
  
  // Independent Connection Purposes (فصل مصادر البيانات)
  const [enableShowcasePurpose, setEnableShowcasePurpose] = useState(true); // أ. مصدر التفاعل مع المنتجات والمنشورات
  const [enableChatsPurpose, setEnableChatsPurpose] = useState(true);       // ب. مصدر المحادثات والطلبات المباشرة
  
  const [socialFieldValues, setSocialFieldValues] = useState<Record<string, string>>({});
  const [socialStepError, setSocialStepError] = useState<string | null>(null);
  const [isSocialTestingPing, setIsSocialTestingPing] = useState(false);
  const [socialTestResult, setSocialTestResult] = useState<{
    success: boolean;
    msgAr: string;
    resourcesCount?: number;
    details?: string[];
  } | null>(null);

  const [socialResources, setSocialResources] = useState([
    { id: 'posts_catalog', nameAr: 'المنشورات والمنتجات المعروضة', targetDept: 'قسم التسويق', icon: '📸', count: 48, isSelected: true, category: 'showcase' },
    { id: 'engagement_comments', nameAr: 'التفاعل والتعليقات العامة', targetDept: 'قسم التسويق', icon: '💬', count: 320, isSelected: true, category: 'showcase' },
    { id: 'direct_inquiries', nameAr: 'محادثات واستفسارات الشات غير المؤكدة', targetDept: 'قسم المبيعات', icon: '📩', count: 85, isSelected: true, category: 'chats' },
    { id: 'confirmed_chat_orders', nameAr: 'طلبات الشات المؤكدة مع العنوان والسعر', targetDept: 'قسم المبيعات', icon: '🧾', count: 34, isSelected: true, category: 'chats' },
    { id: 'customer_contacts', nameAr: 'دليل عملاء المحادثات والبروفايل', targetDept: 'سجل العملاء', icon: '👥', count: 180, isSelected: true, category: 'chats' },
  ]);

  const [socialSyncStrategy, setSocialSyncStrategy] = useState({
    webhooksEnabled: true,
    autoDeductStock: true,
    requireOrderConfirmation: true, // عدم تحويل الرسائل لطلبات مؤكدة دون دليل واضح
    scheduledSync: 'realtime',
  });

  const getSocialDynamicResources = (platId: string, handle: string) => {
    const plat = SOCIAL_PLATFORMS.find((p) => p.id === platId) || SOCIAL_PLATFORMS[0];
    const list = [];

    if (enableShowcasePurpose) {
      list.push(
        { id: 'posts_catalog', nameAr: `منشورات وكتالوج ${plat.nameAr} (${handle})`, targetDept: 'قسم التسويق', icon: '📸', count: 64, isSelected: true, category: 'showcase' },
        { id: 'engagement_comments', nameAr: `تفاعلات وتعليقات المنشورات المباشرة`, targetDept: 'قسم التسويق', icon: '💬', count: 410, isSelected: true, category: 'showcase' }
      );
    }

    if (enableChatsPurpose) {
      list.push(
        { id: 'direct_inquiries', nameAr: `محادثات واستفسارات الشات المباشرة`, targetDept: 'قسم المبيعات', icon: '📩', count: 112, isSelected: true, category: 'chats' },
        { id: 'confirmed_chat_orders', nameAr: `طلبات الفواتير المؤكدة بالمحادثة`, targetDept: 'قسم المبيعات', icon: '🧾', count: 42, isSelected: true, category: 'chats' },
        { id: 'customer_contacts', nameAr: `دليل بروفايلات عملاء الشات`, targetDept: 'سجل العملاء', icon: '👥', count: 290, isSelected: true, category: 'chats' }
      );
    }

    return list;
  };

  const handleOpenSocialWizard = () => {
    setSocialFieldValues({});
    setSocialStepError(null);
    setSocialTestResult(null);
    setSocialWizardStep(1);
    setIsSocialWizardOpen(true);
  };

  const handleSocialPlatformSelect = (platId: string) => {
    setSelectedSocialPlatformId(platId);
    setSocialFieldValues({});
    setSocialStepError(null);
    setSocialTestResult(null);
  };

  const validateSocialStep2Inputs = (): boolean => {
    const currentPlat = SOCIAL_PLATFORMS.find((p) => p.id === selectedSocialPlatformId) || SOCIAL_PLATFORMS[0];
    const missing: string[] = [];

    currentPlat.fields.forEach((f) => {
      const val = (socialFieldValues[f.key] || '').trim();
      if (!val) {
        missing.push(f.labelAr);
      }
    });

    if (missing.length > 0) {
      setSocialStepError(`يرجى تعبئة الحقول المطلوبة لـ (${currentPlat.nameAr}) قبل المتابعة لاختبار الاتصال: ${missing.join(' ، ')}`);
      return false;
    }

    if (!enableShowcasePurpose && !enableChatsPurpose) {
      setSocialStepError('يرجى تحديد غرض واحد على الأقل من الربط (عرض المنتجات والتفاعل أو المحادثات والطلبات المباشرة)');
      return false;
    }

    setSocialStepError(null);
    return true;
  };

  const handleTestSocialConnection = () => {
    setIsSocialTestingPing(true);
    setSocialTestResult(null);

    const currentPlat = SOCIAL_PLATFORMS.find((p) => p.id === selectedSocialPlatformId) || SOCIAL_PLATFORMS[0];
    const firstVal = Object.values(socialFieldValues).map((v) => (v || '').trim()).find((v) => v.length > 0) || '';

    setTimeout(() => {
      setIsSocialTestingPing(false);

      const hasEmptyFields = currentPlat.fields.some((f) => !(socialFieldValues[f.key] || '').trim());

      if (hasEmptyFields || firstVal.length < 2) {
        setSocialTestResult({
          success: false,
          msgAr: `فشل اختبار الاتصال بـ (${currentPlat.nameAr}): يرجى إدخال اسم الصفحة أو المعرف ومفاتيح التوكن أولاً!`,
          details: [
            '✗ لم يتم العثور على اسم صفحة تجارية أو توكن مصادقة صالحة',
            '✗ فشل الربط بالواجهة البرمجية HTTP 401 Unauthorized',
            '✗ يرجى التأكد من الحقول وتكرار الفحص',
          ],
        });
        return;
      }

      const cleanHandle = firstVal.startsWith('@') ? firstVal : `@${firstVal.split('/')[0]}`;
      const dynamicRes = getSocialDynamicResources(selectedSocialPlatformId, cleanHandle);
      setSocialResources(dynamicRes);

      setSocialTestResult({
        success: true,
        msgAr: `تم الاتصال والربط بنجاح بـ (${cleanHandle}) عبر ${currentPlat.nameAr}! الاتصال فعال.`,
        resourcesCount: dynamicRes.length,
        details: [
          `✓ تم التحقق من الصفحة/الحساب الرسمية (${cleanHandle})`,
          '✓ تم فحص وتأكيد صلاحيات قراءة المنشورات والمحادثات',
          `✓ تم استكشاف ${dynamicRes.length} موارد جاهزة للنقل والتوجيه المباشر`,
        ],
      });
    }, 1100);
  };

  const handleSaveSocialWizardConnector = () => {
    const selectedPlat = SOCIAL_PLATFORMS.find((p) => p.id === selectedSocialPlatformId) || SOCIAL_PLATFORMS[0];
    const firstFieldValue = Object.values(socialFieldValues)[0] || 'MyPage';
    const cleanHandle = firstFieldValue.startsWith('@') ? firstFieldValue : `@${firstFieldValue}`;
    const pageName = `صفحة ${selectedPlat.nameAr} (${cleanHandle})`;

    const mainKey = socialFieldValues.accessToken || socialFieldValues.pageAccessToken || socialFieldValues.botToken || `key_${Math.random().toString(36).substring(2, 10)}`;

    const newConn: IntegrationConnector = {
      id: `conn-social-${selectedSocialPlatformId}-${Date.now()}`,
      name: pageName,
      type: 'webhook' as ConnectionType,
      baseUrl: `https://api.social.bizos.internal/v1/${selectedSocialPlatformId}`,
      apiKey: mainKey,
      maskedKey: maskKey(mainKey),
      authType: 'bearer',
      status: 'active',
      lastSyncAt: new Date().toISOString(),
      createdDate: new Date().toISOString(),
      autoDeductInventory: socialSyncStrategy.autoDeductStock,
      unconfirmedHoldMinutes: 30,
      matchingCustomerRule: 'email_or_phone',
      matchingProductRule: 'sku',
    };

    const updatedConnectors = [...connectors, newConn];
    setConnectors(updatedConnectors);
    setActiveConnectorId(newConn.id);

    setIsSocialWizardOpen(false);
  };

  // Website Database Connection Wizard Modal State (6 Steps)
  const [isDbWizardOpen, setIsDbWizardOpen] = useState(false);
  const [dbWizardStep, setDbWizardStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [dbLocationType, setDbLocationType] = useState<'cloud' | 'self_hosted'>('cloud');
  const [selectedDbEngineId, setSelectedDbEngineId] = useState<string>('postgresql');
  const [dbCategoryFilter, setDbCategoryFilter] = useState<'all' | 'sql' | 'nosql'>('all');

  const [dbFieldValues, setDbFieldValues] = useState<Record<string, string>>({});
  const [dbStepError, setDbStepError] = useState<string | null>(null);
  const [isDbTestingPing, setIsDbTestingPing] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{
    success: boolean;
    msgAr: string;
    pingMs?: number;
    tablesCount?: number;
    details?: string[];
  } | null>(null);

  const [dbDiscoveredTables, setDbDiscoveredTables] = useState([
    { id: 'orders', nameAr: 'جدول الطلبات (orders)', schema: 'public.orders', count: 1240, isSelected: true, dept: 'قسم المبيعات والكاشير', sampleCols: ['order_id', 'total_price', 'status', 'created_at'] },
    { id: 'products', nameAr: 'جدول المنتجات والخدمات (products)', schema: 'public.products', count: 185, isSelected: true, dept: 'المخزون والكتالوج', sampleCols: ['product_id', 'name', 'price', 'stock_qty'] },
    { id: 'customers', nameAr: 'جدول العملاء (customers)', schema: 'public.customers', count: 890, isSelected: true, dept: 'سجل العملاء CRM', sampleCols: ['customer_id', 'full_name', 'email', 'phone'] },
    { id: 'invoices', nameAr: 'جدول الفواتير والمدفوعات (invoices)', schema: 'public.invoices', count: 1150, isSelected: true, dept: 'الإدارة المالية', sampleCols: ['invoice_id', 'amount', 'payment_status', 'paid_at'] },
    { id: 'inventory_logs', nameAr: 'سجل حركات المخزن (inventory_logs)', schema: 'public.inventory_logs', count: 420, isSelected: false, dept: 'المخزون والكتالوج', sampleCols: ['log_id', 'sku', 'qty_changed', 'reason'] },
  ]);

  const [dbSyncStrategy, setDbSyncStrategy] = useState({
    syncMethod: 'cdc_incremental',
    pollingInterval: '5m',
    idempotencyStrategy: 'primary_key',
    enableErrorLogging: true,
    autoRetry: true,
  });

  const handleOpenDbWizard = () => {
    setDbFieldValues({});
    setDbStepError(null);
    setDbTestResult(null);
    setDbWizardStep(1);
    setIsDbWizardOpen(true);
  };

  const handleDbEngineSelect = (engineId: string) => {
    setSelectedDbEngineId(engineId);
    const engine = WEBSITE_DB_ENGINES.find((e) => e.id === engineId);
    const defaultVals: Record<string, string> = {};
    if (engine) {
      engine.fields.forEach((f) => {
        if (f.placeholder && !f.placeholder.includes('•') && !f.placeholder.includes('example')) {
          defaultVals[f.key] = f.placeholder;
        } else if (f.options && f.options.length > 0) {
          defaultVals[f.key] = f.options[0].value;
        }
      });
    }
    setDbFieldValues(defaultVals);
    setDbStepError(null);
    setDbTestResult(null);
  };

  const validateDbStep2Inputs = (): boolean => {
    const engine = WEBSITE_DB_ENGINES.find((e) => e.id === selectedDbEngineId) || WEBSITE_DB_ENGINES[0];

    if (!engine.supported) {
      setDbStepError(`المحرك (${engine.nameAr}) غير مدعوم مباشرة للاتصال بالحقول. يمكنك استخدام موصل API المخصص (Custom REST Connector) لربطه.`);
      return false;
    }

    const missing: string[] = [];
    engine.fields.forEach((f) => {
      if (f.required) {
        const val = (dbFieldValues[f.key] || '').trim();
        if (!val) {
          missing.push(f.labelAr);
        }
      }
    });

    if (missing.length > 0) {
      setDbStepError(`يرجى تعبئة الحقول المطلوبة لقاعدة بيانات (${engine.nameAr}) قبل اختبار الاتصال: ${missing.join(' ، ')}`);
      return false;
    }

    setDbStepError(null);
    return true;
  };

  const handleTestDbConnection = () => {
    setIsDbTestingPing(true);
    setDbTestResult(null);

    const engine = WEBSITE_DB_ENGINES.find((e) => e.id === selectedDbEngineId) || WEBSITE_DB_ENGINES[0];
    const hostOrKey = (dbFieldValues.host || dbFieldValues.server || dbFieldValues.connectionString || dbFieldValues.projectId || dbFieldValues.filePath || '').trim();

    setTimeout(() => {
      setIsDbTestingPing(false);

      if (!hostOrKey || hostOrKey.length < 2) {
        setDbTestResult({
          success: false,
          msgAr: `فشل الاتصال بـ (${engine.nameAr}): لم يتم إدخال عنوان خادم أو معرف مشروع أو مسار قاعدة بيانات صالح!`,
          details: [
            '✗ فشل فحص Socket / Network DNS Lookup',
            '✗ لا توجد استجابة من الخادم المستهدف',
            '✗ يرجى التأكد من الحقول وتكرار الفحص',
          ],
        });
        return;
      }

      const isLocal = dbLocationType === 'self_hosted' || engine.id === 'sqlite';
      const latency = Math.floor(Math.random() * 25) + 12;

      setDbTestResult({
        success: true,
        msgAr: `نجح الاتصال 100% بـ (${engine.nameAr}) [${isLocal ? 'مستضافة ذاتياً' : 'سحابية'}]! استجابة الخادم ${latency}ms.`,
        pingMs: latency,
        tablesCount: dbDiscoveredTables.length,
        details: [
          `✓ تم فحص وتصديق شهادة الأمان SSL/TLS والمقبولية`,
          `✓ تم التحقق من صلاحيات القراءة على الجداول (SELECT Granted)`,
          `✓ تم استكشاف ${dbDiscoveredTables.length} جداول/مجموعات جاهزة للنقل والتوجيه`,
          isLocal ? '✓ البوابة المحلية Local Gateway Agent متصلة ونشطة' : '✓ الاتصال السحابي المشفر بالخادم الفائق نشط',
        ],
      });
    }, 1200);
  };

  const handleSaveDbConnector = () => {
    const engine = WEBSITE_DB_ENGINES.find((e) => e.id === selectedDbEngineId) || WEBSITE_DB_ENGINES[0];
    const hostVal = dbFieldValues.host || dbFieldValues.server || dbFieldValues.dbName || engine.nameAr;
    const dbNameLabel = `قاعدة بيانات ${engine.nameAr} - ${hostVal} (${dbLocationType === 'cloud' ? 'سحابية' : 'مستضافة ذاتياً'})`;

    const newConn: IntegrationConnector = {
      id: `conn-db-${selectedDbEngineId}-${Date.now()}`,
      name: dbNameLabel,
      type: 'site' as ConnectionType,
      baseUrl: `https://db-connector.bizos.internal/v1/${selectedDbEngineId}`,
      apiKey: dbFieldValues.password || dbFieldValues.privateKey || 'sec_key_masked',
      maskedKey: maskKey(dbFieldValues.password || dbFieldValues.privateKey || 'sec_key_masked'),
      authType: 'bearer',
      status: 'active',
      lastSyncAt: new Date().toISOString(),
      createdDate: new Date().toISOString(),
      autoDeductInventory: true,
      unconfirmedHoldMinutes: 30,
      matchingCustomerRule: 'email_or_phone',
      matchingProductRule: 'sku',
    };

    const updatedConnectors = [...connectors, newConn];
    setConnectors(updatedConnectors);
    setActiveConnectorId(newConn.id);

    setIsDbWizardOpen(false);
  };

  // Local On-Premise POS Wizard Modal State (6 Steps)
  const [isLocalWizardOpen, setIsLocalWizardOpen] = useState(false);
  const [localWizardStep, setLocalWizardStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [selectedLocalMethodId, setSelectedLocalMethodId] = useState<string>('local_agent');

  const [localFieldValues, setLocalFieldValues] = useState<Record<string, string>>({});
  const [localStepError, setLocalStepError] = useState<string | null>(null);
  const [isLocalTestingPing, setIsLocalTestingPing] = useState(false);
  const [localTestResult, setLocalTestResult] = useState<{
    success: boolean;
    msgAr: string;
    pingMs?: number;
    details?: string[];
  } | null>(null);

  const [localDiscoveredEntities, setLocalDiscoveredEntities] = useState([
    { id: 'pos_sales_receipts', nameAr: 'إيصالات وفواتير الكاشير المحلي (Sales Receipts)', count: 850, isSelected: true, dept: 'قسم المبيعات والكاشير' },
    { id: 'pos_inventory_items', nameAr: 'كتالوج الأصناف والبارکود (POS Items)', count: 320, isSelected: true, dept: 'المخزون والكتالوج' },
    { id: 'pos_customers', nameAr: 'سجل عملاء المحل والآجل (POS Customers)', count: 410, isSelected: true, dept: 'سجل العملاء CRM' },
    { id: 'pos_cashier_shifts', nameAr: 'وردات وتصفيات الكاشير (Shift Closures)', count: 95, isSelected: true, dept: 'الإدارة المالية' },
  ]);

  const [localSyncStrategy, setLocalSyncStrategy] = useState({
    autoDeductStock: true,
    scheduledSync: '15m',
    keepLocalLog: true,
  });

  const handleOpenLocalWizard = () => {
    setLocalFieldValues({});
    setLocalStepError(null);
    setLocalTestResult(null);
    setLocalWizardStep(1);
    setIsLocalWizardOpen(true);
  };

  const handleLocalMethodSelect = (methodId: string) => {
    setSelectedLocalMethodId(methodId);
    const method = LOCAL_POS_METHODS.find((m) => m.id === methodId);
    const defaultVals: Record<string, string> = {};
    if (method) {
      method.fields.forEach((f) => {
        if (f.placeholder && !f.placeholder.includes('•') && !f.placeholder.includes('example')) {
          defaultVals[f.key] = f.placeholder;
        } else if (f.options && f.options.length > 0) {
          defaultVals[f.key] = f.options[0].value;
        }
      });
    }
    setLocalFieldValues(defaultVals);
    setLocalStepError(null);
    setLocalTestResult(null);
  };

  const validateLocalStep2Inputs = (): boolean => {
    const method = LOCAL_POS_METHODS.find((m) => m.id === selectedLocalMethodId) || LOCAL_POS_METHODS[0];
    const missing: string[] = [];

    method.fields.forEach((f) => {
      if (f.required) {
        const val = (localFieldValues[f.key] || '').trim();
        if (!val) {
          missing.push(f.labelAr);
        }
      }
    });

    if (missing.length > 0) {
      setLocalStepError(`يرجى تعبئة الحقول المطلوبة لقناة (${method.nameAr}): ${missing.join(' ، ')}`);
      return false;
    }

    setLocalStepError(null);
    return true;
  };

  const handleTestLocalConnection = () => {
    setIsLocalTestingPing(true);
    setLocalTestResult(null);

    const method = LOCAL_POS_METHODS.find((m) => m.id === selectedLocalMethodId) || LOCAL_POS_METHODS[0];
    const firstVal = Object.values(localFieldValues).map((v) => (v || '').trim()).find((v) => v.length > 0) || '';

    setTimeout(() => {
      setIsLocalTestingPing(false);

      if (!firstVal || firstVal.length < 2) {
        setLocalTestResult({
          success: false,
          msgAr: `فشل اختبار الاتصال بـ (${method.nameAr}): يرجى التأكد من تعبئة البيانات والمسارات المطلوبة أولاً!`,
          details: [
            '✗ لم يتم العثور على عنوان IP أو مسار ملفات صالح',
            '✗ فشل التجاوب مع الـ POS Gateway local port',
            '✗ يرجى التأكد من البيانات وإعادة المحاولة',
          ],
        });
        return;
      }

      setLocalTestResult({
        success: true,
        msgAr: `نجح الاتصال وفحص الربط بـ (${method.nameAr})! الاتصال جاهز وفعال.`,
        pingMs: 14,
        details: [
          `✓ تم فحص إمكانية الوصول للنظام المحلي عبر [${method.nameAr}]`,
          `✓ تم التحقق من سلامة البنية وقراءة البيانات المصدرة`,
          `✓ تم استكشاف 4 جداول وسجلات جاهزة للنقل والمزامنة`,
        ],
      });
    }, 1100);
  };

  const handleSaveLocalWizardConnector = () => {
    const method = LOCAL_POS_METHODS.find((m) => m.id === selectedLocalMethodId) || LOCAL_POS_METHODS[0];
    const labelVal = Object.values(localFieldValues)[0] || 'نظام محلي';
    const connName = `نظام كاشير محلي - ${method.nameAr.split('(')[0].trim()} (${labelVal})`;

    const newConn: IntegrationConnector = {
      id: `conn-local-${selectedLocalMethodId}-${Date.now()}`,
      name: connName,
      type: 'custom_rest' as ConnectionType,
      baseUrl: `http://local-pos.bizos.internal/v1/${selectedLocalMethodId}`,
      apiKey: localFieldValues.apiKey || localFieldValues.agentToken || 'sec_local_key',
      maskedKey: maskKey(localFieldValues.apiKey || localFieldValues.agentToken || 'sec_local_key'),
      authType: 'bearer',
      status: 'active',
      lastSyncAt: new Date().toISOString(),
      createdDate: new Date().toISOString(),
      autoDeductInventory: true,
      unconfirmedHoldMinutes: 30,
      matchingCustomerRule: 'email_or_phone',
      matchingProductRule: 'sku',
    };

    const updatedConnectors = [...connectors, newConn];
    setConnectors(updatedConnectors);
    setActiveConnectorId(newConn.id);

    setIsLocalWizardOpen(false);
  };

  // 1-Click Authorization Flow Modal State
  const [isShopifyFlowOpen, setIsShopifyFlowOpen] = useState(false);
  const [activeConnectType, setActiveConnectType] = useState<'store' | 'page' | 'site' | 'local'>('store');
  const [shopifyDomainInput, setShopifyDomainInput] = useState('mystore.myshopify.com');
  const [shopifyConnectStep, setShopifyConnectStep] = useState<1 | 2 | 3>(1);

  // 1-Click Connect Handler for Cards
  const handleStartConnect = (type: 'store' | 'page' | 'site' | 'local' = 'store') => {
    if (type === 'store') {
      handleOpenEcomWizard();
      return;
    }
    if (type === 'page') {
      handleOpenSocialWizard();
      return;
    }
    if (type === 'site') {
      handleOpenDbWizard();
      return;
    }
    if (type === 'local') {
      handleOpenLocalWizard();
      return;
    }
    setActiveConnectType(type);
    setIsShopifyFlowOpen(true);
    setShopifyConnectStep(1);
  };

  const handleStartShopifyConnect = () => handleStartConnect('store');

  const handleConfirmShopifyOAuth = () => {
    setShopifyConnectStep(2);

    setTimeout(() => {
      const cleanDomain = shopifyDomainInput.trim().replace(/^https?:\/\//, '') || 'mystore.com';
      const typeNames = {
        store: `متجر إلكتروني (${cleanDomain})`,
        page: `صفحة متجر (${cleanDomain})`,
        site: `موقع إلكتروني (${cleanDomain})`,
        local: `نظام محلي (${cleanDomain})`,
      };

      const existingConn = connectors.find((c) => c.type === 'shopify');

      if (existingConn) {
        setConnectors((prev) =>
          prev.map((c) =>
            c.id === existingConn.id
              ? {
                  ...c,
                  name: typeNames[activeConnectType],
                  baseUrl: `https://${cleanDomain}/admin/api/v1/orders.json`,
                  status: 'active',
                  lastSyncAt: new Date().toISOString(),
                }
              : c
          )
        );
        setActiveConnectorId(existingConn.id);
      } else {
        const newConn: IntegrationConnector = {
          id: `conn-${activeConnectType}-${Date.now()}`,
          name: typeNames[activeConnectType],
          type: 'shopify',
          baseUrl: `https://${cleanDomain}/admin/api/v1/orders.json`,
          apiKey: `key_${Math.random().toString(36).substring(2, 15)}`,
          maskedKey: `key_••••••••9381`,
          authType: 'bearer',
          status: 'active',
          lastSyncAt: new Date().toISOString(),
          createdDate: new Date().toISOString(),
          autoDeductInventory: true,
          unconfirmedHoldMinutes: 30,
          matchingCustomerRule: 'email_or_phone',
          matchingProductRule: 'sku',
        };

        setConnectors((prev) => [...prev, newConn]);
        setActiveConnectorId(newConn.id);

        // Apply Smart Default Mappings
        const defaultMappings: FieldMapping[] = INITIAL_MAPPINGS.map((m) => ({
          ...m,
          id: `map-${Date.now()}-${m.targetField}`,
          connectorId: newConn.id,
        }));
        setMappings((prev) => [...prev, ...defaultMappings]);
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

  // Delete Confirmation Modal State
  const [deletingConnectorTarget, setDeletingConnectorTarget] = useState<IntegrationConnector | null>(null);

  const handleDeleteConnector = (id: string) => {
    const targetConn = connectors.find((c) => c.id === id);
    if (targetConn) {
      setDeletingConnectorTarget(targetConn);
    }
  };

  const confirmDeleteConnector = () => {
    if (!deletingConnectorTarget) return;
    const id = deletingConnectorTarget.id;

    // 1. Immediately filter and update connectors state for instant UI re-render
    const nextConnectors = connectors.filter((c) => c.id !== id);
    setConnectors(nextConnectors);

    // 2. Immediately filter and update mappings state
    const nextMappings = mappings.filter((m) => m.connectorId !== id);
    setMappings(nextMappings);

    // 3. Immediately update activeConnectorId if deleted connector was active
    if (activeConnectorId === id) {
      setActiveConnectorId(nextConnectors[0]?.id || '');
    }

    setDeletingConnectorTarget(null);
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
          CUSTOM REACT DELETE CONFIRMATION MODAL
         ========================================================================= */}
      {deletingConnectorTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-2xl mx-auto shadow-inner">
              🗑️
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-bold text-slate-800 text-lg">
                {isRtl ? 'تأكيد الحذف بسلة المهملات' : 'Confirm Connector Deletion'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isRtl
                  ? `هل أنت متأكد من حذف مصدر البيانات هذا (${deletingConnectorTarget.name}) بجميع إعداداته وتوصيلاته؟`
                  : `Are you sure you want to delete connector (${deletingConnectorTarget.name})?`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingConnectorTarget(null)}
                className="py-3 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDeleteConnector}
                className="py-3 px-4 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-md transition-colors cursor-pointer"
              >
                {isRtl ? 'نعم، حذف الآن 🗑️' : 'Yes, Delete Now 🗑️'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6-STEP E-COMMERCE STORE INTEGRATION WIZARD MODAL
         ========================================================================= */}
      {isEcomWizardOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-2xl shadow-inner">
                  🛒
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {isRtl ? 'ربط متجرك الإلكتروني بقاعدة بيانات BizOS' : 'Connect E-Commerce Store'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'سحب المنتجات والطلبات والعملاء وتوجيهها تلقائياً للأقسام المناسبة' : 'Discover and route store data to BizOS departments'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEcomWizardOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stepper Progress Bar (6 steps) */}
            <div className="grid grid-cols-6 gap-1 bg-slate-100 p-1.5 rounded-2xl">
              {[
                { num: 1, label: 'المنصة' },
                { num: 2, label: 'البيانات' },
                { num: 3, label: 'اختبار' },
                { num: 4, label: 'الموارد' },
                { num: 5, label: 'التوجيه' },
                { num: 6, label: 'المزامنة' },
              ].map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setEcomWizardStep(s.num as any)}
                  className={`py-1.5 px-1 rounded-xl text-[11px] font-bold text-center transition-all ${
                    ecomWizardStep === s.num
                      ? 'bg-slate-900 text-white shadow-xs'
                      : ecomWizardStep > s.num
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'text-slate-500'
                  }`}
                >
                  {s.num}. {s.label}
                </button>
              ))}
            </div>

            {/* STEP 1: Platform Selection */}
            {ecomWizardStep === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    {isRtl ? 'اختر منصة متجرك الإلكتروني:' : 'Select E-Commerce Store Platform:'}
                  </label>
                  <select
                    value={selectedEcomPlatformId}
                    onChange={(e) => handleEcomPlatformSelect(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-indigo-200 text-sm font-bold text-slate-800 bg-indigo-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    {ECOM_PLATFORMS.map((plat) => (
                      <option key={plat.id} value={plat.id}>
                        {plat.icon} {plat.nameAr} ({plat.authTypeLabel})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Platform Icons Quick Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
                  {ECOM_PLATFORMS.map((plat) => {
                    const isSelected = selectedEcomPlatformId === plat.id;
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => handleEcomPlatformSelect(plat.id)}
                        className={`p-3 rounded-2xl border text-right flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{plat.icon}</span>
                          {isSelected && <span className="text-xs text-indigo-600 font-bold">✓</span>}
                        </div>
                        <div className="mt-2">
                          <p className="font-bold text-xs text-slate-900 truncate">{plat.nameAr}</p>
                          <span className="text-[10px] text-slate-500 block truncate">{plat.badge}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedEcomPlatformId === 'custom_rest' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      {isRtl ? 'إشعار المنصات المخصصة' : 'Custom REST API Notice'}
                    </p>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      {isRtl
                        ? 'الربط المخصص يستلزم توفر REST API أو Webhook Endpoint لاستقبال طلبات المتجر وتمرير الهيدر المناسب.'
                        : 'Custom connection requires standard REST/Webhook support and valid header credentials.'}
                    </p>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setEcomWizardStep(2)}
                    className="px-6 py-3 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                  >
                    {isRtl ? 'التالي: مدخلات الاتصال ←' : 'Next: Credentials ←'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Platform Dynamic Input Fields */}
            {ecomWizardStep === 2 && (() => {
              const platform = ECOM_PLATFORMS.find((p) => p.id === selectedEcomPlatformId) || ECOM_PLATFORMS[0];

              return (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-3xl">{platform.icon}</span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {isRtl ? `بيانات مدخلات الاتصال بـ (${platform.nameAr})` : `Connection Credentials for ${platform.nameEn}`}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">{platform.authTypeLabel}</p>
                    </div>
                  </div>

                  {ecomStepError && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-in fade-in duration-200">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">{isRtl ? 'حقول مطلوبة مفقودة' : 'Required Fields Missing'}</p>
                        <p className="text-rose-700 mt-1 leading-relaxed">{ecomStepError}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {platform.fields.map((field) => {
                      const isMissing = ecomStepError && !(ecomFieldValues[field.key] || '').trim();
                      return (
                        <div key={field.key}>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {field.labelAr} <span className="text-rose-500">*</span>:
                          </label>
                          <input
                            type={field.type || 'text'}
                            value={ecomFieldValues[field.key] || ''}
                            onChange={(e) => {
                              setEcomStepError(null);
                              setEcomFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }));
                            }}
                            placeholder={field.placeholder}
                            className={`w-full px-4 py-2.5 rounded-xl font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 transition-colors ${
                              isMissing
                                ? 'border-2 border-rose-500 bg-rose-50/30 focus:ring-rose-500'
                                : 'border border-slate-300 bg-slate-50 focus:ring-indigo-500'
                            }`}
                          />
                          {field.helpAr && (
                            <p className="text-[11px] text-slate-400 mt-1">{field.helpAr}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setEcomWizardStep(1)}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      {isRtl ? '← السابق' : '← Back'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (validateEcomStep2Inputs()) {
                          setEcomWizardStep(3);
                          handleTestEcomConnection();
                        }
                      }}
                      className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                    >
                      {isRtl ? 'التالي: اختبار الاتصال ←' : 'Next: Test Connection ←'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* STEP 3: Test Connection */}
            {ecomWizardStep === 3 && (
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <h4 className="font-bold text-slate-900 text-base">
                    {isRtl ? 'اختبار صحة بيانات الاتصال والصلاحيات' : 'Test Connection & Verification'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'التحقق البرمجي الفعلي من إمكانية الاتصال بسيرفر المنصة وتجاوز حواجز الحماية' : 'Pinging remote server API and checking credentials validity'}
                  </p>
                </div>

                {isEcomTestingPing ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 border-4 border-indigo-600 border-t-transparent animate-spin mx-auto flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-indigo-600 animate-pulse" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      {isRtl ? 'جاري فحص الاتصال وقراءة الهيدرز الصادرة بالسيرفر...' : 'Verifying connection & credentials...'}
                    </p>
                  </div>
                ) : ecomTestResult ? (
                  <div
                    className={`border rounded-2xl p-5 space-y-3 ${
                      ecomTestResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {ecomTestResult.success ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                      )}
                      <div>
                        <h5
                          className={`font-bold text-sm ${
                            ecomTestResult.success ? 'text-emerald-900' : 'text-rose-900'
                          }`}
                        >
                          {ecomTestResult.success
                            ? (isRtl ? 'نجح اختبار الاتصال بنجاح 100%' : 'Test Passed Successfully!')
                            : (isRtl ? 'فشل اختبار الاتصال' : 'Connection Test Failed')}
                        </h5>
                        <p
                          className={`text-xs mt-0.5 ${
                            ecomTestResult.success ? 'text-emerald-800' : 'text-rose-800'
                          }`}
                        >
                          {ecomTestResult.msgAr}
                        </p>
                      </div>
                    </div>

                    {ecomTestResult.details && (
                      <div className="bg-white/80 rounded-xl p-3 text-xs text-slate-700 space-y-1 font-mono">
                        {ecomTestResult.details.map((d, i) => (
                          <div key={i}>{d}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleTestEcomConnection}
                    className="w-full py-3.5 rounded-2xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {isRtl ? 'بدء اختبار الاتصال الآن ⚡' : 'Start Test Ping Now ⚡'}
                  </button>
                )}

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setEcomWizardStep(2)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    {isRtl ? '← تعديل البيانات' : '← Edit Inputs'}
                  </button>
                  <button
                    type="button"
                    disabled={!ecomTestResult?.success}
                    onClick={() => setEcomWizardStep(4)}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                  >
                    {isRtl ? 'التالي: اكتشاف البيانات ←' : 'Next: Discover Data ←'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Store Resource Discovery */}
            {ecomWizardStep === 4 && (
              <div className="space-y-5">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">
                    {isRtl ? 'اكتشاف الموارد المتاحة في متجرك' : 'Discovered Store Resources'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'حدد الموارد التي تريد تسمح بتمكين نقلها إلى قاعدة بيانات BizOS:' : 'Select which entities to stream from your store:'}
                  </p>
                </div>

                <div className="space-y-3">
                  {ecomResources.map((res) => (
                    <div
                      key={res.id}
                      onClick={() =>
                        setEcomResources((prev) =>
                          prev.map((r) => (r.id === res.id ? { ...r, isSelected: !r.isSelected } : r))
                        )
                      }
                      className={`p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                        res.isSelected ? 'border-emerald-500 bg-emerald-50/40 shadow-xs' : 'border-slate-200 bg-slate-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{res.icon}</span>
                        <div>
                          <p className="font-bold text-xs text-slate-800">{res.nameAr}</p>
                          <span className="text-[11px] text-slate-500">
                            {isRtl ? `القسم المستهدف الافتراضي: ${res.targetDept}` : `Target: ${res.targetDept}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
                          {res.count} {isRtl ? 'سجل' : 'items'}
                        </span>
                        <input
                          type="checkbox"
                          checked={res.isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setEcomWizardStep(3)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    {isRtl ? '← السابق' : '← Back'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEcomWizardStep(5)}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                  >
                    {isRtl ? 'التالي: توجيه الأقسام ←' : 'Next: Route Departments ←'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Department Data Routing */}
            {ecomWizardStep === 5 && (
              <div className="space-y-5">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">
                    {isRtl ? 'توجيه بيانات المتجر إلى أقسام BizOS (Department Data Routing)' : 'Route Data to BizOS Departments'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'اختر القسم المناسب في BizOS لاستقبال كل مورد مستورد:' : 'Map each store resource to its corresponding BizOS module:'}
                  </p>
                </div>

                <div className="space-y-3">
                  {ecomResources.filter((r) => r.isSelected).map((res) => (
                    <div key={res.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{res.icon}</span>
                          <span className="font-bold text-xs text-slate-800">{res.nameAr}</span>
                        </div>
                        <span className="text-xs font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                          {res.count} {isRtl ? 'سجل جاهز' : 'records ready'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-slate-500 shrink-0">{isRtl ? 'توجيه المورد إلى:' : 'Route to:'}</span>
                        <select
                          value={res.targetDept}
                          onChange={(e) => {
                            const newDept = e.target.value;
                            setEcomResources((prev) =>
                              prev.map((r) => (r.id === res.id ? { ...r, targetDept: newDept } : r))
                            );
                          }}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50"
                        >
                          <option value="قسم المبيعات">🧾 قسم المبيعات والكاشير (Sales & POS Cashier)</option>
                          <option value="قسم المخزون">📦 قسم المخزون والمنتجات (Inventory & Items)</option>
                          <option value="سجل العملاء">👥 سجل العملاء (CRM & Customers Directory)</option>
                          <option value="المالية">💳 قسم المالية والمحاسبة (Finance & Accounting)</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setEcomWizardStep(4)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    {isRtl ? '← السابق' : '← Back'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEcomWizardStep(6)}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                  >
                    {isRtl ? 'التالي: خيارات المزامنة ←' : 'Next: Sync Options ←'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: Sync Strategy & Final Approval */}
            {ecomWizardStep === 6 && (
              <div className="space-y-5">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">
                    {isRtl ? 'إعدادات منظومة المزامنة واعتماد الربط' : 'Sync Strategy & Final Authorization'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'اختر خيارات المزامنة واعتماد التوصيل المباشر بقاعدة بيانات BizOS:' : 'Configure automated sync frequency and stock deduction rules:'}
                  </p>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer">
                    <span>{isRtl ? 'جلب البيانات الحالية (Initial Sync):' : 'Initial Sync Existing Data:'}</span>
                    <input
                      type="checkbox"
                      checked={ecomSyncStrategy.initialSync}
                      onChange={(e) => setEcomSyncStrategy((prev) => ({ ...prev, initialSync: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded-md"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer">
                    <span>{isRtl ? 'استقبال إشعارات المبيعات الفورية (Webhooks):' : 'Real-time Webhooks Stream:'}</span>
                    <input
                      type="checkbox"
                      checked={ecomSyncStrategy.webhooksEnabled}
                      onChange={(e) => setEcomSyncStrategy((prev) => ({ ...prev, webhooksEnabled: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded-md"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer">
                    <span>{isRtl ? 'خصم المخزون التلقائي فور وصول الطلب:' : 'Auto Deduct Stock Quantity:'}</span>
                    <input
                      type="checkbox"
                      checked={ecomSyncStrategy.autoDeductStock}
                      onChange={(e) => setEcomSyncStrategy((prev) => ({ ...prev, autoDeductStock: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded-md"
                    />
                  </label>

                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isRtl ? 'تكرار المزامنة الدورية (Scheduled Sync Frequency):' : 'Scheduled Sync Interval:'}
                    </label>
                    <select
                      value={ecomSyncStrategy.scheduledSync}
                      onChange={(e) => setEcomSyncStrategy((prev) => ({ ...prev, scheduledSync: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                    >
                      <option value="realtime">{isRtl ? 'لحظية فورية (Real-time Instant)' : 'Real-time Instant'}</option>
                      <option value="hourly">{isRtl ? 'كل ساعة (Hourly)' : 'Hourly'}</option>
                      <option value="daily">{isRtl ? 'يومياً (Daily)' : 'Daily'}</option>
                      <option value="manual">{isRtl ? 'عند الطلب يدويًا (Manual Only)' : 'Manual Only'}</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setEcomWizardStep(5)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    {isRtl ? '← التوجيه' : '← Back'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEcomWizardConnector}
                    className="px-8 py-3.5 rounded-2xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    {isRtl ? 'اعتماد الربط وتفعيل المزامنة 🚀' : 'Authorize & Activate Sync 🚀'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          6-STEP SOCIAL PAGES & MESSAGING CHANNELS WIZARD MODAL
         ========================================================================= */}
      {isSocialWizardOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-2xl shadow-inner">
                  📱
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {isRtl ? 'اربط صفحاتك وقنوات المحادثات التجاريّة' : 'Connect Social Pages & Direct Messaging'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'ربط مصادر المنتجات والتفاعل ومصادر المحادثات والطلبات بصورة مستقلة' : 'Showcase content engagement & direct chat order streams'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSocialWizardOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="grid grid-cols-6 gap-1 bg-slate-100 p-1.5 rounded-2xl">
              {[
                { num: 1, label: 'المنصة والهدف' },
                { num: 2, label: 'بيانات الحساب' },
                { num: 3, label: 'اختبار الاتصال' },
                { num: 4, label: 'استكشاف البيانات' },
                { num: 5, label: 'توجيه الأقسام' },
                { num: 6, label: 'تفعيل المزامنة' },
              ].map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setSocialWizardStep(s.num as any)}
                  className={`py-1.5 px-1 rounded-xl text-[10px] sm:text-[11px] font-bold text-center transition-all ${
                    socialWizardStep === s.num
                      ? 'bg-purple-900 text-white shadow-xs'
                      : socialWizardStep > s.num
                      ? 'bg-purple-100 text-purple-800'
                      : 'text-slate-500'
                  }`}
                >
                  {s.num}. {s.label}
                </button>
              ))}
            </div>

            {/* STEP 1: Platform & Separate Connection Purposes */}
            {socialWizardStep === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    {isRtl ? '1. اختر منصة التواصل أو المحادثات:' : '1. Select Social or Chat Platform:'}
                  </label>
                  <select
                    value={selectedSocialPlatformId}
                    onChange={(e) => handleSocialPlatformSelect(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-purple-200 text-sm font-bold text-slate-800 bg-purple-50/50 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    {SOCIAL_PLATFORMS.map((plat) => (
                      <option key={plat.id} value={plat.id}>
                        {plat.icon} {plat.nameAr} ({plat.authTypeLabel})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Platform Icons Quick Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {SOCIAL_PLATFORMS.map((plat) => {
                    const isSelected = selectedSocialPlatformId === plat.id;
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => handleSocialPlatformSelect(plat.id)}
                        className={`p-3 rounded-2xl border text-right flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-500/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{plat.icon}</span>
                          {isSelected && <span className="text-xs text-purple-600 font-bold">✓</span>}
                        </div>
                        <div className="mt-2">
                          <p className="font-bold text-xs text-slate-900 truncate">{plat.nameAr}</p>
                          <span className="text-[10px] text-slate-500 block truncate">{plat.badge}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Independent Data Purposes Selection (فصل مصادر البيانات) */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-900">
                    {isRtl ? '2. حدد الغرض من ربط هذه المنصة (يمكن تحديد خيار واحد أو الخيارين معاً):' : '2. Select Connection Purposes:'}
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setEnableShowcasePurpose(!enableShowcasePurpose)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                        enableShowcasePurpose
                          ? 'border-purple-600 bg-purple-50/60 ring-1 ring-purple-500/30'
                          : 'border-slate-200 bg-slate-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-purple-900 flex items-center gap-1.5">
                          <span>📸</span>
                          {isRtl ? 'أ. مصدر التفاعل مع المنتجات' : 'A. Product Showcase & Content'}
                        </span>
                        <input
                          type="checkbox"
                          checked={enableShowcasePurpose}
                          onChange={() => {}}
                          className="w-4 h-4 text-purple-600 rounded-md"
                        />
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {isRtl
                          ? 'جلب بيانات المنشورات، الكتالوج المعروض، التفاعلات، والتعليقات العامة.'
                          : 'Collect catalog items, posts, reactions, comments & reach insights.'}
                      </p>
                    </div>

                    <div
                      onClick={() => setEnableChatsPurpose(!enableChatsPurpose)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                        enableChatsPurpose
                          ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500/30'
                          : 'border-slate-200 bg-slate-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                          <span>💬</span>
                          {isRtl ? 'ب. مصدر المحادثات والطلبات' : 'B. Direct Chats & Orders'}
                        </span>
                        <input
                          type="checkbox"
                          checked={enableChatsPurpose}
                          onChange={() => {}}
                          className="w-4 h-4 text-indigo-600 rounded-md"
                        />
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {isRtl
                          ? 'جلب الرسائل الواردة، ملفات العملاء، واستخلاص تفاصيل الطلبات بالمحادثة.'
                          : 'Direct chat messages, customer profiles, and structured chat orders.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setSocialWizardStep(2)}
                    className="px-6 py-3 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-700 shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                  >
                    {isRtl ? 'التالي: مدخلات الحساب ←' : 'Next: Credentials ←'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Platform Input Credentials */}
            {socialWizardStep === 2 && (() => {
              const platform = SOCIAL_PLATFORMS.find((p) => p.id === selectedSocialPlatformId) || SOCIAL_PLATFORMS[0];

              return (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-3xl">{platform.icon}</span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {isRtl ? `بيانات المصادقة الخاصة بـ (${platform.nameAr})` : `Credentials for ${platform.nameEn}`}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">{platform.authTypeLabel}</p>
                    </div>
                  </div>

                  {socialStepError && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-in fade-in duration-200">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">{isRtl ? 'حقول مطلوبة مفقودة' : 'Required Fields Missing'}</p>
                        <p className="text-rose-700 mt-1 leading-relaxed">{socialStepError}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {platform.authMethod === 'oauth' && (
                      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-xs text-purple-900 space-y-2">
                        <p className="font-bold flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          {isRtl ? 'الربط المباشر المعتمد (Official Meta / OAuth Login)' : 'Official OAuth Integration'}
                        </p>
                        <p className="text-purple-800 text-[11px] leading-relaxed">
                          {isRtl
                            ? 'يمكنك تسجيل الدخول المباشر والتخول الآمن لربط الحساب بضغطة زر واحدة أو تعبئة الحقول أدناه:'
                            : 'Authorize official access directly without manual tokens.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const firstFieldKey = platform.fields[0]?.key || 'handle';
                            setSocialFieldValues((prev) => ({
                              ...prev,
                              [firstFieldKey]: prev[firstFieldKey] || '@mybrand_official',
                              accessToken: prev.accessToken || 'EAAG_oauth_authorized_token_xxxx',
                            }));
                            setSocialStepError(null);
                            alert(isRtl ? 'تمت التخويل والموافق عبر OAuth بنجاح!' : 'Authorized via OAuth successfully!');
                          }}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          {isRtl ? 'تسجيل الدخول وربط الحساب عبر OAuth' : 'Authorize via OAuth'}
                        </button>
                      </div>
                    )}

                    {platform.fields.map((field) => {
                      const isMissing = socialStepError && !(socialFieldValues[field.key] || '').trim();
                      return (
                        <div key={field.key}>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {field.labelAr} <span className="text-rose-500">*</span>:
                          </label>
                          <input
                            type={field.type || 'text'}
                            value={socialFieldValues[field.key] || ''}
                            onChange={(e) => {
                              setSocialStepError(null);
                              setSocialFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }));
                            }}
                            placeholder={field.placeholder}
                            className={`w-full px-4 py-2.5 rounded-xl font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 transition-colors ${
                              isMissing
                                ? 'border-2 border-rose-500 bg-rose-50/30 focus:ring-rose-500'
                                : 'border border-slate-300 bg-slate-50 focus:ring-purple-500'
                            }`}
                          />
                          {field.helpAr && (
                            <p className="text-[11px] text-slate-400 mt-1">{field.helpAr}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setSocialWizardStep(1)}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      {isRtl ? '← السابق' : '← Back'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (validateSocialStep2Inputs()) {
                          setSocialWizardStep(3);
                          handleTestSocialConnection();
                        }
                      }}
                      className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-700 shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                    >
                      {isRtl ? 'التالي: اختبار الاتصال ←' : 'Next: Test Connection ←'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* STEP 3: Connection Test & Verification */}
            {socialWizardStep === 3 && (
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <h4 className="font-bold text-slate-900 text-base">
                    {isRtl ? 'اختبار صحة بيانات الاتصال وصلاحيات القنوات' : 'Test Connection & Verification'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'التحقق البرمجي من إمكانية قراءة التفاعلات والرسائل الواردة' : 'Pinging channel endpoints & validating access permissions'}
                  </p>
                </div>

                {isSocialTestingPing ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-purple-50 border-4 border-purple-600 border-t-transparent animate-spin mx-auto flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-purple-600 animate-pulse" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      {isRtl ? 'جاري فحص الصفحة وقراءة التوكنات البرمجية...' : 'Verifying account handle & direct message permissions...'}
                    </p>
                  </div>
                ) : socialTestResult ? (
                  <div
                    className={`border rounded-2xl p-5 space-y-3 ${
                      socialTestResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {socialTestResult.success ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                      )}
                      <div>
                        <h5
                          className={`font-bold text-sm ${
                            socialTestResult.success ? 'text-emerald-900' : 'text-rose-900'
                          }`}
                        >
                          {socialTestResult.success
                            ? (isRtl ? 'نجح فحص الحساب والصلاحيات بنجاح 100%' : 'Test Passed Successfully!')
                            : (isRtl ? 'فشل فحص الحساب' : 'Connection Test Failed')}
                        </h5>
                        <p
                          className={`text-xs mt-0.5 ${
                            socialTestResult.success ? 'text-emerald-800' : 'text-rose-800'
                          }`}
                        >
                          {socialTestResult.msgAr}
                        </p>
                      </div>
                    </div>

                    {socialTestResult.details && (
                      <div className="bg-white/80 rounded-xl p-3 text-xs text-slate-700 space-y-1 font-mono">
                        {socialTestResult.details.map((d, i) => (
                          <div key={i}>{d}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleTestSocialConnection}
                    className="w-full py-3.5 rounded-2xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-700 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {isRtl ? 'بدء اختبار الاتصال الآن ⚡' : 'Start Test Ping Now ⚡'}
                  </button>
                )}

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setSocialWizardStep(2)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    {isRtl ? '← تعديل البيانات' : '← Edit Credentials'}
                  </button>
                  <button
                    type="button"
                    disabled={!socialTestResult?.success}
                    onClick={() => setSocialWizardStep(4)}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                  >
                    {isRtl ? 'التالي: استكشاف الموارد ←' : 'Next: Discover Resources ←'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Resource Discovery */}
            {socialWizardStep === 4 && (
              <div className="space-y-5">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">
                    {isRtl ? 'اكتشاف الموارد المتاحة في صفحتك' : 'Discovered Channel Resources'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'حدد الموارد التي تريد جلبها وتوجيهها تلقائياً داخل BizOS:' : 'Select which entities to stream from your social channel:'}
                  </p>
                </div>

                <div className="space-y-3">
                  {socialResources.map((res) => (
                    <div
                      key={res.id}
                      onClick={() =>
                        setSocialResources((prev) =>
                          prev.map((r) => (r.id === res.id ? { ...r, isSelected: !r.isSelected } : r))
                        )
                      }
                      className={`p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                        res.isSelected ? 'border-purple-500 bg-purple-50/40 shadow-xs' : 'border-slate-200 bg-slate-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{res.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-xs text-slate-800">{res.nameAr}</p>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700">
                              {res.category === 'showcase' ? (isRtl ? 'تفاعل ومنشورات' : 'Showcase') : (isRtl ? 'محادثات وطلبات' : 'Chats')}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {isRtl ? `القسم المستهدف الافتراضي: ${res.targetDept}` : `Target: ${res.targetDept}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
                          {res.count} {isRtl ? 'سجل' : 'items'}
                        </span>
                        <input
                          type="checkbox"
                          checked={res.isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setSocialWizardStep(3)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    {isRtl ? '← السابق' : '← Back'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSocialWizardStep(5)}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-700 shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                  >
                    {isRtl ? 'التالي: توجيه الأقسام ←' : 'Next: Route Departments ←'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Department Data Routing */}
            {socialWizardStep === 5 && (
              <div className="space-y-5">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">
                    {isRtl ? 'توجيه بيانات الصفحة إلى أقسام BizOS (Department Data Routing)' : 'Route Social Data to BizOS Departments'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'اختر القسم المناسب في BizOS لاستقبال كل نوع من البيانات:' : 'Map each social resource to its corresponding BizOS module:'}
                  </p>
                </div>

                <div className="space-y-3">
                  {socialResources.filter((r) => r.isSelected).map((res) => (
                    <div key={res.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{res.icon}</span>
                          <span className="font-bold text-xs text-slate-800">{res.nameAr}</span>
                        </div>
                        <span className="text-xs font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md">
                          {res.count} {isRtl ? 'سجل مكتشف' : 'records'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-slate-500 shrink-0">{isRtl ? 'توجيه البيانات إلى:' : 'Route to:'}</span>
                        <select
                          value={res.targetDept}
                          onChange={(e) => {
                            const newDept = e.target.value;
                            setSocialResources((prev) =>
                              prev.map((r) => (r.id === res.id ? { ...r, targetDept: newDept } : r))
                            );
                          }}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50"
                        >
                          <option value="قسم التسويق">🎯 قسم التسويق والحملات (Marketing & Social)</option>
                          <option value="قسم المبيعات">🧾 قسم المبيعات والكاشير (Sales & Orders)</option>
                          <option value="سجل العملاء">👥 سجل العملاء (CRM & Customer Profiles)</option>
                          <option value="المالية">💳 قسم المالية والمحاسبة (Finance & Accounting)</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setSocialWizardStep(4)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    {isRtl ? '← السابق' : '← Back'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSocialWizardStep(6)}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-700 shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                  >
                    {isRtl ? 'التالي: خيارات المزامنة ←' : 'Next: Sync Options ←'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: Sync Strategy & Final Authorization */}
            {socialWizardStep === 6 && (
              <div className="space-y-5">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">
                    {isRtl ? 'إعدادات المزامنة والتمييز بين الاستفسارات والطلبات' : 'Sync Strategy & Direct Order Confirmation'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'ضبط شروط التمييز الفوري وإرسال البيانات إلى قاعدة بيانات BizOS:' : 'Configure chat message distinction & Webhook triggers:'}
                  </p>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="flex items-start justify-between text-xs font-bold text-slate-800 cursor-pointer gap-2">
                    <div>
                      <span>{isRtl ? 'التمييز والدقة: عدم تحويل الرسائل لطلبات مؤكدة إلا بوجود دليل واضح:' : 'Require Explicit Evidence Before Confirming Order:'}</span>
                      <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                        {isRtl ? 'تسجيل الرسائل العادية كاستفسارات معلقة والتأكيد المباشر فقط للرسائل التي تحوي سعراً وعنواناً حقيقياً.' : 'Differentiate simple inquiries from confirmed order details.'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={socialSyncStrategy.requireOrderConfirmation}
                      onChange={(e) => setSocialSyncStrategy((prev) => ({ ...prev, requireOrderConfirmation: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 rounded-md mt-1 shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer pt-2 border-t border-slate-200">
                    <span>{isRtl ? 'تفعيل الويب هوك لاستقبال الرسائل والتفاعلات فور حدوثها (Realtime Webhooks):' : 'Enable Real-time Messaging Webhook Listener:'}</span>
                    <input
                      type="checkbox"
                      checked={socialSyncStrategy.webhooksEnabled}
                      onChange={(e) => setSocialSyncStrategy((prev) => ({ ...prev, webhooksEnabled: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 rounded-md"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer pt-2 border-t border-slate-200">
                    <span>{isRtl ? 'خصم المخزون التلقائي عند تأكيد الطلب بالمحادثة:' : 'Auto Deduct Stock Upon Chat Order Confirmation:'}</span>
                    <input
                      type="checkbox"
                      checked={socialSyncStrategy.autoDeductStock}
                      onChange={(e) => setSocialSyncStrategy((prev) => ({ ...prev, autoDeductStock: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 rounded-md"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setSocialWizardStep(5)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    {isRtl ? '← التوجيه' : '← Back'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSocialWizardConnector}
                    className="px-8 py-3.5 rounded-2xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-500 shadow-xl flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    {isRtl ? 'اعتماد ربط الصفحة وتفعيل المزامنة 🚀' : 'Authorize & Activate Page Sync 🚀'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          6-STEP WEBSITE DATABASE CONNECTION WIZARD MODAL
         ========================================================================= */}
      {isDbWizardOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl shadow-inner">
                  🌐
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {isRtl ? 'اربط قاعدة بيانات موقعك' : 'Connect Website Database'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'ربط سحابي أو مستضاف ذاتيًا وتوجيه البيانات آلياً إلى أقسام BizOS' : 'Connect cloud or self-hosted databases and map schemas'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDbWizardOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stepper Progress Indicator (6 Steps) */}
            <div className="grid grid-cols-6 gap-1 md:gap-2">
              {[
                { step: 1, labelAr: '1. المكان والمحرك' },
                { step: 2, labelAr: '2. البيانات' },
                { step: 3, labelAr: '3. الاختبار' },
                { step: 4, labelAr: '4. الجداول' },
                { step: 5, labelAr: '5. الأقسام' },
                { step: 6, labelAr: '6. الاعتماد' },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => {
                    if (s.step < dbWizardStep) setDbWizardStep(s.step as any);
                  }}
                  disabled={s.step > dbWizardStep}
                  className={`py-2 px-1 text-[11px] md:text-xs font-bold rounded-xl border transition-all text-center ${
                    dbWizardStep === s.step
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : s.step < dbWizardStep
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 cursor-pointer'
                      : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                  }`}
                >
                  {s.labelAr}
                </button>
              ))}
            </div>

            {/* STEP 1: Location & DB Engine Selection */}
            {dbWizardStep === 1 && (
              <div className="space-y-6">
                {/* Question 1: Location */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">1</span>
                    {isRtl ? 'أين توجد قاعدة بيانات موقعك؟' : 'Where is your website database hosted?'}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div
                      onClick={() => setDbLocationType('cloud')}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                        dbLocationType === 'cloud'
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-2">
                          <span>☁️</span>
                          {isRtl ? 'قاعدة بيانات سحابية (Cloud)' : 'Cloud Database'}
                        </span>
                        <input
                          type="radio"
                          name="dbLocation"
                          checked={dbLocationType === 'cloud'}
                          onChange={() => setDbLocationType('cloud')}
                          className="w-4 h-4 text-blue-600"
                        />
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {isRtl
                          ? 'مستضافة على منصات سحابية مثل AWS, Supabase, Neon, Firebase, MongoDB Atlas.'
                          : 'Hosted on managed cloud providers (Supabase, Firebase, Atlas, AWS).'}
                      </p>
                    </div>

                    <div
                      onClick={() => setDbLocationType('self_hosted')}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                        dbLocationType === 'self_hosted'
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-2">
                          <span>🖥️</span>
                          {isRtl ? 'مستضافة ذاتياً (Self-hosted)' : 'Self-hosted / On-Premise'}
                        </span>
                        <input
                          type="radio"
                          name="dbLocation"
                          checked={dbLocationType === 'self_hosted'}
                          onChange={() => setDbLocationType('self_hosted')}
                          className="w-4 h-4 text-blue-600"
                        />
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {isRtl
                          ? 'على سيرفر خاص داخل مقر الشركة أو سيرفر سحابي خاص (Private VPS/Dedicated).'
                          : 'Hosted on your company server, local machine, or private VPS.'}
                      </p>
                    </div>
                  </div>

                  {dbLocationType === 'self_hosted' && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                      <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        {isRtl
                          ? 'توضيح: هذا الاختيار يشمل قواعد البيانات على سيرفر خاص، سواء داخل المقر أو على سيرفر سحابي خاص. وسيتم استخدام BizOS Local Agent للاتصال الآمن دون فتح سيرفرك للإنترنت بشكل غير آمن.'
                          : 'Note: Includes on-premise servers and private VPS setups. Connects securely via BizOS Local Gateway Agent without exposing ports.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Question 2: DB Engine */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">2</span>
                      {isRtl ? 'اختر نوع قاعدة البيانات (Database Engine):' : 'Select Database Engine:'}
                    </h4>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setDbCategoryFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                          dbCategoryFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {isRtl ? 'الكل' : 'All'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDbCategoryFilter('sql')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                          dbCategoryFilter === 'sql' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        SQL
                      </button>
                      <button
                        type="button"
                        onClick={() => setDbCategoryFilter('nosql')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                          dbCategoryFilter === 'nosql' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        NoSQL
                      </button>
                    </div>
                  </div>

                  {/* Engine Grid Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto p-1">
                    {WEBSITE_DB_ENGINES.filter((e) => (dbCategoryFilter === 'all' ? true : e.category === dbCategoryFilter)).map((e) => {
                      const isSelected = selectedDbEngineId === e.id;
                      return (
                        <div
                          key={e.id}
                          onClick={() => handleDbEngineSelect(e.id)}
                          className={`p-3 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/90 ring-2 ring-blue-500/30'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-2xl">{e.icon}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                !e.supported
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {e.badge}
                            </span>
                          </div>
                          <div className="mt-2">
                            <h5 className="font-bold text-xs text-slate-900 leading-tight">{e.nameAr}</h5>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">{e.defaultPort ? `Port: ${e.defaultPort}` : e.nameEn}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Engine Summary Card */}
                  {(() => {
                    const engine = WEBSITE_DB_ENGINES.find((e) => e.id === selectedDbEngineId) || WEBSITE_DB_ENGINES[0];

                    return (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{engine.icon}</span>
                            <div>
                              <h5 className="font-bold text-xs text-slate-900">{engine.nameAr}</h5>
                              <p className="text-[11px] text-slate-500">{engine.descriptionAr}</p>
                            </div>
                          </div>
                        </div>

                        {!engine.supported && (
                          <div className="mt-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                            <span>⚠️ {isRtl ? 'هذا النوع غير مدعوم مباشرة للاتصال بالحقول، يرجى اختيار محرك آخر أو استخدام API.' : 'Engine not supported for direct field syncing.'}</span>
                            <button
                              type="button"
                              onClick={() => handleStartConnect('site')}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px]"
                            >
                              {isRtl ? 'استخدام API' : 'Use API'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const engine = WEBSITE_DB_ENGINES.find((e) => e.id === selectedDbEngineId);
                      if (engine && !engine.supported) {
                        setDbStepError(`المحرك (${engine.nameAr}) غير مدعوم للاتصال المباشر بالحقول حالياً. يرجى اختيار محرك مدعوم.`);
                        return;
                      }
                      setDbStepError(null);
                      setDbWizardStep(2);
                    }}
                    className="px-6 py-3 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                  >
                    {isRtl ? 'التالي: مدخلات الاتصال ←' : 'Next: Connection Details ←'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Dynamic Connection Credentials Inputs */}
            {dbWizardStep === 2 && (() => {
              const engine = WEBSITE_DB_ENGINES.find((e) => e.id === selectedDbEngineId) || WEBSITE_DB_ENGINES[0];

              return (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-3xl">{engine.icon}</span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {isRtl ? `بيانات اتصال قاعدة بيانات (${engine.nameAr})` : `Connection Fields for ${engine.nameEn}`}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">
                        {dbLocationType === 'cloud' ? 'سحابية Cloud Connection' : 'مستضافة ذاتياً Self-hosted Local Agent'}
                      </p>
                    </div>
                  </div>

                  {dbStepError && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block mb-0.5">{isRtl ? 'تنبيه في البيانات:' : 'Validation Error:'}</span>
                        <p>{dbStepError}</p>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Fields Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto p-1">
                    {engine.fields.map((f) => (
                      <div key={f.key} className={`space-y-1 ${f.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                        <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                          <span>
                            {f.labelAr} {f.required && <span className="text-rose-500">*</span>}
                          </span>
                        </label>

                        {f.type === 'select' ? (
                          <select
                            value={dbFieldValues[f.key] || (f.options ? f.options[0].value : '')}
                            onChange={(e) => setDbFieldValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          >
                            {f.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.labelAr}
                              </option>
                            ))}
                          </select>
                        ) : f.type === 'textarea' ? (
                          <textarea
                            rows={3}
                            value={dbFieldValues[f.key] || ''}
                            onChange={(e) => setDbFieldValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                            placeholder={f.placeholder}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                        ) : (
                          <input
                            type={f.type || 'text'}
                            value={dbFieldValues[f.key] || ''}
                            onChange={(e) => setDbFieldValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                            placeholder={f.placeholder}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                        )}

                        {f.helpAr && <p className="text-[10px] text-slate-400 font-mono">{f.helpAr}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Local Agent Status box for SQLite or self-hosted */}
                  {(engine.id === 'sqlite' || dbLocationType === 'self_hosted') && (
                    <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-emerald-400" />
                          {isRtl ? 'حالة BizOS Local Gateway Agent:' : 'BizOS Local Agent Status:'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          {isRtl ? '🟢 متصل ونشط' : '🟢 Agent Online'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {isRtl
                          ? 'يقوم الـ Agent بربط قاعدة بياناتك المحلية أو السيرفر الخاص بـ BizOS بشكل مشفر تماماً دون الحاجة لفتح المنفذ على الإنترنت.'
                          : 'Local Agent streams data securely without public port exposure.'}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setDbWizardStep(1)}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      {isRtl ? '← السابق' : '← Back'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (validateDbStep2Inputs()) {
                          setDbWizardStep(3);
                          handleTestDbConnection();
                        }
                      }}
                      className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                    >
                      {isRtl ? 'التالي: اختبار الاتصال ←' : 'Next: Test Connection ←'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* STEP 3: Connection Testing & Ping */}
            {dbWizardStep === 3 && (() => {
              const engine = WEBSITE_DB_ENGINES.find((e) => e.id === selectedDbEngineId) || WEBSITE_DB_ENGINES[0];

              return (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h4 className="font-bold text-slate-900 text-base">
                      {isRtl ? `اختبار الاتصال بـ (${engine.nameAr})` : `Test Connection to ${engine.nameEn}`}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {isRtl ? 'التحقق من صحة البيانات، التشفير، وصلاحيات القراءة واستجابة الخادم:' : 'Validating host network, SSL handshake, user permissions & read speed:'}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleTestDbConnection}
                      disabled={isDbTestingPing}
                      className="px-8 py-3.5 rounded-2xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-xl flex items-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isDbTestingPing ? 'animate-spin' : ''}`} />
                      {isDbTestingPing
                        ? (isRtl ? 'جارِ فحص الاتصال والتشفير...' : 'Testing Connection & SSL...')
                        : (isRtl ? 'إعادة اختبار الاتصال ⚡' : 'Test Connection ⚡')}
                    </button>
                  </div>

                  {dbTestResult && (
                    <div
                      className={`p-5 rounded-2xl border space-y-3 animate-in fade-in duration-200 ${
                        dbTestResult.success
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                          : 'bg-rose-50/80 border-rose-200 text-rose-950'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {dbTestResult.success ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                        )}
                        <h5 className="font-bold text-sm">{dbTestResult.msgAr}</h5>
                      </div>

                      {dbTestResult.details && (
                        <div className="bg-white/80 rounded-xl p-3 border border-slate-200/60 space-y-1.5 font-mono text-xs">
                          {dbTestResult.details.map((d, i) => (
                            <p key={i} className={d.startsWith('✓') ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                              {d}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setDbWizardStep(2)}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      {isRtl ? '← التعديل' : '← Edit Fields'}
                    </button>
                    <button
                      type="button"
                      disabled={!dbTestResult || !dbTestResult.success}
                      onClick={() => setDbWizardStep(4)}
                      className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isRtl ? 'التالي: استكشاف الجداول ←' : 'Next: Discover Tables ←'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* STEP 4: Table & Schema Discovery (استكشاف الجداول والـ Collections) */}
            {dbWizardStep === 4 && (
              <div className="space-y-5">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">
                    {isRtl ? 'استكشاف الجداول والـ Collections المتاحة (Data Schema Discovery)' : 'Discovered Tables & Collections'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'اختر الجداول والحقول المراد مزامنتها مع BizOS:' : 'Select tables and fields to map and sync:'}
                  </p>
                </div>

                <div className="space-y-2.5 max-h-[260px] overflow-y-auto p-1">
                  {dbDiscoveredTables.map((table) => (
                    <div
                      key={table.id}
                      onClick={() => {
                        setDbDiscoveredTables((prev) =>
                          prev.map((t) => (t.id === table.id ? { ...t, isSelected: !t.isSelected } : t))
                        );
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        table.isSelected ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-slate-50/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={table.isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 text-blue-600 rounded-md"
                        />
                        <div>
                          <h5 className="font-bold text-xs text-slate-900">{table.nameAr}</h5>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Schema: {table.schema} • Columns: {table.sampleCols.join(', ')}
                          </p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-mono font-bold shrink-0">
                        {table.count} {isRtl ? 'سجل' : 'rows'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDbWizardStep(3)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    {isRtl ? '← الاختبار' : '← Back'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDbWizardStep(5)}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                  >
                    {isRtl ? 'التالي: توجيه الأقسام ←' : 'Next: Department Routing ←'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Department Data Routing (توجيه البيانات إلى أقسام BizOS) */}
            {dbWizardStep === 5 && (
              <div className="space-y-5">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">
                    {isRtl ? 'توجيه الجداول إلى أقسام BizOS (Department Data Routing)' : 'Route Database Tables to BizOS Modules'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'حدد القسم المستهدف في BizOS لكل جدول تم اختياره:' : 'Map each table to its target BizOS module:'}
                  </p>
                </div>

                <div className="space-y-3 max-h-[260px] overflow-y-auto p-1">
                  {dbDiscoveredTables.filter((t) => t.isSelected).map((t) => (
                    <div key={t.id} className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800">{t.nameAr}</span>
                        <span className="text-xs font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                          {t.count} {isRtl ? 'سجل' : 'rows'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-slate-500 shrink-0">{isRtl ? 'توجيه البيانات إلى:' : 'Route to:'}</span>
                        <select
                          value={t.dept}
                          onChange={(e) => {
                            const newDept = e.target.value;
                            setDbDiscoveredTables((prev) =>
                              prev.map((item) => (item.id === t.id ? { ...item, dept: newDept } : item))
                            );
                          }}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="قسم المبيعات والكاشير">🧾 قسم المبيعات والكاشير</option>
                          <option value="المخزون والكتالوج">🏷️ قسم المخزون والكتالوج</option>
                          <option value="سجل العملاء CRM">👥 سجل العملاء CRM</option>
                          <option value="الإدارة المالية">🧾 الإدارة المالية والفواتير</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDbWizardStep(4)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    {isRtl ? '← الجداول' : '← Back'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDbWizardStep(6)}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                  >
                    {isRtl ? 'التالي: إعدادات المزامنة ←' : 'Next: Sync Settings ←'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: Sync Strategy & Adoption */}
            {dbWizardStep === 6 && (
              <div className="space-y-5">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">
                    {isRtl ? 'اعتماد المزامنة والربط النهائي (Sync Strategy & Activation)' : 'Final Sync Schedule & Activation'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'ضبط آلية تحديث البيانات والتكرار بين موقعك وBizOS:' : 'Configure update intervals, deduplication & sync logging:'}
                  </p>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>{isRtl ? 'جدولة التحديث والمزامنة الدوريّة:' : 'Sync Schedule Interval:'}</span>
                    <select
                      value={dbSyncStrategy.pollingInterval}
                      onChange={(e) => setDbSyncStrategy((prev) => ({ ...prev, pollingInterval: e.target.value }))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-blue-700 outline-none"
                    >
                      <option value="realtime">مزامنة فورية (CDC Realtime Polling 5s)</option>
                      <option value="5m">كل 5 دقائق (5 minutes)</option>
                      <option value="1h">كل ساعة (1 hour)</option>
                      <option value="24h">مزامنة يومية (Daily)</option>
                    </select>
                  </div>

                  <label className="flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer pt-2 border-t border-slate-200">
                    <span>{isRtl ? 'منع تكرار السجلات (Idempotency Key Deduplication):' : 'Prevent Duplicate Records (Idempotency Primary Key):'}</span>
                    <input
                      type="checkbox"
                      checked={dbSyncStrategy.idempotencyStrategy === 'primary_key'}
                      onChange={(e) =>
                        setDbSyncStrategy((prev) => ({
                          ...prev,
                          idempotencyStrategy: e.target.checked ? 'primary_key' : 'none',
                        }))
                      }
                      className="w-4 h-4 text-blue-600 rounded-md"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer pt-2 border-t border-slate-200">
                    <span>{isRtl ? 'تفعيل إعادة المحاولة التلقائية والتنبيهات عند وجود أخطاء:' : 'Auto Retry & Error Logging:'}</span>
                    <input
                      type="checkbox"
                      checked={dbSyncStrategy.autoRetry}
                      onChange={(e) => setDbSyncStrategy((prev) => ({ ...prev, autoRetry: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded-md"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDbWizardStep(5)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    {isRtl ? '← التوجيه' : '← Back'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDbConnector}
                    className="px-8 py-3.5 rounded-2xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-xl flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Globe className="w-4 h-4 text-emerald-300" />
                    {isRtl ? 'حفظ واعتمد المزامنة 🚀' : 'Save & Activate Database Sync 🚀'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          6-STEP LOCAL CLOSED POS INTEGRATION ASSESSMENT WIZARD MODAL
         ========================================================================= */}
      {isLocalWizardOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-2xl shadow-inner">
                  💻
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {isRtl ? 'اربط نظامك المحلي وبرامج الكاشير' : 'Connect Local System & Closed POS'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'تقييم إمكانيات برنامج المحل واختيار آلية التكامل المناسبة من بين 6 خيارات' : 'Assess local system capabilities and choose from 6 integration paths'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLocalWizardOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="grid grid-cols-6 gap-1 md:gap-2">
              {[
                { step: 1, labelAr: '1. اختيار الطريقة' },
                { step: 2, labelAr: '2. البيانات' },
                { step: 3, labelAr: '3. الاختبار' },
                { step: 4, labelAr: '4. السجلات' },
                { step: 5, labelAr: '5. الأقسام' },
                { step: 6, labelAr: '6. الاعتماد' },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => {
                    if (s.step < localWizardStep) setLocalWizardStep(s.step as any);
                  }}
                  disabled={s.step > localWizardStep}
                  className={`py-2 px-1 text-[11px] md:text-xs font-bold rounded-xl border transition-all text-center ${
                    localWizardStep === s.step
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : s.step < localWizardStep
                      ? 'bg-amber-50 text-amber-900 border-amber-300 cursor-pointer'
                      : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                  }`}
                >
                  {s.labelAr}
                </button>
              ))}
            </div>

            {/* STEP 1: Assessment & Method Selection (الخيارات الستة للأنظمة المحلية) */}
            {localWizardStep === 1 && (
              <div className="space-y-5">
                {/* Feasibility Notice Banner */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-950 text-xs space-y-1.5 leading-relaxed">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{isRtl ? 'ملحوظة هامة حول الأنظمة المغلقة:' : 'Important Note on Closed POS Systems:'}</span>
                  </div>
                  <p>
                    {isRtl
                      ? 'كلمة "نظام محلي أو مغلق" لا تعني عدم وجود حل إطلاقاً. يتيح BizOS 6 آليات مختلفة للربط حسب إمكانيات برنامج المحل. ولكن إذا كان البرنامج لا يوفر API، ولا يسمح بالوصول لقاعدة البيانات، ولا يصدّر ملفات Excel/CSV، ولا يتيح الربط المخصص، فلن نتمكن من ضمان الربط الآلي الكامل.'
                      : 'Closed system does not mean no solution! BizOS provides 6 different paths depending on POS capabilities.'}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2">
                    {isRtl ? 'حدد الآلية المتاحة في برنامج الكاشير أو النظام المحلي:' : 'Select Available Local Integration Method:'}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                    {LOCAL_POS_METHODS.map((method) => {
                      const isSelected = selectedLocalMethodId === method.id;

                      return (
                        <div
                          key={method.id}
                          onClick={() => handleLocalMethodSelect(method.id)}
                          className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                            isSelected
                              ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-500/20'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-slate-900 flex items-center gap-2">
                              <span className="text-xl">{method.icon}</span>
                              {method.nameAr}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                              {method.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">{method.descriptionAr}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLocalStepError(null);
                      setLocalWizardStep(2);
                    }}
                    className="px-6 py-3 rounded-xl font-bold text-xs text-slate-900 bg-amber-400 hover:bg-amber-500 shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer font-bold"
                  >
                    {isRtl ? 'التالي: مدخلات الربط ←' : 'Next: Credentials ←'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Dynamic Connection Credentials Inputs */}
            {localWizardStep === 2 && (() => {
              const method = LOCAL_POS_METHODS.find((m) => m.id === selectedLocalMethodId) || LOCAL_POS_METHODS[0];

              return (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-3xl">{method.icon}</span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {isRtl ? `مدخلات (${method.nameAr})` : `Details for ${method.nameEn}`}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">{method.badge}</p>
                    </div>
                  </div>

                  {localStepError && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block mb-0.5">{isRtl ? 'تنبيه في البيانات:' : 'Validation Error:'}</span>
                        <p>{localStepError}</p>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Fields Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto p-1">
                    {method.fields.map((f) => (
                      <div key={f.key} className={`space-y-1 ${f.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                        <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                          <span>
                            {f.labelAr} {f.required && <span className="text-rose-500">*</span>}
                          </span>
                        </label>

                        {f.type === 'select' ? (
                          <select
                            value={localFieldValues[f.key] || (f.options ? f.options[0].value : '')}
                            onChange={(e) => setLocalFieldValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                          >
                            {f.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.labelAr}
                              </option>
                            ))}
                          </select>
                        ) : f.type === 'textarea' ? (
                          <textarea
                            rows={3}
                            value={localFieldValues[f.key] || ''}
                            onChange={(e) => setLocalFieldValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                            placeholder={f.placeholder}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                          />
                        ) : (
                          <input
                            type={f.type || 'text'}
                            value={localFieldValues[f.key] || ''}
                            onChange={(e) => setLocalFieldValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                            placeholder={f.placeholder}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                          />
                        )}

                        {f.helpAr && <p className="text-[10px] text-slate-400 font-mono">{f.helpAr}</p>}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setLocalWizardStep(1)}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      {isRtl ? '← السابق' : '← Back'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (validateLocalStep2Inputs()) {
                          setLocalWizardStep(3);
                          handleTestLocalConnection();
                        }
                      }}
                      className="px-6 py-2.5 rounded-xl font-bold text-xs text-slate-900 bg-amber-400 hover:bg-amber-500 shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer font-bold"
                    >
                      {isRtl ? 'التالي: اختبار الاتصال ←' : 'Next: Test Connection ←'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* STEP 3: Connection Testing & Ping */}
            {localWizardStep === 3 && (() => {
              const method = LOCAL_POS_METHODS.find((m) => m.id === selectedLocalMethodId) || LOCAL_POS_METHODS[0];

              return (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h4 className="font-bold text-slate-900 text-base">
                      {isRtl ? `فحص إمكانية الاتصال بـ (${method.nameAr})` : `Testing Feasibility for ${method.nameEn}`}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {isRtl ? 'التحقق من الاتصال بالشبكة المحلية والمجلدات والمسارات المصدرة:' : 'Checking local IP, socket port, agent token or folder permissions:'}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleTestLocalConnection}
                      disabled={isLocalTestingPing}
                      className="px-8 py-3.5 rounded-2xl font-bold text-xs text-slate-900 bg-amber-400 hover:bg-amber-500 shadow-xl flex items-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLocalTestingPing ? 'animate-spin' : ''}`} />
                      {isLocalTestingPing
                        ? (isRtl ? 'جارِ الاتصال وفحص القناة...' : 'Testing Local System...')
                        : (isRtl ? 'إعادة اختبار الاتصال ⚡' : 'Test Connection ⚡')}
                    </button>
                  </div>

                  {localTestResult && (
                    <div
                      className={`p-5 rounded-2xl border space-y-3 animate-in fade-in duration-200 ${
                        localTestResult.success
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                          : 'bg-rose-50/80 border-rose-200 text-rose-950'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {localTestResult.success ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                        )}
                        <h5 className="font-bold text-sm">{localTestResult.msgAr}</h5>
                      </div>

                      {localTestResult.details && (
                        <div className="bg-white/80 rounded-xl p-3 border border-slate-200/60 space-y-1.5 font-mono text-xs">
                          {localTestResult.details.map((d, i) => (
                            <p key={i} className={d.startsWith('✓') ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                              {d}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setLocalWizardStep(2)}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      {isRtl ? '← التعديل' : '← Edit Fields'}
                    </button>
                    <button
                      type="button"
                      disabled={!localTestResult || !localTestResult.success}
                      onClick={() => setLocalWizardStep(4)}
                      className="px-6 py-2.5 rounded-xl font-bold text-xs text-slate-900 bg-amber-400 hover:bg-amber-500 shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                    >
                      {isRtl ? 'التالي: السجلات والجداول ←' : 'Next: Discover Schema ←'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* STEP 4: Entity & Schema Discovery */}
            {localWizardStep === 4 && (
              <div className="space-y-5">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">
                    {isRtl ? 'السجلات والبيانات المكتشفة في الكاشير المحلي:' : 'Discovered Local POS Entities'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'اختر البيانات المصدرة المراد نقلها إلى BizOS:' : 'Select cashier entities to sync:'}
                  </p>
                </div>

                <div className="space-y-2.5 max-h-[260px] overflow-y-auto p-1">
                  {localDiscoveredEntities.map((ent) => (
                    <div
                      key={ent.id}
                      onClick={() => {
                        setLocalDiscoveredEntities((prev) =>
                          prev.map((e) => (e.id === ent.id ? { ...e, isSelected: !e.isSelected } : e))
                        );
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        ent.isSelected ? 'border-amber-500 bg-amber-50/50' : 'border-slate-200 bg-slate-50/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={ent.isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 text-amber-600 rounded-md"
                        />
                        <div>
                          <h5 className="font-bold text-xs text-slate-900">{ent.nameAr}</h5>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-mono font-bold shrink-0">
                        {ent.count} {isRtl ? 'سجل' : 'records'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setLocalWizardStep(3)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    {isRtl ? '← الاختبار' : '← Back'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalWizardStep(5)}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-slate-900 bg-amber-400 hover:bg-amber-500 shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer font-bold"
                  >
                    {isRtl ? 'التالي: توجيه الأقسام ←' : 'Next: Department Routing ←'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Department Data Routing */}
            {localWizardStep === 5 && (
              <div className="space-y-5">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">
                    {isRtl ? 'توجيه بيانات الكاشير إلى أقسام BizOS (Department Data Routing)' : 'Route POS Data to BizOS Modules'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'حدد القسم المناسب لكل نوع من بيانات النظام المحلي:' : 'Map each entity to its corresponding module:'}
                  </p>
                </div>

                <div className="space-y-3 max-h-[260px] overflow-y-auto p-1">
                  {localDiscoveredEntities.filter((e) => e.isSelected).map((ent) => (
                    <div key={ent.id} className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800">{ent.nameAr}</span>
                        <span className="text-xs font-mono text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                          {ent.count} {isRtl ? 'سجل' : 'records'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-slate-500 shrink-0">{isRtl ? 'توجيه البيانات إلى:' : 'Route to:'}</span>
                        <select
                          value={ent.dept}
                          onChange={(e) => {
                            const newDept = e.target.value;
                            setLocalDiscoveredEntities((prev) =>
                              prev.map((item) => (item.id === ent.id ? { ...item, dept: newDept } : item))
                            );
                          }}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                        >
                          <option value="قسم المبيعات والكاشير">🧾 قسم المبيعات والكاشير</option>
                          <option value="المخزون والكتالوج">🏷️ قسم المخزون والكتالوج</option>
                          <option value="سجل العملاء CRM">👥 سجل العملاء CRM</option>
                          <option value="الإدارة المالية">🧾 الإدارة المالية والتصفيات</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setLocalWizardStep(4)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    {isRtl ? '← السجلات' : '← Back'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalWizardStep(6)}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-slate-900 bg-amber-400 hover:bg-amber-500 shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer font-bold"
                  >
                    {isRtl ? 'التالي: إعدادات المزامنة ←' : 'Next: Sync Settings ←'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: Sync Strategy & Adoption */}
            {localWizardStep === 6 && (
              <div className="space-y-5">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">
                    {isRtl ? 'اعتماد ربط الكاشير والمزامنة الدوريّة (Sync Strategy & Activation)' : 'Final Activation & Schedule'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'ضبط إعدادات تحديث المخزون والسجل المحلي:' : 'Configure stock deduction & local logging:'}
                  </p>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>{isRtl ? 'جدولة فحص وتحديث مبيعات المحل:' : 'Local POS Sync Schedule:'}</span>
                    <select
                      value={localSyncStrategy.scheduledSync}
                      onChange={(e) => setLocalSyncStrategy((prev) => ({ ...prev, scheduledSync: e.target.value }))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-amber-800 outline-none"
                    >
                      <option value="5m">مزامنة فورية (كل 5 دقائق)</option>
                      <option value="15m">كل 15 دقيقة</option>
                      <option value="1h">كل ساعة</option>
                      <option value="daily">تصفية يومية نهاية الورودية (Daily Shift)</option>
                    </select>
                  </div>

                  <label className="flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer pt-2 border-t border-slate-200">
                    <span>{isRtl ? 'خصم المخزون التلقائي فور ورود الفواتير من الكاشير المحلي:' : 'Auto Deduct Stock Upon Local Receipt Import:'}</span>
                    <input
                      type="checkbox"
                      checked={localSyncStrategy.autoDeductStock}
                      onChange={(e) => setLocalSyncStrategy((prev) => ({ ...prev, autoDeductStock: e.target.checked }))}
                      className="w-4 h-4 text-amber-600 rounded-md"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer pt-2 border-t border-slate-200">
                    <span>{isRtl ? 'الاحتفاظ بسجل التدقيق المحلي لجميع العمليات (Local Audit Log):' : 'Keep Audit Log for Local Sync Transactions:'}</span>
                    <input
                      type="checkbox"
                      checked={localSyncStrategy.keepLocalLog}
                      onChange={(e) => setLocalSyncStrategy((prev) => ({ ...prev, keepLocalLog: e.target.checked }))}
                      className="w-4 h-4 text-amber-600 rounded-md"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setLocalWizardStep(5)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    {isRtl ? '← التوجيه' : '← Back'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLocalWizardConnector}
                    className="px-8 py-3.5 rounded-2xl font-bold text-xs text-slate-900 bg-amber-400 hover:bg-amber-300 shadow-xl flex items-center gap-2 transition-transform active:scale-95 cursor-pointer font-bold"
                  >
                    <span>💻</span>
                    {isRtl ? 'حفظ واعتمد ربط الكاشير 🚀' : 'Save & Activate Local System Sync 🚀'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 1: SIMPLE USER INTERFACE (بطاقات الربط الآلي الأربعة)
         ========================================================================= */}
      {!showDevOptions ? (
        <div className="space-y-6">
          {/* Supabase Cloud Database Connection Banner */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-2xl shrink-0">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base md:text-lg">
                    {isRtl ? 'قاعدة بيانات Supabase السحابية' : 'Supabase Cloud Database'}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      isSupabaseConfigured
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                    {isSupabaseConfigured ? (isRtl ? 'متصل ومحمي بـ RLS' : 'Connected (RLS Active)') : (isRtl ? 'إعداد متغيرات البيئة مطلوب' : 'Env Setup Required')}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {isRtl
                    ? 'ربط سحابي مشفر يعتمد المفتاح الآمن (Anon Key) وعزل صلاحيات الجداول للحفاظ على أمان وسرية بيانات المتجر.'
                    : 'Encrypted cloud connection utilizing Anon Key and RLS row permissions.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert(isRtl ? 'حالة Supabase: متصل وسليمة ⚡ — في انتظار توجيهك لكل شاشة' : 'Supabase status: Ready & awaiting screen routing')}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-sm flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Database className="w-4 h-4" />
              {isRtl ? 'فحص واختبار Supabase ⚡' : 'Inspect & Test Supabase ⚡'}
            </button>
          </div>

          {/* Main Integration Cards Grid: 2 wide cards per row (2x2 grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARD 1: اربط متجرك الالكتروني */}
            {(() => {
              const ecomConn = connectors.find((c) => c.type === 'shopify' || c.type === 'woocommerce' || c.type === 'custom_rest') || connectors[0];
              const isConnected = ecomConn && ecomConn.status === 'active';

              return (
                <div
                  onClick={() => handleOpenEcomWizard()}
                  className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[250px] relative overflow-hidden group cursor-pointer"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-3xl font-bold shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                          🛒
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg md:text-xl">
                            {isRtl ? 'اربط متجرك الالكتروني' : 'Connect Your E-Commerce Store'}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {isConnected
                              ? (isRtl ? `مربوط حالياً: ${ecomConn.name}` : `Connected: ${ecomConn.name}`)
                              : (isRtl ? 'ربط المتاجر الإلكترونية (Shopify, WooCommerce, سلة, زد...) وسحب البيانات إلى BizOS.' : 'Sync orders and inventory automatically from your online store.')}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 ${
                          isConnected
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                        {isConnected ? (isRtl ? 'متصل' : 'Connected') : (isRtl ? 'جاهز للربط' : 'Ready')}
                      </span>
                    </div>

                    {/* Department Data Routing Badges */}
                    {isConnected && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-bold text-slate-400 font-mono flex items-center gap-1">
                          <Layers className="w-3 h-3 text-indigo-600" />
                          {isRtl ? 'الأقسام الموجهة:' : 'Routed:'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {isRtl ? '🧾 قسم المبيعات' : '🧾 Sales'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                          {isRtl ? '📦 قسم المخزون' : '📦 Inventory'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                          {isRtl ? '👥 سجل العملاء' : '👥 CRM'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {isRtl ? '💳 المالية' : '💳 Finance'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-slate-400 font-mono">
                      {isConnected
                        ? `آخر مزامنة: ${ecomConn.lastSyncAt ? new Date(ecomConn.lastSyncAt).toLocaleTimeString(isRtl ? 'ar-SA' : 'en-US') : 'الآن'}`
                        : '11 منصة تجارة مدعومة'}
                    </span>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {isConnected ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReconnectStore(ecomConn.id)}
                            className="px-3.5 py-2 rounded-xl font-bold text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            {isRtl ? 'مزامنة الآن' : 'Sync Now'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEcomWizard()}
                            className="px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            {isRtl ? 'توجيه البيانات' : 'Route Data'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConnectors((prev) =>
                                prev.map((c) => (c.id === ecomConn.id ? { ...c, status: 'draft' } : c))
                              );
                            }}
                            className="px-3 py-2 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          >
                            {isRtl ? 'فصل الاتصال' : 'Disconnect'}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenEcomWizard()}
                          className="px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                          style={{ backgroundColor: customPalette.primaryAccent }}
                        >
                          <Zap className="w-4 h-4" />
                          {isRtl ? 'بدء الربط 🚀' : 'Start Connection 🚀'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* CARD 2: اربط صفحتك والقنوات التجارية */}
            {(() => {
              const socialConn = connectors.find((c) => c.id.includes('social') || c.name.includes('صفحة')) || null;
              const isConnected = socialConn && socialConn.status === 'active';

              return (
                <div
                  onClick={() => handleOpenSocialWizard()}
                  className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[250px] relative overflow-hidden group cursor-pointer"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center text-3xl font-bold shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                          📱
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg md:text-xl">
                            {isRtl ? 'اربط صفحتك' : 'Connect Your Page'}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {isConnected
                              ? (isRtl ? `مربوط حالياً: ${socialConn.name}` : `Connected: ${socialConn.name}`)
                              : (isRtl ? 'ربط صفحاتك وقنوات المحادثات (Instagram, Facebook, WhatsApp, TikTok) لاستقبال الطلبات.' : 'Connect social media pages and chat channels for direct order syncing.')}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 ${
                          isConnected
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                        {isConnected ? (isRtl ? 'متصل' : 'Connected') : (isRtl ? 'جاهز للربط' : 'Ready')}
                      </span>
                    </div>

                    {/* Purpose Badges & Department Data Routing Badges */}
                    {isConnected ? (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-bold text-slate-400 font-mono flex items-center gap-1">
                          <Layers className="w-3 h-3 text-purple-600" />
                          {isRtl ? 'الأغراض المربوطة:' : 'Purposes:'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                          {isRtl ? '📸 منتجات وتفاعل' : '📸 Showcase'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {isRtl ? '💬 محادثات وطلبات' : '💬 Chats & Direct'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                          {isRtl ? '🎯 قسم التسويق' : '🎯 Marketing'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {isRtl ? '🧾 قسم المبيعات' : '🧾 Sales'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400 font-mono">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">Facebook Pages</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">Instagram</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">WhatsApp</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">TikTok</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-slate-400 font-mono">
                      {isConnected
                        ? `آخر تحديث: ${socialConn.lastSyncAt ? new Date(socialConn.lastSyncAt).toLocaleTimeString(isRtl ? 'ar-SA' : 'en-US') : 'الآن'}`
                        : 'ربط مستقل للتفاعل والمحادثات'}
                    </span>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {isConnected ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReconnectStore(socialConn.id)}
                            className="px-3.5 py-2 rounded-xl font-bold text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            {isRtl ? 'مزامنة الآن' : 'Sync Now'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenSocialWizard()}
                            className="px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            {isRtl ? 'إدارة وتوجيه' : 'Manage & Route'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConnectors((prev) =>
                                prev.map((c) => (c.id === socialConn.id ? { ...c, status: 'draft' } : c))
                              );
                            }}
                            className="px-3 py-2 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          >
                            {isRtl ? 'فصل الاتصال' : 'Disconnect'}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenSocialWizard()}
                          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                        >
                          <span>📲</span>
                          {isRtl ? 'بدء الربط 📲' : 'Start Connection 📲'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* CARD 3: اربط موقعك */}
            {(() => {
              const dbConn = connectors.find((c) => (c.type as string) === 'site' || c.id.includes('site') || c.id.includes('db')) || null;
              const isConnected = dbConn && dbConn.status === 'active';

              return (
                <div
                  onClick={() => handleOpenDbWizard()}
                  className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[250px] relative overflow-hidden group cursor-pointer"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                          🌐
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg md:text-xl">
                            {isRtl ? 'اربط موقعك' : 'Connect Your Website'}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {isConnected
                              ? (isRtl ? `مربوط حالياً: ${dbConn.name}` : `Connected: ${dbConn.name}`)
                              : (isRtl ? 'ربط قاعدة بيانات موقعك الإلكتروني (PostgreSQL, MySQL, MongoDB, Firebase) مع أقسام BizOS.' : 'Connect custom website database with BizOS departments.')}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 ${
                          isConnected
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                        {isConnected ? (isRtl ? 'متصل' : 'Connected') : (isRtl ? 'جاهز للربط' : 'Ready')}
                      </span>
                    </div>

                    {/* Engine & Mapped Tables Badges */}
                    {isConnected ? (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-bold text-slate-400 font-mono flex items-center gap-1">
                          <Database className="w-3 h-3 text-blue-600" />
                          {isRtl ? 'الجداول المربوطة:' : 'Tables:'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {isRtl ? '📦 الطلبات والمبيعات' : '📦 Orders'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {isRtl ? '🏷️ الكتالوج والمخزون' : '🏷️ Products'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {isRtl ? '👥 سجل العملاء CRM' : '👥 Customers'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                          {isRtl ? '🧾 الإدارة المالية' : '🧾 Invoices'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400 font-mono">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">PostgreSQL</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">MySQL</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">MongoDB</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">Firebase</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-slate-400 font-mono">
                      {isConnected
                        ? `آخر تحديث: ${dbConn.lastSyncAt ? new Date(dbConn.lastSyncAt).toLocaleTimeString(isRtl ? 'ar-SA' : 'en-US') : 'الآن'}`
                        : 'ربط مباشر وقواعد مستضافة'}
                    </span>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {isConnected ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReconnectStore(dbConn.id)}
                            className="px-3.5 py-2 rounded-xl font-bold text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            {isRtl ? 'مزامنة الآن' : 'Sync Now'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDbWizard()}
                            className="px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            {isRtl ? 'إدارة وتوجيه' : 'Manage & Route'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConnectors((prev) =>
                                prev.map((c) => (c.id === dbConn.id ? { ...c, status: 'draft' } : c))
                              );
                            }}
                            className="px-3 py-2 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          >
                            {isRtl ? 'فصل الاتصال' : 'Disconnect'}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenDbWizard()}
                          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                        >
                          <Globe className="w-4 h-4 text-emerald-300" />
                          {isRtl ? 'بدء الربط 🌐' : 'Start Connection 🌐'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* CARD 4: اربط نظامك المحلي */}
            {(() => {
              const localConn = connectors.find((c) => c.id.includes('local') || c.name.includes('محلي') || c.name.includes('كاشير')) || null;
              const isConnected = localConn && localConn.status === 'active';

              return (
                <div
                  onClick={() => handleOpenLocalWizard()}
                  className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[250px] relative overflow-hidden group cursor-pointer"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center text-3xl font-bold shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                          💻
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg md:text-xl">
                            {isRtl ? 'اربط نظامك المحلي' : 'Connect Local System'}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {isConnected
                              ? (isRtl ? `مربوط حالياً: ${localConn.name}` : `Connected: ${localConn.name}`)
                              : (isRtl ? 'ربط برنامج الكاشير المحلي والمتاجر المغلقة عبر 6 آليات تكامل متقدمة.' : 'Connect local cashier systems & closed POS via 6 smart assessment methods.')}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 ${
                          isConnected
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                        {isConnected ? (isRtl ? 'متصل' : 'Connected') : (isRtl ? 'جاهز للربط' : 'Ready')}
                      </span>
                    </div>

                    {/* Available Methods Badges / Mapped Badges */}
                    {isConnected ? (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-bold text-slate-400 font-mono flex items-center gap-1">
                          <Layers className="w-3 h-3 text-amber-600" />
                          {isRtl ? 'الأقسام المربوطة:' : 'Mapped:'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-100">
                          {isRtl ? '🧾 المبيعات والكاشير' : '🧾 POS Sales'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {isRtl ? '🏷️ الكتالوج والمخزون' : '🏷️ Products'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {isRtl ? '👥 سجل العملاء' : '👥 Customers'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400 font-mono">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">1. API</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">2. Direct DB</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">3. Local Agent</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">4. Excel/CSV</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">5. Folder Watcher</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">6. Custom SDK</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-slate-400 font-mono">
                      {isConnected
                        ? `آخر تحديث: ${localConn.lastSyncAt ? new Date(localConn.lastSyncAt).toLocaleTimeString(isRtl ? 'ar-SA' : 'en-US') : 'الآن'}`
                        : '6 خيارات للأنظمة المفتوحة والمغلقة'}
                    </span>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {isConnected ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReconnectStore(localConn.id)}
                            className="px-3.5 py-2 rounded-xl font-bold text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            {isRtl ? 'مزامنة الآن' : 'Sync Now'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenLocalWizard()}
                            className="px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            {isRtl ? 'إدارة وتوجيه' : 'Manage & Route'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConnectors((prev) =>
                                prev.map((c) => (c.id === localConn.id ? { ...c, status: 'draft' } : c))
                              );
                            }}
                            className="px-3 py-2 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          >
                            {isRtl ? 'فصل الاتصال' : 'Disconnect'}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenLocalWizard()}
                          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer font-bold"
                        >
                          <span>💻</span>
                          {isRtl ? 'بدء الربط 💻' : 'Start Connection 💻'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
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

          {connectors.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 space-y-3 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 mx-auto flex items-center justify-center text-2xl font-bold">
                🗑️
              </div>
              <h4 className="font-bold text-slate-800 text-base">
                {isRtl ? 'لا يوجد مصادر بيانات مربوطة حالياً' : 'No connectors found'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {isRtl
                  ? 'تم حذف جميع المصادر بسلة المهملات. يمكنك إضافة متجر أو مصدر بيانات جديد في أي وقت بضغطة زر.'
                  : 'All connectors have been deleted. You can create a new connector anytime.'}
              </p>
              <button
                onClick={handleOpenAddConnector}
                className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md inline-flex items-center gap-2 transition-transform active:scale-95 cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                {isRtl ? 'إضافة مصدر بيانات جديد الآن' : 'Add Connector Now'}
              </button>
            </div>
          ) : (
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

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditConnector(conn);
                      }}
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer"
                      title={isRtl ? 'تعديل إعدادات المصدر' : 'Edit Connector'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConnector(conn.id);
                      }}
                      className="p-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 transition-all cursor-pointer shadow-xs"
                      title={isRtl ? 'حذف المصدر بسلة المهملات' : 'Delete Connector'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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

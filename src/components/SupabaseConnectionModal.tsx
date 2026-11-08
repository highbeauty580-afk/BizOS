import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertTriangle, RefreshCw, ShieldCheck, Lock, ExternalLink, Info, Copy, Check } from 'lucide-react';
import { testSupabaseConnection, isSupabaseConfigured, SupabaseHealthResult } from '../lib/supabase';

interface SupabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRtl?: boolean;
}

export const SupabaseConnectionModal: React.FC<SupabaseConnectionModalProps> = ({
  isOpen,
  onClose,
  isRtl = true,
}) => {
  const [testing, setTesting] = useState(false);
  const [health, setHealth] = useState<SupabaseHealthResult | null>(null);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const runTest = async () => {
    setTesting(true);
    const result = await testSupabaseConnection();
    setHealth(result);
    setTesting(false);
  };

  useEffect(() => {
    if (isOpen) {
      runTest();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const envTemplate = `VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-200 text-right">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-2xl shadow-inner">
              ⚡
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                {isRtl ? 'إعداد واختبار اتصال Supabase السحابي' : 'Supabase Cloud Connection Setup'}
              </h3>
              <p className="text-xs text-slate-500">
                {isRtl ? 'ربط سحابي آمن باستخدام VITE_SUPABASE_URL و Anon Key مع حماية RLS' : 'Secure Supabase client initialized via Vite env vars and RLS protection'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Status Overview Card */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            health?.success
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : !isSupabaseConfigured
              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
              : 'bg-rose-50/80 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              {health?.success ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : !isSupabaseConfigured ? (
                <Info className="w-6 h-6 text-amber-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
              )}
              <div>
                <h4 className="font-bold text-sm">
                  {health?.success
                    ? (isRtl ? 'الاتصال بـ Supabase فعال وجاهز' : 'Supabase Connected & Active')
                    : !isSupabaseConfigured
                    ? (isRtl ? 'متغيرات البيئة غير مكتملة' : 'Environment Variables Missing')
                    : (isRtl ? 'فشل فحص الاتصال بـ Supabase' : 'Connection Failed')}
                </h4>
                <p className="text-xs opacity-80 font-mono mt-0.5">{health?.statusMessageAr}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={runTest}
              disabled={testing}
              className="px-3.5 py-2 rounded-xl font-bold text-xs bg-white shadow-xs hover:bg-slate-50 text-slate-800 border border-slate-200 flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              {testing ? (isRtl ? 'جارِ الفحص...' : 'Testing...') : (isRtl ? 'إعادة الفحص' : 'Re-test')}
            </button>
          </div>

          {health?.details && health.details.length > 0 && (
            <div className="mt-3 bg-white/90 rounded-xl p-3 border border-slate-200/60 space-y-1 font-mono text-xs">
              {health.details.map((d, i) => (
                <p key={i} className={d.startsWith('✓') ? 'text-emerald-700 font-semibold' : d.startsWith('ℹ️') ? 'text-amber-800' : 'text-rose-700'}>
                  {d}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Security Rules & Protections Summary */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-xs flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              {isRtl ? 'معايير الأمان المطبقة لربط Supabase:' : 'Supabase Security Protocols:'}
            </span>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md">
              Anon Key Only
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-300 leading-relaxed font-sans">
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>عدم استخدام مفتاح <code className="text-amber-300 font-mono">service_role</code> نهائياً في الواجهة الأمامية.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>فرض صلاحيات الجدول عبر Row Level Security (RLS) بقاعدة البيانات.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>عزل بيانات كل متجر/حساب وعدم السماح بالوصول لبيانات الآخرين.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>استخدام متغيرات بيئة <code className="text-emerald-300 font-mono">VITE_*</code> دون تخزين مفاتيح في Git.</span>
            </div>
          </div>
        </div>

        {/* Setup Instructions for User */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <h4 className="font-bold text-slate-900 flex items-center justify-between">
            <span>{isRtl ? 'متغيرات البيئة المطلوبة في ملف .env:' : 'Required .env Variables:'}</span>
            <button
              type="button"
              onClick={handleCopyEnv}
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-mono text-[11px] bg-white border border-slate-200 px-2.5 py-1 rounded-lg cursor-pointer"
            >
              {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedEnv ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ النموذج' : 'Copy Template')}
            </button>
          </h4>

          <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto text-left dir-ltr">
            {envTemplate}
          </pre>

          <div className="space-y-1.5 text-slate-600 text-[11px] pt-1 leading-relaxed">
            <p className="font-bold text-slate-800">{isRtl ? 'خطوات الإعداد داخل لوحة Supabase Dashboard:' : 'Required steps inside Supabase Dashboard:'}</p>
            <ol className="list-decimal list-inside space-y-1 font-sans">
              <li>افتح مشروعك في Supabase واذهب إلى <strong>Project Settings &gt; API</strong>.</li>
              <li>انسخ <strong>Project URL</strong> وضعه في قيمة <code className="font-mono text-blue-700">VITE_SUPABASE_URL</code>.</li>
              <li>انسخ <strong>anon / public key</strong> وضعه في قيمة <code className="font-mono text-blue-700">VITE_SUPABASE_ANON_KEY</code>.</li>
              <li>تأكد من إضافة رابط التطبيق في <strong>Authentication &gt; URL Configuration &gt; Redirect URLs</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>{isRtl ? 'الانتقال إلى لوحة Supabase' : 'Open Supabase Dashboard'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer shadow-sm"
          >
            {isRtl ? 'إغلاق النافذة' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

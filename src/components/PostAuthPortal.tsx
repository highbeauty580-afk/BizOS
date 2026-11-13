import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowUpLeft,
  ArrowUpRight,
  Briefcase,
  Building2,
  FolderKanban,
  Globe,
  Layers,
  LogOut,
  Moon,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { ProfnessNetworkBackground } from './ProfnessNetworkBackground';
import {
  createTenantForOwner,
  fetchPostAuthPortalData,
  PostAuthPortalState,
  TenantRole,
  TenantWithMembership,
} from '../lib/tenantsService';

interface PostAuthPortalProps {
  onSelectTenant: (tenant: TenantWithMembership, isConsultant: boolean) => void;
}

export const PostAuthPortal: React.FC<PostAuthPortalProps> = ({ onSelectTenant }) => {
  const { user, signOut } = useAuth();
  const {
    language,
    setLanguage,
    isDarkPortal: isDarkMode,
    toggleDarkPortal,
    setAvailableProjectsCount,
  } = useApp();

  const isRtl = language === 'ar';

  const [portalState, setPortalState] = useState<PostAuthPortalState>({
    profile: null,
    isConsultant: false,
    isCashier: false,
    isDisabledCashier: false,
    hasMultipleProjects: false,
    ownerProject: null,
    staffProject: null,
    projects: [],
    error: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isAutoRoutingOwner, setIsAutoRoutingOwner] = useState<boolean>(false);
  const [hasLockedOnboarding, setHasLockedOnboarding] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // First-time Owner onboarding modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const onSelectTenantRef = useRef(onSelectTenant);
  onSelectTenantRef.current = onSelectTenant;

  const loadPortalData = useCallback(
    async (silent = false) => {
      if (!user) return;
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const result = await fetchPostAuthPortalData(user);
      setAvailableProjectsCount(result.projects.length);

      // Single-Project Owner: skip portal & route directly into Owner dashboard
      if (!result.error && !result.isConsultant && !result.hasMultipleProjects && result.ownerProject) {
        setHasLockedOnboarding(true);
        setIsAutoRoutingOwner(true);
        setPortalState(result);
        setIsLoading(false);
        setIsRefreshing(false);
        onSelectTenantRef.current(result.ownerProject, false);
        return;
      }

      // Single-Project Cashier / Staff: skip portal & route directly into POS cashier screen
      if (!result.error && !result.isConsultant && !result.hasMultipleProjects && result.staffProject) {
        setHasLockedOnboarding(true);
        setIsAutoRoutingOwner(true);
        setPortalState(result);
        setIsLoading(false);
        setIsRefreshing(false);
        onSelectTenantRef.current(result.staffProject, false);
        return;
      }

      setPortalState(result);
      setIsLoading(false);
      setIsRefreshing(false);
    },
    [user, setAvailableProjectsCount]
  );

  useEffect(() => {
    loadPortalData(false);
  }, [loadPortalData]);

  const displayName = useMemo(() => {
    if (portalState.profile?.fullName?.trim()) return portalState.profile.fullName.trim();
    const metaName = user?.user_metadata?.full_name || user?.user_metadata?.display_name;
    if (metaName && String(metaName).trim()) return String(metaName).trim();
    return user?.email?.split('@')[0] || (isRtl ? 'مستخدم النظام' : 'Workspace User');
  }, [portalState.profile, user, isRtl]);

  const getRoleLabel = (role: TenantRole): string => {
    const normalized = String(role || 'consultant').toLowerCase();
    if (normalized === 'owner') return isRtl ? 'مالك المشروع (Owner)' : 'Owner';
    if (normalized === 'cashier') return isRtl ? 'كاشير مبيعات (Cashier)' : 'Cashier (POS Only)';
    if (normalized === 'consultant' || normalized === 'advisor') {
      return isRtl ? 'إشراف استشاري' : 'Consultant Oversight';
    }
    if (normalized === 'admin') return isRtl ? 'مدير نظام' : 'Admin';
    return isRtl ? 'عضو فريق' : 'Member';
  };

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return portalState.projects;
    return portalState.projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        getRoleLabel(p.role).toLowerCase().includes(q)
    );
  }, [portalState.projects, searchQuery, isRtl]);

  const aggregateStats = useMemo(() => {
    return portalState.projects.reduce(
      (acc, proj) => ({
        totalOrders: acc.totalOrders + (proj.metrics.ordersCount || 0),
        totalCustomers: acc.totalCustomers + (proj.metrics.customersCount || 0),
        totalRevenue: acc.totalRevenue + (proj.metrics.revenueTotal || 0),
      }),
      { totalOrders: 0, totalCustomers: 0, totalRevenue: 0 }
    );
  }, [portalState.projects]);

  const handleOpenCreateModal = () => {
    if (hasLockedOnboarding || portalState.ownerProject) return;
    setCreateError(null);
    setNewProjectName('');
    setIsCreateModalOpen(true);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || hasLockedOnboarding || portalState.ownerProject) return;
    setCreateError(null);

    const trimmed = newProjectName.trim();
    if (!trimmed) {
      setCreateError(
        isRtl ? 'يرجى إدخال اسم المشروع للمتابعة.' : 'Please enter a project name to continue.'
      );
      return;
    }

    setIsCreating(true);
    const res = await createTenantForOwner(trimmed, user.id);
    setIsCreating(false);

    if (!res.success || !res.tenant) {
      setCreateError(
        res.error ||
          (isRtl ? 'تعذر إنشاء المشروع في قاعدة البيانات.' : 'Unable to create project in database.')
      );
      return;
    }

    // Rule A Condition 2: Lock/hide onboarding permanently and transition directly into the new project dashboard
    setHasLockedOnboarding(true);
    setIsAutoRoutingOwner(true);
    setIsCreateModalOpen(false);
    setNewProjectName('');
    setPortalState((prev) => ({
      ...prev,
      ownerProject: res.tenant!,
      projects: [res.tenant!],
    }));

    onSelectTenant(res.tenant, false);
  };

  const formatDate = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat(isRtl ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(isoString));
    } catch {
      return '';
    }
  };

  const showLoadingSkeleton = isLoading || isAutoRoutingOwner;
  const showDisabledCashierNotice =
    !showLoadingSkeleton &&
    !portalState.isConsultant &&
    !portalState.ownerProject &&
    !portalState.staffProject &&
    portalState.isDisabledCashier &&
    !portalState.error;
  const showOwnerOnboarding =
    !showLoadingSkeleton &&
    !portalState.isConsultant &&
    !portalState.hasMultipleProjects &&
    !portalState.isCashier &&
    !portalState.isDisabledCashier &&
    !portalState.ownerProject &&
    !portalState.staffProject &&
    !hasLockedOnboarding &&
    !portalState.error;
  const showConsultantDashboard =
    !showLoadingSkeleton && (portalState.isConsultant || portalState.hasMultipleProjects);
  const OpenArrow = isRtl ? ArrowUpLeft : ArrowUpRight;

  const glassCardClass = isDarkMode
    ? 'bg-slate-900/40 backdrop-blur-xl border border-teal-500/20 shadow-2xl'
    : 'bg-white/90 backdrop-blur-2xl border border-[#DCE3ED]/90 shadow-[0_24px_60px_-15px_rgba(1,53,137,0.10),0_6px_18px_rgba(37,89,175,0.06)]';

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen w-full flex flex-col justify-between relative overflow-hidden font-sans transition-colors duration-300 ${
        isDarkMode
          ? 'bg-[#060b14] text-slate-100 selection:bg-teal-500/30 selection:text-teal-200'
          : 'bg-[#F5F7FA] text-[#172B4D] selection:bg-[#EDF1F6] selection:text-[#013589]'
      }`}
    >
      {/* Ambient Background & Network Plexus */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <ProfnessNetworkBackground theme={isDarkMode ? 'dark' : 'light'} />

        {isDarkMode ? (
          <>
            <div
              className="absolute -top-44 left-1/2 -translate-x-1/2 w-[780px] h-[520px] rounded-full blur-[140px] opacity-60 animate-float-slow"
              style={{
                background:
                  'radial-gradient(circle, rgba(20, 184, 166, 0.22) 0%, rgba(16, 185, 129, 0.12) 45%, transparent 100%)',
              }}
            />
            <div
              className="absolute -bottom-48 -left-24 w-[540px] h-[540px] rounded-full blur-[150px] opacity-55"
              style={{
                background:
                  'radial-gradient(circle, rgba(13, 148, 136, 0.20) 0%, rgba(6, 182, 212, 0.08) 55%, transparent 100%)',
              }}
            />
            <div
              className="absolute -bottom-40 -right-24 w-[540px] h-[540px] rounded-full blur-[150px] opacity-50"
              style={{
                background:
                  'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(20, 184, 166, 0.08) 55%, transparent 100%)',
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, #2dd4bf 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
          </>
        ) : (
          <>
            <div
              className="absolute -top-32 left-1/2 -translate-x-1/2 w-[760px] h-[520px] rounded-full blur-[130px] opacity-75"
              style={{
                background:
                  'radial-gradient(circle, rgba(71, 126, 216, 0.22) 0%, rgba(37, 89, 175, 0.14) 45%, rgba(1, 53, 137, 0.06) 70%, transparent 100%)',
              }}
            />
            <div
              className="absolute -bottom-40 -left-24 w-[520px] h-[520px] rounded-full blur-[140px] opacity-60"
              style={{
                background:
                  'radial-gradient(circle, rgba(1, 53, 137, 0.16) 0%, rgba(71, 126, 216, 0.10) 50%, transparent 100%)',
              }}
            />
            <div
              className="absolute -bottom-36 -right-20 w-[560px] h-[560px] rounded-full blur-[150px] opacity-60"
              style={{
                background:
                  'radial-gradient(circle, rgba(37, 89, 175, 0.16) 0%, rgba(101, 223, 210, 0.08) 50%, transparent 100%)',
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, #2559AF 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
          </>
        )}
      </div>

      {/* Glassmorphic Top Navigation Bar */}
      <header
        className={`w-full sticky top-0 z-30 border-b backdrop-blur-xl transition-colors ${
          isDarkMode
            ? 'border-teal-500/15 bg-slate-950/65'
            : 'border-[#DCE3ED]/90 bg-white/80 shadow-[0_2px_12px_rgba(1,53,137,0.04)]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-4">
          {/* Profness Brand Identity */}
          <div className="flex items-center gap-3">
            {isDarkMode ? (
              <div className="w-10 h-10 rounded-xl bg-slate-900/80 border border-teal-500/25 flex items-center justify-center shadow-lg shadow-teal-500/10">
                <img
                  src="/assets/aistudio/profness_v6-removebg-preview__1__59596515.png"
                  alt="Profness Icon"
                  className="h-7 w-7 object-contain"
                />
              </div>
            ) : (
              <img
                src="/assets/aistudio/profness_v6-removebg-preview__1__59596515.png"
                alt="Profness Icon"
                className="h-9 sm:h-10 w-auto object-contain shrink-0 filter drop-shadow-xs"
              />
            )}
            <div className="flex flex-col">
              <img
                src="/assets/aistudio/Profness_Full_Logo_transparent.png"
                alt="Profness"
                className={`h-5 sm:h-6 w-auto object-contain select-none transition-all ${
                  isDarkMode ? 'brightness-0 invert opacity-95' : ''
                }`}
              />
              <span
                className={`text-[11px] font-medium tracking-wide hidden sm:block ${
                  isDarkMode ? 'text-teal-400/80' : 'text-[#68778D]'
                }`}
              >
                {portalState.isConsultant
                  ? isRtl
                    ? 'بوابة الاستشاري ومتابعة المشاريع'
                    : 'Consultant Multi-Project Oversight'
                  : portalState.hasMultipleProjects
                    ? isRtl
                      ? 'بوابة المشاريع وتبديل الصلاحيات'
                      : 'Multi-Project & Role Switcher'
                    : isRtl
                      ? 'نظام الإدارة السحابي'
                      : 'Cloud Workspace Portal'}
              </span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {(portalState.isConsultant || portalState.hasMultipleProjects) && (
              <button
                type="button"
                onClick={() => loadPortalData(true)}
                disabled={isRefreshing || showLoadingSkeleton}
                className={`p-2 rounded-xl border transition-all cursor-pointer disabled:opacity-50 ${
                  isDarkMode
                    ? 'bg-slate-900/60 border-teal-500/20 text-slate-300 hover:text-teal-300 hover:border-teal-400/40'
                    : 'bg-white/85 border-[#DCE3ED] text-[#68778D] hover:text-[#2559AF] hover:border-[#2559AF]/45 shadow-xs'
                }`}
                title={isRtl ? 'تحديث البيانات' : 'Refresh data'}
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    isRefreshing ? (isDarkMode ? 'animate-spin text-teal-400' : 'animate-spin text-[#2559AF]') : ''
                  }`}
                />
              </button>
            )}

            {/* Light / Dark Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleDarkPortal}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                isDarkMode
                  ? 'bg-slate-900/60 border-teal-500/20 hover:border-teal-400/40 text-slate-200 hover:text-teal-300'
                  : 'bg-white/85 border-[#DCE3ED] hover:border-[#2559AF]/50 hover:bg-white text-[#172B4D] shadow-xs'
              }`}
              title={
                isDarkMode
                  ? isRtl
                    ? 'التبديل إلى الوضع المضيء'
                    : 'Switch to Light Mode'
                  : isRtl
                    ? 'التبديل إلى الوضع الليلي'
                    : 'Switch to Dark Mode'
              }
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline font-bold">
                    {isRtl ? 'الوضع المضيء' : 'Light'}
                  </span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#2559AF]" />
                  <span className="hidden sm:inline font-bold">
                    {isRtl ? 'الوضع الليلي' : 'Dark'}
                  </span>
                </>
              )}
            </button>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                isDarkMode
                  ? 'bg-slate-900/60 border-teal-500/20 hover:border-teal-400/40 text-slate-200 hover:text-teal-300'
                  : 'bg-white/85 border-[#DCE3ED] hover:border-[#2559AF]/50 hover:bg-white text-[#172B4D] shadow-xs'
              }`}
              title={isRtl ? 'تغيير اللغة' : 'Switch Language'}
            >
              <Globe className={`w-3.5 h-3.5 ${isDarkMode ? 'text-teal-400' : 'text-[#2559AF]'}`} />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {/* Authenticated User Badge */}
            {user && (
              <div
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium max-w-[200px] ${
                  isDarkMode
                    ? 'bg-slate-900/60 border-teal-500/20 text-slate-200'
                    : 'bg-[#EDF1F6]/80 border-[#DCE3ED] text-[#172B4D]'
                }`}
                title={user.email}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isDarkMode
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                      : 'bg-emerald-500'
                  }`}
                />
                <span className="truncate">{displayName}</span>
              </div>
            )}

            {/* Sign Out */}
            <button
              type="button"
              onClick={() => signOut()}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                isDarkMode
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/25 hover:border-rose-400/40 text-rose-300'
                  : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRtl ? 'خروج' : 'Sign out'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
        {/* Global Fetch Error Banner */}
        {portalState.error && (
          <div
            className={`mb-6 p-4 rounded-2xl backdrop-blur-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl ${
              isDarkMode
                ? 'bg-rose-950/50 border-rose-500/30 text-rose-200'
                : 'bg-rose-50/95 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <AlertCircle className={`w-5 h-5 shrink-0 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`} />
              <div className="text-sm">
                <span className="font-bold block">
                  {isRtl ? 'تعذر تحميل بيانات المشاريع من قاعدة البيانات' : 'Failed to load workspace data'}
                </span>
                <span className={`text-xs ${isDarkMode ? 'text-rose-300/80' : 'text-rose-600'}`}>
                  {portalState.error}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadPortalData(false)}
              className={`px-4 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto ${
                isDarkMode
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-400/30 text-rose-100'
                  : 'bg-rose-100 hover:bg-rose-200 border-rose-300 text-rose-800'
              }`}
            >
              {isRtl ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        )}

        {/* 1. LOADING SKELETON STATE (Also shown while auto-routing existing Owner to dashboard) */}
        {showLoadingSkeleton && (
          <div className="space-y-8 animate-pulse">
            <div className={`${glassCardClass} rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6`}>
              <div className="space-y-3 flex-1">
                <div className={`h-4 w-36 rounded-lg ${isDarkMode ? 'bg-teal-500/15' : 'bg-[#DCE3ED]'}`} />
                <div className={`h-8 w-64 rounded-xl ${isDarkMode ? 'bg-slate-800/80' : 'bg-[#EDF1F6]'}`} />
                <div className={`h-4 w-80 max-w-full rounded-lg ${isDarkMode ? 'bg-slate-800/60' : 'bg-[#EDF1F6]'}`} />
              </div>
              <div className="grid grid-cols-3 gap-3 sm:w-80">
                <div className={`h-20 rounded-2xl ${isDarkMode ? 'bg-slate-800/70 border border-teal-500/10' : 'bg-[#EDF1F6]'}`} />
                <div className={`h-20 rounded-2xl ${isDarkMode ? 'bg-slate-800/70 border border-teal-500/10' : 'bg-[#EDF1F6]'}`} />
                <div className={`h-20 rounded-2xl ${isDarkMode ? 'bg-slate-800/70 border border-teal-500/10' : 'bg-[#EDF1F6]'}`} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className={`${glassCardClass} rounded-2xl p-6 space-y-5`}>
                  <div className="flex items-center justify-between">
                    <div className={`w-11 h-11 rounded-xl ${isDarkMode ? 'bg-teal-500/15' : 'bg-[#EDF1F6]'}`} />
                    <div className={`h-6 w-20 rounded-lg ${isDarkMode ? 'bg-emerald-500/15' : 'bg-emerald-100'}`} />
                  </div>
                  <div className="space-y-2">
                    <div className={`h-6 w-44 rounded-lg ${isDarkMode ? 'bg-slate-800/80' : 'bg-[#EDF1F6]'}`} />
                    <div className={`h-3.5 w-28 rounded ${isDarkMode ? 'bg-slate-800/60' : 'bg-[#EDF1F6]'}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`h-14 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-[#F5F7FA]'}`} />
                    <div className={`h-14 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-[#F5F7FA]'}`} />
                  </div>
                  <div className={`h-11 w-full rounded-xl ${isDarkMode ? 'bg-teal-500/15' : 'bg-[#EDF1F6]'}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1B. DISABLED / UNLINKED CASHIER GUARD */}
        {showDisabledCashierNotice && (
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className={`${glassCardClass} rounded-3xl p-8 sm:p-12 max-w-xl w-full text-center relative overflow-hidden`}>
              <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center mb-5">
                <ShieldCheck className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className={`text-xl sm:text-2xl font-extrabold mb-3 ${isDarkMode ? 'text-white' : 'text-[#013589]'}`}>
                {isRtl ? 'حساب الموظف غير مفعّل حالياً' : 'Staff Account Inactive'}
              </h2>
              <p className={`text-sm leading-relaxed max-w-md mx-auto mb-7 ${isDarkMode ? 'text-slate-300' : 'text-[#68778D]'}`}>
                {isRtl
                  ? 'تم تعطيل وصول هذا الحساب (كاشير) أو لم يتم تفعيل ربطه بالمشروع بعد. يرجى التواصل مع مالك المشروع لتفعيل صلاحياتك.'
                  : 'This cashier account is currently disabled or pending activation by the project owner.'}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => loadPortalData(false)}
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
                >
                  {isRtl ? 'إعادة التحقق' : 'Refresh Status'}
                </button>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className={`px-5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isDarkMode
                      ? 'border-slate-700 text-slate-200 hover:bg-slate-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isRtl ? 'تسجيل الخروج' : 'Sign Out'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. RULE A CONDITION 2: FIRST-TIME OWNER ONBOARDING VIEW (ZERO ACTIVE PROJECTS) */}
        {showOwnerOnboarding && (
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className={`${glassCardClass} rounded-3xl p-8 sm:p-12 max-w-xl w-full text-center relative overflow-hidden`}>
              {isDarkMode && (
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" />
              )}

              {/* Minimalist Geometric Illustration / Icon Composition */}
              <div className="relative mx-auto w-24 h-24 mb-7 flex items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-3xl blur-xl animate-pulse ${
                    isDarkMode
                      ? 'bg-gradient-to-tr from-teal-500/25 to-emerald-400/20'
                      : 'bg-gradient-to-tr from-[#2559AF]/20 to-[#65DFD2]/25'
                  }`}
                />
                <div
                  className={`relative w-20 h-20 rounded-2xl border flex items-center justify-center shadow-xl ${
                    isDarkMode
                      ? 'bg-slate-900/80 border-teal-400/35 shadow-teal-500/15'
                      : 'bg-white border-[#DCE3ED] shadow-[#013589]/10'
                  }`}
                >
                  <Building2
                    className={`w-10 h-10 stroke-[1.75] ${
                      isDarkMode ? 'text-teal-300' : 'text-[#013589]'
                    }`}
                  />
                  <span
                    className={`absolute -top-2 -right-2 w-7 h-7 rounded-xl border flex items-center justify-center backdrop-blur-md ${
                      isDarkMode
                        ? 'bg-emerald-500/20 border-emerald-400/40'
                        : 'bg-[#65DFD2]/25 border-[#65DFD2]'
                    }`}
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isDarkMode ? 'text-emerald-300' : 'text-[#013589]'}`} />
                  </span>
                </div>
              </div>

              {/* Status Label */}
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-semibold mb-4 ${
                  isDarkMode
                    ? 'bg-teal-500/10 border-teal-400/25 text-teal-300'
                    : 'bg-[#EDF1F6] border-[#DCE3ED] text-[#013589]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    isDarkMode
                      ? 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.9)]'
                      : 'bg-[#65DFD2] shadow-[0_0_8px_rgba(101,223,210,0.85)]'
                  }`}
                />
                <span>{isRtl ? 'الإعداد الأولي لمساحة العمل' : 'First-Time Workspace Setup'}</span>
              </div>

              {/* Headline */}
              <h1
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 ${
                  isDarkMode ? 'text-white' : 'text-[#013589]'
                }`}
              >
                {isRtl ? 'أهلاً بك في نظامك الإداري' : 'Welcome to Your Workspace'}
              </h1>

              {/* Subtext */}
              <p
                className={`text-sm sm:text-base leading-relaxed max-w-md mx-auto mb-8 ${
                  isDarkMode ? 'text-slate-300/90' : 'text-[#68778D]'
                }`}
              >
                {isRtl
                  ? 'لا يوجد أي مشروع مرتبط بحسابك حتى الآن. أنشئ مشروعك الوحيد الآن لتفعيل لوحة التحكم الخاصة بك.'
                  : 'You do not have a project linked to your account yet. Create your project now to launch your dedicated dashboard.'}
              </p>

              {/* Single Prominent Primary CTA Button */}
              <div className="relative inline-block group">
                <div
                  className={`absolute -inset-1 rounded-2xl opacity-45 blur-lg group-hover:opacity-80 transition-opacity duration-300 pointer-events-none ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-400'
                      : 'bg-gradient-to-r from-[#013589] via-[#2559AF] to-[#477ED8]'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className={`relative inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-extrabold text-sm sm:text-base shadow-xl transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-teal-500/25'
                      : 'bg-gradient-to-r from-[#013589] via-[#2559AF] to-[#477ED8] hover:from-[#002B70] hover:via-[#1F4C97] hover:to-[#3B6DC4] text-white shadow-[#013589]/30'
                  }`}
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                  <span>{isRtl ? 'إنشاء مشروعك الأول' : 'Create Your First Project'}</span>
                </button>
              </div>

              {/* Capabilities Footer */}
              <div
                className={`mt-8 pt-6 border-t grid grid-cols-3 gap-3 text-[11px] sm:text-xs ${
                  isDarkMode ? 'border-teal-500/15 text-slate-400' : 'border-[#DCE3ED] text-[#68778D]'
                }`}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <ShoppingBag className={`w-4 h-4 ${isDarkMode ? 'text-teal-400/90' : 'text-[#2559AF]'}`} />
                  <span>{isRtl ? 'مبيعات متكاملة' : 'Integrated POS'}</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <Package className={`w-4 h-4 ${isDarkMode ? 'text-emerald-400/90' : 'text-emerald-600'}`} />
                  <span>{isRtl ? 'مخزون ذكي' : 'Smart Stock'}</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <ShieldCheck className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400/90' : 'text-[#013589]'}`} />
                  <span>{isRtl ? 'ملكية كاملة' : 'Full Ownership'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. RULE B: CONSULTANT / ADVISOR ACCOUNT (ALL REGISTERED TENANTS OVERSIGHT) */}
        {showConsultantDashboard && (
          <div className="space-y-8">
            {/* Greeting Header + Quick Stats */}
            <section className={`${glassCardClass} rounded-3xl p-6 sm:p-8 relative overflow-hidden`}>
              {isDarkMode && (
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
              )}

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2.5">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-semibold ${
                      isDarkMode
                        ? 'bg-teal-500/10 border-teal-400/25 text-teal-300'
                        : 'bg-[#EDF1F6] border-[#DCE3ED] text-[#013589]'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full animate-pulse ${
                        isDarkMode
                          ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                          : 'bg-[#65DFD2] shadow-[0_0_8px_rgba(101,223,210,0.85)]'
                      }`}
                    />
                    <Briefcase className={`w-3.5 h-3.5 ${isDarkMode ? 'text-teal-300' : 'text-[#2559AF]'}`} />
                    <span>
                      {portalState.isConsultant
                        ? isRtl
                          ? 'لوحة الاستشاري — الإشراف العام على المشاريع'
                          : 'Advisor Command Center — All Projects'
                        : isRtl
                        ? 'مشاريعك وصلاحياتك المرتبطة — اختر مساحة العمل'
                        : 'Your Projects & Assigned Roles — Choose Workspace'}
                    </span>
                  </div>

                  <h1
                    className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                      isDarkMode ? 'text-white' : 'text-[#013589]'
                    }`}
                  >
                    {isRtl ? `مرحباً، ${displayName}` : `Welcome back, ${displayName}`}
                  </h1>

                  <p className={`text-sm max-w-2xl leading-relaxed ${isDarkMode ? 'text-slate-300/85' : 'text-[#68778D]'}`}>
                    {portalState.isConsultant
                      ? isRtl
                        ? 'بصفتك مستشاراً، يمكنك استعراض جميع المشاريع المسجلة في المنصة والانتقال مباشرة لإدارة أي مشروع.'
                        : 'As a consultant, you have oversight across all registered projects in the database. Click any project card to manage its workspace.'
                      : isRtl
                      ? 'حسابك مرتبط بأكثر من مشروع. يمكنك اختيار المشروع المناسب الآن؛ الدخول بدور "مالك" يمنحك الصلاحيات الكاملة، بينما الدخول بدور "كاشير" يفتح شاشة البيع (POS) فقط.'
                      : 'Your account belongs to multiple projects. Enter an Owner project for full management access, or a Cashier project for POS-only access.'}
                  </p>
                </div>

                {/* Search Filter across all registered tenants */}
                {portalState.projects.length > 0 && (
                  <div className="relative shrink-0">
                    <Search
                      className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 ${
                        isRtl ? 'right-3.5' : 'left-3.5'
                      } ${isDarkMode ? 'text-slate-400' : 'text-[#8A9BB4]'}`}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isRtl ? 'ابحث في المشاريع...' : 'Search all projects...'}
                      className={`w-full sm:w-64 py-2.5 ${
                        isRtl ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'
                      } rounded-xl text-sm focus:outline-none transition-all ${
                        isDarkMode
                          ? 'bg-slate-950/60 border border-teal-500/20 text-slate-100 placeholder-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20'
                          : 'bg-white border border-[#DCE3ED] text-[#172B4D] placeholder-[#8A9BB4] focus:border-[#2559AF] focus:ring-4 focus:ring-[#2559AF]/10'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Aggregate Quick Stats Strip */}
              <div
                className={`mt-7 pt-6 border-t grid grid-cols-1 sm:grid-cols-3 gap-4 ${
                  isDarkMode ? 'border-teal-500/15' : 'border-[#DCE3ED]'
                }`}
              >
                <div
                  className={`rounded-2xl border p-4 flex items-center justify-between ${
                    isDarkMode ? 'bg-slate-950/45 border-teal-500/15' : 'bg-[#F5F7FA]/90 border-[#DCE3ED]'
                  }`}
                >
                  <div>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-[#68778D]'}`}>
                      {isRtl ? 'إجمالي المشاريع المسجلة' : 'Registered Projects'}
                    </p>
                    <p
                      className={`text-2xl font-extrabold tabular-nums mt-1 ${
                        isDarkMode ? 'text-white' : 'text-[#013589]'
                      }`}
                    >
                      {portalState.projects.length}
                    </p>
                  </div>
                  <div
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center ${
                      isDarkMode ? 'bg-teal-500/10 border-teal-400/25' : 'bg-white border-[#DCE3ED]'
                    }`}
                  >
                    <FolderKanban className={`w-5 h-5 ${isDarkMode ? 'text-teal-300' : 'text-[#2559AF]'}`} />
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-4 flex items-center justify-between ${
                    isDarkMode ? 'bg-slate-950/45 border-teal-500/15' : 'bg-[#F5F7FA]/90 border-[#DCE3ED]'
                  }`}
                >
                  <div>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-[#68778D]'}`}>
                      {isRtl ? 'إجمالي الطلبات' : 'Total Tracked Orders'}
                    </p>
                    <p
                      className={`text-2xl font-extrabold tabular-nums mt-1 ${
                        isDarkMode ? 'text-white' : 'text-[#013589]'
                      }`}
                    >
                      {aggregateStats.totalOrders}
                    </p>
                  </div>
                  <div
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center ${
                      isDarkMode ? 'bg-emerald-500/10 border-emerald-400/25' : 'bg-white border-[#DCE3ED]'
                    }`}
                  >
                    <ShoppingBag className={`w-5 h-5 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`} />
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-4 flex items-center justify-between ${
                    isDarkMode ? 'bg-slate-950/45 border-teal-500/15' : 'bg-[#F5F7FA]/90 border-[#DCE3ED]'
                  }`}
                >
                  <div>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-[#68778D]'}`}>
                      {isRtl ? 'إجمالي العملاء' : 'Total Customers'}
                    </p>
                    <p
                      className={`text-2xl font-extrabold tabular-nums mt-1 ${
                        isDarkMode ? 'text-white' : 'text-[#013589]'
                      }`}
                    >
                      {aggregateStats.totalCustomers}
                    </p>
                  </div>
                  <div
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center ${
                      isDarkMode ? 'bg-cyan-500/10 border-cyan-400/25' : 'bg-white border-[#DCE3ED]'
                    }`}
                  >
                    <Users className={`w-5 h-5 ${isDarkMode ? 'text-cyan-300' : 'text-[#477ED8]'}`} />
                  </div>
                </div>
              </div>
            </section>

            {/* Responsive Multi-Project Grid */}
            {filteredProjects.length > 0 ? (
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => {
                  const normalizedRole = String(project.role || 'cashier').toLowerCase();
                  const isCashierCard = !portalState.isConsultant && normalizedRole === 'cashier';
                  const isOwnerCard = normalizedRole === 'owner';

                  return (
                    <article
                      key={project.tenantId}
                      onClick={() => onSelectTenant(project, portalState.isConsultant)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectTenant(project, portalState.isConsultant);
                        }
                      }}
                      className={`group ${glassCardClass} rounded-2xl p-6 flex flex-col justify-between gap-5 hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden focus:outline-none ${
                        isDarkMode
                          ? 'hover:border-teal-400/50 hover:shadow-teal-500/15 focus:ring-2 focus:ring-teal-400/60'
                          : 'hover:border-[#2559AF]/45 hover:shadow-[0_24px_48px_-12px_rgba(1,53,137,0.16)] focus:ring-2 focus:ring-[#2559AF]/50'
                      }`}
                    >
                      {isDarkMode && (
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                      )}

                      <div className="space-y-4">
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform ${
                              isDarkMode
                                ? 'bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border-teal-400/30'
                                : 'bg-gradient-to-br from-[#EDF1F6] to-white border-[#DCE3ED]'
                            }`}
                          >
                            <Layers className={`w-6 h-6 ${isDarkMode ? 'text-teal-300' : 'text-[#2559AF]'}`} />
                          </div>

                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
                              isCashierCard
                                ? isDarkMode
                                  ? 'bg-amber-500/15 border-amber-400/30 text-amber-300'
                                  : 'bg-amber-50 border-amber-200 text-amber-800'
                                : isOwnerCard
                                  ? isDarkMode
                                    ? 'bg-indigo-500/20 border-indigo-400/35 text-indigo-200'
                                    : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                                  : isDarkMode
                                    ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                isCashierCard
                                  ? 'bg-amber-400'
                                  : isOwnerCard
                                    ? 'bg-indigo-400'
                                    : 'bg-emerald-400'
                              }`}
                            />
                            <span>
                              {isCashierCard
                                ? 'cashier'
                                : isOwnerCard
                                  ? 'owner'
                                  : isRtl
                                    ? 'نشط'
                                    : 'Active'}
                            </span>
                          </span>
                        </div>

                        {/* Project Title & Metadata */}
                        <div>
                          <h2
                            className={`text-lg font-extrabold transition-colors line-clamp-1 ${
                              isDarkMode
                                ? 'text-white group-hover:text-teal-200'
                                : 'text-[#013589] group-hover:text-[#2559AF]'
                            }`}
                          >
                            <bdi>{project.name}</bdi>
                          </h2>
                          <div
                            className={`flex items-center gap-2 mt-1 text-xs ${
                              isDarkMode ? 'text-slate-400' : 'text-[#68778D]'
                            }`}
                          >
                            <span
                              className={`font-semibold ${
                                isCashierCard
                                  ? isDarkMode
                                    ? 'text-amber-300/90'
                                    : 'text-amber-700'
                                  : isDarkMode
                                    ? 'text-teal-300/90'
                                    : 'text-[#2559AF]'
                              }`}
                            >
                              {getRoleLabel(project.role)}
                            </span>
                            <span>•</span>
                            <span>{formatDate(project.createdAt)}</span>
                          </div>
                        </div>

                        {/* Quick Metrics Preview (Hidden on Cashier cards to preserve financial privacy) */}
                        {isCashierCard ? (
                          <div
                            className={`rounded-xl border p-3.5 text-xs leading-relaxed ${
                              isDarkMode
                                ? 'bg-slate-950/55 border-amber-500/20 text-slate-300'
                                : 'bg-amber-50/60 border-amber-200/80 text-amber-950'
                            }`}
                          >
                            <div className="font-bold mb-1">
                              {isRtl ? 'صلاحية نقطة البيع فقط (Cashier)' : 'POS Cashier Scope Only'}
                            </div>
                            <div className="text-[11px] opacity-80">
                              {isRtl
                                ? 'وصول مباشر لشاشة الكاشير والبيع وتحديث مخزون هذا المشروع دون المصروفات أو التقارير المالية.'
                                : 'Direct access to POS checkout & project stock updates without expenses or profit reports.'}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2.5 pt-1">
                            <div
                              className={`rounded-xl border px-3 py-2.5 ${
                                isDarkMode ? 'bg-slate-950/55 border-slate-800/90' : 'bg-[#F5F7FA] border-[#DCE3ED]'
                              }`}
                            >
                              <div
                                className={`flex items-center gap-1.5 text-[11px] ${
                                  isDarkMode ? 'text-slate-400' : 'text-[#68778D]'
                                }`}
                              >
                                <ShoppingBag className={`w-3.5 h-3.5 ${isDarkMode ? 'text-teal-400' : 'text-[#2559AF]'}`} />
                                <span>{isRtl ? 'الطلبات' : 'Orders'}</span>
                              </div>
                              <p
                                className={`text-base font-bold tabular-nums mt-0.5 ${
                                  isDarkMode ? 'text-slate-100' : 'text-[#172B4D]'
                                }`}
                              >
                                {project.metrics.ordersCount}
                              </p>
                            </div>

                            <div
                              className={`rounded-xl border px-3 py-2.5 ${
                                isDarkMode ? 'bg-slate-950/55 border-slate-800/90' : 'bg-[#F5F7FA] border-[#DCE3ED]'
                              }`}
                            >
                              <div
                                className={`flex items-center gap-1.5 text-[11px] ${
                                  isDarkMode ? 'text-slate-400' : 'text-[#68778D]'
                                }`}
                              >
                                <Users className={`w-3.5 h-3.5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                                <span>{isRtl ? 'العملاء' : 'Customers'}</span>
                              </div>
                              <p
                                className={`text-base font-bold tabular-nums mt-0.5 ${
                                  isDarkMode ? 'text-slate-100' : 'text-[#172B4D]'
                                }`}
                              >
                                {project.metrics.customersCount}
                              </p>
                            </div>

                            <div
                              className={`rounded-xl border px-3 py-2.5 ${
                                isDarkMode ? 'bg-slate-950/55 border-slate-800/90' : 'bg-[#F5F7FA] border-[#DCE3ED]'
                              }`}
                            >
                              <div
                                className={`flex items-center gap-1.5 text-[11px] ${
                                  isDarkMode ? 'text-slate-400' : 'text-[#68778D]'
                                }`}
                              >
                                <Package className={`w-3.5 h-3.5 ${isDarkMode ? 'text-cyan-400' : 'text-[#477ED8]'}`} />
                                <span>{isRtl ? 'المنتجات' : 'Products'}</span>
                              </div>
                              <p
                                className={`text-base font-bold tabular-nums mt-0.5 ${
                                  isDarkMode ? 'text-slate-100' : 'text-[#172B4D]'
                                }`}
                              >
                                {project.metrics.productsCount}
                              </p>
                            </div>

                            <div
                              className={`rounded-xl border px-3 py-2.5 ${
                                isDarkMode ? 'bg-slate-950/55 border-slate-800/90' : 'bg-[#F5F7FA] border-[#DCE3ED]'
                              }`}
                            >
                              <div
                                className={`flex items-center gap-1.5 text-[11px] ${
                                  isDarkMode ? 'text-slate-400' : 'text-[#68778D]'
                                }`}
                              >
                                <TrendingUp className={`w-3.5 h-3.5 ${isDarkMode ? 'text-teal-300' : 'text-[#013589]'}`} />
                                <span>{isRtl ? 'المبيعات' : 'Revenue'}</span>
                              </div>
                              <p
                                className={`text-base font-bold tabular-nums mt-0.5 truncate ${
                                  isDarkMode ? 'text-teal-300' : 'text-[#013589]'
                                }`}
                              >
                                {project.metrics.revenueTotal.toLocaleString(isRtl ? 'ar-EG' : 'en-US', {
                                  maximumFractionDigits: 0,
                                })}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Enter Workspace Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTenant(project, portalState.isConsultant);
                        }}
                        className={`w-full py-3 px-4 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                          isCashierCard
                            ? isDarkMode
                              ? 'bg-amber-500/15 hover:bg-amber-500 border-amber-400/35 hover:border-transparent text-amber-200 hover:text-slate-950'
                              : 'bg-amber-50 hover:bg-amber-600 border-amber-200 hover:border-transparent text-amber-900 hover:text-white'
                            : isDarkMode
                              ? 'bg-teal-500/15 hover:bg-gradient-to-r hover:from-teal-500 hover:to-emerald-500 border-teal-400/30 hover:border-transparent text-teal-200 hover:text-slate-950 group-hover:shadow-lg group-hover:shadow-teal-500/15'
                              : 'bg-[#EDF1F6] hover:bg-gradient-to-r hover:from-[#013589] hover:via-[#2559AF] hover:to-[#477ED8] border-[#DCE3ED] hover:border-transparent text-[#013589] hover:text-white group-hover:shadow-md'
                        }`}
                      >
                        <span>
                          {portalState.isConsultant
                            ? isRtl
                              ? 'إدارة المشروع'
                              : 'Manage Project'
                            : isCashierCard
                              ? isRtl
                                ? 'فتح شاشة الكاشير (POS)'
                                : 'Open Cashier POS'
                              : isRtl
                                ? 'الدخول كمالك المشروع'
                                : 'Enter as Owner'}
                        </span>
                        <OpenArrow className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </button>
                    </article>
                  );
                })}
              </section>
            ) : (
              /* Consultant Empty State / Search No Match */
              <div className={`${glassCardClass} rounded-3xl p-10 text-center max-w-lg mx-auto`}>
                <div
                  className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto mb-4 ${
                    isDarkMode ? 'bg-teal-500/10 border-teal-400/25' : 'bg-[#EDF1F6] border-[#DCE3ED]'
                  }`}
                >
                  <FolderKanban className={`w-8 h-8 ${isDarkMode ? 'text-teal-300' : 'text-[#2559AF]'}`} />
                </div>
                <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#013589]'}`}>
                  {searchQuery.trim()
                    ? isRtl
                      ? 'لا توجد مشاريع مطابقة للبحث'
                      : 'No matching projects found'
                    : isRtl
                      ? 'لا توجد مشاريع مسجلة في النظام بعد'
                      : 'No projects registered in the database yet'}
                </h3>
                <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-[#68778D]'}`}>
                  {searchQuery.trim()
                    ? isRtl
                      ? 'جرب تعديل كلمة البحث لعرض المشاريع المتاحة.'
                      : 'Try adjusting your search query to view registered projects.'
                    : isRtl
                      ? 'ستظهر هنا تلقائياً جميع المشاريع المسجلة من قبل أصحاب الأعمال فور إنشائها.'
                      : 'Any projects created by workspace owners will automatically appear here for oversight.'}
                </p>
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className={`px-5 py-2.5 rounded-xl border text-sm font-bold transition-colors cursor-pointer ${
                      isDarkMode
                        ? 'bg-teal-500/15 border-teal-400/30 text-teal-200 hover:bg-teal-500/25'
                        : 'bg-[#EDF1F6] border-[#DCE3ED] text-[#013589] hover:bg-[#DCE3ED]'
                    }`}
                  >
                    {isRtl ? 'مسح البحث' : 'Clear search'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`relative z-10 w-full text-center py-5 text-xs ${isDarkMode ? 'text-slate-500' : 'text-[#68778D]'}`}>
        <span>
          Profness Cloud •{' '}
          {isRtl
            ? 'منصة متعددة المشاريع مع عزل كامل للبيانات'
            : 'Multi-Tenant Operations & Management Platform'}
        </span>
      </footer>

      {/* First-Time Owner Create Project Modal (Locked permanently once created) */}
      {isCreateModalOpen && !hasLockedOnboarding && !portalState.ownerProject && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${
            isDarkMode ? 'bg-slate-950/75' : 'bg-[#013589]/25'
          }`}
          onClick={() => !isCreating && setIsCreateModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md backdrop-blur-2xl rounded-3xl p-6 sm:p-8 relative overflow-hidden border shadow-2xl ${
              isDarkMode
                ? 'bg-slate-900/90 border-teal-500/30'
                : 'bg-white/95 border-[#DCE3ED]'
            }`}
          >
            {isDarkMode && (
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" />
            )}

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                    isDarkMode
                      ? 'bg-teal-500/15 border-teal-400/30'
                      : 'bg-[#EDF1F6] border-[#DCE3ED]'
                  }`}
                >
                  <Building2 className={`w-5 h-5 ${isDarkMode ? 'text-teal-300' : 'text-[#2559AF]'}`} />
                </div>
                <div>
                  <h2 className={`text-lg font-extrabold ${isDarkMode ? 'text-white' : 'text-[#013589]'}`}>
                    {isRtl ? 'إنشاء مشروعك الأول' : 'Create Your First Project'}
                  </h2>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-[#68778D]'}`}>
                    {isRtl
                      ? 'سيتم ربطك كمالك وحيد للمشروع وتوجيهك للوحة التحكم'
                      : 'Links you as the project owner and launches your workspace'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isCreating}
                onClick={() => setIsCreateModalOpen(false)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 ${
                  isDarkMode
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-[#68778D] hover:text-[#172B4D] hover:bg-[#EDF1F6]'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div
                className={`mb-5 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  isDarkMode
                    ? 'bg-rose-950/60 border-rose-500/35 text-rose-200'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`} />
                <span className="leading-relaxed">{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-5">
              <div>
                <label className={`block text-xs font-bold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-[#172B4D]'}`}>
                  {isRtl ? 'اسم المشروع / الشركة' : 'Project / Company Name'}
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  disabled={isCreating}
                  placeholder={
                    isRtl ? 'مثال: شركة النخبة للتجارة' : 'e.g. Acme Retail Operations'
                  }
                  className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all disabled:opacity-60 ${
                    isDarkMode
                      ? 'bg-slate-950/80 border border-teal-500/25 text-white placeholder-slate-500 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20'
                      : 'bg-white border border-[#DCE3ED] text-[#172B4D] placeholder-[#8A9BB4] focus:border-[#2559AF] focus:ring-4 focus:ring-[#2559AF]/10'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={() => setIsCreateModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                    isDarkMode
                      ? 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'border-[#DCE3ED] text-[#68778D] hover:text-[#172B4D] hover:bg-[#EDF1F6]'
                  }`}
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isCreating || !newProjectName.trim()}
                  className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-teal-500/20'
                      : 'bg-gradient-to-r from-[#013589] via-[#2559AF] to-[#477ED8] hover:from-[#002B70] hover:via-[#1F4C97] hover:to-[#3B6DC4] text-white shadow-[#013589]/25'
                  }`}
                >
                  {isCreating ? (
                    <>
                      <span
                        className={`w-4 h-4 border-2 rounded-full animate-spin ${
                          isDarkMode ? 'border-slate-950/30 border-t-slate-950' : 'border-white/30 border-t-white'
                        }`}
                      />
                      <span>{isRtl ? 'جاري الإنشاء...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>{isRtl ? 'إنشاء وفتح المشروع' : 'Create & Open Project'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

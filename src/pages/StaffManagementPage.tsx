import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Link2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  fetchOwnerManagedTenants,
  fetchProjectStaffFromSupabase,
  fetchRegisteredUsersForLinking,
  linkStaffToTenantInSupabase,
  OwnerTenantOption,
  RegisteredUserOption,
  removeStaffMemberFromSupabase,
  StaffMemberRecord,
  toggleStaffActiveStatusInSupabase,
} from '../lib/staffService';

export const StaffManagementPage: React.FC = () => {
  const {
    language,
    themeConfig,
    customPalette,
    activeTenant,
    currentTenantId,
    isOwnerUser,
    selectTenant,
    setCurrentPage,
  } = useApp();
  const { user } = useAuth();
  const isRtl = language === 'ar';
  const activeProjectId = (currentTenantId || activeTenant?.tenantId || '').trim();

  const [staffList, setStaffList] = useState<StaffMemberRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'cashier'>('all');

  // Registered Users Dropdown & Multi-Tenant Link Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUserOption[]>([]);
  const [ownerTenants, setOwnerTenants] = useState<OwnerTenantOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [userDropdownSearch, setUserDropdownSearch] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [targetTenantId, setTargetTenantId] = useState<string>(activeProjectId);
  const [selectedRole, setSelectedRole] = useState<'cashier' | 'owner'>('cashier');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);

  const loadStaff = useCallback(
    async (silent = false) => {
      if (!activeProjectId || !isOwnerUser) {
        setIsLoading(false);
        return;
      }

      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setFetchError(null);

      const res = await fetchProjectStaffFromSupabase(activeProjectId);
      if (res.error) {
        setFetchError(res.error);
      } else {
        setStaffList((prev) => {
          const prevByUserId = new Map<string, StaffMemberRecord>(prev.map((m) => [m.userId, m]));
          return res.data.map((member) => {
            const cached = prevByUserId.get(member.userId);
            return {
              ...member,
              email: member.email || cached?.email,
              fullName:
                member.fullName.startsWith('كاشير (') && cached?.fullName
                  ? cached.fullName
                  : member.fullName,
            };
          });
        });
      }

      setIsLoading(false);
      setIsRefreshing(false);
    },
    [activeProjectId, isOwnerUser]
  );

  const loadDropdownData = useCallback(async () => {
    setIsLoadingUsers(true);
    const [usersRes, tenantsRes] = await Promise.all([
      fetchRegisteredUsersForLinking(),
      fetchOwnerManagedTenants(),
    ]);
    setRegisteredUsers(usersRes.data);
    setOwnerTenants(tenantsRes);
    setIsLoadingUsers(false);
  }, []);

  useEffect(() => {
    loadStaff(false);
  }, [loadStaff]);

  useEffect(() => {
    setTargetTenantId(activeProjectId);
  }, [activeProjectId]);

  const stats = useMemo(() => {
    const total = staffList.length;
    const cashiers = staffList.filter((m) => m.role === 'cashier');
    const activeCashiers = cashiers.filter((m) => m.isActive).length;
    const inactiveMembers = staffList.filter((m) => !m.isActive).length;
    return { total, cashiersCount: cashiers.length, activeCashiers, inactiveMembers };
  }, [staffList]);

  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return staffList.filter((m) => {
      if (roleFilter === 'owner' && m.role !== 'owner') return false;
      if (roleFilter === 'cashier' && m.role !== 'cashier') return false;
      if (!q) return true;
      return (
        m.fullName.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        m.userId.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
      );
    });
  }, [staffList, searchQuery, roleFilter]);

  const filteredDropdownUsers = useMemo(() => {
    const q = userDropdownSearch.trim().toLowerCase();
    if (!q) return registeredUsers;
    return registeredUsers.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        u.memberships.some((m) => m.tenantName.toLowerCase().includes(q))
    );
  }, [registeredUsers, userDropdownSearch]);

  const selectedUserRecord = useMemo(
    () => registeredUsers.find((u) => u.userId === selectedUserId) || null,
    [registeredUsers, selectedUserId]
  );

  // Strict Owner-only & Active-Project guard inside the page itself
  if (!isOwnerUser || !activeTenant || !activeProjectId) {
    const missingProject = isOwnerUser && (!activeTenant || !activeProjectId);
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-rose-200/90 shadow-sm max-w-md w-full p-8 text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">
            {missingProject
              ? isRtl
                ? 'لم يتم اختيار المشروع النشط'
                : 'No Active Project Selected'
              : isRtl
              ? 'وصول غير مصرح به'
              : 'Restricted Access'}
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {missingProject
              ? isRtl
                ? 'يرجى اختيار المشروع النشط أولاً قبل إضافة أو إدارة الموظفين.'
                : 'Please select an active project first before adding or managing staff.'
              : isRtl
              ? 'هذه الصفحة مخصصة لمالك المشروع (Owner) فقط لإدارة موظفي الكاشير وصلاحيات المشروع.'
              : 'Staff Management is strictly restricted to the Project Owner.'}
          </p>
          <div className="flex items-center gap-2.5">
            {missingProject && (
              <button
                type="button"
                onClick={() => selectTenant(null)}
                className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-xs cursor-pointer"
                style={{ backgroundColor: themeConfig.primary }}
              >
                {isRtl ? 'اختيار المشروع أولاً' : 'Select Project'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setCurrentPage('home')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold shadow-xs cursor-pointer"
            >
              {isRtl ? 'العودة إلى الشاشة الرئيسية' : 'Back to Home'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleOpenAddModal = () => {
    if (!activeProjectId) {
      setActionFeedback({
        type: 'error',
        message: isRtl
          ? 'يرجى اختيار المشروع النشط أولاً قبل ربط موظف جديد.'
          : 'Please select an active project first before linking a staff member.',
      });
      return;
    }
    setFormError(null);
    setUserDropdownSearch('');
    setSelectedUserId('');
    setTargetTenantId(activeProjectId);
    setSelectedRole('cashier');
    setIsAddModalOpen(true);
    void loadDropdownData();
  };

  const handleLinkSelectedUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setActionFeedback(null);

    const resolvedProjectId = (targetTenantId || activeProjectId).trim();
    if (!resolvedProjectId) {
      const missingMsg = isRtl
        ? 'تعذر تحديد معرف المشروع النشط (tenant_id). يرجى اختيار المشروع أولاً.'
        : 'Unable to determine active project (tenant_id). Please select a project first.';
      setFormError(missingMsg);
      setActionFeedback({ type: 'error', message: missingMsg });
      return;
    }

    if (!selectedUserId) {
      setFormError(
        isRtl
          ? 'يرجى اختيار المستخدم المسجل مسبقاً من القائمة المنسدلة.'
          : 'Please choose a registered user from the dropdown list.'
      );
      return;
    }

    setIsSubmitting(true);

    const res = await linkStaffToTenantInSupabase({
      userId: selectedUserId,
      email: selectedUserRecord?.email,
      role: selectedRole,
      tenantId: resolvedProjectId,
    });

    setIsSubmitting(false);

    if (!res.success || !res.member) {
      setFormError(res.error || (isRtl ? 'فشل ربط الموظف بالمشروع.' : 'Failed to link staff account.'));
      return;
    }

    if (resolvedProjectId === activeProjectId) {
      setStaffList((prev) => {
        const withoutDup = prev.filter((m) => m.id !== res.member!.id && m.userId !== res.member!.userId);
        return [res.member!, ...withoutDup];
      });
    }

    const linkedTenantName =
      ownerTenants.find((t) => t.tenantId === resolvedProjectId)?.name || activeTenant.name;

    setIsAddModalOpen(false);
    setActionFeedback({
      type: 'success',
      message: res.wasUpdated
        ? isRtl
          ? `تم تحديث صلاحية (${res.member.fullName}) وتفعيله في مشروع "${linkedTenantName}" بدور ${selectedRole} بنجاح.`
          : `Updated and activated ${res.member.fullName} in "${linkedTenantName}" as ${selectedRole}.`
        : isRtl
        ? `تم ربط وتفعيل (${res.member.fullName}) في مشروع "${linkedTenantName}" بدور ${selectedRole} بنجاح!`
        : `Linked and activated ${res.member.fullName} in "${linkedTenantName}" as ${selectedRole}!`,
    });
    loadStaff(true);
  };

  const handleToggleActive = async (member: StaffMemberRecord) => {
    if (member.role === 'owner' || member.userId === user?.id || !activeProjectId) return;
    setBusyMemberId(member.id);
    setActionFeedback(null);

    const nextState = !member.isActive;
    const res = await toggleStaffActiveStatusInSupabase(member.id, nextState, activeProjectId);

    setBusyMemberId(null);

    if (!res.success) {
      setActionFeedback({
        type: 'error',
        message: res.error || (isRtl ? 'تعذر تحديث حالة الموظف.' : 'Failed to update staff status.'),
      });
      return;
    }

    setStaffList((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, isActive: nextState } : m))
    );
    setActionFeedback({
      type: 'success',
      message: nextState
        ? isRtl
          ? `تم تفعيل صلاحية الكاشير (${member.fullName}).`
          : `Activated ${member.fullName}.`
        : isRtl
        ? `تم تعطيل دخول الكاشير (${member.fullName}) مؤقتاً.`
        : `Deactivated ${member.fullName}.`,
    });
  };

  const handleRemoveMember = async (member: StaffMemberRecord) => {
    if (member.role === 'owner' || member.userId === user?.id || !activeProjectId) return;
    const confirmText = isRtl
      ? `هل أنت متأكد من إزالة (${member.fullName}) من طاقم مشروع "${activeTenant.name}"؟`
      : `Remove ${member.fullName} from "${activeTenant.name}"?`;
    if (!window.confirm(confirmText)) return;

    setBusyMemberId(member.id);
    setActionFeedback(null);

    const res = await removeStaffMemberFromSupabase(member.id, activeProjectId);
    setBusyMemberId(null);

    if (!res.success) {
      setActionFeedback({
        type: 'error',
        message: res.error || (isRtl ? 'تعذر إزالة الموظف.' : 'Failed to remove staff member.'),
      });
      return;
    }

    setStaffList((prev) => prev.filter((m) => m.id !== member.id));
    setActionFeedback({
      type: 'success',
      message: isRtl
        ? `تمت إزالة (${member.fullName}) من المشروع بنجاح.`
        : `Removed ${member.fullName} from project.`,
    });
  };

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(isRtl ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(iso));
    } catch {
      return '';
    }
  };

  const tenantChoices: OwnerTenantOption[] =
    ownerTenants.length > 0
      ? ownerTenants
      : [{ tenantId: activeProjectId, name: activeTenant.name }];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Banner */}
      <div
        style={{ backgroundColor: customPalette.surfaceBg || '#ffffff' }}
        className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100 text-[11px] font-bold text-indigo-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isRtl ? 'للمالك فقط • إدارة الصلاحيات' : 'Owner Only • Staff RBAC'}</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              • <bdi>{activeTenant.name}</bdi>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {isRtl ? 'إدارة الموظفين وحسابات الكاشير' : 'Staff & Cashier Access Management'}
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            {isRtl
              ? 'اختر الموظف المسجل مسبقاً من القائمة المنسدلة مباشرةً وحدد المشروع والدور الوظيفي (cashier) لربطه وتفعيله دون أي أخطاء إملائية.'
              : 'Pick a pre-registered user directly from the dropdown, confirm the target project and role, and link them cleanly without typos.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => loadStaff(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
            title={isRtl ? 'تحديث القائمة' : 'Refresh Staff List'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRtl ? 'تحديث' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
            style={{ backgroundColor: themeConfig.primary }}
          >
            <Link2 className="w-4 h-4" />
            <span>{isRtl ? '+ إضافة / ربط موظف' : '+ Link Staff Member'}</span>
          </button>
        </div>
      </div>

      {/* Onboarding Instructions Banner */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-indigo-950 text-xs flex items-start gap-3">
        <UserPlus className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">
            {isRtl ? 'آلية الاختيار والربط السريع: ' : 'Zero-Typo Staff Linking: '}
          </span>
          {isRtl
            ? 'اختر الموظف من قائمة المستخدمين المسجلين، واستعرض مشاريعه وأدواره الحالية، ثم اضغط "ربط وتفعيل" لإضافته للمشروع بدور كاشير أو مالك.'
            : 'Choose a registered user from the dropdown, inspect their existing projects/roles, and click "Link & Activate" for your active project.'}
        </div>
      </div>

      {/* Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500">
              {isRtl ? 'إجمالي أعضاء المشروع' : 'Total Project Members'}
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500">
              {isRtl ? 'موظفو الكاشير النشطون' : 'Active Cashiers'}
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">
              {stats.activeCashiers}
              <span className="text-xs font-semibold text-slate-400 mx-1">/ {stats.cashiersCount}</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500">
              {isRtl ? 'حسابات معطّلة' : 'Inactive Accounts'}
            </div>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">{stats.inactiveMembers}</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
          {(['all', 'cashier', 'owner'] as const).map((r) => {
            const label =
              r === 'all'
                ? isRtl
                  ? 'الكل'
                  : 'All'
                : r === 'cashier'
                ? isRtl
                  ? 'الكاشير'
                  : 'Cashiers'
                : isRtl
                ? 'المالك'
                : 'Owner';
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === r ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${
              isRtl ? 'right-3' : 'left-3'
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? 'ابحث بالاسم أو البريد الإلكتروني...' : 'Search by name or email...'}
            className={`w-full h-9 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 ${
              isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>
      </div>

      {/* Staff List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {fetchError ? (
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <p className="text-xs font-bold text-rose-700">{fetchError}</p>
            <button
              type="button"
              onClick={() => loadStaff(false)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
            >
              {isRtl ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : isLoading ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs font-semibold">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span>{isRtl ? 'جاري تحميل قائمة موظفي المشروع...' : 'Loading project staff...'}</span>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3 text-slate-400">
            <Users className="w-10 h-10 text-slate-300" />
            <div className="text-sm font-bold text-slate-700">
              {isRtl ? 'لا يوجد موظفون مطابقون حالياً' : 'No matching staff members found'}
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              {isRtl
                ? 'ابدأ باختيار أول موظف من قائمة المستخدمين المسجلين وربطه بمشروعك.'
                : 'Select a pre-registered user from the dropdown to link them to your project.'}
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-1 px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: themeConfig.primary }}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{isRtl ? 'اختيار وربط موظف' : 'Select & Link Staff'}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4 text-start">{isRtl ? 'الموظف' : 'Member'}</th>
                  <th className="py-3 px-4 text-start">{isRtl ? 'الدور والصلاحية' : 'Role & Permissions'}</th>
                  <th className="py-3 px-4 text-start">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-4 text-start">{isRtl ? 'تاريخ الانضمام' : 'Joined'}</th>
                  <th className="py-3 px-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStaff.map((member) => {
                  const isOwnerRow = member.role === 'owner';
                  const isSelf = member.userId === user?.id;
                  const initials = member.fullName
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 ${
                              isOwnerRow
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {initials || 'ST'}
                          </div>
                          <div className="flex flex-col">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{member.fullName}</span>
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                                  {isRtl ? 'أنت' : 'You'}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {member.email || `ID: ${member.userId.slice(0, 8)}...`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isOwnerRow ? (
                          <div className="inline-flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 w-fit px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold text-[11px]">
                              <ShieldCheck className="w-3 h-3" />
                              <span>{isRtl ? 'مالك المشروع (Owner)' : 'Owner'}</span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {isRtl ? 'صلاحية كاملة على المشروع والموظفين' : 'Full workspace & staff access'}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 w-fit px-2.5 py-0.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-bold text-[11px]">
                              <span>{isRtl ? 'كاشير (Cashier)' : 'Cashier'}</span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {isRtl
                                ? 'شاشة الكاشير والبيع وتحديث المخزون فقط'
                                : 'POS & project stock deduction only'}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] border ${
                            member.isActive
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              member.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span>
                            {member.isActive ? (isRtl ? 'نشط' : 'Active') : isRtl ? 'معطّل' : 'Inactive'}
                          </span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {formatDate(member.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isOwnerRow || isSelf ? (
                          <span className="text-[11px] text-slate-400 font-medium">
                            {isRtl ? 'محمي' : 'Protected'}
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              disabled={busyMemberId === member.id}
                              onClick={() => handleToggleActive(member)}
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                                member.isActive
                                  ? 'border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800'
                                  : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {member.isActive
                                ? isRtl
                                  ? 'تعطيل'
                                  : 'Disable'
                                : isRtl
                                ? 'تفعيل'
                                : 'Activate'}
                            </button>
                            <button
                              type="button"
                              disabled={busyMemberId === member.id}
                              onClick={() => handleRemoveMember(member)}
                              className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                              title={isRtl ? 'إزالة من المشروع' : 'Remove from project'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LINK REGISTERED USER DROPDOWN MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl text-white flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: themeConfig.primary }}
                >
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {isRtl ? 'ربط وتفعيل موظف من القائمة' : 'Link & Activate Registered User'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isRtl
                      ? `معرف المشروع النشط: ${activeTenant.name}`
                      : `Active Tenant: ${activeTenant.name}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleLinkSelectedUser} className="flex flex-col gap-4 text-xs">
              {/* Step 1: Registered User Dropdown (with Search Filter) */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">
                    {isRtl ? '1. اختر المستخدم المسجل مسبقاً' : '1. Select Registered User'}
                  </label>
                  <button
                    type="button"
                    onClick={() => loadDropdownData()}
                    disabled={isLoadingUsers}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                    <span>{isRtl ? 'تحديث المستخدمين' : 'Reload Users'}</span>
                  </button>
                </div>

                {/* Quick Filter inside Dropdown */}
                <div className="relative">
                  <Search
                    className={`w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 ${
                      isRtl ? 'right-3' : 'left-3'
                    }`}
                  />
                  <input
                    type="text"
                    value={userDropdownSearch}
                    onChange={(e) => setUserDropdownSearch(e.target.value)}
                    placeholder={isRtl ? 'تصفية قائمة المستخدمين بالاسم أو البريد...' : 'Filter users by name or email...'}
                    className={`w-full h-9 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 ${
                      isRtl ? 'pr-8 pl-3' : 'pl-8 pr-3'
                    }`}
                  />
                </div>

                {/* Primary Registered Users Dropdown */}
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={isLoadingUsers}
                  className="w-full h-11 px-3 rounded-xl bg-white border-2 border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-60"
                >
                  <option value="">
                    {isLoadingUsers
                      ? isRtl
                        ? 'جاري تحميل قائمة المستخدمين المسجلين...'
                        : 'Loading registered users...'
                      : filteredDropdownUsers.length === 0
                      ? isRtl
                        ? 'لا يوجد مستخدمون مسجلون متاحون'
                        : 'No registered users available'
                      : isRtl
                      ? `-- اختر موظفاً من القائمة (${filteredDropdownUsers.length}) --`
                      : `-- Choose a user (${filteredDropdownUsers.length}) --`}
                  </option>
                  {filteredDropdownUsers.map((u) => {
                    const alreadyInTarget = u.memberships.find(
                      (m) => m.tenantId === (targetTenantId || activeProjectId)
                    );
                    const emailDisplay = u.email ? ` (${u.email})` : '';
                    const membershipHint = alreadyInTarget
                      ? ` • [${isRtl ? 'مسجل حالياً كـ' : 'Currently'}: ${alreadyInTarget.role}]`
                      : '';
                    return (
                      <option key={u.userId} value={u.userId}>
                        {u.fullName}
                        {emailDisplay}
                        {membershipHint}
                      </option>
                    );
                  })}
                </select>

                {/* Selected User's Current Multi-Tenant Projects & Roles */}
                {selectedUserRecord && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{selectedUserRecord.fullName}</span>
                      {selectedUserRecord.email && (
                        <span className="font-mono text-[11px] text-slate-500">{selectedUserRecord.email}</span>
                      )}
                    </div>
                    {selectedUserRecord.memberships.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500">
                          {isRtl ? 'المشاريع والأدوار المرتبطة بهذا الحساب:' : 'Linked Projects & Roles:'}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedUserRecord.memberships.map((m) => (
                            <span
                              key={`${m.tenantId}-${m.role}`}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
                                m.role === 'owner'
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                                  : 'bg-teal-50 border-teal-200 text-teal-800'
                              }`}
                            >
                              <Building2 className="w-3 h-3" />
                              <span>{m.tenantName}</span>
                              <span className="px-1.5 py-0.2 rounded bg-white/80 text-[10px] font-mono">
                                {m.role}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        {isRtl
                          ? 'غير مرتبط بأي مشروع حتى الآن — جاهز للربط المباشر.'
                          : 'Not linked to any project yet — ready to assign.'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Project & Role Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">
                    {isRtl ? '2. المشروع المراد ربطه به' : '2. Target Project'}
                  </label>
                  <select
                    value={targetTenantId}
                    onChange={(e) => setTargetTenantId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {tenantChoices.map((t) => (
                      <option key={t.tenantId} value={t.tenantId}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">
                    {isRtl ? '3. الدور داخل المشروع' : '3. Assigned Role'}
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as 'cashier' | 'owner')}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="cashier">
                      {isRtl ? 'كاشير (cashier) — البيع والمخزون' : 'Cashier (cashier) — POS Only'}
                    </option>
                    <option value="owner">
                      {isRtl ? 'مالك مشارك (owner) — كامل الصلاحيات' : 'Co-Owner (owner) — Full Access'}
                    </option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-200/80 text-teal-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>{isRtl ? 'عزل تلقائي حسب المشروع:' : 'Per-Project Role Isolation:'}</strong>{' '}
                  {selectedRole === 'cashier'
                    ? isRtl
                      ? 'عند دخول هذا المستخدم لهذا المشروع، سيتم توجيهه لشاشة الكاشير (POS) فقط، مع احتفاظه بصلاحياته المستقلة في أي مشروع آخر يمتلكه.'
                      : 'Inside this project, the user is restricted strictly to POS checkout while preserving their independent role in other projects.'
                    : isRtl
                      ? 'سيحصل هذا المستخدم على صلاحيات المالك الكاملة داخل هذا المشروع المختار.'
                      : 'Grants full Owner management access inside the selected project.'}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedUserId}
                  className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  style={{ backgroundColor: themeConfig.primary }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{isRtl ? 'جاري الربط والتفعيل...' : 'Linking & Activating...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'ربط وتفعيل' : 'Link & Activate'}</span>
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

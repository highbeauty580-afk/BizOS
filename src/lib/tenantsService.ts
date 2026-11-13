import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';

export type TenantRole = 'owner' | 'consultant' | 'advisor' | 'admin' | 'member' | string;

export interface TenantMetrics {
  customersCount: number;
  productsCount: number;
  ordersCount: number;
  revenueTotal: number;
}

export interface TenantWithMembership {
  id: string;
  tenantId: string;
  name: string;
  role: TenantRole;
  isActive: boolean;
  createdAt: string;
  metrics: TenantMetrics;
}

export interface UserProfileRecord {
  id: string;
  fullName: string | null;
  isConsultant: boolean;
}

export interface PostAuthPortalState {
  profile: UserProfileRecord | null;
  isConsultant: boolean;
  ownerProject: TenantWithMembership | null;
  projects: TenantWithMembership[];
  error: string | null;
}

let currentActiveTenantId: string | null = null;
const verifiedTenantIds = new Set<string>();

export function setCurrentActiveTenantId(tenantId: string | null): void {
  const cleanId = tenantId ? tenantId.trim() : '';
  currentActiveTenantId = cleanId || null;
  if (!currentActiveTenantId) {
    verifiedTenantIds.clear();
  }
}

export function getCurrentActiveTenantId(): string | null {
  return currentActiveTenantId;
}

/**
 * Resolves and verifies the active tenant_id against public.tenants / public.tenant_members
 * so foreign key constraints (e.g. stock_tenant_id_fkey, products_tenant_id_fkey) never receive null or invalid IDs.
 */
export async function resolveActiveTenantId(
  preferredTenantId?: string | null
): Promise<string | null> {
  const candidate = (preferredTenantId ?? getCurrentActiveTenantId() ?? '').trim();

  if (candidate && verifiedTenantIds.has(candidate)) {
    setCurrentActiveTenantId(candidate);
    return candidate;
  }

  if (!isSupabaseConfigured) {
    return candidate || null;
  }

  try {
    if (candidate) {
      const { data: tenantRow, error: tenantErr } = await supabase
        .from('tenants')
        .select('id')
        .eq('id', candidate)
        .maybeSingle();

      if (!tenantErr && tenantRow?.id) {
        verifiedTenantIds.add(tenantRow.id);
        setCurrentActiveTenantId(tenantRow.id);
        return tenantRow.id;
      }

      // If RLS blocks direct tenants read or candidate is a membership ID, check tenant_members
      const { data: memberByTenantId } = await supabase
        .from('tenant_members')
        .select('tenant_id')
        .eq('tenant_id', candidate)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (memberByTenantId?.tenant_id) {
        verifiedTenantIds.add(memberByTenantId.tenant_id);
        setCurrentActiveTenantId(memberByTenantId.tenant_id);
        return memberByTenantId.tenant_id;
      }

      const { data: memberById } = await supabase
        .from('tenant_members')
        .select('tenant_id')
        .eq('id', candidate)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (memberById?.tenant_id) {
        verifiedTenantIds.add(memberById.tenant_id);
        setCurrentActiveTenantId(memberById.tenant_id);
        return memberById.tenant_id;
      }
    }

    // Fallback: look up the authenticated user's active membership
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      const { data: activeMember } = await supabase
        .from('tenant_members')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeMember?.tenant_id) {
        verifiedTenantIds.add(activeMember.tenant_id);
        setCurrentActiveTenantId(activeMember.tenant_id);
        return activeMember.tenant_id;
      }
    }
  } catch (err) {
    console.warn('⚠️ resolveActiveTenantId warning:', err);
  }

  return null;
}

const EMPTY_METRICS: TenantMetrics = {
  customersCount: 0,
  productsCount: 0,
  ordersCount: 0,
  revenueTotal: 0,
};

async function fetchTenantQuickMetrics(tenantId: string): Promise<TenantMetrics> {
  if (!isSupabaseConfigured || !tenantId) return { ...EMPTY_METRICS };

  try {
    const [custRes, prodRes, ordRes, txRes] = await Promise.all([
      supabase
        .from('customers')
        .select('customer_pk', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
      supabase
        .from('products')
        .select('product_pk', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
      supabase
        .from('orders')
        .select('total_price', { count: 'exact' })
        .eq('tenant_id', tenantId),
      supabase
        .from('transactions')
        .select('transactions_amount, transactions_type')
        .eq('tenant_id', tenantId)
        .eq('transactions_type', 'Sales_Trans'),
    ]);

    const customersCount = custRes.error ? 0 : custRes.count ?? 0;
    const productsCount = prodRes.error ? 0 : prodRes.count ?? 0;
    const ordersCount = ordRes.error ? 0 : ordRes.count ?? (ordRes.data?.length ?? 0);

    let revenueTotal = 0;
    if (!txRes.error && txRes.data && txRes.data.length > 0) {
      revenueTotal = txRes.data.reduce(
        (sum: number, row: any) => sum + (parseFloat(row.transactions_amount) || 0),
        0
      );
    } else if (!ordRes.error && ordRes.data && ordRes.data.length > 0) {
      revenueTotal = ordRes.data.reduce(
        (sum: number, row: any) => sum + (parseFloat(row.total_price) || 0),
        0
      );
    }

    return {
      customersCount,
      productsCount,
      ordersCount,
      revenueTotal,
    };
  } catch {
    return { ...EMPTY_METRICS };
  }
}

export async function fetchPostAuthPortalData(user: User): Promise<PostAuthPortalState> {
  if (!isSupabaseConfigured) {
    return {
      profile: null,
      isConsultant: false,
      ownerProject: null,
      projects: [],
      error: 'لم يتم تكوين اتصال Supabase.',
    };
  }

  try {
    const [profileRes, membershipsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, is_consultant')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('tenant_members')
        .select('id, tenant_id, user_id, role, is_active, created_at, tenants(id, name, created_at)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
    ]);

    if (membershipsRes.error) {
      return {
        profile: null,
        isConsultant: Boolean(user.user_metadata?.is_consultant),
        ownerProject: null,
        projects: [],
        error: membershipsRes.error.message,
      };
    }

    const profile: UserProfileRecord | null =
      profileRes.data && !profileRes.error
        ? {
            id: profileRes.data.id,
            fullName: profileRes.data.full_name || null,
            isConsultant: Boolean(profileRes.data.is_consultant),
          }
        : null;

    const activeMemberships = membershipsRes.data || [];

    const metaRole = String(user.user_metadata?.role || '').toLowerCase();
    const isConsultant =
      Boolean(profile?.isConsultant) ||
      Boolean(user.user_metadata?.is_consultant) ||
      metaRole === 'consultant' ||
      metaRole === 'advisor' ||
      activeMemberships.some((row: any) => {
        const r = String(row.role || '').toLowerCase();
        return r === 'consultant' || r === 'advisor';
      });

    // RULE B: Consultant / Advisor Account -> Fetch and display ALL registered projects (tenants)
    if (isConsultant) {
      const { data: allTenantsData, error: allTenantsError } = await supabase
        .from('tenants')
        .select('id, name, created_at')
        .order('created_at', { ascending: false });

      if (allTenantsError) {
        return {
          profile,
          isConsultant: true,
          ownerProject: null,
          projects: [],
          error: allTenantsError.message,
        };
      }

      const membershipRoleByTenantId: Record<string, TenantRole> = {};
      activeMemberships.forEach((m: any) => {
        if (m.tenant_id) {
          membershipRoleByTenantId[m.tenant_id] = m.role || 'consultant';
        }
      });

      // Merge all registered tenants with any membership-joined tenants (deduplicated)
      const tenantMap = new Map<string, { id: string; name: string; created_at: string }>();
      (allTenantsData || []).forEach((t: any) => {
        if (t?.id) {
          tenantMap.set(t.id, {
            id: t.id,
            name: t.name || 'مشروع بدون اسم',
            created_at: t.created_at || new Date().toISOString(),
          });
        }
      });
      activeMemberships.forEach((row: any) => {
        const joinedTenant = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants;
        if (joinedTenant?.id && !tenantMap.has(joinedTenant.id)) {
          tenantMap.set(joinedTenant.id, {
            id: joinedTenant.id,
            name: joinedTenant.name || 'مشروع بدون اسم',
            created_at: joinedTenant.created_at || row.created_at || new Date().toISOString(),
          });
        }
      });

      const consultantProjectsBase: TenantWithMembership[] = Array.from(tenantMap.values()).map(
        (tenant) => ({
          id: tenant.id,
          tenantId: tenant.id,
          name: tenant.name,
          role: membershipRoleByTenantId[tenant.id] || 'consultant',
          isActive: true,
          createdAt: tenant.created_at,
          metrics: { ...EMPTY_METRICS },
        })
      );

      const metricsList = await Promise.all(
        consultantProjectsBase.map((proj) => fetchTenantQuickMetrics(proj.tenantId))
      );

      const projects = consultantProjectsBase.map((proj, idx) => ({
        ...proj,
        metrics: metricsList[idx] || { ...EMPTY_METRICS },
      }));

      return {
        profile,
        isConsultant: true,
        ownerProject: null,
        projects,
        error: null,
      };
    }

    // RULE A: Owner Account (Single-Project Constraint: role = 'owner' & is_active = true)
    const ownerRow = activeMemberships.find(
      (row: any) => String(row.role || '').toLowerCase() === 'owner'
    );

    if (!ownerRow) {
      return {
        profile,
        isConsultant: false,
        ownerProject: null,
        projects: [],
        error: null,
      };
    }

    let tenantObj = Array.isArray(ownerRow.tenants) ? ownerRow.tenants[0] : ownerRow.tenants;
    if (!tenantObj && ownerRow.tenant_id) {
      const { data: fallbackTenant } = await supabase
        .from('tenants')
        .select('id, name, created_at')
        .eq('id', ownerRow.tenant_id)
        .maybeSingle();
      tenantObj = fallbackTenant;
    }

    const metrics = await fetchTenantQuickMetrics(ownerRow.tenant_id);
    const ownerProject: TenantWithMembership = {
      id: ownerRow.id,
      tenantId: ownerRow.tenant_id,
      name: tenantObj?.name || 'مشروعي',
      role: 'owner',
      isActive: true,
      createdAt: tenantObj?.created_at || ownerRow.created_at || new Date().toISOString(),
      metrics,
    };

    return {
      profile,
      isConsultant: false,
      ownerProject,
      projects: [ownerProject],
      error: null,
    };
  } catch (err: any) {
    return {
      profile: null,
      isConsultant: false,
      ownerProject: null,
      projects: [],
      error: err?.message || 'حدث خطأ أثناء تحميل بيانات المشاريع',
    };
  }
}

export async function createTenantForOwner(
  projectName: string,
  userId: string
): Promise<{ success: boolean; tenant?: TenantWithMembership; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'لم يتم تكوين اتصال Supabase.' };
  }

  const cleanName = projectName.trim();
  if (!cleanName) {
    return { success: false, error: 'يرجى إدخال اسم المشروع.' };
  }

  try {
    // Enforce Single-Project Constraint: prevent an owner from creating more than ONE active project
    const { data: existingOwnerRows, error: checkError } = await supabase
      .from('tenant_members')
      .select('id, tenant_id')
      .eq('user_id', userId)
      .eq('role', 'owner')
      .eq('is_active', true)
      .limit(1);

    if (!checkError && existingOwnerRows && existingOwnerRows.length > 0) {
      return {
        success: false,
        error: 'يمتلك هذا الحساب مشروعاً نشطاً بالفعل، ولا يمكن للمالك إنشاء أكثر من مشروع واحد.',
      };
    }

    // Call database RPC function create_tenant_and_link (creates tenant & links current user as owner)
    const { data, error } = await supabase.rpc('create_tenant_and_link', {
      p_name: cleanName,
    });

    if (error) {
      console.error('Error creating project:', error.message);
      return { success: false, error: error.message };
    }

    console.log('Project created:', data);

    const record = Array.isArray(data) ? data[0] : data;
    let resolvedTenantId =
      typeof record === 'string'
        ? record.trim()
        : String(record?.tenant_id || '').trim();
    let resolvedMemberId =
      typeof record === 'object' && record !== null
        ? String(record.member_id || record.id || '').trim()
        : '';
    let resolvedName =
      typeof record === 'object' && record !== null && record.name
        ? String(record.name)
        : cleanName;
    let resolvedCreatedAt =
      typeof record === 'object' && record !== null && record.created_at
        ? String(record.created_at)
        : new Date().toISOString();

    // Verify record.id if RPC returned { id } without explicit tenant_id
    if (!resolvedTenantId && typeof record === 'object' && record !== null && record.id) {
      const possibleTenantId = String(record.id).trim();
      const { data: tenantCheck } = await supabase
        .from('tenants')
        .select('id')
        .eq('id', possibleTenantId)
        .maybeSingle();
      if (tenantCheck?.id) {
        resolvedTenantId = tenantCheck.id;
      }
    }

    // If the RPC returns void or omits tenant_id, read back the newly linked owner membership
    if (!resolvedTenantId) {
      const { data: linkedRow } = await supabase
        .from('tenant_members')
        .select('id, tenant_id, created_at, tenants(id, name, created_at)')
        .eq('user_id', userId)
        .eq('role', 'owner')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (linkedRow?.tenant_id) {
        const joinedTenant = Array.isArray(linkedRow.tenants)
          ? linkedRow.tenants[0]
          : linkedRow.tenants;
        resolvedTenantId = linkedRow.tenant_id;
        resolvedMemberId = linkedRow.id || resolvedTenantId;
        resolvedName = joinedTenant?.name || cleanName;
        resolvedCreatedAt =
          joinedTenant?.created_at || linkedRow.created_at || resolvedCreatedAt;
      }
    }

    if (!resolvedTenantId) {
      return {
        success: false,
        error: 'تم إنشاء المشروع ولكن تعذر تحديد معرف المشروع المرتبط.',
      };
    }

    verifiedTenantIds.add(resolvedTenantId);
    setCurrentActiveTenantId(resolvedTenantId);

    return {
      success: true,
      tenant: {
        id: resolvedMemberId || resolvedTenantId,
        tenantId: resolvedTenantId,
        name: resolvedName,
        role: 'owner',
        isActive: true,
        createdAt: resolvedCreatedAt,
        metrics: { ...EMPTY_METRICS },
      },
    };
  } catch (err: any) {
    console.error('Error creating project:', err?.message || err);
    return {
      success: false,
      error: err?.message || 'حدث خطأ غير متوقع أثناء إنشاء المشروع',
    };
  }
}

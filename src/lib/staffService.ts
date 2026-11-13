import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from './supabase';
import { getCurrentActiveTenantId, resolveActiveTenantId } from './tenantsService';

export interface StaffMemberRecord {
  id: string; // tenant_members.id
  tenantId: string;
  userId: string;
  role: 'owner' | 'cashier' | 'consultant' | 'admin' | 'member' | string;
  isActive: boolean;
  createdAt: string;
  fullName: string;
  email?: string;
}

export interface CreateCashierParams {
  fullName: string;
  email: string;
  password: string;
  tenantId?: string;
}

export interface CreateCashierResult {
  success: boolean;
  member?: StaffMemberRecord;
  needsEmailConfirmation?: boolean;
  error?: string;
}

/**
 * Ephemeral Auth client with persistSession: false so registering a new Cashier
 * in Supabase Auth NEVER replaces the currently logged-in Owner's active session.
 */
const ephemeralStaffAuthClient = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'bizos-ephemeral-staff-signup',
    },
  }
);

/**
 * Fetch all members in tenant_members belonging strictly to the active tenant_id.
 */
export async function fetchProjectStaffFromSupabase(
  tenantId?: string
): Promise<{ data: StaffMemberRecord[]; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: 'لم يتم تكوين اتصال Supabase.' };
  }

  try {
    const currentTenantId = (tenantId ?? getCurrentActiveTenantId() ?? '').trim();
    if (!currentTenantId) {
      return { data: [], error: 'لم يتم تحديد معرف المشروع النشط (tenant_id).' };
    }

    const { data: membersData, error: membersError } = await supabase
      .from('tenant_members')
      .select('id, tenant_id, user_id, role, is_active, created_at')
      .eq('tenant_id', currentTenantId)
      .order('created_at', { ascending: false });

    if (membersError) {
      console.error('❌ Supabase fetch tenant_members error:', membersError.message);
      return { data: [], error: membersError.message };
    }

    const rows = membersData || [];
    const userIds = Array.from(
      new Set(rows.map((r: any) => r.user_id).filter((id: any) => typeof id === 'string' && id.trim() !== ''))
    );

    // Fetch matching profile metadata safely (works even if profiles has varying optional columns)
    const profilesMap: Record<string, { fullName?: string; email?: string }> = {};
    if (userIds.length > 0) {
      try {
        const { data: profilesData, error: profilesErr } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        if (!profilesErr && profilesData) {
          profilesData.forEach((p: any) => {
            if (p?.id) {
              profilesMap[p.id] = {
                fullName: p.full_name || p.display_name || p.name || undefined,
                email: p.email || undefined,
              };
            }
          });
        }
      } catch (profileEx) {
        console.warn('⚠️ Optional profiles lookup skipped:', profileEx);
      }
    }

    // Include current logged-in user details if present
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (currentUser?.id) {
        const existing = profilesMap[currentUser.id] || {};
        profilesMap[currentUser.id] = {
          fullName:
            existing.fullName ||
            currentUser.user_metadata?.full_name ||
            currentUser.user_metadata?.display_name ||
            currentUser.email?.split('@')[0],
          email: existing.email || currentUser.email,
        };
      }
    } catch {
      // non-fatal
    }

    const mapped: StaffMemberRecord[] = rows.map((row: any) => {
      const prof = profilesMap[row.user_id] || {};
      const roleNormalized = String(row.role || 'cashier').toLowerCase();
      const defaultLabel =
        roleNormalized === 'owner'
          ? 'مالك المشروع'
          : roleNormalized === 'cashier'
          ? `كاشير (${String(row.user_id || '').slice(0, 6)})`
          : `عضو (${String(row.user_id || '').slice(0, 6)})`;

      return {
        id: row.id,
        tenantId: row.tenant_id,
        userId: row.user_id,
        role: roleNormalized,
        isActive: row.is_active !== false,
        createdAt: row.created_at || new Date().toISOString(),
        fullName: prof.fullName || defaultLabel,
        email: prof.email,
      };
    });

    return { data: mapped, error: null };
  } catch (err: any) {
    console.error('❌ Exception in fetchProjectStaffFromSupabase:', err);
    return { data: [], error: err?.message || 'حدث خطأ أثناء جلب قائمة الموظفين' };
  }
}

/**
 * Owner-only workflow:
 * 1. Verifies the current authenticated user is an active Owner of target tenant_id
 * 2. Registers the new staff account in Supabase Auth via ephemeral client (preserves Owner session)
 * 3. Links the new user_id in public.tenant_members with tenant_id and role = 'cashier'
 */
export async function createCashierStaffAccount(
  params: CreateCashierParams
): Promise<CreateCashierResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'لم يتم تكوين اتصال Supabase.' };
  }

  const cleanName = params.fullName.trim();
  const cleanEmail = params.email.trim().toLowerCase();
  const password = params.password;

  if (!cleanName) {
    return { success: false, error: 'يرجى إدخال الاسم الكامل للموظف.' };
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'يرجى إدخال بريد إلكتروني صحيح.' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.' };
  }

  try {
    const resolvedTenantId = await resolveActiveTenantId(params.tenantId);
    if (!resolvedTenantId) {
      return {
        success: false,
        error: 'تعذر تحديد معرف المشروع النشط (tenant_id). يرجى اختيار المشروع أولاً.',
      };
    }

    // Enforce Owner-only check before calling Auth / DB
    const {
      data: { user: ownerUser },
    } = await supabase.auth.getUser();

    if (!ownerUser?.id) {
      return { success: false, error: 'يجب تسجيل الدخول كمالك للمشروع أولاً.' };
    }

    const { data: ownerMembership, error: ownerCheckErr } = await supabase
      .from('tenant_members')
      .select('id, role, is_active')
      .eq('tenant_id', resolvedTenantId)
      .eq('user_id', ownerUser.id)
      .eq('role', 'owner')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (ownerCheckErr || !ownerMembership) {
      return {
        success: false,
        error: 'غير مصرح لك بإضافة موظفين. هذه العملية مخصصة لمالك المشروع فقط.',
      };
    }

    // Step 1: Register new Cashier in Supabase Auth using ephemeral client
    const { data: signUpData, error: signUpError } = await ephemeralStaffAuthClient.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          display_name: cleanName,
          role: 'cashier',
          tenant_id: resolvedTenantId,
        },
      },
    });

    if (signUpError) {
      const msg = signUpError.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        return {
          success: false,
          error: 'هذا البريد الإلكتروني مسجل مسبقاً في النظام. يرجى استخدام بريد إلكتروني آخر.',
        };
      }
      return { success: false, error: msg || 'فشل تسجيل حساب الموظف في Supabase Auth.' };
    }

    const newUserId = signUpData?.user?.id;
    const emptyIdentities =
      Array.isArray(signUpData?.user?.identities) && signUpData.user.identities.length === 0;

    if (!newUserId || emptyIdentities) {
      return {
        success: false,
        error: 'هذا البريد الإلكتروني مسجل مسبقاً في النظام. يرجى استخدام بريد إلكتروني آخر للموظف الجديد.',
      };
    }

    // Step 2: Best-effort profile population using ephemeral session (if email confirmation is off)
    if (signUpData.session) {
      try {
        await ephemeralStaffAuthClient
          .from('profiles')
          .upsert({ id: newUserId, full_name: cleanName, is_consultant: false }, { onConflict: 'id' });
      } catch {
        // Non-fatal if trigger already populated profiles or schema differs
      }
      try {
        await ephemeralStaffAuthClient.auth.signOut({ scope: 'local' });
      } catch {
        // Ignore cleanup error
      }
    }

    // Step 3: Link user_id to public.tenant_members using Owner's authenticated Supabase client
    const { data: insertedMember, error: memberInsertError } = await supabase
      .from('tenant_members')
      .insert([
        {
          tenant_id: resolvedTenantId,
          user_id: newUserId,
          role: 'cashier',
          is_active: true,
        },
      ])
      .select('id, tenant_id, user_id, role, is_active, created_at')
      .single();

    if (memberInsertError) {
      console.error('❌ Supabase tenant_members insert error:', memberInsertError.message);
      return {
        success: false,
        error: `تم إنشاء الحساب في Auth لكن تعذر ربطه بالمشروع (tenant_members): ${memberInsertError.message}`,
      };
    }

    const createdMember: StaffMemberRecord = {
      id: insertedMember.id,
      tenantId: insertedMember.tenant_id,
      userId: insertedMember.user_id,
      role: String(insertedMember.role || 'cashier').toLowerCase(),
      isActive: insertedMember.is_active !== false,
      createdAt: insertedMember.created_at || new Date().toISOString(),
      fullName: cleanName,
      email: cleanEmail,
    };

    return {
      success: true,
      member: createdMember,
      needsEmailConfirmation: !signUpData.session,
    };
  } catch (err: any) {
    console.error('❌ Exception in createCashierStaffAccount:', err);
    return {
      success: false,
      error: err?.message || 'حدث خطأ غير متوقع أثناء إضافة الموظف.',
    };
  }
}

/**
 * Toggle is_active status for a non-owner staff member within the active tenant.
 */
export async function toggleStaffActiveStatusInSupabase(
  memberId: string,
  nextIsActive: boolean,
  tenantId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const resolvedTenantId = await resolveActiveTenantId(tenantId);
    if (!resolvedTenantId) {
      return { success: false, error: 'معرف المشروع النشط (tenant_id) غير متوفر.' };
    }

    const { error } = await supabase
      .from('tenant_members')
      .update({ is_active: nextIsActive })
      .eq('id', memberId)
      .eq('tenant_id', resolvedTenantId)
      .neq('role', 'owner');

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Remove a non-owner staff member from the active tenant's tenant_members table.
 */
export async function removeStaffMemberFromSupabase(
  memberId: string,
  tenantId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const resolvedTenantId = await resolveActiveTenantId(tenantId);
    if (!resolvedTenantId) {
      return { success: false, error: 'معرف المشروع النشط (tenant_id) غير متوفر.' };
    }

    const { error } = await supabase
      .from('tenant_members')
      .delete()
      .eq('id', memberId)
      .eq('tenant_id', resolvedTenantId)
      .neq('role', 'owner');

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

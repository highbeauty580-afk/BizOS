import { supabase, isSupabaseConfigured } from './supabase';
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

export interface LinkStaffByEmailParams {
  email: string;
  role?: 'cashier' | string;
  tenantId?: string;
}

export interface LinkStaffByEmailResult {
  success: boolean;
  member?: StaffMemberRecord;
  wasUpdated?: boolean;
  error?: string;
}

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
    const explicitTenantId = (tenantId ?? getCurrentActiveTenantId() ?? '').trim();
    const currentTenantId =
      (await resolveActiveTenantId(explicitTenantId)) || explicitTenantId;
    if (!currentTenantId) {
      return { data: [], error: 'لم يتم تحديد معرف المشروع النشط (tenant_id). يرجى اختيار المشروع أولاً.' };
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
          ? prof.email?.split('@')[0] || `كاشير (${String(row.user_id || '').slice(0, 6)})`
          : prof.email?.split('@')[0] || `عضو (${String(row.user_id || '').slice(0, 6)})`;

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
 * Looks up a pre-registered user_id by email (via public.profiles or optional RPC)
 * without triggering Supabase Auth SignUp rate limits.
 */
async function lookupRegisteredUserByEmail(
  cleanEmail: string
): Promise<{ userId: string | null; fullName?: string; lookupNote?: string }> {
  // 1. Primary lookup in public.profiles by email
  try {
    const { data: profileRow, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', cleanEmail)
      .limit(1)
      .maybeSingle();

    if (!profileErr && profileRow?.id) {
      return {
        userId: String(profileRow.id),
        fullName:
          profileRow.full_name ||
          profileRow.display_name ||
          profileRow.name ||
          cleanEmail.split('@')[0],
      };
    }
  } catch (err) {
    console.warn('⚠️ Profiles email lookup warning:', err);
  }

  // 2. Fallback RPC lookup (if get_user_id_by_email is configured in Supabase)
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('get_user_id_by_email', {
      p_email: cleanEmail,
    });

    if (!rpcErr && rpcData) {
      const record = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      const rpcUserId =
        typeof record === 'string'
          ? record.trim()
          : String(record?.user_id || record?.id || '').trim();

      if (rpcUserId) {
        return {
          userId: rpcUserId,
          fullName:
            typeof record === 'object' && record !== null
              ? record.full_name || record.display_name || cleanEmail.split('@')[0]
              : cleanEmail.split('@')[0],
        };
      }
    }
  } catch {
    // Optional RPC not configured; fall through cleanly
  }

  return { userId: null };
}

/**
 * Owner-only workflow (No Auth Sign-Up / Zero Rate Limits):
 * 1. Verifies the current authenticated user is an active Owner of target tenant_id
 * 2. Searches for the pre-registered employee's user_id by email in profiles
 * 3. Inserts or updates public.tenant_members linking user_id -> active tenant_id with selected role (default 'cashier')
 */
export async function linkStaffByEmailInSupabase(
  params: LinkStaffByEmailParams
): Promise<LinkStaffByEmailResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'لم يتم تكوين اتصال Supabase.' };
  }

  const cleanEmail = params.email.trim().toLowerCase();
  const selectedRole = (params.role || 'cashier').trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'يرجى إدخال بريد إلكتروني صحيح للموظف.' };
  }

  try {
    const explicitTenantId = (params.tenantId ?? getCurrentActiveTenantId() ?? '').trim();
    const resolvedTenantId =
      (await resolveActiveTenantId(explicitTenantId)) || explicitTenantId;
    if (!resolvedTenantId) {
      return {
        success: false,
        error: 'تعذر تحديد معرف المشروع النشط (tenant_id). يرجى اختيار المشروع أولاً.',
      };
    }

    // Enforce Owner-only check before linking
    const {
      data: { user: ownerUser },
    } = await supabase.auth.getUser();

    if (!ownerUser?.id) {
      return { success: false, error: 'يجب تسجيل الدخول كمالك للمشروع أولاً.' };
    }

    if (ownerUser.email && ownerUser.email.trim().toLowerCase() === cleanEmail) {
      return {
        success: false,
        error: 'هذا البريد الإلكتروني يعود لحسابك الحالي كمالك للمشروع بالفعل.',
      };
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
        error: 'غير مصرح لك بإدارة موظفي هذا المشروع. هذه العملية مخصصة لمالك المشروع فقط.',
      };
    }

    // Step 1: Lookup user_id for the pre-registered email
    const foundUser = await lookupRegisteredUserByEmail(cleanEmail);
    if (!foundUser.userId) {
      return {
        success: false,
        error: `لم يتم العثور على حساب مسجل بالبريد (${cleanEmail}). يجب أن يقوم الموظف بتسجيل حسابه الشخصي في النظام أولاً (Sign Up)، ثم يمكنك ربطه هنا.`,
      };
    }

    const targetUserId = foundUser.userId;

    // Step 2: Check if user already has a membership record in this tenant -> Update or Insert
    const { data: existingMember, error: existingErr } = await supabase
      .from('tenant_members')
      .select('id, tenant_id, user_id, role, is_active, created_at')
      .eq('tenant_id', resolvedTenantId)
      .eq('user_id', targetUserId)
      .limit(1)
      .maybeSingle();

    if (existingErr) {
      console.error('❌ Error checking existing membership:', existingErr.message);
      return {
        success: false,
        error: `تعذر التحقق من العضوية الحالية للموظف: ${existingErr.message}`,
      };
    }

    if (existingMember) {
      if (String(existingMember.role || '').toLowerCase() === 'owner') {
        return {
          success: false,
          error: 'هذا المستخدم هو مالك المشروع الحالي بالفعل ولا يمكن تغيير دوره.',
        };
      }

      const { data: updatedMember, error: updateErr } = await supabase
        .from('tenant_members')
        .update({
          role: selectedRole,
          is_active: true,
        })
        .eq('id', existingMember.id)
        .eq('tenant_id', resolvedTenantId)
        .select('id, tenant_id, user_id, role, is_active, created_at')
        .single();

      if (updateErr) {
        console.error('❌ Supabase tenant_members update error:', updateErr.message);
        return {
          success: false,
          error: `تعذر تحديث سجل الموظف في المشروع: ${updateErr.message}`,
        };
      }

      return {
        success: true,
        wasUpdated: true,
        member: {
          id: updatedMember.id,
          tenantId: updatedMember.tenant_id,
          userId: updatedMember.user_id,
          role: String(updatedMember.role || selectedRole).toLowerCase(),
          isActive: updatedMember.is_active !== false,
          createdAt: updatedMember.created_at || new Date().toISOString(),
          fullName: foundUser.fullName || cleanEmail.split('@')[0],
          email: cleanEmail,
        },
      };
    }

    // Step 3: Insert new link into public.tenant_members
    const { data: insertedMember, error: insertErr } = await supabase
      .from('tenant_members')
      .insert([
        {
          tenant_id: resolvedTenantId,
          user_id: targetUserId,
          role: selectedRole,
          is_active: true,
        },
      ])
      .select('id, tenant_id, user_id, role, is_active, created_at')
      .single();

    if (insertErr) {
      console.error('❌ Supabase tenant_members insert error:', insertErr.message);
      return {
        success: false,
        error: `تعذر ربط الموظف بالمشروع (tenant_members): ${insertErr.message}`,
      };
    }

    return {
      success: true,
      wasUpdated: false,
      member: {
        id: insertedMember.id,
        tenantId: insertedMember.tenant_id,
        userId: insertedMember.user_id,
        role: String(insertedMember.role || selectedRole).toLowerCase(),
        isActive: insertedMember.is_active !== false,
        createdAt: insertedMember.created_at || new Date().toISOString(),
        fullName: foundUser.fullName || cleanEmail.split('@')[0],
        email: cleanEmail,
      },
    };
  } catch (err: any) {
    console.error('❌ Exception in linkStaffByEmailInSupabase:', err);
    return {
      success: false,
      error: err?.message || 'حدث خطأ غير متوقع أثناء ربط الموظف بالمشروع.',
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
    const explicitTenantId = (tenantId ?? getCurrentActiveTenantId() ?? '').trim();
    const resolvedTenantId =
      (await resolveActiveTenantId(explicitTenantId)) || explicitTenantId;
    if (!resolvedTenantId) {
      return { success: false, error: 'معرف المشروع النشط (tenant_id) غير متوفر. يرجى اختيار المشروع أولاً.' };
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
    const explicitTenantId = (tenantId ?? getCurrentActiveTenantId() ?? '').trim();
    const resolvedTenantId =
      (await resolveActiveTenantId(explicitTenantId)) || explicitTenantId;
    if (!resolvedTenantId) {
      return { success: false, error: 'معرف المشروع النشط (tenant_id) غير متوفر. يرجى اختيار المشروع أولاً.' };
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

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

export interface UserProjectMembershipSummary {
  tenantId: string;
  tenantName: string;
  role: string;
  isActive: boolean;
}

export interface RegisteredUserOption {
  userId: string;
  fullName: string;
  email?: string;
  isCurrentUser?: boolean;
  createdAt?: string;
  memberships: UserProjectMembershipSummary[];
}

export interface OwnerTenantOption {
  tenantId: string;
  name: string;
}

export interface LinkStaffParams {
  userId?: string;
  email?: string;
  role?: 'cashier' | 'owner' | string;
  tenantId?: string;
}

export interface LinkStaffResult {
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

    const profilesMap: Record<string, { fullName?: string; email?: string }> = {};
    if (userIds.length > 0) {
      try {
        const { data: profilesData, error: profilesErr } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        if (!profilesErr && profilesData) {
          profilesData.forEach((p: any) => {
            const pid = String(p?.id || p?.user_id || '').trim();
            if (pid) {
              profilesMap[pid] = {
                fullName: p.full_name || p.display_name || p.name || p.username || undefined,
                email: p.email || undefined,
              };
            }
          });
        }
      } catch (profileEx) {
        console.warn('⚠️ Optional profiles lookup skipped:', profileEx);
      }
    }

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
 * Fetch all registered users from public.profiles (and optional RPC fallback),
 * enriched with each user's project memberships and roles so the Owner can see
 * all registered accounts directly in Staff Management and link any of them.
 */
export async function fetchRegisteredUsersForLinking(optionsConfig?: {
  includeCurrentUser?: boolean;
}): Promise<{
  data: RegisteredUserOption[];
  error: string | null;
  rpcAvailable?: boolean;
  profilesCount?: number;
}> {
  if (!isSupabaseConfigured) {
    return { data: [], error: 'لم يتم تكوين اتصال Supabase.', rpcAvailable: false, profilesCount: 0 };
  }

  const includeCurrentUser = optionsConfig?.includeCurrentUser ?? false;

  try {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    const usersMap = new Map<
      string,
      { fullName?: string; email?: string; createdAt?: string }
    >();

    // Query BOTH public.profiles and list_registered_users RPC in parallel so neither old RLS nor missing profile rows hide new accounts
    const [profilesRes, rpcRes] = await Promise.all([
      supabase.from('profiles').select('*').limit(1000),
      Promise.resolve(supabase.rpc('list_registered_users')).catch((err) => ({
        data: null,
        error: err,
      })),
    ]);

    const profilesData = !profilesRes.error && Array.isArray(profilesRes.data) ? profilesRes.data : [];
    profilesData.forEach((p: any) => {
      const uid = String(p?.id || p?.user_id || '').trim();
      if (!uid) return;
      usersMap.set(uid, {
        fullName: p.full_name || p.display_name || p.name || p.username || undefined,
        email: p.email || undefined,
        createdAt: p.created_at || p.updated_at || undefined,
      });
    });

    const rpcAvailable = !rpcRes.error && Array.isArray(rpcRes.data);
    if (rpcAvailable) {
      (rpcRes.data as any[]).forEach((u: any) => {
        const uid = String(u?.id || u?.user_id || '').trim();
        if (!uid) return;
        const prev = usersMap.get(uid) || {};
        usersMap.set(uid, {
          fullName:
            prev.fullName ||
            u.full_name ||
            u.display_name ||
            u.name ||
            (u.email ? String(u.email).split('@')[0] : undefined),
          email: prev.email || u.email || undefined,
          createdAt: prev.createdAt || u.created_at || undefined,
        });
      });
    }

    // Ensure current authenticated user is represented if includeCurrentUser is requested
    if (includeCurrentUser && currentUser?.id) {
      const prev = usersMap.get(currentUser.id) || {};
      usersMap.set(currentUser.id, {
        fullName:
          prev.fullName ||
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.display_name ||
          currentUser.email?.split('@')[0],
        email: prev.email || currentUser.email,
        createdAt: prev.createdAt || currentUser.created_at,
      });
    }

    // 3. Enrich with memberships from tenant_members
    const userIds = Array.from(usersMap.keys());
    const membershipsByUserId = new Map<string, UserProjectMembershipSummary[]>();

    try {
      const memberQuery = supabase
        .from('tenant_members')
        .select('tenant_id, user_id, role, is_active, tenants(id, name)')
        .limit(1000);

      const { data: allMembersData } =
        userIds.length > 0 ? await memberQuery.in('user_id', userIds) : await memberQuery;

      if (Array.isArray(allMembersData)) {
        allMembersData.forEach((row: any) => {
          const uid = String(row.user_id || '').trim();
          if (!uid) return;

          if (!usersMap.has(uid)) {
            usersMap.set(uid, {});
          }

          const joinedTenant = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants;
          const summary: UserProjectMembershipSummary = {
            tenantId: String(row.tenant_id),
            tenantName: joinedTenant?.name || `مشروع (${String(row.tenant_id).slice(0, 6)})`,
            role: String(row.role || 'cashier').toLowerCase(),
            isActive: row.is_active !== false,
          };

          const existingList = membershipsByUserId.get(uid) || [];
          existingList.push(summary);
          membershipsByUserId.set(uid, existingList);
        });
      }
    } catch (memberEx) {
      console.warn('⚠️ Optional memberships enrichment skipped:', memberEx);
    }

    const options: RegisteredUserOption[] = Array.from(usersMap.entries())
      .filter(([uid]) => includeCurrentUser || uid !== currentUser?.id)
      .map(([uid, info]) => {
        const cleanEmail = info.email?.trim();
        const fallbackName = cleanEmail
          ? cleanEmail.split('@')[0]
          : `مستخدم (${uid.slice(0, 6)})`;
        return {
          userId: uid,
          fullName: info.fullName?.trim() || fallbackName,
          email: cleanEmail,
          isCurrentUser: uid === currentUser?.id,
          createdAt: info.createdAt,
          memberships: membershipsByUserId.get(uid) || [],
        };
      })
      .sort((a, b) => {
        if (a.isCurrentUser !== b.isCurrentUser) return a.isCurrentUser ? 1 : -1;
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) {
          return timeB - timeA; // Newest accounts first so newly registered users appear at top
        }
        return a.fullName.localeCompare(b.fullName, 'ar');
      });

    return {
      data: options,
      error: profilesRes.error && options.length === 0 ? profilesRes.error.message : null,
      rpcAvailable,
      profilesCount: profilesData.length,
    };
  } catch (err: any) {
    console.error('❌ Exception in fetchRegisteredUsersForLinking:', err);
    return {
      data: [],
      error: err?.message || 'تعذر جلب قائمة المستخدمين المسجلين.',
      rpcAvailable: false,
      profilesCount: 0,
    };
  }
}

/**
 * Fetch projects owned by the authenticated user so the Owner can pick or confirm the target tenant_id.
 */
export async function fetchOwnerManagedTenants(): Promise<OwnerTenantOption[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return [];

    const { data, error } = await supabase
      .from('tenant_members')
      .select('tenant_id, tenants(id, name)')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .eq('is_active', true);

    if (error || !Array.isArray(data)) return [];

    const seen = new Set<string>();
    const list: OwnerTenantOption[] = [];
    data.forEach((row: any) => {
      const tid = String(row.tenant_id || '').trim();
      if (!tid || seen.has(tid)) return;
      seen.add(tid);
      const joinedTenant = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants;
      list.push({
        tenantId: tid,
        name: joinedTenant?.name || 'مشروعي',
      });
    });
    return list;
  } catch {
    return [];
  }
}

/**
 * Fallback lookup by email if caller submits email instead of userId directly.
 */
async function lookupRegisteredUserByEmail(
  cleanEmail: string
): Promise<{ userId: string | null; fullName?: string }> {
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
  } catch {
    // ignore
  }

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
    // ignore
  }

  return { userId: null };
}

/**
 * Owner-only workflow:
 * Links a selected pre-registered user (by userId from dropdown or email fallback)
 * into public.tenant_members for target tenant_id with the chosen role (default 'cashier').
 */
export async function linkStaffToTenantInSupabase(
  params: LinkStaffParams
): Promise<LinkStaffResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'لم يتم تكوين اتصال Supabase.' };
  }

  const selectedRole = (params.role || 'cashier').trim().toLowerCase();
  const explicitUserId = (params.userId || '').trim();
  const cleanEmail = (params.email || '').trim().toLowerCase();

  if (!explicitUserId && (!cleanEmail || !cleanEmail.includes('@'))) {
    return { success: false, error: 'يرجى اختيار الموظف من القائمة المنسدلة أولاً.' };
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

    const {
      data: { user: ownerUser },
    } = await supabase.auth.getUser();

    if (!ownerUser?.id) {
      return { success: false, error: 'يجب تسجيل الدخول كمالك للمشروع أولاً.' };
    }

    if (
      (explicitUserId && explicitUserId === ownerUser.id) ||
      (cleanEmail && ownerUser.email && ownerUser.email.trim().toLowerCase() === cleanEmail)
    ) {
      return {
        success: false,
        error: 'هذا الحساب يعود لك كمالك للمشروع بالفعل.',
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

    let targetUserId = explicitUserId;
    let targetFullName = cleanEmail ? cleanEmail.split('@')[0] : '';
    let targetEmail = cleanEmail || undefined;

    if (!targetUserId && cleanEmail) {
      const foundUser = await lookupRegisteredUserByEmail(cleanEmail);
      if (!foundUser.userId) {
        return {
          success: false,
          error: `لم يتم العثور على حساب مسجل بالبريد (${cleanEmail}). يرجى اختيار المستخدم من القائمة المنسدلة.`,
        };
      }
      targetUserId = foundUser.userId;
      targetFullName = foundUser.fullName || targetFullName;
    } else if (targetUserId) {
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetUserId)
          .maybeSingle();
        if (prof) {
          targetFullName =
            prof.full_name || prof.display_name || prof.name || prof.email?.split('@')[0] || targetFullName;
          targetEmail = prof.email || targetEmail;
        }
      } catch {
        // non-fatal
      }
    }

    const { data: existingMember, error: existingErr } = await supabase
      .from('tenant_members')
      .select('id, tenant_id, user_id, role, is_active, created_at')
      .eq('tenant_id', resolvedTenantId)
      .eq('user_id', targetUserId)
      .limit(1)
      .maybeSingle();

    if (existingErr) {
      return {
        success: false,
        error: `تعذر التحقق من العضوية الحالية للمستخدم: ${existingErr.message}`,
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
          fullName: targetFullName || `كاشير (${targetUserId.slice(0, 6)})`,
          email: targetEmail,
        },
      };
    }

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
        fullName: targetFullName || `كاشير (${targetUserId.slice(0, 6)})`,
        email: targetEmail,
      },
    };
  } catch (err: any) {
    console.error('❌ Exception in linkStaffToTenantInSupabase:', err);
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

import { supabase, isSupabaseConfigured } from './supabase';
import { Customer, CustomerType, CustomerStatus } from '../types';

/**
 * Dedicated Supabase Customer Data Service for BizOS
 * Target Table: public.customers
 */

export interface AddCustomerParams {
  name: string;
  phone1: string;
  phone2?: string;
  address: string;
  email?: string;
  type: CustomerType; // 'Individual' | 'Company'
  status?: CustomerStatus; // 'New' | 'Active' | 'Churned'
  creditLimit?: number;
}

export async function fetchCustomersFromSupabase(): Promise<{ data: Customer[]; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: 'لم يتم تكوين متغيرات بيئة Supabase (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY).' };
  }

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase fetch customers error:', error);
      return { data: [], error: error.message };
    }

    const mappedCustomers: Customer[] = (data || []).map((row: any) => ({
      id: row.customer_pk || row.id,
      name: row.customer_name || 'عميل بدون اسم',
      phone: row.customer_phone_1 || row.customer_phone || '',
      phone2: row.customer_phone_2 || undefined,
      address: row.customer_address || undefined,
      email: row.customer_email || undefined,
      company: row.customer_type === 'Company' ? row.customer_name : undefined,
      type: (row.customer_type as CustomerType) || 'Individual',
      status: (row.customer_status as CustomerStatus) || 'New',
      creditLimit: Number(row.credit_limit || 0.0),
    }));

    return { data: mappedCustomers, error: null };
  } catch (err: any) {
    console.error('❌ Exception in fetchCustomersFromSupabase:', err);
    return { data: [], error: err?.message || 'حدث خطأ أثناء جلب قائمة العملاء' };
  }
}

export async function addCustomerToSupabase(
  params: AddCustomerParams
): Promise<{ success: boolean; data?: Customer; error?: string }> {
  console.log('1. Starting customer save process with params:', params);

  if (!isSupabaseConfigured) {
    const msg = 'لم يتم تكوين متغيرات الاتصال بـ Supabase (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY غير معرفة).';
    console.error('❌ Supabase Config Error:', msg);
    return { success: false, error: msg };
  }

  try {
    const payload = {
      customer_name: params.name.trim(),
      customer_phone_1: params.phone1.trim(),
      customer_phone_2: params.phone2?.trim() || null,
      customer_address: params.address.trim(),
      customer_email: params.email?.trim() || null,
      customer_type: params.type || 'Individual',
      customer_status: params.status || 'Active', // Defaults to 'Active' to satisfy chk_customer_status constraint
      credit_limit: params.creditLimit !== undefined ? params.creditLimit : 0.0,
    };

    console.log('2. Sending Payload to Supabase public.customers:', payload);

    const { data, error } = await supabase
      .from('customers')
      .insert([payload])
      .select();

    if (error) {
      console.error('❌ Supabase Insert Error:', error.message, error.details, error.hint);
      return {
        success: false,
        error: `${error.message}${error.details ? ` - ${error.details}` : ''}${error.hint ? ` (${error.hint})` : ''}`,
      };
    }

    if (!data || data.length === 0) {
      console.error('❌ Supabase Insert Warning: No row returned from insert statement.');
      return { success: false, error: 'لم يتم إرجاع أي بيانات بعد الحفظ' };
    }

    console.log('✅ Successfully inserted customer in Supabase:', data);

    const createdRow = data[0];
    const createdCustomer: Customer = {
      id: createdRow.customer_pk || createdRow.id || `cust-${Date.now()}`,
      name: createdRow.customer_name || payload.customer_name,
      phone: createdRow.customer_phone_1 || payload.customer_phone_1,
      phone2: createdRow.customer_phone_2 || payload.customer_phone_2 || undefined,
      address: createdRow.customer_address || payload.customer_address,
      email: createdRow.customer_email || payload.customer_email || undefined,
      type: (createdRow.customer_type as CustomerType) || payload.customer_type,
      status: (createdRow.customer_status as CustomerStatus) || payload.customer_status,
      creditLimit: Number(createdRow.credit_limit ?? payload.credit_limit),
    };

    return { success: true, data: createdCustomer };
  } catch (err: any) {
    console.error('❌ Exception in addCustomerToSupabase:', err);
    return { success: false, error: err?.message || 'حدث خطأ غير متوقع أثناء الاتصال بـ Supabase' };
  }
}

export async function updateCustomerStatusInSupabase(
  customerPk: string,
  newStatus: CustomerStatus
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const { error } = await supabase
      .from('customers')
      .update({ customer_status: newStatus })
      .eq('customer_pk', customerPk);

    if (error) {
      console.error('❌ Failed to update customer status in Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function updateCustomerCreditLimitInSupabase(
  customerPk: string,
  newCreditLimit: number
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const { error } = await supabase
      .from('customers')
      .update({ credit_limit: newCreditLimit })
      .eq('customer_pk', customerPk);

    if (error) {
      console.error('❌ Failed to update credit limit in Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function deleteCustomerFromSupabase(
  customerPk: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('customer_pk', customerPk);

    if (error) {
      console.error('❌ Failed to delete customer from Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

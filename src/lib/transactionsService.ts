import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentActiveTenantId } from './tenantsService';

/**
 * Dedicated Supabase Financial Transactions Service for BizOS
 * Target Table: public.transactions
 * Columns:
 * - transactions_amount: numeric (Required) -> Total amount
 * - transactions_method: string (Required) -> 'Cash' | 'E_Wallet' | 'Bank' | 'Credit'
 * - Trans_Notice: string (Optional) -> Guidance or notes
 * - transactions_type: string (Required) -> 'Sales_Trans' | 'Return_Trans' | 'Expense_Trans' | etc.
 * - transactions_name: string (Required) -> "Customer Name + Operation Type"
 */

export interface AddFinancialTransactionParams {
  amount: number;
  method: 'Cash' | 'E_Wallet' | 'Bank' | 'Credit' | string;
  notice?: string;
  type: 'Sales_Trans' | 'Return_Trans' | string;
  name: string;
  stock_fk?: string;
}

export async function addFinancialTransactionToSupabase(
  params: AddFinancialTransactionParams
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase Config Error' };
  }

  try {
    const resolvedTenantId = getCurrentActiveTenantId();
    const cleanPayload: any = {
      transactions_amount: parseFloat(params.amount as any) || 0,
      transactions_method: params.method,
      Trans_Notice: params.notice || null,
      transactions_type: params.type,
      transactions_name: params.name,
    };

    if (params.stock_fk) {
      cleanPayload.Stock_fk = params.stock_fk;
    }
    if (resolvedTenantId) {
      cleanPayload.tenant_id = resolvedTenantId;
    }

    let { data, error } = await supabase
      .from('transactions')
      .insert([cleanPayload])
      .select();

    if (error && params.stock_fk) {
      console.warn(`⚠️ Retrying financial transaction without Stock_fk due to schema/constraint error:`, error.message);
      delete cleanPayload.Stock_fk;
      const retryRes = await supabase
        .from('transactions')
        .insert([cleanPayload])
        .select();
      data = retryRes.data;
      error = retryRes.error;
    }

    if (error) {
      console.error(`❌ Supabase Error in financial transactions:`, error.message, error.details);
      return { success: false, error: error.message };
    }

    return { success: true, data: data && data[0] };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function updateFinancialTransactionInSupabase(
  identifier: string,
  params: AddFinancialTransactionParams
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase Config Error' };
  }

  try {
    const cleanPayload: any = {
      transactions_amount: parseFloat(params.amount as any) || 0,
      transactions_method: params.method,
      Trans_Notice: params.notice || null,
      transactions_type: params.type,
      transactions_name: params.name,
    };

    if (params.stock_fk) {
      cleanPayload.Stock_fk = params.stock_fk;
    }

    // Try updating by transactions_pk first
    const { error: errPk } = await supabase
      .from('transactions')
      .update(cleanPayload)
      .eq('transactions_pk', identifier);

    if (errPk) {
      // Fallback try updating by id
      const { error: errId } = await supabase
        .from('transactions')
        .update(cleanPayload)
        .eq('id', identifier);

      if (errId) {
        console.error(`❌ Supabase Update Error in financial transactions:`, errId.message);
        return { success: false, error: errId.message };
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function deleteFinancialTransactionInSupabase(
  identifier: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase Config Error' };
  }

  try {
    const { error: errPk } = await supabase
      .from('transactions')
      .delete()
      .eq('transactions_pk', identifier);

    if (errPk) {
      const { error: errId } = await supabase
        .from('transactions')
        .delete()
        .eq('id', identifier);

      if (errId) {
        console.error(`❌ Supabase Delete Error in financial transactions:`, errId.message);
        return { success: false, error: errId.message };
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function fetchExpenseTransactionsFromSupabase(tenantId?: string): Promise<{ data: any[]; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: 'Supabase Config Error' };
  }

  try {
    const resolvedTenantId = tenantId ?? getCurrentActiveTenantId();
    let query = supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (resolvedTenantId) {
      query = query.eq('tenant_id', resolvedTenantId);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: error.message };
    }

    // Exclude sales & returns, but INCLUDE stock supply transactions under category 'بضاعة'
    const nonExpenseTypes = [
      'Sales_Trans',
      'Return_Trans',
    ];

    const stockSupplyTypes = [
      'New_Stock_Trans',
      'Reload_stock_Trans',
      'New_Material_Trans',
      'ReLoad_material_Trans',
    ];

    const expenseRows = (data || []).filter(
      (row: any) => !nonExpenseTypes.includes(row.transactions_type)
    );

    const mappedExpenses = expenseRows.map((row: any) => {
      const pk = row.transactions_pk || row.id || `tx-${Date.now()}`;
      const amount = parseFloat(row.transactions_amount) || 0;
      const createdDate = row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

      const isStockType = stockSupplyTypes.includes(row.transactions_type);
      const categoryName = isStockType ? 'بضاعة' : (row.transactions_type || 'مصروفات أخرى');

      return {
        id: pk,
        transaction_pk: pk,
        receiptNo: isStockType ? `STK-${String(pk).slice(-4)}` : `EXP-${String(pk).slice(-4)}`,
        amount: amount,
        category: categoryName,
        date: createdDate,
        paymentMethod: row.transactions_method || 'Cash',
        status: row.transactions_method === 'Credit' ? 'Unpaid' : 'Paid',
        notes: row.transactions_name || '',
        paymentNotice: row.Trans_Notice || '',
        createdAt: row.created_at || new Date().toISOString(),
      };
    });

    return { data: mappedExpenses, error: null };
  } catch (err: any) {
    return { data: [], error: err?.message || 'Error fetching expenses' };
  }
}

export async function fetchSalesTransactionsFromSupabase(tenantId?: string): Promise<{ data: any[]; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: 'Supabase Config Error' };
  }

  try {
    const resolvedTenantId = tenantId ?? getCurrentActiveTenantId();
    let query = supabase
      .from('transactions')
      .select('*')
      .in('transactions_type', ['Sales_Trans', 'Return_Trans'])
      .order('created_at', { ascending: false });

    if (resolvedTenantId) {
      query = query.eq('tenant_id', resolvedTenantId);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: error.message };
    }

    const mappedSales = (data || []).map((row: any) => {
      const pk = row.transactions_pk || row.id || `tx-${Date.now()}`;
      let parsedItems: any[] = [];
      try {
        if (row.Trans_Notice && row.Trans_Notice.startsWith('[')) {
          parsedItems = JSON.parse(row.Trans_Notice);
        }
      } catch (e) {
        parsedItems = [];
      }

      return {
        id: pk,
        receiptNo: `REC-${String(pk).slice(-4)}`,
        time: row.created_at ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        itemsSummary: row.transactions_name || 'عملية بيع',
        items: parsedItems,
        subtotal: parseFloat(row.transactions_amount) || 0,
        tax: 0,
        total: parseFloat(row.transactions_amount) || 0,
        paymentMethod: row.transactions_method || 'Cash',
        status: row.transactions_type === 'Return_Trans' ? 'Refunded' : 'Completed',
        shiftNotes: '',
        cashier: 'الكاشير الرئيسية',
        customerName: row.transactions_name?.split(' - ')[0] || undefined,
      };
    });

    return { data: mappedSales, error: null };
  } catch (err: any) {
    return { data: [], error: err?.message || 'Error fetching sales transactions' };
  }
}


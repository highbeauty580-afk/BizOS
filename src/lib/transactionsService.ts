import { supabase, isSupabaseConfigured } from './supabase';

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

export async function fetchExpenseTransactionsFromSupabase(): Promise<{ data: any[]; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: 'Supabase Config Error' };
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    const nonExpenseTypes = [
      'Sales_Trans',
      'Return_Trans',
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

      return {
        id: pk,
        transaction_pk: pk,
        receiptNo: `EXP-${String(pk).slice(-4)}`,
        amount: amount,
        category: row.transactions_type || 'مصروفات أخرى',
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


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


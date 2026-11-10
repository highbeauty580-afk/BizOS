import { supabase, isSupabaseConfigured } from './supabase';
import { FastItem } from '../types';

/**
 * Dedicated Supabase Stock Service for BizOS
 * Target Table: public.stock
 * Columns (Case Sensitive):
 * - Stock_name: string (Required) -> Name of Raw Material or Finished Product
 * - stock_type: string (Required) -> 'Raw material' | 'Stocked Product'
 * - minimum_limit: numeric (Required) -> Minimum stock limit
 * - maximum_limit: numeric (Required) -> Maximum stock limit
 * - quantity: numeric (Required) -> Current quantity in stock
 * - Stock_Cost: numeric (Required) -> Cost price per unit
 * - amount: numeric (Required) -> Stock_Cost * quantity
 * - Stock_code: string (Optional)
 * - Measure_SType: string (Optional)
 * - product_fk: uuid (Optional) -> Link to products table
 */

export interface AddStockParams {
  stock_name: string;
  stock_type: 'Raw material' | 'Stocked Product';
  minimum_limit: number;
  maximum_limit: number;
  quantity: number;
  stock_cost: number;
  stock_code?: string;
  measure_stype?: string;
  product_fk?: string;
}

export async function fetchStockFromSupabase(): Promise<{ data: FastItem[]; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: 'لم يتم تكوين متغيرات بيئة Supabase.' };
  }

  try {
    const { data, error } = await supabase
      .from('stock')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase fetch stock error:', error.message, error.details);
      return { data: [], error: error.message };
    }

    const mappedStock: FastItem[] = (data || []).map((row: any) => {
      const qty = parseFloat(row.quantity) || 0;
      const cost = parseFloat(row.Stock_Cost) || 0;
      // Use amount from DB or recalculate if missing
      const amount = row.amount !== undefined ? parseFloat(row.amount) : (cost * qty);

      return {
        id: row.stock_pk || row.id || `stk-${Date.now()}-${Math.random()}`,
        name: row.Stock_name || 'عنصر مخزن',
        nameAr: row.Stock_name || undefined,
        category: (row.stock_type === 'Raw material') ? 'Raw Materials' : 'Retail',
        inventoryType: (row.stock_type === 'Raw material') ? 'raw_material' : 'finished_goods',
        price: cost, 
        costPrice: cost,
        stockQuantity: qty,
        minStock: parseFloat(row.minimum_limit) || 10,
        maxStock: parseFloat(row.maximum_limit) || 100,
        unit: row.Measure_SType || 'قطعة',
        code: row.Stock_code || undefined,
        product_pk: row.product_fk,
        stock_pk: row.stock_pk,
        amount: amount,
      };
    });

    return { data: mappedStock, error: null };
  } catch (err: any) {
    console.error('❌ Exception in fetchStockFromSupabase:', err);
    return { data: [], error: err?.message || 'حدث خطأ أثناء جلب قائمة المخزون' };
  }
}

export async function addStockToSupabase(
  params: AddStockParams
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase Config Error' };
  }

  try {
    const cost = parseFloat(params.stock_cost as any) || 0;
    const qty = parseFloat(params.quantity as any) || 0;
    const calcAmount = cost * qty;

    const cleanPayload: Record<string, any> = {
      Stock_name: params.stock_name.trim(),
      stock_type: params.stock_type,
      minimum_limit: parseFloat(params.minimum_limit as any) || 0,
      maximum_limit: parseFloat(params.maximum_limit as any) || 0,
      quantity: qty,
      Stock_Cost: cost,
      amount: calcAmount,
      Stock_code: params.stock_code?.trim() || null,
      Measure_SType: params.measure_stype?.trim() || 'قطعة',
    };

    if (params.product_fk) {
      cleanPayload.product_fk = params.product_fk;
    }

    const { data, error } = await supabase
      .from('stock')
      .insert([cleanPayload])
      .select();

    if (error) {
      console.error(`❌ Supabase Error in stock:`, error.message, error.details);
      return { success: false, error: error.message };
    }

    return { success: true, data: data && data[0] };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function updateStockQuantityInSupabase(
  identifier: string,
  newQuantity: number,
  stockCost: number,
  isProductFk: boolean = false
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const cost = parseFloat(stockCost as any) || 0;
    const qty = parseFloat(newQuantity as any) || 0;
    const calcAmount = cost * qty;

    const updatePayload = {
      quantity: qty,
      amount: calcAmount,
      Stock_Cost: cost,
    };

    const query = supabase.from('stock').update(updatePayload);
    
    if (isProductFk) {
      query.eq('product_fk', identifier);
    } else {
      query.eq('stock_pk', identifier);
    }

    const { error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}


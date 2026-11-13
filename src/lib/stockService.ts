import { supabase, isSupabaseConfigured } from './supabase';
import { FastItem } from '../types';
import { getCurrentActiveTenantId } from './tenantsService';
import { fetchProductsFromSupabase } from './productsService';

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
  tenant_id?: string;
}

export interface UpdateStockOptions {
  stockPk?: string;
  productFk?: string;
  itemName?: string;
  isRawMaterial?: boolean;
  unit?: string;
  code?: string;
  minStock?: number;
  maxStock?: number;
  tenantId?: string;
}

export async function fetchStockFromSupabase(tenantId?: string): Promise<{ data: FastItem[]; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: 'لم يتم تكوين متغيرات بيئة Supabase.' };
  }

  try {
    const resolvedTenantId = tenantId ?? getCurrentActiveTenantId();
    let query = supabase
      .from('stock')
      .select('*')
      .order('created_at', { ascending: false });

    if (resolvedTenantId) {
      query = query.eq('tenant_id', resolvedTenantId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Supabase fetch stock error:', error.message, error.details);
      return { data: [], error: error.message };
    }

    const mappedStock: FastItem[] = (data || []).map((row: any) => {
      const qty = parseFloat(row.quantity) || 0;
      const cost = parseFloat(row.Stock_Cost) || 0;
      const amount = row.amount !== undefined ? parseFloat(row.amount) : cost * qty;

      return {
        id: row.stock_pk || row.id || `stk-${Date.now()}-${Math.random()}`,
        name: row.Stock_name || 'عنصر مخزن',
        nameAr: row.Stock_name || undefined,
        category: row.stock_type === 'Raw material' ? 'Raw Materials' : 'Retail',
        inventoryType: row.stock_type === 'Raw material' ? 'raw_material' : 'finished_goods',
        price: cost,
        costPrice: cost,
        stockQuantity: qty,
        minStock: parseFloat(row.minimum_limit) || 10,
        maxStock: parseFloat(row.maximum_limit) || 100,
        unit: row.Measure_SType || 'قطعة',
        code: row.Stock_code || undefined,
        imageUrl: row.image_url || row.image || row.imageUrl || undefined,
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

/**
 * Fetches live products & stock directly from Supabase and merges them
 * cleanly into a unified FastItem[] catalog with authoritative stock quantities.
 */
export async function fetchCombinedInventoryFromSupabase(
  tenantId?: string
): Promise<{ data: FastItem[]; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: 'لم يتم تكوين متغيرات بيئة Supabase.' };
  }

  const resolvedTenantId = tenantId ?? getCurrentActiveTenantId() ?? undefined;
  const [prodRes, stockRes] = await Promise.all([
    fetchProductsFromSupabase(resolvedTenantId),
    fetchStockFromSupabase(resolvedTenantId),
  ]);

  const products = prodRes.data || [];
  const stocks = stockRes.data || [];
  const matchedProductIds = new Set<string>();

  const combined: FastItem[] = stocks.map((stk) => {
    let linkedProd: FastItem | undefined;

    if (stk.product_pk) {
      linkedProd = products.find(
        (p) => p.id === stk.product_pk || p.product_pk === stk.product_pk
      );
    }

    // Fallback match by exact name for finished goods if product_fk was missing
    if (!linkedProd && stk.inventoryType !== 'raw_material') {
      const stkNameNorm = stk.name.trim().toLowerCase();
      linkedProd = products.find(
        (p) => !matchedProductIds.has(p.id) && p.name.trim().toLowerCase() === stkNameNorm
      );
    }

    if (linkedProd) {
      matchedProductIds.add(linkedProd.id);
      return {
        ...linkedProd,
        stockQuantity: stk.stockQuantity,
        minStock: stk.minStock,
        maxStock: stk.maxStock,
        amount: stk.amount,
        stock_pk: stk.stock_pk,
        imageUrl: linkedProd.imageUrl || stk.imageUrl,
      };
    }

    return stk;
  });

  products.forEach((p) => {
    const alreadyAdded =
      matchedProductIds.has(p.id) ||
      combined.some((c) => c.id === p.id || (p.product_pk && c.product_pk === p.product_pk));
    if (!alreadyAdded) {
      combined.push(p);
    }
  });

  return {
    data: combined,
    error: prodRes.error || stockRes.error || null,
  };
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

    const resolvedTenantId = params.tenant_id ?? getCurrentActiveTenantId();
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
    if (resolvedTenantId) {
      cleanPayload.tenant_id = resolvedTenantId;
    }

    const { data, error } = await supabase
      .from('stock')
      .insert([cleanPayload])
      .select();

    if (error) {
      console.error('❌ Supabase Error in stock:', error.message, error.details);
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
  isProductFk: boolean = false,
  options?: UpdateStockOptions
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const cost = parseFloat(stockCost as any) || 0;
    const qty = Math.max(0, parseFloat(newQuantity as any) || 0);
    const calcAmount = cost * qty;

    const updatePayload = {
      quantity: qty,
      amount: calcAmount,
      Stock_Cost: cost,
    };

    const resolvedStockPk = options?.stockPk || (!isProductFk ? identifier : undefined);
    const resolvedProductFk = options?.productFk || (isProductFk ? identifier : undefined);

    let updatedCount = 0;

    // 1. Prefer matching directly by stock_pk when available
    if (resolvedStockPk) {
      const { data, error } = await supabase
        .from('stock')
        .update(updatePayload)
        .eq('stock_pk', resolvedStockPk)
        .select('stock_pk');

      if (error) return { success: false, error: error.message };
      updatedCount = data?.length ?? 0;
    }

    // 2. Fallback to matching by product_fk if stock_pk wasn't provided or matched 0 rows
    if (updatedCount === 0 && resolvedProductFk) {
      const { data, error } = await supabase
        .from('stock')
        .update(updatePayload)
        .eq('product_fk', resolvedProductFk)
        .select('stock_pk');

      if (error) return { success: false, error: error.message };
      updatedCount = data?.length ?? 0;
    }

    // 3. Fallback if neither matched 1+ rows: insert missing stock row so DB stays authoritative
    if (updatedCount === 0 && options?.itemName) {
      const insertRes = await addStockToSupabase({
        stock_name: options.itemName,
        stock_type: options.isRawMaterial ? 'Raw material' : 'Stocked Product',
        minimum_limit: options.minStock ?? 10,
        maximum_limit: options.maxStock ?? 200,
        quantity: qty,
        stock_cost: cost,
        stock_code: options.code,
        measure_stype: options.unit || 'قطعة',
        product_fk: resolvedProductFk,
        tenant_id: options.tenantId,
      });

      if (!insertRes.success) {
        return { success: false, error: insertRes.error };
      }
    }

    // SYNC: Update products table unit_cost if linked to a finished good
    if (resolvedProductFk) {
      const { error: prodError } = await supabase
        .from('products')
        .update({ unit_cost: cost })
        .eq('product_pk', resolvedProductFk);

      if (prodError) {
        console.warn('⚠️ Warning: Stock updated but product unit_cost failed to sync:', prodError.message);
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

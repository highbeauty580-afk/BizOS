import { supabase, isSupabaseConfigured } from './supabase';
import { FastItem } from '../types';

/**
 * Dedicated Supabase Product Service for BizOS
 * Target Table: public.products
 * Columns:
 * - product_name: string (Required)
 * - product_type: string (Required - category)
 * - product_description: string | null (Optional)
 * - unit_cost: numeric (Required - wholesale unit cost)
 * - unit_price: numeric (Required - retail unit price)
 * - product_code: string | null (Optional - code)
 */

export interface AddProductParams {
  product_name: string;
  product_type: string;
  product_description?: string;
  unit_cost: number;
  unit_price: number;
  product_code?: string;
  measure_ptype?: string;
}

export async function fetchProductsFromSupabase(): Promise<{ data: FastItem[]; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: 'لم يتم تكوين متغيرات بيئة Supabase.' };
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase fetch products error:', error.message, error.details);
      return { data: [], error: error.message };
    }

    const mappedProducts: FastItem[] = (data || []).map((row: any) => ({
      id: row.product_pk || row.id || `prd-${Date.now()}`,
      name: row.product_name || 'منتج بدون اسم',
      nameAr: row.product_name || undefined,
      category: row.product_type || 'Retail',
      inventoryType: 'finished_goods',
      price: parseFloat(row.unit_price) || 0,
      costPrice: parseFloat(row.unit_cost) || 0,
      code: row.product_code || row.code || undefined,
      description: row.product_description || undefined,
      unit: row.Measure_PType || row.unit || 'قطعة',
      product_pk: row.product_pk,
      stockQuantity: 0, // Stock qty comes from stock table, this is just a placeholder or list view
      minStock: 10,
      maxStock: 100,
    }));

    return { data: mappedProducts, error: null };
  } catch (err: any) {
    console.error('❌ Exception in fetchProductsFromSupabase:', err);
    return { data: [], error: err?.message || 'حدث خطأ أثناء جلب قائمة المنتجات' };
  }
}

export async function addProductToSupabase(
  params: AddProductParams
): Promise<{ success: boolean; data?: FastItem; error?: string }> {
  console.log('1. Starting product save process with params:', params);

  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase Config Error' };
  }

  try {
    const cleanPayload = {
      product_name: params.product_name.trim(),
      product_type: params.product_type.trim() || 'Retail',
      product_description: params.product_description?.trim() || null,
      unit_cost: parseFloat(params.unit_cost as any) || 0,
      unit_price: parseFloat(params.unit_price as any) || 0,
      product_code: params.product_code?.trim() || null,
      Measure_PType: params.measure_ptype?.trim() || 'قطعة',
    };

    console.log('2. Sending Clean Payload to public.products:', cleanPayload);

    const { data, error } = await supabase
      .from('products')
      .insert([cleanPayload])
      .select();

    if (error) {
      console.error(`❌ Supabase Error in products:`, error.message, error.details);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'لم يتم حفظ البيانات، يرجى مراجعة المدخلات.' };
    }

    const createdRow = data[0];
    const createdProduct: FastItem = {
      id: createdRow.product_pk || createdRow.id || `prd-${Date.now()}`,
      name: createdRow.product_name || cleanPayload.product_name,
      nameAr: createdRow.product_name || cleanPayload.product_name,
      category: createdRow.product_type || cleanPayload.product_type,
      inventoryType: 'finished_goods',
      price: parseFloat(createdRow.unit_price ?? cleanPayload.unit_price),
      costPrice: parseFloat(createdRow.unit_cost ?? cleanPayload.unit_cost),
      code: createdRow.product_code || cleanPayload.product_code || undefined,
      description: createdRow.product_description || cleanPayload.product_description || undefined,
      unit: createdRow.Measure_PType || cleanPayload.Measure_PType,
      product_pk: createdRow.product_pk,
      stockQuantity: 0,
      minStock: 10,
      maxStock: 200,
    };

    return { success: true, data: createdProduct };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function deleteProductFromSupabase(
  productPk: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('product_pk', productPk);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
export async function updateProductInSupabase(
  productPk: string,
  updates: Partial<AddProductParams>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const cleanPayload: any = {};
    if (updates.product_name) cleanPayload.product_name = updates.product_name.trim();
    if (updates.product_type) cleanPayload.product_type = updates.product_type.trim();
    if (updates.product_description !== undefined) cleanPayload.product_description = updates.product_description?.trim() || null;
    if (updates.unit_cost !== undefined) cleanPayload.unit_cost = parseFloat(updates.unit_cost as any) || 0;
    if (updates.unit_price !== undefined) cleanPayload.unit_price = parseFloat(updates.unit_price as any) || 0;
    if (updates.product_code !== undefined) cleanPayload.product_code = updates.product_code?.trim() || null;
    if (updates.measure_ptype) cleanPayload.Measure_PType = updates.measure_ptype.trim();

    const { error } = await supabase
      .from('products')
      .update(cleanPayload)
      .eq('product_pk', productPk);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

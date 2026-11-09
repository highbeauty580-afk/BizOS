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
      stockQuantity: Number(row.stock_quantity ?? 50),
      minStock: Number(row.minimum_limit ?? row.min_stock ?? 10),
      maxStock: Number(row.maximum_limit ?? row.max_stock ?? 200),
      unit: row.unit || 'قطعة',
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
    const msg = 'لم يتم تكوين متغيرات الاتصال بـ Supabase (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY غير معرفة).';
    console.error('❌ Supabase Config Error:', msg);
    return { success: false, error: msg };
  }

  try {
    // Clean Payload Standards:
    // - No tenant_id unless in state
    // - No empty strings; send null or omit
    // - Parse numbers correctly
    const cleanPayload = {
      product_name: params.product_name.trim(),
      product_type: params.product_type.trim() || 'Retail',
      product_description: params.product_description?.trim() || null,
      unit_cost: parseFloat(params.unit_cost as any) || 0,
      unit_price: parseFloat(params.unit_price as any) || 0,
      product_code: params.product_code?.trim() || null,
    };

    console.log('2. Sending Clean Payload to public.products:', cleanPayload);

    const { data, error } = await supabase
      .from('products')
      .insert([cleanPayload])
      .select();

    if (error) {
      console.error(`❌ Supabase Error in products:`, error.message, error.details);
      return {
        success: false,
        error: `خطأ في السيرفر: ${error.message}${error.details ? ` - ${error.details}` : ''}`,
      };
    }

    if (!data || data.length === 0) {
      console.error('❌ Supabase Error in products: No rows returned.');
      return { success: false, error: 'لم يتم حفظ البيانات، يرجى مراجعة المدخلات.' };
    }

    console.log(`✅ Success in products:`, data);

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
      stockQuantity: Number(createdRow.stock_quantity ?? 50),
      minStock: 10,
      maxStock: 200,
      unit: 'قطعة',
    };

    return { success: true, data: createdProduct };
  } catch (err: any) {
    console.error('❌ Exception in addProductToSupabase:', err);
    return { success: false, error: err?.message || 'حدث خطأ غير متوقع أثناء الاتصال بـ Supabase' };
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

    if (error) {
      console.error('❌ Failed to delete product from Supabase:', error.message, error.details);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

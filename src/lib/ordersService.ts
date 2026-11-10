import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Dedicated Supabase Orders Service for BizOS
 * Target Table: public.orders
 * Schema:
 * - Customer_Name: string (Required)
 * - Customer_Phone1: string (Optional / Required)
 * - Customer_Phone2: string | null (Optional)
 * - Customer_Address: string | null (Optional)
 * - total_price: numeric (Required)
 * - payment_method: string (Required)
 * - delivery_status: string (Required - e.g. 'فى انتظار انتهاء التحضير' | 'فى الشحن' | 'تم التوصيل')
 * - Preparing_Status: string (Required - e.g. 'تم البدء فيه' | 'جاري العمل عليه' | 'تم الانتهاء من تحضيره')
 * - order_status: string (Required - e.g. 'يتم تحضيره' | 'يتم توصيله' | 'تم توصيله' | 'مرتجع')
 */

export interface AddOrderParams {
  customerName: string;
  customerPhone1?: string;
  customerPhone2?: string;
  customerAddress?: string;
  totalPrice: number;
  paymentMethod: string;
  deliveryStatus?: string;
  preparingStatus?: string;
  orderStatus?: string;
}

export interface OrderRecord {
  id: string | number;
  orderPk?: string | number;
  customerName: string;
  customerPhone1: string;
  customerPhone2?: string;
  customerAddress?: string;
  totalPrice: number;
  paymentMethod: string;
  deliveryStatus: string;
  preparingStatus: string;
  orderStatus: string;
  createdAt?: string;
  raw?: any;
}

export const DEFAULT_DELIVERY_STATUS = 'فى انتظار انتهاء التحضير';
export const DEFAULT_PREPARING_STATUS = 'تم البدء فيه';
export const DEFAULT_ORDER_STATUS = 'يتم تحضيره';

export const DELIVERY_STATUS_OPTIONS = [
  'فى انتظار انتهاء التحضير',
  'فى الشحن',
  'تم التوصيل',
];

export const PREPARING_STATUS_OPTIONS = [
  'تم البدء فيه',
  'جاري العمل عليه',
  'تم الانتهاء من تحضيره',
];

export const ORDER_STATUS_OPTIONS = [
  'يتم تحضيره',
  'يتم توصيله',
  'تم توصيله',
  'مرتجع',
];

export async function addOrderToSupabase(
  params: AddOrderParams
): Promise<{ success: boolean; data?: OrderRecord; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase Config Error: Not configured' };
  }

  const deliveryStatus = params.deliveryStatus || DEFAULT_DELIVERY_STATUS;
  const preparingStatus = params.preparingStatus || DEFAULT_PREPARING_STATUS;
  const orderStatus = params.orderStatus || DEFAULT_ORDER_STATUS;

  // Exact casing payload according to database instructions
  const exactPayload: Record<string, any> = {
    Customer_Name: params.customerName.trim(),
    Customer_Phone1: (params.customerPhone1 || '').trim(),
    Customer_Phone2: params.customerPhone2 ? params.customerPhone2.trim() : null,
    Customer_Address: params.customerAddress ? params.customerAddress.trim() : null,
    total_price: parseFloat(params.totalPrice as any) || 0,
    payment_method: params.paymentMethod,
    delivery_status: deliveryStatus,
    Preparing_Status: preparingStatus,
    order_status: orderStatus,
  };

  try {
    let { data, error } = await supabase
      .from('orders')
      .insert([exactPayload])
      .select();

    // Fallback if Postgres table uses lowercase column identifiers
    if (error) {
      console.warn('⚠️ Supabase orders exact insert warning, retrying with lowercase columns:', error.message);
      const lowerPayload: Record<string, any> = {
        customer_name: params.customerName.trim(),
        customer_phone1: (params.customerPhone1 || '').trim(),
        customer_phone2: params.customerPhone2 ? params.customerPhone2.trim() : null,
        customer_address: params.customerAddress ? params.customerAddress.trim() : null,
        total_price: parseFloat(params.totalPrice as any) || 0,
        payment_method: params.paymentMethod,
        delivery_status: deliveryStatus,
        preparing_status: preparingStatus,
        order_status: orderStatus,
      };

      const retryRes = await supabase
        .from('orders')
        .insert([lowerPayload])
        .select();

      data = retryRes.data;
      error = retryRes.error;
    }

    if (error) {
      console.error('❌ Supabase error inserting order:', error.message, error.details);
      return { success: false, error: error.message };
    }

    const row = data && data[0] ? data[0] : null;
    if (!row) {
      return { success: false, error: 'لم يتم استرجاع معرف الطلب بعد الحفظ' };
    }

    const orderPkVal = row.order_pk ?? row.orders_pk ?? row.id ?? row.order_id;
    const orderId = orderPkVal || `ord-${Date.now()}`;
    const createdOrder: OrderRecord = {
      id: orderId,
      orderPk: orderPkVal,
      customerName: row.Customer_Name || row.customer_name || exactPayload.Customer_Name,
      customerPhone1: row.Customer_Phone1 || row.customer_phone1 || exactPayload.Customer_Phone1,
      customerPhone2: row.Customer_Phone2 || row.customer_phone2 || undefined,
      customerAddress: row.Customer_Address || row.customer_address || undefined,
      totalPrice: parseFloat(row.total_price || exactPayload.total_price),
      paymentMethod: row.payment_method || exactPayload.payment_method,
      deliveryStatus: row.delivery_status || exactPayload.delivery_status,
      preparingStatus: row.Preparing_Status || row.preparing_status || exactPayload.Preparing_Status,
      orderStatus: row.order_status || exactPayload.order_status,
      createdAt: row.created_at || new Date().toISOString(),
      raw: row,
    };

    return { success: true, data: createdOrder };
  } catch (err: any) {
    console.error('❌ Exception in addOrderToSupabase:', err);
    return { success: false, error: err?.message || 'Error saving order to Supabase' };
  }
}

export async function fetchOrdersFromSupabase(): Promise<{ data: OrderRecord[]; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: 'Supabase Config Error' };
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // In case created_at column doesn't exist, try un-ordered
      const retry = await supabase.from('orders').select('*');
      if (retry.error) {
        console.error('❌ Supabase fetch orders error:', retry.error.message);
        return { data: [], error: retry.error.message };
      }
      return { data: (retry.data || []).map(mapOrderRow), error: null };
    }

    return { data: (data || []).map(mapOrderRow), error: null };
  } catch (err: any) {
    console.error('❌ Exception in fetchOrdersFromSupabase:', err);
    return { data: [], error: err?.message || 'Error fetching orders' };
  }
}

function mapOrderRow(row: any): OrderRecord {
  const orderPkVal = row.order_pk ?? row.orders_pk ?? row.id ?? row.order_id;
  const orderId = orderPkVal || `ord-${Date.now()}`;
  return {
    id: orderId,
    orderPk: orderPkVal,
    customerName: row.Customer_Name || row.customer_name || 'عميل نقدي',
    customerPhone1: row.Customer_Phone1 || row.customer_phone1 || row.customer_phone_1 || '',
    customerPhone2: row.Customer_Phone2 || row.customer_phone2 || row.customer_phone_2 || undefined,
    customerAddress: row.Customer_Address || row.customer_address || undefined,
    totalPrice: parseFloat(row.total_price || row.totalPrice || 0) || 0,
    paymentMethod: row.payment_method || row.paymentMethod || 'Cash',
    deliveryStatus: row.delivery_status || row.deliverystatus || DEFAULT_DELIVERY_STATUS,
    preparingStatus: row.Preparing_Status || row.preparing_status || DEFAULT_PREPARING_STATUS,
    orderStatus: row.order_status || row.orderstatus || DEFAULT_ORDER_STATUS,
    createdAt: row.created_at || undefined,
    raw: row,
  };
}

export async function updateOrderStatusInSupabase(
  orderId: string | number,
  updates: Partial<{
    deliveryStatus: string;
    preparingStatus: string;
    orderStatus: string;
  }>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }

  const exactUpdates: Record<string, any> = {};
  const lowerUpdates: Record<string, any> = {};

  if (updates.deliveryStatus !== undefined) {
    exactUpdates.delivery_status = updates.deliveryStatus;
    lowerUpdates.delivery_status = updates.deliveryStatus;
  }
  if (updates.preparingStatus !== undefined) {
    exactUpdates.Preparing_Status = updates.preparingStatus;
    lowerUpdates.preparing_status = updates.preparingStatus;
  }
  if (updates.orderStatus !== undefined) {
    exactUpdates.order_status = updates.orderStatus;
    lowerUpdates.order_status = updates.orderStatus;
  }

  // Helper to run update against a given column
  const runUpdate = async (idCol: string, payload: Record<string, any>) => {
    return await supabase
      .from('orders')
      .update(payload)
      .eq(idCol, orderId);
  };

  try {
    // Try primary key columns: id, order_pk, orders_pk, order_id
    let res = await runUpdate('id', exactUpdates);
    if (res.error) res = await runUpdate('order_pk', exactUpdates);
    if (res.error) res = await runUpdate('orders_pk', exactUpdates);
    if (res.error) res = await runUpdate('order_id', exactUpdates);

    // If still error, retry with lowercase columns
    if (res.error) {
      res = await runUpdate('id', lowerUpdates);
      if (res.error) res = await runUpdate('order_pk', lowerUpdates);
      if (res.error) res = await runUpdate('orders_pk', lowerUpdates);
      if (res.error) res = await runUpdate('order_id', lowerUpdates);
    }

    if (res.error) {
      console.error('❌ Failed to update order status in Supabase:', res.error);
      return { success: false, error: res.error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ Exception in updateOrderStatusInSupabase:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * ------------------------------------------------------------------
 * DEDICATED SUPABASE ORDER ITEMS SERVICE
 * Target Table: public.order_items
 * Schema:
 * - order_fk: references orders(order_pk)
 * - Item_Name: string (اسم المنتج المختار)
 * - unit_price: numeric (سعر القطعة للمستهلك)
 * - quantity_items: numeric / integer (الكمية المطلوبة)
 * - total_item_price: numeric (حاصل ضرب الكمية في سعر القطعة)
 * ------------------------------------------------------------------
 */

export interface OrderItemRecord {
  id?: string | number;
  order_fk: string | number;
  Item_Name: string;
  unit_price: number;
  quantity_items: number;
  total_item_price: number;
  raw?: any;
}

export interface AddOrderItemInput {
  orderFk: string | number;
  itemName: string;
  unitPrice: number;
  quantityItems: number;
  totalItemPrice: number;
}

export async function addOrderItemsToSupabase(
  items: AddOrderItemInput[]
): Promise<{ success: boolean; data?: OrderItemRecord[]; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase Config Error: Not configured' };
  }
  if (!items || items.length === 0) {
    return { success: true, data: [] };
  }

  // Exact payload as specified by user instructions:
  // Item_Name, unit_price, quantity_items, total_item_price, order_fk
  const exactRows = items.map((it) => ({
    order_fk: it.orderFk,
    Item_Name: it.itemName.trim(),
    unit_price: parseFloat(it.unitPrice as any) || 0,
    quantity_items: parseInt(it.quantityItems as any, 10) || 1,
    total_item_price: parseFloat(it.totalItemPrice as any) || 0,
  }));

  try {
    let { data, error } = await supabase
      .from('order_items')
      .insert(exactRows)
      .select();

    // Fallback 1: lowercase column names if Postgres table created without quotes
    if (error) {
      console.warn('⚠️ Supabase order_items exact insert warning, retrying with lowercase columns:', error.message);
      const lowerRows = items.map((it) => ({
        order_fk: it.orderFk,
        item_name: it.itemName.trim(),
        unit_price: parseFloat(it.unitPrice as any) || 0,
        quantity_items: parseInt(it.quantityItems as any, 10) || 1,
        total_item_price: parseFloat(it.totalItemPrice as any) || 0,
      }));

      const retryRes = await supabase
        .from('order_items')
        .insert(lowerRows)
        .select();

      data = retryRes.data;
      error = retryRes.error;
    }

    // Fallback 2: if foreign key column is named order_id
    if (error && (error.message.includes('order_fk') || error.message.includes('column'))) {
      console.warn('⚠️ Supabase order_items retrying with order_id column:', error.message);
      const altRows = items.map((it) => ({
        order_id: it.orderFk,
        item_name: it.itemName.trim(),
        unit_price: parseFloat(it.unitPrice as any) || 0,
        quantity_items: parseInt(it.quantityItems as any, 10) || 1,
        total_item_price: parseFloat(it.totalItemPrice as any) || 0,
      }));

      const retryRes2 = await supabase
        .from('order_items')
        .insert(altRows)
        .select();

      data = retryRes2.data;
      error = retryRes2.error;
    }

    if (error) {
      console.error('❌ Supabase error inserting order_items:', error.message, error.details);
      return { success: false, error: error.message };
    }

    const mapped = (data || []).map(mapOrderItemRow);
    return { success: true, data: mapped };
  } catch (err: any) {
    console.error('❌ Exception in addOrderItemsToSupabase:', err);
    return { success: false, error: err?.message || 'Error inserting order items' };
  }
}

export async function fetchOrderItemsFromSupabase(
  orderFk?: string | number
): Promise<{ data: OrderItemRecord[]; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: 'Supabase Config Error' };
  }

  try {
    let query = supabase.from('order_items').select('*');
    if (orderFk !== undefined) {
      query = query.eq('order_fk', orderFk);
    }
    const { data, error } = await query;
    if (error) {
      if (orderFk !== undefined) {
        const retry = await supabase.from('order_items').select('*').eq('order_id', orderFk);
        if (!retry.error) {
          return { data: (retry.data || []).map(mapOrderItemRow), error: null };
        }
      }
      console.warn('⚠️ Supabase fetch order_items warning:', error.message);
      return { data: [], error: error.message };
    }
    return { data: (data || []).map(mapOrderItemRow), error: null };
  } catch (err: any) {
    console.error('❌ Exception in fetchOrderItemsFromSupabase:', err);
    return { data: [], error: err?.message || 'Error fetching order items' };
  }
}

export function mapOrderItemRow(row: any): OrderItemRecord {
  return {
    id: row.id || row.item_id || row.order_item_pk,
    order_fk: row.order_fk ?? row.order_id ?? row.orderFk,
    Item_Name: row.Item_Name || row.item_name || row.itemName || 'منتج',
    unit_price: parseFloat(row.unit_price || row.unitPrice || 0) || 0,
    quantity_items: parseInt(row.quantity_items || row.quantity || row.quantityItems || 1, 10) || 1,
    total_item_price: parseFloat(row.total_item_price || row.totalItemPrice || 0) || 0,
    raw: row,
  };
}

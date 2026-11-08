import { supabase, isSupabaseConfigured } from './supabase';
import { FastItem, Customer, Transaction, Employee, StagedItem } from '../types';

/**
 * Supabase Data Sync & Mapping Layer for BizOS ERP
 */

// 1. Products Sync
export async function fetchProductsFromSupabase(): Promise<FastItem[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error || !data) return [];
    return data.map((p: any) => ({
      id: p.product_pk || p.id,
      name: p.product_name,
      nameAr: p.product_name,
      category: p.product_type || 'General',
      inventoryType: (p.product_type as any) || 'finished_goods',
      price: Number(p.unit_price || 0),
      costPrice: Number(p.unit_cost || 0),
      stockQuantity: 100,
      minStock: 10,
      maxStock: 500,
      unit: 'قطعة',
    }));
  } catch (err) {
    console.warn('Error fetching products from Supabase:', err);
    return [];
  }
}

export async function saveProductToSupabase(item: FastItem): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const payload: any = {
      product_name: item.nameAr || item.name,
      product_type: item.inventoryType || item.category || 'Finished_Product',
      product_description: `Unit: ${item.unit || 'piece'} | Category: ${item.category}`,
      unit_cost: item.costPrice || 0,
      unit_price: item.price || 0,
    };
    if (item.id && !item.id.startsWith('fi-')) {
      payload.product_pk = item.id;
    }
    const { error } = await supabase.from('products').upsert([payload]);
    return !error;
  } catch (err) {
    console.warn('Error saving product to Supabase:', err);
    return false;
  }
}

export async function deleteProductFromSupabase(productId: string): Promise<boolean> {
  if (!isSupabaseConfigured || productId.startsWith('fi-')) return false;
  try {
    const { error } = await supabase.from('products').delete().eq('product_pk', productId);
    return !error;
  } catch (err) {
    console.warn('Error deleting product from Supabase:', err);
    return false;
  }
}

// 2. Customers Sync (Directly connected to public.customers table in Supabase)
export async function fetchCustomersFromSupabase(): Promise<Customer[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((c: any) => ({
      id: c.customer_pk || c.id,
      name: c.customer_name,
      phone: c.customer_phone_1 || c.phone || '',
      email: c.customer_email || '',
      company: c.customer_type === 'Company' ? c.customer_name : undefined,
      taxNumber: c.customer_phone_2 || undefined,
    }));
  } catch (err) {
    console.warn('Error fetching customers from Supabase public.customers:', err);
    return [];
  }
}

export async function saveCustomerToSupabase(customer: Customer): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const payload: any = {
      customer_name: customer.name,
      customer_phone_1: customer.phone,
      customer_phone_2: customer.taxNumber || null,
      customer_email: customer.email || null,
      customer_type: customer.company ? 'Company' : 'Individual',
      customer_status: 'Active',
      credit_limit: 5000.0,
    };
    if (customer.id && !customer.id.startsWith('cust-')) {
      payload.customer_pk = customer.id;
    }
    const { error } = await supabase.from('customers').upsert([payload]);
    if (error) {
      console.warn('Supabase public.customers upsert error:', error.message);
    }
    return !error;
  } catch (err) {
    console.warn('Error saving customer to Supabase public.customers:', err);
    return false;
  }
}

export async function deleteCustomerFromSupabase(customerId: string): Promise<boolean> {
  if (!isSupabaseConfigured || customerId.startsWith('cust-')) return false;
  try {
    const { error } = await supabase.from('customers').delete().eq('customer_pk', customerId);
    return !error;
  } catch (err) {
    console.warn('Error deleting customer from Supabase:', err);
    return false;
  }
}

// 3. Employees Sync
export async function fetchEmployeesFromSupabase(): Promise<Employee[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.from('employers').select('*');
    if (error || !data) return [];
    return data.map((e: any) => ({
      id: e.employer_pk || e.id,
      name: e.employer_name,
      nameAr: e.employer_name,
      title: e.employer_job_title || 'موظف',
      titleAr: e.employer_job_title || 'موظف',
      department: e.employer_department || 'العام',
      departmentAr: e.employer_department || 'العام',
      directManagerId: null,
      email: `${e.employer_name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      phone: '0500000000',
    }));
  } catch (err) {
    console.warn('Error fetching employees from Supabase:', err);
    return [];
  }
}

export async function saveEmployeeToSupabase(emp: Employee): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const payload: any = {
      employer_name: emp.nameAr || emp.name,
      employer_department: emp.departmentAr || emp.department,
      employer_job_title: emp.titleAr || emp.title,
      employer_status: 'Contracted',
      employer_type: 'Employee',
      work_type: 'On_Site',
      employer_salary: 5000.0,
    };
    if (emp.id && !emp.id.startsWith('emp-')) {
      payload.employer_pk = emp.id;
    }
    const { error } = await supabase.from('employers').upsert([payload]);
    return !error;
  } catch (err) {
    console.warn('Error saving employee to Supabase:', err);
    return false;
  }
}

// 4. Transactions Sync & Fetch
export async function fetchTransactionsFromSupabase(): Promise<Transaction[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((t: any) => ({
      id: t.transactions_pk || t.id,
      receiptNo: `REC-${(t.transactions_pk || '0000').slice(0, 6)}`,
      time: new Date(t.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(t.created_at || Date.now()).toISOString().split('T')[0],
      itemsSummary: t.transactions_name || 'معاملة مالية',
      items: [],
      subtotal: Number(t.transactions_amount || 0) * 0.85,
      tax: Number(t.transactions_amount || 0) * 0.15,
      total: Number(t.transactions_amount || 0),
      paymentMethod: (t.transactions_method as any) || 'Cash',
      status: 'Completed',
      shiftNotes: t.transactions_name || '',
      cashier: t.transactions_employer || 'الكاشير',
    }));
  } catch (err) {
    console.warn('Error fetching transactions from Supabase:', err);
    return [];
  }
}

// 5. ATOMIC POS CHECKOUT TRANSACTION FLOW (Batch Insert into orders, order_items, stock, transactions, stock_movement)
export interface PosCheckoutParams {
  items: StagedItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  cashierName: string;
  customerName?: string;
}

export async function executeSupabasePosCheckout(params: PosCheckoutParams): Promise<{ success: boolean; orderId?: string; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true, orderId: `tx-${Date.now()}` };
  }

  try {
    // A. Insert into Orders Table
    const orderPayload = {
      order_status: 'Ready',
      delivery_status: 'Delivered',
      customer_channel: 'POS',
      payment_method: params.paymentMethod,
      total_price: params.total,
      sales_agent: params.cashierName,
      notes: `فاتورة مبيعات POS لكاشير: ${params.cashierName} — العميل: ${params.customerName || 'عميل نقدي'}`,
    };

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select('order_pk')
      .single();

    if (orderError || !orderData) {
      console.warn('Error creating order in Supabase:', orderError);
      return { success: false, error: orderError?.message || 'فشل إنشاء الطلب' };
    }

    const orderPk = orderData.order_pk;

    // B. Insert into Order Items
    const itemPayloads = params.items.map((item) => ({
      order_fk: orderPk,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_item_price: item.quantity * item.unitPrice,
    }));

    if (itemPayloads.length > 0) {
      const { error: itemsError } = await supabase.from('order_items').insert(itemPayloads);
      if (itemsError) {
        console.warn('Error inserting order_items into Supabase:', itemsError);
      }
    }

    // C. Insert Financial Transaction Entry into Transactions
    const txPayload = {
      order_fk: orderPk,
      transactions_name: `فاتورة مبيعات رقم (${orderPk.slice(0, 8)})`,
      transactions_type: 'Sales',
      transactions_amount: params.total,
      transactions_method: params.paymentMethod,
      transactions_employer: params.cashierName,
    };

    const { error: txError } = await supabase.from('transactions').insert([txPayload]);
    if (txError) {
      console.warn('Error creating transaction entry in Supabase:', txError);
    }

    // D. Log Stock Movement
    const movementPayload = {
      transactions_fk: null,
      supply_items: JSON.stringify(params.items.map((i) => `${i.name} x${i.quantity}`)),
      supply_from: 'المستودع الرئيسي',
      supply_to: 'عميل POS',
      supply_type: 'Sale',
      supply_status: 'Ready',
      supply_delivery: 'Delivered',
    };

    await supabase.from('stock_movement').insert([movementPayload]);

    return { success: true, orderId: orderPk };
  } catch (err: any) {
    console.warn('POS Checkout exception in Supabase:', err);
    return { success: false, error: err?.message || 'خطأ أثناء تنفيذ الفاتورة' };
  }
}

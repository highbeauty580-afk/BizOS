import { supabase, isSupabaseConfigured } from './supabase';
import { FastItem, Customer, Transaction, Employee } from '../types';

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
    const payload = {
      product_name: item.nameAr || item.name,
      product_type: item.inventoryType || item.category || 'Finished_Product',
      product_description: `Unit: ${item.unit || 'piece'} | Category: ${item.category}`,
      unit_cost: item.costPrice || 0,
      unit_price: item.price || 0,
    };
    const { error } = await supabase.from('products').upsert([payload]);
    return !error;
  } catch (err) {
    console.warn('Error saving product to Supabase:', err);
    return false;
  }
}

// 2. Customers Sync
export async function fetchCustomersFromSupabase(): Promise<Customer[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.from('customers').select('*');
    if (error || !data) return [];
    return data.map((c: any) => ({
      id: c.customer_pk || c.id,
      name: c.customer_name,
      phone: c.customer_phone_1,
      email: c.customer_email || '',
      company: c.customer_type === 'Company' ? c.customer_name : undefined,
    }));
  } catch (err) {
    console.warn('Error fetching customers from Supabase:', err);
    return [];
  }
}

export async function saveCustomerToSupabase(customer: Customer): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const payload = {
      customer_name: customer.name,
      customer_phone_1: customer.phone,
      customer_email: customer.email || null,
      customer_type: customer.company ? 'Company' : 'Individual',
      customer_status: 'Active',
      credit_limit: 5000.0,
    };
    const { error } = await supabase.from('customers').upsert([payload]);
    return !error;
  } catch (err) {
    console.warn('Error saving customer to Supabase:', err);
    return false;
  }
}

// 3. Transactions Sync
export async function saveTransactionToSupabase(tx: Transaction): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const payload = {
      transactions_name: `فاتورة مبيعات ${tx.receiptNo}`,
      transactions_type: 'Sales',
      transactions_amount: tx.total,
      transactions_method: tx.paymentMethod,
      transactions_employer: tx.cashier,
    };
    const { error } = await supabase.from('transactions').insert([payload]);
    return !error;
  } catch (err) {
    console.warn('Error saving transaction to Supabase:', err);
    return false;
  }
}

// 4. Employees Sync
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
    const payload = {
      employer_name: emp.nameAr || emp.name,
      employer_department: emp.departmentAr || emp.department,
      employer_job_title: emp.titleAr || emp.title,
      employer_status: 'Contracted',
      employer_type: 'Employee',
      work_type: 'On_Site',
      employer_salary: 5000.0,
    };
    const { error } = await supabase.from('employers').upsert([payload]);
    return !error;
  } catch (err) {
    console.warn('Error saving employee to Supabase:', err);
    return false;
  }
}

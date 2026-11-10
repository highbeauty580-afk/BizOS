import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Expense, ExpensePaymentMethod } from '../types';
import { addFinancialTransactionToSupabase } from '../lib/transactionsService';

export const ExpensesManager: React.FC = () => {
  const {
    language,
    themeConfig,
    customPalette,
    expenses,
    expenseCategories,
    addExpense,
    updateExpense,
    deleteExpense,
    settleExpense,
    addExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
  } = useApp();

  const isRtl = language === 'ar';

  // Modals state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Active selections
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Expense Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(expenseCategories[0]?.nameAr || 'مصروفات أخرى');
  const [expenseDate, setExpenseDate] = useState(todayStr);
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>('Cash');
  const [notes, setNotes] = useState('');
  const [paymentNotice, setPaymentNotice] = useState('');

  // New Category Inline Form
  const [newCatNameAr, setNewCatNameAr] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatNameAr, setEditingCatNameAr] = useState('');

  // Settlement Form
  const [settleMethod, setSettleMethod] = useState<'Cash' | 'E_Wallet' | 'Bank'>('Cash');

  // Table Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all'); // 'all' | 'today' | 'month'

  // Calculations for KPIs
  const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM

  const todayExpenses = expenses.filter((e) => e.date === todayStr);
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const monthExpenses = expenses.filter((e) => e.date.startsWith(currentMonthPrefix));
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const totalExpenseCount = expenses.length;
  const unpaidCreditCount = expenses.filter((e) => e.status === 'Unpaid').length;
  const unpaidCreditTotal = expenses
    .filter((e) => e.status === 'Unpaid')
    .reduce((sum, e) => sum + e.amount, 0);

  // Balance impacts
  const cashPaidTotal = expenses
    .filter((e) => (e.status === 'Paid' && (e.paymentMethod === 'Cash' || e.settledPaymentMethod === 'Cash')))
    .reduce((sum, e) => sum + e.amount, 0);

  const electronicPaidTotal = expenses
    .filter((e) => (e.status === 'Paid' && (['E_Wallet', 'Bank'].includes(e.paymentMethod) || ['E_Wallet', 'Bank'].includes(e.settledPaymentMethod as any))))
    .reduce((sum, e) => sum + e.amount, 0);

  // Filtered Expenses for table
  const filteredExpenses = expenses.filter((exp) => {
    // Search
    const searchLower = searchTerm.trim().toLowerCase();
    const matchSearch =
      !searchTerm.trim() ||
      exp.receiptNo.toLowerCase().includes(searchLower) ||
      exp.category.toLowerCase().includes(searchLower) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchLower));

    // Category filter
    const matchCat = filterCategory === 'all' || exp.category === filterCategory;

    // Method filter
    const matchMethod = filterMethod === 'all' || exp.paymentMethod === filterMethod;

    // Status filter
    const matchStatus = filterStatus === 'all' || exp.status === filterStatus;

    // Date filter
    let matchDate = true;
    if (filterDateRange === 'today') {
      matchDate = exp.date === todayStr;
    } else if (filterDateRange === 'month') {
      matchDate = exp.date.startsWith(currentMonthPrefix);
    }

    return matchSearch && matchCat && matchMethod && matchStatus && matchDate;
  });

  // Modal open handlers
  const handleOpenAdd = () => {
    setEditingExpense(null);
    setAmount('');
    setCategory(expenseCategories[0]?.nameAr || 'مصروفات أخرى');
    setExpenseDate(todayStr);
    setPaymentMethod('Cash');
    setNotes('');
    setPaymentNotice('');
    setShowExpenseModal(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setAmount(exp.amount.toString());
    setCategory(exp.category);
    setExpenseDate(exp.date);
    setPaymentMethod(exp.paymentMethod);
    setNotes(exp.notes || '');
    setPaymentNotice(exp.paymentNotice || '');
    setShowExpenseModal(true);
  };

  const handleOpenSettle = (exp: Expense) => {
    setSelectedExpense(exp);
    setSettleMethod('Cash');
    setShowSettleModal(true);
  };

  const handleOpenDetail = (exp: Expense) => {
    setSelectedExpense(exp);
    setShowDetailModal(true);
  };

  // Helper to format transaction name: "[Category] [Date] [Month] [DayOfWeek] [Time]"
  const getFormattedTxName = (cat: string) => {
    const now = new Date();
    const days = [
      isRtl ? 'الأحد' : 'Sunday',
      isRtl ? 'الاثنين' : 'Monday',
      isRtl ? 'الثلاثاء' : 'Tuesday',
      isRtl ? 'الأربعاء' : 'Wednesday',
      isRtl ? 'الخميس' : 'Thursday',
      isRtl ? 'الجمعة' : 'Friday',
      isRtl ? 'السبت' : 'Saturday'
    ];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[now.getDay()];
    const monthName = isRtl ? monthsAr[now.getMonth()] : monthsEn[now.getMonth()];
    const dayOfMonth = now.getDate();
    const timeStr = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    return `${cat} ${dayOfMonth} ${monthName} ${dayName} ${timeStr}`;
  };

  // Submit Expense Form
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert(isRtl ? 'يرجى إدخال مبلغ صحيح أكبر من الصفر' : 'Please enter a valid amount greater than zero');
      return;
    }

    // MANDATORY PAYMENT NOTICE VALIDATION
    if (!paymentNotice.trim()) {
      alert(isRtl ? 'يرجى إدخال ملحوظة الدفع (حقل إجباري)' : 'Payment notice is required.');
      return;
    }

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        amount: parsedAmount,
        category,
        date: expenseDate,
        paymentMethod,
        notes: notes.trim() || undefined,
        paymentNotice: paymentNotice.trim(),
      });
    } else {
      // Record Financial Transaction for New Expense
      await addFinancialTransactionToSupabase({
        amount: parsedAmount,
        method: paymentMethod,
        notice: paymentNotice.trim(),
        type: 'Expense_Trans',
        name: getFormattedTxName(category)
      });

      addExpense({
        amount: parsedAmount,
        category,
        date: expenseDate,
        paymentMethod,
        status: paymentMethod === 'Credit' ? 'Unpaid' : 'Paid',
        notes: notes.trim() || undefined,
        paymentNotice: paymentNotice.trim(),
      });
    }

    setShowExpenseModal(false);
  };

  // Submit Settle Form
  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedExpense) {
      settleExpense(selectedExpense.id, settleMethod);
      setShowSettleModal(false);
      setSelectedExpense(null);
    }
  };

  // Category Modal Handlers
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameAr.trim()) return;
    addExpenseCategory(newCatNameAr.trim(), newCatNameEn.trim() || newCatNameAr.trim());
    setNewCatNameAr('');
    setNewCatNameEn('');
  };

  const handleSaveEditCategory = (id: string) => {
    if (!editingCatNameAr.trim()) return;
    updateExpenseCategory(id, editingCatNameAr.trim());
    setEditingCatId(null);
    setEditingCatNameAr('');
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600">
              {isRtl ? 'إدارة المصروفات والتدفقات النقدية' : 'Expense & Cash Outflow Management'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isRtl ? 'المصروفات التشغيلية' : 'Operating Expenses'}
          </h1>
          <p className="text-xs text-slate-500">
            {isRtl
              ? 'تسجيل ومتابعة جميع المصروفات النقدية والبنكية والآجلة وتوثيق السداد مع الفصل التام عن مشتريات المخزون.'
              : 'Track all cash, bank, and credit expenses with auto-calculated totals and zero overlap with stock purchases.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">category</span>
            <span>{isRtl ? 'إدارة التصنيفات' : 'Manage Categories'}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap"
            style={{ backgroundColor: customPalette.primaryAccent || themeConfig.primary }}
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span>{isRtl ? '+ تسجيل مصروف جديد' : '+ Record New Expense'}</span>
          </button>
        </div>
      </div>

      {/* Accounting Notice Box: Explicit Separation from Inventory Purchasing */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-amber-900">
        <span className="material-symbols-outlined text-amber-600 text-2xl flex-shrink-0 mt-0.5">
          info
        </span>
        <div className="flex flex-col gap-0.5 text-xs">
          <span className="font-extrabold">
            {isRtl ? 'تنويه محاسبي هام — الفصل التام عن المشتريات:' : 'Important Accounting Note — Separation from Inventory:'}
          </span>
          <span className="text-amber-800 leading-relaxed">
            {isRtl
              ? 'هذه الصفحة مخصصة للمصروفات التشغيلية فقط (مثل الإيجار، والرواتب، والكهرباء، والصيانة). توريد البضائع والمنتجات يتم تسجيله مباشرة في واجهة المخزون لزيادة قيمة المخزون وحساب تكلفة البضاعة المباعة (COGS) بشكل منفصل لمنع ازدواجية التكاليف.'
              : 'This module handles operational overhead only (rent, salaries, utilities). Inventory stock additions must be recorded in the Inventory view to manage cost of goods sold separately without cost duplication.'}
          </span>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Today's Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between gap-3 relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {isRtl ? 'إجمالي المصروفات اليوم' : "Today's Expenses"}
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">today</span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {todayTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-sm font-sans font-normal text-slate-500">ر.س</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <span className="font-bold text-slate-700">{todayExpenses.length}</span> {isRtl ? 'عمليات مصروفات اليوم' : 'transactions today'}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1 h-full bg-amber-500"></div>
        </div>

        {/* 2. Monthly Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between gap-3 relative overflow-hidden group hover:border-indigo-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {isRtl ? 'إجمالي المصروفات خلال الشهر' : 'Monthly Expenses'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">calendar_month</span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {monthTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-sm font-sans font-normal text-slate-500">ر.س</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <span className="font-bold text-slate-700">{monthExpenses.length}</span> {isRtl ? 'عمليات هذا الشهر' : 'transactions this month'}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500"></div>
        </div>

        {/* 3. Total Expense Count & Unpaid Credit Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between gap-3 relative overflow-hidden group hover:border-rose-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {isRtl ? 'عدد العمليات والمستحقات' : 'Total Count & Payable'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">receipt_long</span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight flex items-baseline gap-2">
              <span>{totalExpenseCount}</span>
              <span className="text-xs text-slate-500 font-normal">{isRtl ? 'إجمالي العمليات' : 'total operations'}</span>
            </div>
            <div className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-bold">
              {unpaidCreditCount > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  <span>
                    {unpaidCreditCount} {isRtl ? 'مصروفات آجلة غير مسددة' : 'unpaid credit expenses'} ({unpaidCreditTotal.toLocaleString()} ر.س)
                  </span>
                </>
              ) : (
                <span className="text-emerald-600 font-semibold">
                  ✓ {isRtl ? 'جميع المصروفات مسددة بالكامل' : 'All credit expenses are settled'}
                </span>
              )}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1 h-full bg-rose-500"></div>
        </div>
      </div>

      {/* Expenses History Table & Filter Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-5">
        {/* Table Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600 text-2xl">
              receipt
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isRtl ? 'سجل عمليات المصروفات' : 'Expenses Ledger Log'}
              </h2>
              <p className="text-xs text-slate-400">
                {isRtl ? `عرض ${filteredExpenses.length} من أصل ${expenses.length} عملية مسجلة` : `Showing ${filteredExpenses.length} of ${expenses.length} expenses`}
              </p>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <span className={`material-symbols-outlined absolute top-1/2 -translate-y-1/2 text-slate-400 text-lg ${
                isRtl ? 'right-3' : 'left-3'
              }`}>
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isRtl ? 'بحث بالسند أو التصنيف أو الملاحظة...' : 'Search receipt, category, notes...'}
                className={`w-full h-9 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 ${
                  isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                }`}
              />
            </div>

            {/* Date Filter */}
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">{isRtl ? 'كل التواريخ' : 'All Dates'}</option>
              <option value="today">{isRtl ? 'مصروفات اليوم' : "Today's Expenses"}</option>
              <option value="month">{isRtl ? 'مصروفات هذا الشهر' : 'This Month'}</option>
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 max-w-[160px] truncate"
            >
              <option value="all">{isRtl ? 'جميع التصنيفات' : 'All Categories'}</option>
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.nameAr}>
                  {cat.nameAr}
                </option>
              ))}
            </select>

            {/* Method Filter */}
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">{isRtl ? 'كل طرق الدفع' : 'All Methods'}</option>
              <option value="Cash">{isRtl ? 'نقدي' : 'Cash'}</option>
              <option value="E_Wallet">{isRtl ? 'إلكتروني' : 'Electronic'}</option>
              <option value="Bank">{isRtl ? 'تحويل بنكي' : 'Bank Transfer'}</option>
              <option value="Credit">{isRtl ? 'آجل' : 'Credit / Deferred'}</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">{isRtl ? 'كل الحالات' : 'All Statuses'}</option>
              <option value="Paid">{isRtl ? 'مدفوع' : 'Paid'}</option>
              <option value="Unpaid">{isRtl ? 'آجل غير مدفوع' : 'Unpaid'}</option>
            </select>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                <th className="py-3 px-4 text-start rounded-r-lg">{isRtl ? 'رقم السند' : 'Receipt No'}</th>
                <th className="py-3 px-4 text-start">{isRtl ? 'التاريخ' : 'Date'}</th>
                <th className="py-3 px-4 text-start">{isRtl ? 'التصنيف' : 'Category'}</th>
                <th className="py-3 px-4 text-start">{isRtl ? 'الوصف / ملاحظات' : 'Notes'}</th>
                <th className="py-3 px-4 text-start">{isRtl ? 'المبلغ' : 'Amount'}</th>
                <th className="py-3 px-4 text-start">{isRtl ? 'طريقة الدفع والحالة' : 'Payment & Status'}</th>
                <th className="py-3 px-4 text-center rounded-l-lg">{isRtl ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
                      <span className="text-sm font-bold text-slate-500">
                        {isRtl ? 'لا توجد مصروفات مسجلة تطابق التصفية الحالية' : 'No expenses match the current criteria'}
                      </span>
                      <button
                        onClick={handleOpenAdd}
                        className="mt-2 text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                      >
                        {isRtl ? '+ اضغط هنا لتسجيل مصروف جديد' : '+ Click to add a new expense'}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const isCreditUnpaid = exp.paymentMethod === 'Credit' && exp.status === 'Unpaid';

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Receipt No */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {exp.receiptNo}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {exp.date}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100">
                          {exp.category}
                        </span>
                      </td>

                      {/* Description / Notes */}
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {exp.notes || <span className="text-slate-300 italic">{isRtl ? 'بدون ملاحظات' : 'No notes'}</span>}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-mono font-extrabold text-sm text-slate-900 whitespace-nowrap">
                        {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] font-sans text-slate-500">ر.س</span>
                      </td>

                      {/* Payment Method & Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isCreditUnpaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-extrabold text-[11px] border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            <span>{isRtl ? 'آجل (غير مدفوع)' : 'Credit (Unpaid)'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>
                              {exp.paymentMethod === 'Cash' || exp.settledPaymentMethod === 'Cash'
                                ? isRtl ? 'نقدي — مدفوع' : 'Cash — Paid'
                                : exp.paymentMethod === 'E_Wallet' || exp.settledPaymentMethod === 'E_Wallet'
                                ? isRtl ? 'إلكتروني — مدفوع' : 'Electronic — Paid'
                                : exp.paymentMethod === 'Bank' || exp.settledPaymentMethod === 'Bank'
                                ? isRtl ? 'تحويل بنكي — مدفوع' : 'Bank Transfer — Paid'
                                : isRtl ? 'آجل — تم السداد' : 'Credit — Settled'}
                            </span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Settle button for unpaid credit */}
                          {isCreditUnpaid && (
                            <button
                              onClick={() => handleOpenSettle(exp)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                              title={isRtl ? 'سداد المصروف الآجل' : 'Settle Credit Expense'}
                            >
                              <span className="material-symbols-outlined text-sm">payments</span>
                              <span>{isRtl ? 'سداد' : 'Settle'}</span>
                            </button>
                          )}

                          {/* View details button */}
                          <button
                            onClick={() => handleOpenDetail(exp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title={isRtl ? 'تفاصيل السند' : 'View Details'}
                          >
                            <span className="material-symbols-outlined text-base">visibility</span>
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEdit(exp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title={isRtl ? 'تعديل البيانات' : 'Edit Expense'}
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => {
                              if (window.confirm(isRtl ? `حذف مصروف رقم ${exp.receiptNo} بقيمة ${exp.amount} ر.س؟` : `Delete expense ${exp.receiptNo}?`)) {
                                deleteExpense(exp.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title={isRtl ? 'حذف المصروف' : 'Delete Expense'}
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial System Impact Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold flex-shrink-0">
            <span className="material-symbols-outlined text-xl">account_balance</span>
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-slate-900">
              {isRtl ? 'تأثير المصروفات على الأرصدة والمالية' : 'Financial Balances Impact Summary'}
            </h3>
            <p className="text-xs text-slate-500">
              {isRtl ? 'يتم خصم المصروفات المدفوعة تلقائياً من الأرصدة، بينما تُسجَّل المصروفات الآجلة كالتزام مستحق السداد.' : 'Paid expenses deduct from balances immediately, whereas credit expenses act as liabilities.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap text-xs font-bold">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
            <span className="text-slate-500">{isRtl ? 'مدفوع نقدي (صندوق):' : 'Cash Paid:'}</span>
            <span className="font-mono text-slate-900">{cashPaidTotal.toLocaleString()} ر.س</span>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
            <span className="text-slate-500">{isRtl ? 'مدفوع إلكتروني (بنك):' : 'Bank Paid:'}</span>
            <span className="font-mono text-slate-900">{electronicPaidTotal.toLocaleString()} ر.س</span>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2">
            <span className="text-amber-700">{isRtl ? 'مستحق آجل (الذمم):' : 'Accounts Payable:'}</span>
            <span className="font-mono font-black">{unpaidCreditTotal.toLocaleString()} ر.س</span>
          </div>
        </div>
      </div>

      {/* 1. ADD / EDIT EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 flex flex-col gap-5 border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">
                  {editingExpense ? 'edit_note' : 'add_card'}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {editingExpense
                    ? (isRtl ? 'تعديل بيانات المصروف' : 'Edit Expense Details')
                    : (isRtl ? 'تسجيل مصروف جديد' : 'Record New Expense')}
                </h3>
              </div>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleExpenseSubmit} className="flex flex-col gap-4 text-xs font-medium">
              {/* Amount */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-800">
                  {isRtl ? 'قيمة المصروف (ر.س) *' : 'Expense Amount (SAR) *'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-base text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                  />
                  <span className={`absolute top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 ${
                    isRtl ? 'left-3.5' : 'right-3.5'
                  }`}>
                    ر.س
                  </span>
                </div>
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category Selection */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">{isRtl ? 'تصنيف المصروف *' : 'Category *'}</label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      {isRtl ? '+ إضافة تصنيف' : '+ Add Category'}
                    </button>
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                  >
                    {expenseCategories.map((cat) => (
                      <option key={cat.id} value={cat.nameAr}>
                        {cat.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expense Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-800">{isRtl ? 'تاريخ المصروف *' : 'Expense Date *'}</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Payment Method Option Group */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-800">{isRtl ? 'طريقة الدفع *' : 'Payment Method *'}</label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Cash */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash')}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'Cash'
                        ? 'bg-emerald-600 text-white border-emerald-600 font-extrabold shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-semibold'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">payments</span>
                    <span>{isRtl ? 'نقدي' : 'Cash'}</span>
                  </button>

                  {/* Electronic (E-Wallet) */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('E_Wallet')}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'E_Wallet'
                        ? 'bg-indigo-600 text-white border-indigo-600 font-extrabold shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-semibold'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                    <span>{isRtl ? 'إلكتروني' : 'E-Wallet'}</span>
                  </button>

                  {/* Bank Transfer */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Bank')}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'Bank'
                        ? 'bg-blue-600 text-white border-blue-600 font-extrabold shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-semibold'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">account_balance</span>
                    <span>{isRtl ? 'تحويل بنكي' : 'Bank'}</span>
                  </button>

                  {/* Credit (Deferred) */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Credit')}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'Credit'
                        ? 'bg-amber-600 text-white border-amber-600 font-extrabold shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-semibold'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">schedule</span>
                    <span>{isRtl ? 'آجل' : 'Credit / Due'}</span>
                  </button>
                </div>
              </div>

              {/* Payment Notice (Mandatory) */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-800">
                  {isRtl ? 'ملاحظة الدفع *' : 'Payment Notice *'}
                </label>
                <input
                  type="text"
                  required
                  value={paymentNotice}
                  onChange={(e) => setPaymentNotice(e.target.value)}
                  placeholder={
                    paymentMethod === 'Cash' ? (isRtl ? 'ادخل اسم المستلم' : 'Enter recipient name') :
                    paymentMethod === 'E_Wallet' ? (isRtl ? 'رقم هاتف المحفظة' : 'Wallet phone number') :
                    paymentMethod === 'Bank' ? (isRtl ? 'الرقم المرجعي للتحويل' : 'Transfer reference number') :
                    (isRtl ? 'ملاحظة للسداد الآجل' : 'Credit payment note')
                  }
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition-all"
                />
              </div>

              {/* Description or Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-800">
                  {isRtl ? 'وصف أو ملاحظات إضافية (اختياري)' : 'Description or Notes (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isRtl ? 'مثال: سداد فاتورة الكهرباء والماء لشهر أكتوبر فرع السليمانية' : 'e.g. Electricity bill payment for October branch 1'}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white resize-none"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md cursor-pointer transition-transform active:scale-95"
                  style={{ backgroundColor: customPalette.primaryAccent || themeConfig.primary }}
                >
                  {editingExpense ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'تأكيد وحفظ المصروف' : 'Save Expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CATEGORY MANAGEMENT MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">category</span>
                <h3 className="text-base font-bold text-slate-900">
                  {isRtl ? 'إدارة تصنيفات المصروفات' : 'Expense Categories Management'}
                </h3>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Add New Category Form */}
            <form onSubmit={handleAddCategorySubmit} className="flex flex-col gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-800">{isRtl ? 'إضافة تصنيف جديد:' : 'Add New Category:'}</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newCatNameAr}
                  onChange={(e) => setNewCatNameAr(e.target.value)}
                  placeholder={isRtl ? 'اسم التصنيف (بالعربية)' : 'Category Name (Arabic)'}
                  className="flex-1 h-9 px-3 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                >
                  {isRtl ? 'إضافة' : 'Add'}
                </button>
              </div>
            </form>

            {/* Existing Categories List */}
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              <span className="text-xs font-bold text-slate-500">{isRtl ? 'التصنيفات المتاحة:' : 'Available Categories:'}</span>
              {expenseCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-2.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between text-xs"
                >
                  {editingCatId === cat.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editingCatNameAr}
                        onChange={(e) => setEditingCatNameAr(e.target.value)}
                        className="flex-1 h-8 px-2 rounded-lg border border-indigo-400 text-xs focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveEditCategory(cat.id)}
                        className="px-2 py-1 bg-emerald-600 text-white rounded-md text-[11px] font-bold cursor-pointer"
                      >
                        {isRtl ? 'حفظ' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingCatId(null)}
                        className="px-2 py-1 bg-slate-200 text-slate-700 rounded-md text-[11px] font-bold cursor-pointer"
                      >
                        {isRtl ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{cat.nameAr}</span>
                        {cat.isDefault && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded">
                            {isRtl ? 'افتراضي' : 'Default'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCatId(cat.id);
                            setEditingCatNameAr(cat.nameAr);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                          title={isRtl ? 'تعديل' : 'Edit'}
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>

                        {!cat.isDefault && (
                          <button
                            onClick={() => {
                              if (window.confirm(isRtl ? `حذف تصنيف ${cat.nameAr}؟` : `Delete category ${cat.nameAr}?`)) {
                                deleteExpenseCategory(cat.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title={isRtl ? 'حذف' : 'Delete'}
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SETTLE CREDIT EXPENSE MODAL */}
      {showSettleModal && selectedExpense && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">payments</span>
                <h3 className="text-base font-bold text-slate-900">
                  {isRtl ? 'تسجيل سداد مصروف آجل' : 'Settle Credit Expense'}
                </h3>
              </div>
              <button
                onClick={() => setShowSettleModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs flex flex-col gap-1.5">
              <div className="flex justify-between font-bold text-amber-900">
                <span>{isRtl ? 'رقم السند:' : 'Receipt:'}</span>
                <span className="font-mono">{selectedExpense.receiptNo}</span>
              </div>
              <div className="flex justify-between font-bold text-amber-900">
                <span>{isRtl ? 'المبلغ المستحق:' : 'Due Amount:'}</span>
                <span className="font-mono text-sm">{selectedExpense.amount.toLocaleString()} ر.س</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{isRtl ? 'التصنيف:' : 'Category:'}</span>
                <span>{selectedExpense.category}</span>
              </div>
            </div>

            <form onSubmit={handleSettleSubmit} className="flex flex-col gap-4 text-xs font-medium">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-800">{isRtl ? 'اختر وسيلة الدفع عند السداد:' : 'Payment Method:'}</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSettleMethod('Cash')}
                    className={`py-3 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 font-bold ${
                      settleMethod === 'Cash'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">payments</span>
                    <span>{isRtl ? 'نقدي (الصندوق)' : 'Cash'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettleMethod('E_Wallet')}
                    className={`py-3 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 font-bold ${
                      settleMethod === 'E_Wallet'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                    <span>{isRtl ? 'إلكتروني' : 'E-Wallet'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettleMethod('Bank')}
                    className={`py-3 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 font-bold ${
                      settleMethod === 'Bank'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">account_balance</span>
                    <span>{isRtl ? 'بنكي' : 'Bank'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  {isRtl ? 'تأكيد السداد وتحديث الرصيد' : 'Confirm Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DETAIL VIEW MODAL */}
      {showDetailModal && selectedExpense && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">receipt_long</span>
                <h3 className="text-base font-bold text-slate-900">
                  {isRtl ? 'تفاصيل سند المصروف' : 'Expense Voucher Details'}
                </h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-bold">{isRtl ? 'رقم السند:' : 'Receipt No:'}</span>
                <span className="font-mono font-bold text-slate-900">{selectedExpense.receiptNo}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-bold">{isRtl ? 'التاريخ:' : 'Date:'}</span>
                <span className="font-mono text-slate-900">{selectedExpense.date}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-bold">{isRtl ? 'تصنيف المصروف:' : 'Category:'}</span>
                <span className="font-bold text-indigo-700">{selectedExpense.category}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-bold">{isRtl ? 'قيمة المصروف:' : 'Amount:'}</span>
                <span className="font-mono font-extrabold text-base text-slate-900">
                  {selectedExpense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-bold">{isRtl ? 'طريقة الدفع:' : 'Payment Method:'}</span>
                <span className="font-bold text-slate-800">
                  {selectedExpense.paymentMethod === 'Cash'
                    ? (isRtl ? 'نقدي' : 'Cash')
                    : selectedExpense.paymentMethod === 'E_Wallet'
                    ? (isRtl ? 'إلكتروني' : 'Electronic')
                    : selectedExpense.paymentMethod === 'Bank'
                    ? (isRtl ? 'تحويل بنكي' : 'Bank Transfer')
                    : (isRtl ? 'آجل' : 'Credit')}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-bold">{isRtl ? 'حالة السداد:' : 'Status:'}</span>
                <span className={`font-bold ${selectedExpense.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {selectedExpense.status === 'Paid' ? (isRtl ? 'تم السداد بالكامل' : 'Fully Paid') : (isRtl ? 'غير مدفوع (مستحق)' : 'Unpaid')}
                </span>
              </div>

              {selectedExpense.settledDate && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">{isRtl ? 'تاريخ وسيلة السداد:' : 'Settled Date:'}</span>
                  <span className="font-mono text-slate-900">{selectedExpense.settledDate}</span>
                </div>
              )}

              <div className="flex flex-col gap-1 pt-1">
                <span className="text-slate-500 font-bold">{isRtl ? 'الملاحظات والبيان:' : 'Notes:'}</span>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-700 leading-relaxed border border-slate-200">
                  {selectedExpense.notes || (isRtl ? 'لا توجد ملاحظات مدونة' : 'No notes entered')}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

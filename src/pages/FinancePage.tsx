import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FinanceItem, FinanceSection } from '../types';
import { ExpensesManager } from '../components/ExpensesManager';

export const FinancePage: React.FC = () => {
  const { language, themeConfig, financeItems, addFinanceItem, updateFinanceItem, deleteFinanceItem } = useApp();

  const isRtl = language === 'ar';

  const [pageView, setPageView] = useState<'expenses' | 'statements'>('expenses');
  const [activeTab, setActiveTab] = useState<FinanceSection>('income');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FinanceItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [amount, setAmount] = useState('');
  const [section, setSection] = useState<FinanceSection>('income');
  const [subsection, setSubsection] = useState('Operating Expenses');
  const [isNegative, setIsNegative] = useState(false);

  const sectionsInfo: Record<
    FinanceSection,
    { titleEn: string; titleAr: string; descEn: string; descAr: string; icon: string }
  > = {
    income: {
      titleEn: 'Income Statement',
      titleAr: 'قائمة الدخل',
      descEn: 'Summary of revenues, cost of sales, operating expenses, and net profit.',
      descAr: 'ملخص الإيرادات وتكلفة المبيعات والمصاريف التشغيلية وصولاً لصافي الربح.',
      icon: 'receipt_long',
    },
    balance: {
      titleEn: 'Balance Sheet',
      titleAr: 'الميزانية العمومية',
      descEn: 'Statement of financial position showing total assets vs liabilities & owner equity.',
      descAr: 'بيان المركز المالي الذي يوضح إجمالي الأصول مقابل الالتزامات وحقوق الملكية.',
      icon: 'account_balance',
    },
    cashflow: {
      titleEn: 'Cash Flow Statement',
      titleAr: 'قائمة التدفقات النقدية',
      descEn: 'Tracking cash inflows and outflows across operating, investing, and financing activities.',
      descAr: 'متابعة المقبوضات والمدفوعات النقدية عبر الأنشطة التشغيلية والاستثمارية والتمويلية.',
      icon: 'payments',
    },
  };

  // Filter items for active tab
  const currentItems = financeItems.filter((item) => item.section === activeTab);

  // Group by subsection
  const groupedSubsections = currentItems.reduce((acc, item) => {
    const sub = item.subsection;
    if (!acc[sub]) acc[sub] = [];
    acc[sub].push(item);
    return acc;
  }, {} as Record<string, FinanceItem[]>);

  // Calculates subtotals
  const calculateTotal = (items: FinanceItem[]) => {
    return items.reduce((acc, i) => {
      const val = Math.abs(i.amount);
      return i.isNegative ? acc - val : acc + val;
    }, 0);
  };

  const currentTabTotal = calculateTotal(currentItems);

  // Modal handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    setTitle('');
    setTitleAr('');
    setAmount('');
    setSection(activeTab);
    setSubsection(activeTab === 'income' ? 'Operating Expenses' : activeTab === 'balance' ? 'Current Assets' : 'Operating Activities');
    setIsNegative(activeTab === 'income');
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: FinanceItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setTitleAr(item.titleAr || '');
    setAmount(Math.abs(item.amount).toString());
    setSection(item.section);
    setSubsection(item.subsection);
    setIsNegative(!!item.isNegative);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount)) return;

    if (editingItem) {
      updateFinanceItem(editingItem.id, {
        title: title.trim(),
        titleAr: titleAr.trim() || undefined,
        amount: parsedAmount,
        section,
        subsection,
        isNegative,
      });
    } else {
      addFinanceItem({
        title: title.trim(),
        titleAr: titleAr.trim() || undefined,
        amount: parsedAmount,
        section,
        subsection,
        isNegative,
      });
    }

    setShowAddModal(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Section', 'Subsection', 'Item Title', 'Amount ($)', 'Type'];
    const rows = financeItems.map((item) => [
      item.id,
      item.section,
      item.subsection,
      `"${item.title}"`,
      item.amount,
      item.isNegative ? 'Deduction/Expense' : 'Income/Asset',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_statements_${activeTab}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Sub Navigation Switcher */}
      <div className="flex bg-slate-200/70 p-1.5 rounded-2xl w-fit gap-1 self-start">
        <button
          onClick={() => setPageView('expenses')}
          className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            pageView === 'expenses'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
          <span>{isRtl ? 'إدارة المصروفات التشغيلية' : 'Operating Expenses'}</span>
        </button>

        <button
          onClick={() => setPageView('statements')}
          className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            pageView === 'statements'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-lg">receipt_long</span>
          <span>{isRtl ? 'القوائم المالية المحاسبية' : 'Accounting Statements'}</span>
        </button>
      </div>

      {pageView === 'expenses' ? (
        <ExpensesManager />
      ) : (
        <>
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  {isRtl ? 'المحاسبة المالي المنظمة' : 'Financial Accounting Standards'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {isRtl ? 'الصفحة المالية — القوائم المالية المحاسبية' : 'Finance Page — Accounting Statements'}
              </h1>
              <p className="text-xs text-slate-500">
                {isRtl
                  ? 'ثلاثة جداول مالية منفصلة بتنسيق محاسبي واضح ودقيق مع إمكانية إضافة وتعديل البنود والإجماليات.'
                  : 'Three structured financial tables (Income Statement, Balance Sheet, Cash Flow) with editable items and clear subtotals.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">download</span>
                <span>{isRtl ? 'تصدير CSV' : 'Export CSV'}</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
                style={{ backgroundColor: themeConfig.primary }}
              >
                <span className="material-symbols-outlined text-lg">add</span>
                <span>{isRtl ? '+ إضافة بند مالي' : '+ Add Financial Item'}</span>
              </button>
            </div>
          </div>

      {/* Segmented Control Tabs for 3 Statements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(['income', 'balance', 'cashflow'] as FinanceSection[]).map((secKey) => {
          const info = sectionsInfo[secKey];
          const isSelected = activeTab === secKey;
          const count = financeItems.filter((i) => i.section === secKey).length;

          return (
            <button
              key={secKey}
              onClick={() => setActiveTab(secKey)}
              className={`p-4 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/10 shadow-md'
                  : 'bg-white/80 hover:bg-white border-slate-200/80 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span
                    className={`material-symbols-outlined text-xl ${
                      isSelected ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  >
                    {info.icon}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {isRtl ? info.titleAr : info.titleEn}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 font-mono">
                  {count} {isRtl ? 'بنود' : 'items'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isRtl ? info.descAr : info.descEn}
              </p>
            </button>
          );
        })}
      </div>

      {/* FINANCIAL STATEMENT TABLE DISPLAY */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600 text-2xl">
              {sectionsInfo[activeTab].icon}
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isRtl ? sectionsInfo[activeTab].titleAr : sectionsInfo[activeTab].titleEn}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {isRtl ? 'السنة المالية 2026 • القيم بالدولار ($)' : 'Fiscal Year 2026 • Values in USD ($)'}
              </p>
            </div>
          </div>

          {/* Statement Total Summary Box */}
          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600">
              {activeTab === 'income'
                ? isRtl
                  ? 'صافي الربح / الخسارة:'
                  : 'Net Income / Profit:'
                : activeTab === 'balance'
                ? isRtl
                  ? 'إجمالي المركز المالي:'
                  : 'Net Position Total:'
                : isRtl
                ? 'صافي التدفق النقدي:'
                : 'Net Cash Flow:'}
            </span>
            <span
              className={`text-lg font-extrabold font-mono ${
                currentTabTotal >= 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              ${currentTabTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* ACCOUNTING TABLE */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-4 rounded-l-lg">{isRtl ? 'اسم البند / البيان' : 'Line Item Title'}</th>
                <th className="py-2.5 px-4">{isRtl ? 'الفئة الفرعية' : 'Sub-Category'}</th>
                <th className="py-2.5 px-4 text-end">{isRtl ? 'القيمة المالية ($)' : 'Amount ($)'}</th>
                <th className="py-2.5 px-4 text-center rounded-r-lg">{isRtl ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {Object.keys(groupedSubsections).map((subName) => {
                const subItems = groupedSubsections[subName];
                const subTotal = calculateTotal(subItems);

                return (
                  <React.Fragment key={subName}>
                    {/* Subsection Category Header Row */}
                    <tr className="bg-slate-50/80 font-bold text-slate-900 border-t border-b border-slate-200/80">
                      <td colSpan={2} className="py-2 px-4 uppercase text-[11px] tracking-wider text-indigo-700">
                        {subItems[0]?.subsectionAr && isRtl ? subItems[0].subsectionAr : subName}
                      </td>
                      <td className="py-2 px-4 text-end font-mono text-slate-900 text-xs font-extrabold">
                        Subtotal: ${subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-4" />
                    </tr>

                    {/* Individual Line Items */}
                    {subItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 pl-6">
                          {isRtl && item.titleAr ? item.titleAr : item.title}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">{item.subsection}</td>
                        <td
                          className={`py-3 px-4 text-end font-bold font-mono text-sm ${
                            item.isNegative ? 'text-red-600' : 'text-slate-900'
                          }`}
                        >
                          {item.isNegative ? `($${Math.abs(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })})` : `$${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600"
                              title={isRtl ? 'تعديل البند' : 'Edit Item'}
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(isRtl ? 'حذف هذا البند المالي؟' : 'Delete this item?')) {
                                  deleteFinanceItem(item.id);
                                }
                              }}
                              className="p-1 rounded text-slate-400 hover:text-red-600"
                              title={isRtl ? 'حذف' : 'Delete'}
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT FINANCIAL ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? (isRtl ? 'تعديل البند المالي' : 'Edit Financial Item') : (isRtl ? 'إضافة بند مالي جديد' : 'Add New Financial Item')}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs font-medium">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">{isRtl ? 'اسم البند (بالإنكليزية)' : 'Item Title (English)'}</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Office Rent or Equipment Purchase"
                  className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">{isRtl ? 'اسم البند (بالعربية)' : 'Item Title (Arabic)'}</label>
                <input
                  type="text"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder="مثال: إيجار المكاتب والمستودع"
                  className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'القوائم المالية' : 'Statement'}</label>
                  <select
                    value={section}
                    onChange={(e: any) => setSection(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="income">{isRtl ? 'قائمة الدخل' : 'Income Statement'}</option>
                    <option value="balance">{isRtl ? 'الميزانية العمومية' : 'Balance Sheet'}</option>
                    <option value="cashflow">{isRtl ? 'التدفقات النقدية' : 'Cash Flow'}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'المبلغ ($)' : 'Amount ($)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="5000"
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 font-bold font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">{isRtl ? 'الفئة الفرعية' : 'Subcategory'}</label>
                <input
                  type="text"
                  value={subsection}
                  onChange={(e) => setSubsection(e.target.value)}
                  placeholder="e.g. Operating Expenses, Revenue, Current Assets..."
                  className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="negCheck"
                  checked={isNegative}
                  onChange={(e) => setIsNegative(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="negCheck" className="text-xs text-slate-700 cursor-pointer">
                  {isRtl ? 'خصم / مصروفات مطروحة (Negative / Expense)' : 'Deduction / Expense / Outflow (Negative)'}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow-sm"
                  style={{ backgroundColor: themeConfig.primary }}
                >
                  {editingItem ? (isRtl ? 'حفظ التعديلات' : 'Save Item') : (isRtl ? 'إضافة البند' : 'Add Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

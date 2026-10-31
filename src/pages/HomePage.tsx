import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SalesCashier } from '../components/SalesCashier';
import { InventoryManager } from '../components/InventoryManager';
import { ExpensesManager } from '../components/ExpensesManager';

export const HomePage: React.FC = () => {
  const { language, customPalette, fastItems } = useApp();

  const isRtl = language === 'ar';

  // Section in central workspace: 'sales' | 'inventory' | 'expenses'
  const [activeSection, setActiveSection] = useState<'sales' | 'inventory' | 'expenses'>('sales');

  // Calculate unique inventory threshold counts
  const lowStockCount = fastItems.filter((i) => i.stockQuantity <= (i.minStock ?? 10)).length;
  const overstockCount = fastItems.filter((i) => {
    const min = i.minStock ?? 10;
    const max = i.maxStock ?? 100;
    return i.stockQuantity > max && i.stockQuantity > min;
  }).length;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Central Area Layout: 3-Icon Column on the Far Side & Active Section Component in the Center */}
      <div className={`flex flex-col lg:flex-row ${isRtl ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-6 items-start w-full`}>
        {/* 3-Icon Vertical Sidebar Column */}
        <div className="flex-shrink-0 z-20">
          <div
            style={{ backgroundColor: customPalette.surfaceBg ? `${customPalette.surfaceBg}b0` : 'rgba(255, 255, 255, 0.75)' }}
            className="p-3.5 rounded-2xl glass-card border border-white/80 shadow-lg flex flex-row lg:flex-col gap-5 w-fit backdrop-blur-xl animate-float-slow"
          >
            {/* 1. SALES ICON (المبيعات) */}
            <button
              onClick={() => setActiveSection('sales')}
              title={isRtl ? 'واجهة المبيعات والكاشير' : 'Sales / Cashier'}
              className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-300 cursor-pointer group relative shadow-xs hover:shadow-md hover:scale-110 active:scale-95 ${
                activeSection === 'sales'
                  ? 'bg-indigo-600 text-white shadow-md border-indigo-600'
                  : 'bg-indigo-50/60 text-indigo-700 hover:bg-indigo-600 hover:text-white border-indigo-100'
              }`}
            >
              <span className="material-symbols-outlined text-2xl hover-icon-sales">
                point_of_sale
              </span>

              {/* Hover Tooltip */}
              <span className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:block bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-lg z-30 pointer-events-none transition-all duration-200 ${
                isRtl ? 'right-full mr-3' : 'left-full ml-3'
              }`}>
                {isRtl ? 'المبيعات (الكاشير)' : 'Sales & Cashier'}
              </span>
            </button>

            {/* 2. INVENTORY ICON WITH NOTIFICATIONS (أيقونة المخزون مع التنبيهات الدقيقة) */}
            <button
              onClick={() => setActiveSection('inventory')}
              title={isRtl ? 'إدارة المخزون والمنتجات' : 'Inventory Management'}
              className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-300 cursor-pointer group relative shadow-xs hover:shadow-md hover:scale-110 active:scale-95 ${
                activeSection === 'inventory'
                  ? 'bg-slate-900 text-white shadow-md border-slate-900'
                  : lowStockCount > 0
                  ? 'bg-rose-50 border-rose-300 text-rose-600 hover:bg-rose-600 hover:text-white'
                  : overstockCount > 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                  : 'bg-emerald-50/60 text-emerald-700 hover:bg-emerald-600 hover:text-white border-emerald-100'
              }`}
            >
              <span className="material-symbols-outlined text-2xl hover-icon-route">
                inventory_2
              </span>

              {/* Notification Badge on Top Right */}
              {lowStockCount > 0 ? (
                // RED PRIORITY BADGE (مخزون منخفض)
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                  {lowStockCount}
                </span>
              ) : overstockCount > 0 ? (
                // GREEN BADGE (مخزون زائد عن الحد الأقصى)
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-white shadow-sm">
                  {overstockCount}
                </span>
              ) : null}

              {/* Hover Tooltip */}
              <span className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:block bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-lg z-30 pointer-events-none transition-all duration-200 ${
                isRtl ? 'right-full mr-3' : 'left-full ml-3'
              }`}>
                {isRtl ? 'إدارة المخزون' : 'Inventory'}
                {lowStockCount > 0
                  ? ` (🔴 ${lowStockCount} منخفض)`
                  : overstockCount > 0
                  ? ` (🟢 ${overstockCount} زائد)`
                  : ''}
              </span>
            </button>

            {/* 3. EXPENSES ICON (المصروفات) */}
            <button
              onClick={() => setActiveSection('expenses')}
              title={isRtl ? 'إدارة المصروفات' : 'Expenses Management'}
              className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-300 cursor-pointer group relative shadow-xs hover:shadow-md hover:scale-110 active:scale-95 ${
                activeSection === 'expenses'
                  ? 'bg-amber-600 text-white shadow-md border-amber-600'
                  : 'bg-amber-50/60 text-amber-700 hover:bg-amber-600 hover:text-white border-amber-100'
              }`}
            >
              <span className="material-symbols-outlined text-2xl hover-icon-wallet">
                account_balance_wallet
              </span>

              {/* Hover Tooltip */}
              <span className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:block bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-lg z-30 pointer-events-none transition-all duration-200 ${
                isRtl ? 'right-full mr-3' : 'left-full ml-3'
              }`}>
                {isRtl ? 'إدارة المصروفات' : 'Expenses'}
              </span>
            </button>
          </div>
        </div>

        {/* Central Workspace */}
        <div className="flex-1 w-full min-w-0">
          {activeSection === 'sales' && <SalesCashier />}
          {activeSection === 'inventory' && <InventoryManager />}
          {activeSection === 'expenses' && <ExpensesManager />}
        </div>
      </div>
    </div>
  );
};

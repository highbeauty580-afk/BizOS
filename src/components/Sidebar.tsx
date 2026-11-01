import React from 'react';
import { useApp } from '../context/AppContext';
import { PageId } from '../types';

interface NavItemConfig {
  id: PageId;
  labelEn: string;
  labelAr: string;
  icon: string;
  activeBg: string;
  inactiveBg: string;
  inactiveText: string;
  iconColor: string;
  iconAnimClass: string;
}

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onCloseMobile }) => {
  const { currentPage, setCurrentPage, language, customPalette } = useApp();

  const navItems: NavItemConfig[] = [
    {
      id: 'home',
      labelEn: 'Home',
      labelAr: 'الرئيسية',
      icon: 'grid_view',
      activeBg: 'bg-indigo-600 text-white shadow-sm',
      inactiveBg: 'bg-indigo-50/60 hover:bg-indigo-100/80 border-indigo-100',
      inactiveText: 'text-indigo-900',
      iconColor: 'text-indigo-600',
      iconAnimClass: 'hover-icon-grid',
    },
    {
      id: 'operations',
      labelEn: 'Operations',
      labelAr: 'التشغيل والإنتاج',
      icon: 'route',
      activeBg: 'bg-amber-600 text-white shadow-sm',
      inactiveBg: 'bg-amber-50/60 hover:bg-amber-100/80 border-amber-100',
      inactiveText: 'text-amber-900',
      iconColor: 'text-amber-600',
      iconAnimClass: 'hover-icon-route',
    },
    {
      id: 'finance',
      labelEn: 'Finance',
      labelAr: 'المالية',
      icon: 'account_balance',
      activeBg: 'bg-emerald-600 text-white shadow-sm',
      inactiveBg: 'bg-emerald-50/60 hover:bg-emerald-100/80 border-emerald-100',
      inactiveText: 'text-emerald-900',
      iconColor: 'text-emerald-600',
      iconAnimClass: 'hover-icon-wallet',
    },
    {
      id: 'hr',
      labelEn: 'Human Resources',
      labelAr: 'الموارد البشرية',
      icon: 'schema',
      activeBg: 'bg-purple-600 text-white shadow-sm',
      inactiveBg: 'bg-purple-50/60 hover:bg-purple-100/80 border-purple-100',
      inactiveText: 'text-purple-900',
      iconColor: 'text-purple-600',
      iconAnimClass: 'hover-icon-schema',
    },
    {
      id: 'marketing',
      labelEn: 'Marketing',
      labelAr: 'التسويق',
      icon: 'campaign',
      activeBg: 'bg-rose-600 text-white shadow-sm',
      inactiveBg: 'bg-rose-50/60 hover:bg-rose-100/80 border-rose-100',
      inactiveText: 'text-rose-900',
      iconColor: 'text-rose-600',
      iconAnimClass: 'hover-icon-campaign',
    },
  ];

  const isRtl = language === 'ar';

  const handleNavClick = (id: PageId) => {
    setCurrentPage(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Dark Overlay Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Navigation Container */}
      <aside
        style={{
          backgroundColor: customPalette.sidebarBg ? `${customPalette.sidebarBg}f0` : 'rgba(255, 255, 255, 0.94)',
          color: customPalette.sidebarText || '#334155',
        }}
        className={`fixed top-16 bottom-0 w-64 glass-sidebar border-r border-slate-200/80 z-40 flex flex-col justify-between py-6 transition-transform duration-300 ${
          isRtl ? 'right-0 border-r-0 border-l' : 'left-0'
        } ${
          isMobileOpen
            ? 'translate-x-0'
            : isRtl
            ? 'translate-x-full lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-2 px-3.5">
          {/* Navigation List */}
          <nav className="flex flex-col gap-3 pt-2">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-start transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 ${
                    isActive
                      ? `${item.activeBg} border-transparent font-bold scale-[1.01] shadow-md shadow-indigo-500/10`
                      : `${item.inactiveBg} ${item.inactiveText} font-semibold hover:shadow-xs border-white/60`
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isActive ? 'bg-white/25 text-white shadow-xs' : 'bg-white/80 shadow-xs group-hover:scale-105 group-hover:bg-white'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-lg ${item.iconAnimClass} ${
                      isActive ? 'text-white' : item.iconColor
                    }`}>
                      {item.icon}
                    </span>
                  </div>
                  <span className="text-sm tracking-tight">
                    {isRtl ? item.labelAr : item.labelEn}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info box */}
        <div className="px-4 flex flex-col gap-3">
          <div className="p-3.5 rounded-2xl bg-white/70 border border-white/90 shadow-xs flex flex-col gap-1">
            <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
              <span>BizOS Engine</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              v1.3.0 • {isRtl ? 'إصدار ثابت' : 'Stable Release'}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

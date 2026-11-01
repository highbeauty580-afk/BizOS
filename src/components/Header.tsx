import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PaletteModal } from './PaletteModal';

interface HeaderProps {
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isMobileMenuOpen, onToggleMobileMenu }) => {
  const {
    language,
    setLanguage,
    customPalette,
    businessName,
    setBusinessName,
    resetToDefault,
  } = useApp();

  const [isEditingBusinessName, setIsEditingBusinessName] = useState(false);
  const [tempName, setTempName] = useState(businessName);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const isRtl = language === 'ar';

  const handleSaveName = () => {
    if (tempName.trim()) {
      setBusinessName(tempName.trim());
    }
    setIsEditingBusinessName(false);
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 h-16 glass-header z-50 px-3 sm:px-6 flex items-center justify-between transition-colors backdrop-blur-xl border-b border-white/70 shadow-sm"
        style={{
          backgroundColor: customPalette.topBarBg ? `${customPalette.topBarBg}ee` : 'rgba(255, 255, 255, 0.92)',
          color: customPalette.topBarText || '#0f172a',
        }}
      >
        {/* Brand, Hamburger Toggle & Business Selector */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Hamburger Drawer Button */}
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl hover:bg-black/5 text-slate-700 transition-colors cursor-pointer flex items-center justify-center shrink-0"
              title={isRtl ? 'فتح القائمة الجانبية' : 'Toggle Navigation Menu'}
            >
              <span className="material-symbols-outlined text-2xl">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          )}

          <div className="flex items-center gap-2">
            {customPalette.brandLogoUrl ? (
              <img src={customPalette.brandLogoUrl} alt="Logo" className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover shadow-xs" />
            ) : (
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white shadow-xs font-bold text-base sm:text-lg tracking-wider"
                style={{ backgroundColor: customPalette.primaryAccent }}
              >
                B
              </div>
            )}
            <span className="font-bold text-lg sm:text-xl tracking-tight">BizOS</span>
          </div>

          <div className="h-4 w-px bg-slate-200/80 hidden md:block" />

          {/* Editable Business Name */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 hover:bg-slate-200/70 rounded-lg text-xs font-medium transition-colors">
            <span className="material-symbols-outlined text-base text-slate-400">domain</span>
            {isEditingBusinessName ? (
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                autoFocus
                className="bg-white border border-indigo-400 rounded px-1.5 py-0.5 text-xs text-slate-900 focus:outline-none"
              />
            ) : (
              <button
                onClick={() => {
                  setTempName(businessName);
                  setIsEditingBusinessName(true);
                }}
                title="Click to rename business"
                className="hover:underline flex items-center gap-1 text-slate-800"
              >
                <bdi>{businessName}</bdi>
                <span className="material-symbols-outlined text-xs text-slate-400">edit</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Controls: Palette Customizer, Language Toggle, Reset Data */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Custom Multi-Zone Palette Trigger */}
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white/90 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer group shrink-0"
            title="Custom Palette & Hex Picker / تخصيص لوحة الألوان بالهيكسا كود"
          >
            <span className="material-symbols-outlined text-sm text-indigo-600 hover-icon-palette">palette</span>
            <span className="hidden sm:inline">{isRtl ? 'لوحة الألوان' : 'Color Palette'}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200/90 bg-white/90 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors group cursor-pointer shrink-0"
            title="Switch Language / تغيير اللغة"
          >
            <span className="material-symbols-outlined text-sm text-indigo-600 hover-icon-translate">translate</span>
            <span dir="ltr" className="inline-block text-[11px] sm:text-xs">
              {language === 'en' ? 'AR' : 'EN'}
            </span>
          </button>

          {/* Reset Data Button */}
          <button
            onClick={resetToDefault}
            title="Reset to sample data"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors group cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-lg hover-icon-spin">restart_alt</span>
          </button>
        </div>
      </header>

      {/* Palette Modal */}
      <PaletteModal isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </>
  );
};

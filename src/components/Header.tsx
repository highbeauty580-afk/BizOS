import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PaletteModal } from './PaletteModal';

export const Header: React.FC = () => {
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
        className="fixed top-0 left-0 right-0 h-16 glass-header z-50 px-4 md:px-6 flex items-center justify-between transition-colors backdrop-blur-xl border-b border-white/70 shadow-sm"
        style={{
          backgroundColor: customPalette.topBarBg ? `${customPalette.topBarBg}dd` : 'rgba(255, 255, 255, 0.75)',
          color: customPalette.topBarText || '#0f172a',
        }}
      >
        {/* Brand & Business Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {customPalette.brandLogoUrl ? (
              <img src={customPalette.brandLogoUrl} alt="Logo" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm font-bold text-lg tracking-wider"
                style={{ backgroundColor: customPalette.primaryAccent }}
              >
                B
              </div>
            )}
            <span className="font-bold text-xl tracking-tight">BizOS</span>
          </div>

          <div className="h-4 w-px bg-slate-200/80 hidden sm:block" />

          {/* Editable Business Name */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 hover:bg-slate-200/70 rounded-lg text-xs font-medium transition-colors">
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
        <div className="flex items-center gap-2 md:gap-3">
          {/* Custom Multi-Zone Palette Trigger */}
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer group"
            title="Custom Palette & Hex Picker / تخصيص لوحة الألوان بالهيكسا كود"
          >
            <span className="material-symbols-outlined text-sm text-indigo-600 hover-icon-palette">palette</span>
            <span className="hidden sm:inline">{isRtl ? 'لوحة الألوان' : 'Color Palette'}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors group cursor-pointer"
            title="Switch Language / تغيير اللغة"
          >
            <span className="material-symbols-outlined text-sm text-indigo-600 hover-icon-translate">translate</span>
            <span dir="ltr" className="inline-block">{language === 'en' ? 'العربية (AR)' : 'English (EN)'}</span>
          </button>

          {/* Reset Data Button */}
          <button
            onClick={resetToDefault}
            title="Reset to sample data"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors group cursor-pointer"
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

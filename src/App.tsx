import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { PostAuthPortal } from './components/PostAuthPortal';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { OperationsPage } from './pages/OperationsPage';
import { FinancePage } from './pages/FinancePage';
import { HRPage } from './pages/HRPage';
import { MarketingPage } from './pages/MarketingPage';

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  if (!hex) return { r: 53, g: 37, b: 205 };
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return { r: 53, g: 37, b: 205 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

const hexToRgba = (hex: string, alpha: number): string => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const AppContent: React.FC = () => {
  const { user, isLoadingAuth } = useAuth();
  const { currentPage, language, customPalette, activeTenant, selectTenant, isDarkPortal } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const isRtl = language === 'ar';

  // 1. Initial Authentication Loading State
  if (isLoadingAuth) {
    return (
      <div
        className={`min-h-screen w-full flex flex-col items-center justify-center transition-colors ${
          isDarkPortal ? 'bg-[#060b14] text-slate-200' : 'bg-[#F5F7FA] text-[#172B4D]'
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg animate-pulse ${
              isDarkPortal
                ? 'bg-gradient-to-tr from-teal-500 to-emerald-400 shadow-teal-500/25'
                : 'bg-gradient-to-tr from-[#013589] to-[#2559AF] shadow-blue-900/20'
            }`}
          >
            <span className={`w-5 h-0.5 rounded-full ${isDarkPortal ? 'bg-slate-950' : 'bg-white'}`}></span>
            <span className={`w-5 h-0.5 rounded-full ${isDarkPortal ? 'bg-slate-950/90' : 'bg-white/90'}`}></span>
            <span className={`w-3.5 h-0.5 rounded-full self-start ml-3.5 ${isDarkPortal ? 'bg-slate-950/80' : 'bg-white/80'}`}></span>
          </div>
          <div className={`flex items-center gap-2 text-sm font-semibold ${isDarkPortal ? 'text-teal-200' : 'text-[#013589]'}`}>
            <span
              className={`w-3.5 h-3.5 border-2 rounded-full animate-spin ${
                isDarkPortal ? 'border-teal-400/30 border-t-teal-400' : 'border-[#2559AF]/30 border-t-[#2559AF]'
              }`}
            ></span>
            <span>{isRtl ? 'جاري التحقق من جلسة العمل...' : 'Validating session...'}</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Gate: Direct user to clean Login Page
  if (!user) {
    return <LoginPage />;
  }

  // 3. Post-Authentication Dynamic Portal: Consultant Grid vs Owner Single-Project Routing
  if (!activeTenant) {
    return (
      <PostAuthPortal
        onSelectTenant={(tenant, isConsultant) => selectTenant(tenant, isConsultant)}
      />
    );
  }

  // 4. Authenticated & Tenant-Scoped Workspace: Full BizOS Workspace
  const primaryHex = customPalette.primaryAccent || '#3525cd';
  const pageBgHex = customPalette.pageBg || '#f0f7ff';
  const sidebarBgHex = customPalette.sidebarBg && customPalette.sidebarBg !== '#ffffff' ? customPalette.sidebarBg : primaryHex;

  const dynamicCanvasStyle: React.CSSProperties = {
    backgroundColor: pageBgHex,
    backgroundImage: `
      radial-gradient(circle at 85% 10%, ${hexToRgba(primaryHex, 0.14)} 0%, transparent 45%),
      radial-gradient(circle at 15% 85%, ${hexToRgba(sidebarBgHex, 0.1)} 0%, transparent 45%),
      linear-gradient(135deg, ${hexToRgba(primaryHex, 0.02)} 0%, ${pageBgHex} 50%, ${hexToRgba(primaryHex, 0.03)} 100%)
    `,
  };

  return (
    <div
      key={activeTenant.tenantId}
      style={dynamicCanvasStyle}
      className="min-h-screen text-[#131b2e] font-sans antialiased transition-colors duration-200 relative overflow-x-hidden"
    >
      {/* Static Ultra-Fast Aquatic Texture Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, ${primaryHex} 1px, transparent 1px)`,
            backgroundSize: '36px 36px'
          }}
        />
      </div>

      {/* Top Header */}
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Navigation Sidebar */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Viewport Responsive Grid */}
      <div className={`relative z-10 pt-16 lg:pt-18 pb-12 transition-all ${
        isRtl ? 'lg:pr-64 lg:pl-0 pr-0 pl-0' : 'lg:pl-64 lg:pr-0 pl-0 pr-0'
      }`}>
        <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
          {currentPage === 'home' && <HomePage />}
          {currentPage === 'operations' && <OperationsPage />}
          {currentPage === 'finance' && <FinancePage />}
          {currentPage === 'hr' && <HRPage />}
          {currentPage === 'marketing' && <MarketingPage />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}


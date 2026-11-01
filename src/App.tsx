import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
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
  const { currentPage, language, customPalette } = useApp();

  const isRtl = language === 'ar';

  const primaryHex = customPalette.primaryAccent || '#3525cd';
  const pageBgHex = customPalette.pageBg || '#f0f7ff';
  const sidebarBgHex = customPalette.sidebarBg && customPalette.sidebarBg !== '#ffffff' ? customPalette.sidebarBg : primaryHex;
  const topBarBgHex = customPalette.topBarBg && customPalette.topBarBg !== '#ffffff' ? customPalette.topBarBg : primaryHex;

  // Dynamic RGBA gradients matching the user's chosen palette (Lightweight GPU accelerated)
  const blob1Gradient = `radial-gradient(circle at 50% 50%, ${hexToRgba(primaryHex, 0.22)} 0%, ${hexToRgba(primaryHex, 0.05)} 60%, transparent 80%)`;
  const blob2Gradient = `radial-gradient(circle at 50% 50%, ${hexToRgba(sidebarBgHex, 0.2)} 0%, ${hexToRgba(primaryHex, 0.04)} 60%, transparent 80%)`;

  const dynamicCanvasStyle: React.CSSProperties = {
    backgroundColor: pageBgHex,
    backgroundImage: `radial-gradient(ellipse at 50% 0%, ${hexToRgba(primaryHex, 0.07)} 0%, transparent 70%), linear-gradient(135deg, ${hexToRgba(primaryHex, 0.03)} 0%, ${pageBgHex} 50%, ${hexToRgba(primaryHex, 0.04)} 100%)`,
  };

  return (
    <div
      style={dynamicCanvasStyle}
      className="min-h-screen text-[#131b2e] font-sans antialiased transition-colors duration-300 relative overflow-x-hidden"
    >
      {/* Dynamic Floating Animated Liquid Water Background Atmosphere (خفيفة وسلسة بأعلى سرعة) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Blob 1: Primary Selected Accent Water Glow */}
        <div
          style={{ background: blob1Gradient }}
          className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] rounded-full blur-2xl water-blob-1 pointer-events-none"
        />
        
        {/* Blob 2: Sidebar / Secondary Palette Reflection */}
        <div
          style={{ background: blob2Gradient }}
          className="absolute bottom-[-5%] left-[-5%] w-[520px] h-[520px] rounded-full blur-2xl water-blob-2 pointer-events-none"
        />

        {/* Dynamic Water Caustic Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, ${primaryHex} 1px, transparent 1px)`,
            backgroundSize: '36px 36px'
          }}
        />
      </div>

      {/* Top Header */}
      <Header />

      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className={`relative z-10 pt-18 pb-12 transition-all ${isRtl ? 'pr-64 pl-0' : 'pl-64 pr-0'}`}>
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
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
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

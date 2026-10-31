import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { OperationsPage } from './pages/OperationsPage';
import { FinancePage } from './pages/FinancePage';
import { HRPage } from './pages/HRPage';
import { MarketingPage } from './pages/MarketingPage';

const AppContent: React.FC = () => {
  const { currentPage, language, customPalette } = useApp();

  const isRtl = language === 'ar';

  return (
    <div
      style={{ backgroundColor: customPalette.pageBg || '#faf8ff' }}
      className="min-h-screen text-[#131b2e] font-sans antialiased transition-colors duration-200"
    >
      {/* Top Header */}
      <Header />

      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className={`pt-16 pb-12 transition-all ${isRtl ? 'pr-64 pl-0' : 'pl-64 pr-0'}`}>
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

import React, { useState } from 'react';
import { Globe, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { ProfnessNetworkBackground } from './ProfnessNetworkBackground';

export const LoginPage: React.FC = () => {
  const { signInWithPassword, signUp, resetPassword, signInWithGoogle, authError, setAuthError } = useAuth();
  const { language, setLanguage, isDarkPortal: isDarkMode, toggleDarkPortal } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const isRtl = language === 'ar';

  const resetFormState = () => {
    setLocalError(null);
    setSuccessMessage(null);
    setAuthError(null);
  };

  const getTranslatedError = (errorMsg: string): string => {
    if (!isRtl) return errorMsg;
    const lower = errorMsg.toLowerCase();
    if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
      return 'بيانات تسجيل الدخول غير صحيحة. يرجى التحقق من البريد وكلمة المرور.';
    }
    if (lower.includes('user already registered') || lower.includes('already exists')) {
      return 'هذا البريد الإلكتروني مسجل بالفعل. يمكنك تسجيل الدخول بدلاً من ذلك.';
    }
    if (lower.includes('password should be at least')) {
      return 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.';
    }
    if (lower.includes('email not confirmed')) {
      return 'يرجى تأكيد بريدك الإلكتروني أولاً عبر الرابط المرسل إلى صندوق الوارد.';
    }
    if (lower.includes('rate limit')) {
      return 'تم تجاوز حد المحاولات المسموح به. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.';
    }
    return errorMsg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!email.trim()) {
      setLocalError(isRtl ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email address');
      return;
    }

    if (mode === 'forgot') {
      setIsSubmitting(true);
      const res = await resetPassword(email);
      setIsSubmitting(false);
      if (res.error) {
        setLocalError(getTranslatedError(res.error.message));
      } else {
        setSuccessMessage(
          isRtl
            ? 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح.'
            : 'Password reset link sent to your email successfully.'
        );
      }
      return;
    }

    if (!password) {
      setLocalError(isRtl ? 'يرجى إدخال كلمة المرور' : 'Please enter your password');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setLocalError(
          isRtl
            ? 'كلمة المرور يجب أن تتكون من 6 أحرف أو أرقام على الأقل'
            : 'Password must be at least 6 characters'
        );
        return;
      }
      if (password !== confirmPassword) {
        setLocalError(
          isRtl
            ? 'كلمتا المرور غير متطابقتين'
            : 'Passwords do not match'
        );
        return;
      }

      setIsSubmitting(true);
      const res = await signUp(email, password, fullName);
      setIsSubmitting(false);

      if (res.error) {
        setLocalError(getTranslatedError(res.error.message));
      } else if (res.needsEmailConfirmation) {
        setSuccessMessage(
          isRtl
            ? 'تم إنشاء الحساب بنجاح! تفقد بريدك الإلكتروني لتأكيد التسجيل ثم سجّل الدخول.'
            : 'Account created successfully! Check your email to confirm registration then sign in.'
        );
        setMode('signin');
        setPassword('');
        setConfirmPassword('');
      } else {
        setSuccessMessage(
          isRtl ? 'مرحباً بك! تم إنشاء حسابك وتسجيل الدخول بنجاح.' : 'Welcome! Account created successfully.'
        );
      }
      return;
    }

    setIsSubmitting(true);
    const res = await signInWithPassword(email, password);
    setIsSubmitting(false);

    if (res.error) {
      setLocalError(getTranslatedError(res.error.message));
    }
  };

  const handleGoogleSignIn = async () => {
    resetFormState();
    setIsSubmitting(true);
    const res = await signInWithGoogle();
    setIsSubmitting(false);
    if (res.error) {
      setLocalError(getTranslatedError(res.error.message));
    }
  };

  const displayError = localError || (authError ? getTranslatedError(authError) : null);

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen w-full flex flex-col justify-between items-center relative overflow-hidden font-sans transition-colors duration-300 ${
        isDarkMode
          ? 'bg-[#060b14] text-slate-100 selection:bg-teal-500/30 selection:text-teal-200'
          : 'bg-[#F5F7FA] text-[#172B4D] selection:bg-[#EDF1F6] selection:text-[#013589]'
      }`}
    >
      {/* Ambient Background Layer (Dark Teal/Emerald vs Classic Light Blue) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <ProfnessNetworkBackground theme={isDarkMode ? 'dark' : 'light'} />

        {isDarkMode ? (
          <>
            <div
              className="absolute -top-44 left-1/2 -translate-x-1/2 w-[780px] h-[520px] rounded-full blur-[140px] opacity-60 animate-float-slow"
              style={{
                background:
                  'radial-gradient(circle, rgba(20, 184, 166, 0.22) 0%, rgba(16, 185, 129, 0.12) 45%, transparent 100%)',
              }}
            />
            <div
              className="absolute -bottom-48 -left-24 w-[540px] h-[540px] rounded-full blur-[150px] opacity-55"
              style={{
                background:
                  'radial-gradient(circle, rgba(13, 148, 136, 0.20) 0%, rgba(6, 182, 212, 0.08) 55%, transparent 100%)',
              }}
            />
            <div
              className="absolute -bottom-40 -right-24 w-[540px] h-[540px] rounded-full blur-[150px] opacity-50"
              style={{
                background:
                  'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(20, 184, 166, 0.08) 55%, transparent 100%)',
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, #2dd4bf 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
          </>
        ) : (
          <>
            <div
              className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[520px] rounded-full blur-[130px] opacity-75"
              style={{
                background:
                  'radial-gradient(circle, rgba(71, 126, 216, 0.22) 0%, rgba(37, 89, 175, 0.14) 45%, rgba(1, 53, 137, 0.06) 70%, transparent 100%)',
              }}
            />
            <div
              className="absolute -bottom-40 -left-24 w-[500px] h-[500px] rounded-full blur-[140px] opacity-60"
              style={{
                background:
                  'radial-gradient(circle, rgba(1, 53, 137, 0.16) 0%, rgba(71, 126, 216, 0.10) 50%, transparent 100%)',
              }}
            />
            <div
              className="absolute -bottom-36 -right-20 w-[550px] h-[550px] rounded-full blur-[150px] opacity-60"
              style={{
                background:
                  'radial-gradient(circle, rgba(37, 89, 175, 0.16) 0%, rgba(101, 223, 210, 0.08) 50%, transparent 100%)',
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, #2559AF 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
          </>
        )}
      </div>

      {/* Top Bar with Brand Logo, Theme Switcher & Language Switcher */}
      <header className="w-full px-6 sm:px-10 lg:px-12 py-5 sm:py-6 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3">
          {isDarkMode ? (
            <div className="w-10 h-10 rounded-xl bg-slate-900/80 border border-teal-500/25 flex items-center justify-center shadow-lg shadow-teal-500/10">
              <img
                src="/assets/aistudio/profness_v6-removebg-preview__1__59596515.png"
                alt="Profness Icon"
                className="h-7 w-7 object-contain"
              />
            </div>
          ) : (
            <img
              src="/assets/aistudio/profness_v6-removebg-preview__1__59596515.png"
              alt="Profness Icon"
              className="h-9 sm:h-10 w-auto object-contain shrink-0 filter drop-shadow-xs transition-transform hover:scale-105"
            />
          )}
          <img
            src="/assets/aistudio/Profness_Full_Logo_transparent.png"
            alt="Profness"
            className={`h-5 sm:h-6 w-auto object-contain select-none transition-all ${
              isDarkMode ? 'brightness-0 invert opacity-95' : 'sm:h-7'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleDarkPortal}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer backdrop-blur-md shrink-0 ${
              isDarkMode
                ? 'border-teal-500/20 bg-slate-900/60 hover:bg-slate-900/90 hover:border-teal-400/40 text-slate-200 hover:text-teal-300 shadow-lg'
                : 'border-[#DCE3ED] bg-white/80 hover:bg-white hover:border-[#2559AF]/50 text-[#172B4D] shadow-xs'
            }`}
            title={
              isDarkMode
                ? isRtl
                  ? 'التبديل إلى الوضع المضيء'
                  : 'Switch to Light Mode'
                : isRtl
                  ? 'التبديل إلى الوضع الليلي'
                  : 'Switch to Dark Mode'
            }
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline font-bold">
                  {isRtl ? 'الوضع المضيء' : 'Light'}
                </span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#2559AF]" />
                <span className="hidden sm:inline font-bold">
                  {isRtl ? 'الوضع الليلي' : 'Dark'}
                </span>
              </>
            )}
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer backdrop-blur-md shrink-0 ${
              isDarkMode
                ? 'border-teal-500/20 bg-slate-900/60 hover:bg-slate-900/90 hover:border-teal-400/40 text-slate-200 hover:text-teal-300 shadow-lg'
                : 'border-[#DCE3ED] bg-white/80 hover:bg-white hover:border-[#2559AF]/50 text-[#172B4D] shadow-xs'
            }`}
            title="Switch Language / تغيير اللغة"
          >
            <Globe className={`w-3.5 h-3.5 ${isDarkMode ? 'text-teal-400' : 'text-[#2559AF]'}`} />
            <span className="text-xs font-bold">{language === 'en' ? 'العربية' : 'English'}</span>
          </button>
        </div>
      </header>

      {/* Main Form Centerpiece */}
      <div className="w-full flex-1 flex flex-col items-center justify-center px-4 py-8 z-10 relative">
        {/* Status Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 mb-4 text-[11px] font-bold tracking-widest uppercase backdrop-blur-md transition-all ${
            isDarkMode
              ? 'rounded-lg bg-teal-500/10 border border-teal-400/25 text-teal-300 shadow-[0_0_20px_rgba(20,184,166,0.12)]'
              : 'rounded-full bg-white/80 border border-[#DCE3ED] text-[#013589] shadow-[0_2px_10px_-2px_rgba(1,53,137,0.10)]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full animate-pulse ${
              isDarkMode
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.95)]'
                : 'bg-[#65DFD2] shadow-[0_0_8px_rgba(101,223,210,0.85)]'
            }`}
          />
          <span>
            {mode === 'signin' && (isRtl ? 'مرحباً بك مجدداً' : 'WELCOME BACK')}
            {mode === 'signup' && (isRtl ? 'حساب جديد' : 'CREATE ACCOUNT')}
            {mode === 'forgot' && (isRtl ? 'استعادة الحساب' : 'RESET PASSWORD')}
          </span>
        </div>

        {/* Heading */}
        <h1
          className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 text-center transition-colors ${
            isDarkMode ? 'text-white' : 'text-[#013589]'
          }`}
        >
          {mode === 'signin' && (isRtl ? 'تسجيل الدخول' : 'Sign in')}
          {mode === 'signup' && (isRtl ? 'إنشاء حساب جديد' : 'Create an account')}
          {mode === 'forgot' && (isRtl ? 'استعادة كلمة المرور' : 'Reset password')}
        </h1>

        {/* Subtitle */}
        <p
          className={`text-sm sm:text-base max-w-sm text-center mb-8 font-normal leading-relaxed transition-colors ${
            isDarkMode ? 'text-slate-300/85' : 'text-[#68778D]'
          }`}
        >
          {mode === 'signin' &&
            (isRtl
              ? 'تابع عملك من حيث توقفت في مساحة العمل الخاصة بك.'
              : 'Pick up where you left off in your workspace.')}
          {mode === 'signup' &&
            (isRtl
              ? 'ابدأ إدارة أعمالك ومبيعاتك وفواتيرك ومخزونك بكل احترافية.'
              : 'Start managing your sales, inventory, and finances in seconds.')}
          {mode === 'forgot' &&
            (isRtl
              ? 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.'
              : 'Enter your email address and we will send you a reset link.')}
        </p>

        {/* Auth Card */}
        <div
          className={`w-full max-w-[430px] rounded-3xl p-7 sm:p-9 transition-all relative overflow-hidden ${
            isDarkMode
              ? 'bg-slate-900/40 backdrop-blur-xl border border-teal-500/20 shadow-2xl'
              : 'bg-white/95 backdrop-blur-2xl border border-[#DCE3ED]/80'
          }`}
          style={
            isDarkMode
              ? undefined
              : {
                  boxShadow: `
                    0 30px 70px -15px rgba(1, 53, 137, 0.12),
                    0 15px 35px -10px rgba(37, 89, 175, 0.08),
                    0 4px 12px rgba(0, 0, 0, 0.03),
                    inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)
                  `,
                }
          }
        >
          {isDarkMode && (
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" />
          )}

          {/* Error Banner */}
          {displayError && (
            <div
              className={`mb-5 p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
                isDarkMode
                  ? 'bg-rose-950/60 border-rose-500/35 text-rose-200'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              <span
                className={`material-symbols-outlined text-base shrink-0 mt-0.5 ${
                  isDarkMode ? 'text-rose-400' : 'text-rose-600'
                }`}
              >
                error
              </span>
              <span className="leading-relaxed flex-1">{displayError}</span>
              <button
                type="button"
                onClick={resetFormState}
                className={`text-sm font-bold ml-1 cursor-pointer ${
                  isDarkMode ? 'text-rose-400 hover:text-rose-200' : 'text-rose-400 hover:text-rose-700'
                }`}
              >
                ×
              </button>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div
              className={`mb-5 p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
                isDarkMode
                  ? 'bg-emerald-950/55 border-emerald-500/35 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <span
                className={`material-symbols-outlined text-base shrink-0 mt-0.5 ${
                  isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                }`}
              >
                check_circle
              </span>
              <span className="leading-relaxed flex-1">{successMessage}</span>
              <button
                type="button"
                onClick={resetFormState}
                className={`text-sm font-bold ml-1 cursor-pointer ${
                  isDarkMode ? 'text-emerald-400 hover:text-emerald-200' : 'text-emerald-400 hover:text-emerald-700'
                }`}
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field (Sign Up Only) */}
            {mode === 'signup' && (
              <div>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${
                    isDarkMode ? 'text-slate-200' : 'text-[#172B4D]'
                  }`}
                >
                  {isRtl ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isRtl ? 'مثال: محمد أحمد' : 'e.g. John Doe'}
                  className={`w-full px-4 py-2.5 sm:py-3 rounded-xl text-sm focus:outline-none transition-all ${
                    isDarkMode
                      ? 'bg-slate-950/75 border border-teal-500/25 text-slate-100 placeholder-slate-500 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20'
                      : 'bg-white border border-[#DCE3ED] text-[#172B4D] placeholder-[#8A9BB4] focus:border-[#2559AF] focus:ring-4 focus:ring-[#2559AF]/10'
                  }`}
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${
                  isDarkMode ? 'text-slate-200' : 'text-[#172B4D]'
                }`}
              >
                {isRtl ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
                className={`w-full px-4 py-2.5 sm:py-3 rounded-xl text-sm focus:outline-none transition-all text-start ${
                  isDarkMode
                    ? 'bg-slate-950/75 border border-teal-500/25 text-slate-100 placeholder-slate-500 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20'
                    : 'bg-white border border-[#DCE3ED] text-[#172B4D] placeholder-[#8A9BB4] focus:border-[#2559AF] focus:ring-4 focus:ring-[#2559AF]/10'
                }`}
                dir="ltr"
              />
            </div>

            {/* Password Field (Sign In & Sign Up) */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className={`text-xs font-semibold ${
                      isDarkMode ? 'text-slate-200' : 'text-[#172B4D]'
                    }`}
                  >
                    {isRtl ? 'كلمة المرور' : 'Password'}
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        resetFormState();
                        setMode('forgot');
                      }}
                      className={`text-xs font-medium hover:underline transition-colors cursor-pointer ${
                        isDarkMode
                          ? 'text-teal-300 hover:text-teal-200'
                          : 'text-[#2559AF] hover:text-[#013589]'
                      }`}
                    >
                      {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    className={`w-full ${isRtl ? 'pl-11 pr-4' : 'pr-11 pl-4'} py-2.5 sm:py-3 rounded-xl text-sm focus:outline-none transition-all ${
                      isDarkMode
                        ? 'bg-slate-950/75 border border-teal-500/25 text-slate-100 placeholder-slate-500 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20'
                        : 'bg-white border border-[#DCE3ED] text-[#172B4D] placeholder-[#8A9BB4] focus:border-[#2559AF] focus:ring-4 focus:ring-[#2559AF]/10'
                    }`}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className={`absolute top-1/2 -translate-y-1/2 ${
                      isRtl ? 'left-3' : 'right-3'
                    } transition-colors cursor-pointer flex items-center justify-center p-1 ${
                      isDarkMode ? 'text-slate-400 hover:text-teal-300' : 'text-[#68778D] hover:text-[#172B4D]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password Field (Sign Up Only) */}
            {mode === 'signup' && (
              <div>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${
                    isDarkMode ? 'text-slate-200' : 'text-[#172B4D]'
                  }`}
                >
                  {isRtl ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full px-4 py-2.5 sm:py-3 rounded-xl text-sm focus:outline-none transition-all ${
                    isDarkMode
                      ? 'bg-slate-950/75 border border-teal-500/25 text-slate-100 placeholder-slate-500 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20'
                      : 'bg-white border border-[#DCE3ED] text-[#172B4D] placeholder-[#8A9BB4] focus:border-[#2559AF] focus:ring-4 focus:ring-[#2559AF]/10'
                  }`}
                  dir="ltr"
                />
              </div>
            )}

            {/* Primary Action Button */}
            <div className="pt-2 relative group">
              {isDarkMode ? (
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-400 opacity-40 blur-lg group-hover:opacity-75 transition-opacity duration-300 pointer-events-none" />
              ) : (
                <div
                  className="absolute inset-0 rounded-2xl opacity-75 blur-xl group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, #013589 0%, #2559AF 50%, #477ED8 100%)',
                    transform: 'translateY(6px) scale(0.95)',
                  }}
                />
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`relative w-full py-3.5 px-4 font-extrabold text-sm rounded-2xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-xl shadow-teal-500/25 border border-teal-300/30'
                    : 'bg-gradient-to-r from-[#013589] via-[#2559AF] to-[#477ED8] hover:from-[#002B70] hover:via-[#1F4C97] hover:to-[#3B6DC4] text-white font-bold shadow-[0_12px_28px_-6px_rgba(1,53,137,0.55),0_4px_12px_rgba(0,0,0,0.1)] border border-white/25'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span
                      className={`w-4 h-4 border-2 rounded-full animate-spin ${
                        isDarkMode ? 'border-slate-950/30 border-t-slate-950' : 'border-white/30 border-t-white'
                      }`}
                    />
                    <span>{isRtl ? 'جاري المعالجة...' : 'Processing...'}</span>
                  </>
                ) : (
                  <span className="tracking-wide">
                    {mode === 'signin' && (isRtl ? 'تسجيل الدخول' : 'Sign in')}
                    {mode === 'signup' && (isRtl ? 'إنشاء حساب جديد' : 'Create account')}
                    {mode === 'forgot' && (isRtl ? 'إرسال رابط الاستعادة' : 'Send reset link')}
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Social Divider & Google Button */}
          {mode !== 'forgot' && (
            <>
              <div className="relative my-6 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div
                    className={`w-full h-px bg-gradient-to-r from-transparent to-transparent ${
                      isDarkMode ? 'via-teal-500/25' : 'via-[#DCE3ED]'
                    }`}
                  />
                </div>
                <div className="relative flex justify-center">
                  <span
                    className={`px-3.5 py-0.5 backdrop-blur-md border text-[10px] font-bold uppercase tracking-widest ${
                      isDarkMode
                        ? 'rounded-lg bg-slate-900/95 border-teal-500/20 text-slate-400'
                        : 'rounded-full bg-white/90 border-[#DCE3ED] text-[#68778D] shadow-[0_2px_8px_-2px_rgba(1,53,137,0.06)]'
                    }`}
                  >
                    {isRtl ? 'أو' : 'OR'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className={`w-full py-3 px-4 font-semibold text-xs rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99] disabled:opacity-60 backdrop-blur-sm group border ${
                  isDarkMode
                    ? 'bg-slate-950/60 hover:bg-slate-900/90 border-teal-500/20 hover:border-teal-400/45 text-slate-100 shadow-lg'
                    : 'bg-white/80 hover:bg-white border-[#DCE3ED] hover:border-[#2559AF]/50 text-[#172B4D] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_-4px_rgba(1,53,137,0.12)]'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center transition-transform group-hover:scale-105">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <span
                  className={`tracking-tight transition-colors ${
                    isDarkMode
                      ? 'text-slate-200 group-hover:text-teal-200'
                      : 'text-[#172B4D] group-hover:text-[#013589]'
                  }`}
                >
                  {isRtl ? 'متابعة باستخدام Google' : 'Continue with Google'}
                </span>
              </button>
            </>
          )}

          {/* Back to sign in for forgot password */}
          {mode === 'forgot' && (
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => {
                  resetFormState();
                  setMode('signin');
                }}
                className={`text-xs font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer ${
                  isDarkMode ? 'text-teal-300 hover:text-teal-200' : 'text-[#2559AF] hover:text-[#013589]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {isRtl ? 'arrow_forward' : 'arrow_back'}
                </span>
                <span>{isRtl ? 'العودة لتسجيل الدخول' : 'Back to sign in'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Toggle beneath card */}
        <div
          className={`mt-6 text-center text-xs sm:text-sm ${
            isDarkMode ? 'text-slate-400' : 'text-[#68778D]'
          }`}
        >
          {mode === 'signin' && (
            <p>
              {isRtl ? 'جديد في Profness؟ ' : 'New to Profness? '}
              <button
                type="button"
                onClick={() => {
                  resetFormState();
                  setMode('signup');
                }}
                className={`font-semibold hover:underline cursor-pointer ${
                  isDarkMode ? 'text-teal-300 hover:text-teal-200' : 'text-[#2559AF] hover:text-[#013589]'
                }`}
              >
                {isRtl ? 'إنشاء حساب جديد' : 'Create an account'}
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p>
              {isRtl ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  resetFormState();
                  setMode('signin');
                }}
                className={`font-semibold hover:underline cursor-pointer ${
                  isDarkMode ? 'text-teal-300 hover:text-teal-200' : 'text-[#2559AF] hover:text-[#013589]'
                }`}
              >
                {isRtl ? 'تسجيل الدخول' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Subtle Bottom Credit */}
      <footer className={`w-full text-center py-5 text-xs z-10 ${isDarkMode ? 'text-slate-500' : 'text-[#68778D]'}`}>
        <span>
          Profness Cloud •{' '}
          {isRtl ? 'منصة العمليات وإدارة الأعمال الاحترافية' : 'Professional Business Operations Platform'}
        </span>
      </footer>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export const LoginPage: React.FC = () => {
  const { signInWithPassword, signUp, resetPassword, signInWithGoogle, authError, setAuthError } = useAuth();
  const { language, setLanguage } = useApp();

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

    // Sign in mode
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
      className="min-h-screen w-full flex flex-col justify-between items-center relative overflow-hidden bg-[#f8f9fd] text-slate-900 font-sans"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 15%, rgba(124, 58, 237, 0.15) 0%, transparent 48%),
          radial-gradient(circle at 85% 85%, rgba(99, 102, 241, 0.12) 0%, transparent 45%),
          radial-gradient(circle at 15% 75%, rgba(168, 85, 247, 0.10) 0%, transparent 45%),
          linear-gradient(180deg, #f8f9fd 0%, #ffffff 100%)
        `,
      }}
    >
      {/* Top Bar with Brand Logo and Language Toggle */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        {/* Brand Logo matching the screenshot */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex flex-col items-center justify-center gap-1 shadow-md shadow-indigo-500/20">
            <span className="w-4 h-0.5 bg-white rounded-full"></span>
            <span className="w-4 h-0.5 bg-white/90 rounded-full"></span>
            <span className="w-2.5 h-0.5 bg-white/80 rounded-full self-start ml-2.5"></span>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">BizOS</span>
        </div>

        {/* Language Switcher */}
        <button
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white/90 hover:bg-white text-slate-700 text-xs font-semibold shadow-xs hover:border-slate-300 transition-all cursor-pointer"
          title="Switch Language / تغيير اللغة"
        >
          <span className="material-symbols-outlined text-sm text-indigo-600">translate</span>
          <span className="uppercase text-[11px] font-bold">{language === 'en' ? 'العربية' : 'English'}</span>
        </button>
      </header>

      {/* Main Form Centerpiece */}
      <div className="w-full flex-1 flex flex-col items-center justify-center px-4 py-8 z-10">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100/90 border border-slate-200/60 shadow-xs mb-3 text-slate-600 text-[11px] font-bold tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
          <span>
            {mode === 'signin' && (isRtl ? 'مرحباً بك مجدداً' : 'WELCOME BACK')}
            {mode === 'signup' && (isRtl ? 'حساب جديد' : 'CREATE ACCOUNT')}
            {mode === 'forgot' && (isRtl ? 'استعادة الحساب' : 'RESET PASSWORD')}
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2 text-center">
          {mode === 'signin' && (isRtl ? 'تسجيل الدخول' : 'Sign in')}
          {mode === 'signup' && (isRtl ? 'إنشاء حساب جديد' : 'Create an account')}
          {mode === 'forgot' && (isRtl ? 'استعادة كلمة المرور' : 'Reset password')}
        </h1>

        {/* Subtitle */}
        <p className="text-slate-500 text-sm sm:text-base max-w-sm text-center mb-7 font-normal">
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

        {/* Clean Center Card with Glassmorphism depth */}
        <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-xl rounded-3xl border border-white/90 p-7 sm:p-8 shadow-[0_25px_60px_-15px_rgba(124,58,237,0.14),0_10px_25px_-5px_rgba(0,0,0,0.05)] transition-all">
          {/* Error Banner */}
          {displayError && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2 animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-base shrink-0 text-rose-600 mt-0.5">error</span>
              <span className="leading-relaxed flex-1">{displayError}</span>
              <button
                type="button"
                onClick={resetFormState}
                className="text-rose-400 hover:text-rose-700 text-sm font-bold ml-1 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2 animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-base shrink-0 text-emerald-600 mt-0.5">check_circle</span>
              <span className="leading-relaxed flex-1">{successMessage}</span>
              <button
                type="button"
                onClick={resetFormState}
                className="text-emerald-400 hover:text-emerald-700 text-sm font-bold ml-1 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field (Sign Up Only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isRtl ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isRtl ? 'مثال: محمد أحمد' : 'e.g. John Doe'}
                    className="w-full px-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isRtl ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isRtl ? 'name@company.com' : 'name@company.com'}
                autoComplete="email"
                className="w-full px-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all text-start"
                dir="ltr"
              />
            </div>

            {/* Password Field (Sign In & Sign Up) */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    {isRtl ? 'كلمة المرور' : 'Password'}
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        resetFormState();
                        setMode('forgot');
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline transition-colors cursor-pointer"
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
                    className={`w-full ${isRtl ? 'pl-11 pr-4' : 'pr-11 pl-4'} py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all`}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className={`absolute top-1/2 -translate-y-1/2 ${
                      isRtl ? 'left-3' : 'right-3'
                    } text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center justify-center p-1`}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isRtl ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  dir="ltr"
                />
              </div>
            )}

            {/* Submit Primary Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:via-indigo-700 hover:to-indigo-800 text-white font-bold text-sm rounded-2xl shadow-[0_15px_30px_-5px_rgba(124,58,237,0.45)] hover:shadow-[0_20px_35px_-5px_rgba(124,58,237,0.6)] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/20"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>{isRtl ? 'جاري المعالجة...' : 'Processing...'}</span>
                  </>
                ) : (
                  <span>
                    {mode === 'signin' && (isRtl ? 'تسجيل الدخول' : 'Sign in')}
                    {mode === 'signup' && (isRtl ? 'إنشاء حساب جديد' : 'Create account')}
                    {mode === 'forgot' && (isRtl ? 'إرسال رابط الاستعادة' : 'Send reset link')}
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Social Divider & Google Button (Only in Signin / Signup) */}
          {mode !== 'forgot' && (
            <>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/80"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                    {isRtl ? 'أو' : 'OR'}
                  </span>
                </div>
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-2.5 sm:py-3 px-4 bg-white hover:bg-slate-50/80 border border-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99] disabled:opacity-60"
              >
                {/* Official Google Icon */}
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
                <span>{isRtl ? 'متابعة باستخدام Google' : 'Continue with Google'}</span>
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
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
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
        <div className="mt-6 text-center text-xs sm:text-sm text-slate-500">
          {mode === 'signin' && (
            <p>
              {isRtl ? 'جديد في BizOS؟ ' : 'New to BizOS? '}
              <button
                type="button"
                onClick={() => {
                  resetFormState();
                  setMode('signup');
                }}
                className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline cursor-pointer"
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
                className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline cursor-pointer"
              >
                {isRtl ? 'تسجيل الدخول' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Subtle Bottom Credit */}
      <footer className="w-full text-center py-4 text-[11px] text-slate-400 z-10">
        <span>BizOS Cloud Workspace • {isRtl ? 'نظام تشغيل وإدارة المؤسسات' : 'Business Operations System'}</span>
      </footer>
    </div>
  );
};

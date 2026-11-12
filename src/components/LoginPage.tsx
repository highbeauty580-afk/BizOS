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
      className="min-h-screen w-full flex flex-col justify-between items-center relative overflow-hidden bg-[#faf8ff] text-slate-900 font-sans selection:bg-purple-100 selection:text-purple-900"
    >
      {/* Ambient Purple Mesh Gradient Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top/Center soft glowing purple orb */}
        <div 
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[520px] rounded-full blur-[130px] opacity-75"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.28) 0%, rgba(124, 58, 237, 0.18) 45%, rgba(99, 102, 241, 0.08) 70%, transparent 100%)',
          }}
        />
        {/* Bottom Left ambient glow */}
        <div 
          className="absolute -bottom-40 -left-24 w-[500px] h-[500px] rounded-full blur-[140px] opacity-60"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.22) 0%, rgba(192, 132, 252, 0.12) 50%, transparent 100%)',
          }}
        />
        {/* Bottom Right ambient glow */}
        <div 
          className="absolute -bottom-36 -right-20 w-[550px] h-[550px] rounded-full blur-[150px] opacity-60"
          style={{
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.20) 0%, rgba(99, 102, 241, 0.12) 50%, transparent 100%)',
          }}
        />
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, #7c3aed 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Top Bar with Brand Logo and Language Toggle */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-10 relative">
        {/* Brand Logo matching the screenshot */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 flex flex-col items-center justify-center gap-1 shadow-md shadow-purple-600/25">
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-200/70 bg-white/80 hover:bg-white text-slate-700 text-xs font-semibold shadow-xs hover:border-purple-300 transition-all cursor-pointer backdrop-blur-md"
          title="Switch Language / تغيير اللغة"
        >
          <span className="material-symbols-outlined text-sm text-purple-600">translate</span>
          <span className="uppercase text-[11px] font-bold">{language === 'en' ? 'العربية' : 'English'}</span>
        </button>
      </header>

      {/* Main Form Centerpiece */}
      <div className="w-full flex-1 flex flex-col items-center justify-center px-4 py-8 z-10 relative">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-purple-200/80 shadow-[0_2px_10px_-2px_rgba(124,58,237,0.15)] mb-3.5 text-purple-900 text-[11px] font-bold tracking-widest uppercase backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>
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
        <p className="text-slate-500 text-sm sm:text-base max-w-sm text-center mb-8 font-normal leading-relaxed">
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

        {/* Floating Card with Deep Diffused Soft Shadows & Glassmorphism Depth */}
        <div 
          className="w-full max-w-[420px] bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/80 p-7 sm:p-9 transition-all relative"
          style={{
            boxShadow: `
              0 30px 70px -15px rgba(124, 58, 237, 0.16),
              0 15px 35px -10px rgba(99, 102, 241, 0.12),
              0 4px 12px rgba(0, 0, 0, 0.03),
              inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)
            `,
          }}
        >
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

            {/* Submit Primary Action Button with Vibrant Purple Gradient & 3D Layered Glow */}
            <div className="pt-2 relative group">
              {/* Colored Glow Shadow Underneath */}
              <div 
                className="absolute inset-0 rounded-2xl opacity-75 blur-xl group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 50%, #6366f1 100%)',
                  transform: 'translateY(6px) scale(0.95)',
                }}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-800 text-white font-bold text-sm rounded-2xl shadow-[0_12px_28px_-6px_rgba(124,58,237,0.55),0_4px_12px_rgba(0,0,0,0.1)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 border border-white/25"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
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

          {/* Social Divider & Google Button (Only in Signin / Signup) */}
          {mode !== 'forgot' && (
            <>
              {/* Modern SaaS Divider with Sleek Pill */}
              <div className="relative my-6 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-200/80 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-purple-100/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-[0_2px_8px_-2px_rgba(124,58,237,0.08)]">
                    {isRtl ? 'أو' : 'OR'}
                  </span>
                </div>
              </div>

              {/* Continue with Google - Refined High-End SaaS Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-white/80 hover:bg-white border border-slate-200/80 hover:border-purple-200 text-slate-700 font-semibold text-xs rounded-2xl transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_-4px_rgba(124,58,237,0.12)] flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99] disabled:opacity-60 backdrop-blur-sm group"
              >
                {/* Official Google Icon */}
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
                <span className="tracking-tight text-slate-700 group-hover:text-slate-900 transition-colors">
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

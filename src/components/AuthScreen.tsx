import React, { useState, useEffect } from 'react';
import { Shield, Lock, Key, ArrowLeft, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { FirebaseVaultService } from '../services/firebaseRtdb';
import { Language, translations } from '../utils/i18n';

interface AuthScreenProps {
  onUnlock: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onUnlock, lang, setLang }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const t = translations[lang];

  useEffect(() => {
    async function checkSetup() {
      try {
        setIsCheckingSetup(true);
        const exists = await FirebaseVaultService.checkAdminPasswordExists();
        setIsFirstTime(!exists);
      } catch (err) {
        console.error('Error during setup check:', err);
      } finally {
        setIsCheckingSetup(false);
      }
    }
    checkSetup();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError(t.passwordEmpty);
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      if (isFirstTime) {
        if (password !== confirmPassword) {
          setError(t.passwordMismatch);
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError(lang === 'ar' ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف' : 'Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }

        await FirebaseVaultService.setAdminPassword(password);
        setSuccessMsg(lang === 'ar' ? 'تم تأمين الخزنة بنجاح!' : 'Vault secured successfully!');
        setTimeout(() => {
          onUnlock();
        }, 600);
      } else {
        const result = await FirebaseVaultService.verifyAdminPassword(password);
        if (result.success) {
          setSuccessMsg(lang === 'ar' ? 'تم التحقق بنجاح، جارٍ فتح الخزنة...' : 'Verified, opening vault...');
          setTimeout(() => {
            onUnlock();
          }, 400);
        } else if (result.isFirstTimeSetup) {
          setIsFirstTime(true);
          setError(null);
        } else {
          setError(t.wrongPassword);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(lang === 'ar' ? 'تعذر الاتصال بقاعدة بيانات Firebase، يرجى المحاولة لاحقاً' : 'Failed to connect to Firebase, check internet connection');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-neutral-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-cairo select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header controls: Language selector */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-xs text-neutral-400 bg-neutral-900/80 border border-neutral-800/80 px-3 py-1.5 rounded-lg backdrop-blur-sm">
          <Database className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-mono text-[11px] text-neutral-300">Firebase RTDB Connected</span>
        </div>
        <button
          type="button"
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="px-3 py-1.5 text-xs font-semibold bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>{lang === 'ar' ? 'English (LTR)' : 'العربية (RTL)'}</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-neutral-900/90 border border-neutral-800 shadow-2xl rounded-2xl p-8 backdrop-blur-xl relative z-10 transition-all duration-300">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center mb-4 shadow-lg shadow-emerald-950/40 relative group">
            <Shield className="w-8 h-8 text-emerald-400 transition-transform group-hover:scale-110 duration-300" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-neutral-900 border border-emerald-500/40 rounded-full flex items-center justify-center">
              <Lock className="w-3 h-3 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mb-2 font-cairo">
            {isFirstTime ? t.firstTimeTitle : t.loginTitle}
          </h1>
          <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
            {isFirstTime ? t.firstTimeSubtitle : t.loginSubtitle}
          </p>
        </div>

        {isCheckingSetup ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-neutral-400">{t.connectingToFirebase}</span>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl flex items-center gap-2.5 text-xs text-red-300 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-300">
                {isFirstTime ? (lang === 'ar' ? 'تعيين كلمة المرور الرئيسية' : 'New Master Password') : t.passwordField}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-neutral-500">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  autoFocus
                  placeholder={t.passwordPlaceholder}
                  className="w-full bg-neutral-950/80 border border-neutral-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-white placeholder-neutral-500 text-sm rounded-xl px-10 py-3 transition-colors outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isFirstTime && (
              <div className="space-y-1.5 animate-in fade-in">
                <label className="block text-xs font-medium text-neutral-300">
                  {lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-neutral-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.confirmPasswordPlaceholder}
                    className="w-full bg-neutral-950/80 border border-neutral-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-white placeholder-neutral-500 text-sm rounded-xl px-10 py-3 transition-colors outline-none font-mono"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isFirstTime ? t.setupButton : t.unlockButton}</span>
                  {lang === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-neutral-800/80 flex flex-col items-center gap-1 text-[11px] text-neutral-500 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Path: /admin/password</span>
          </div>
          <span className="text-neutral-600 text-[10px] truncate max-w-full">
            studio-7413069484-7dc65-default-rtdb.firebaseio.com
          </span>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  Key, 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Copy, 
  Check, 
  RefreshCw,
  Code2
} from 'lucide-react';
import { FirebaseVaultService, AdminStatusResult } from '../services/firebaseRtdb';
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
  
  // Status from Firebase
  const [status, setStatus] = useState<AdminStatusResult>({ hasPassword: false, isPermissionDenied: false });
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Database Secret Drawer / Modal
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [secretInput, setSecretInput] = useState(FirebaseVaultService.getDbSecret());
  const [copiedRules, setCopiedRules] = useState(false);

  const t = translations[lang];

  const checkStatus = async () => {
    try {
      setIsCheckingSetup(true);
      setError(null);
      const res = await FirebaseVaultService.checkAdminPasswordStatus();
      setStatus(res);
      if (res.isPermissionDenied) {
        setError(res.errorMessage || (lang === 'ar' 
          ? 'قاعدة بيانات Firebase مقفلة بصلاحيات الأمان (Permission Denied). يرجى ضبط القواعد أو إدخال Database Secret.' 
          : 'Firebase Database is locked (Permission Denied). Please configure rules or provide Database Secret.'));
      }
    } catch (err: any) {
      console.error('Error during setup check:', err);
      setError(lang === 'ar' ? 'تعذر الاتصال بقاعدة بيانات Firebase' : 'Failed to connect to Firebase');
    } finally {
      setIsCheckingSetup(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleSaveSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    FirebaseVaultService.setDbSecret(secretInput.trim());
    setShowSecretModal(false);
    await checkStatus();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError(t.passwordEmpty);
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      // First Time Setup Mode
      if (!status.hasPassword && !status.isPermissionDenied) {
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

        const res = await FirebaseVaultService.setAdminPassword(password);
        if (!res.success) {
          setError(res.error || (lang === 'ar' ? 'تعذر حفظ كلمة المرور في Firebase' : 'Failed to save password in Firebase'));
          setIsLoading(false);
          return;
        }

        setSuccessMsg(lang === 'ar' ? 'تم تأمين وتشفير الخزنة في Firebase بنجاح!' : 'Vault secured successfully in Firebase!');
        setTimeout(() => {
          onUnlock();
        }, 600);
      } else {
        // Unlock existing vault
        const result = await FirebaseVaultService.verifyAdminPassword(password);
        if (result.success) {
          setSuccessMsg(lang === 'ar' ? 'تم التحقق بنجاح، جارٍ فتح الخزنة...' : 'Verified, opening vault...');
          setTimeout(() => {
            onUnlock();
          }, 400);
        } else if (result.isPermissionDenied) {
          setError(result.errorMessage || (lang === 'ar' ? 'صلاحيات Firebase تمنع القراءة (Permission Denied)' : 'Firebase permissions denied'));
          setStatus(prev => ({ ...prev, isPermissionDenied: true }));
        } else {
          setError(t.wrongPassword);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(lang === 'ar' ? 'حدث خطأ أثناء الاتصال بقاعدة البيانات' : 'Error connecting to database');
    } finally {
      setIsLoading(false);
    }
  };

  const recommendedRules = `{
  "rules": {
    "admin": {
      ".read": true,
      ".write": "!data.exists() || (data.exists() && newData.child('password_hash').exists())"
    },
    "vault": {
      ".read": true,
      ".write": true
    }
  }
}`;

  const copyRulesToClipboard = () => {
    navigator.clipboard.writeText(recommendedRules);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  const isFirstTime = !status.hasPassword && !status.isPermissionDenied;

  return (
    <div className="min-h-screen bg-[#07090e] text-neutral-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-cairo select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header controls: Language selector and Database Secret button */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <button
          type="button"
          onClick={() => setShowSecretModal(true)}
          className="px-3 py-1.5 text-xs font-semibold bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800/80 rounded-lg text-neutral-300 transition-colors flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
        >
          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
          <span>{lang === 'ar' ? 'مفتاح الحماية السري (Database Secret)' : 'Database Secret'}</span>
        </button>

        <button
          type="button"
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="px-3 py-1.5 text-xs font-semibold bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 transition-colors flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
        >
          <span>{lang === 'ar' ? 'English (LTR)' : 'العربية (RTL)'}</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-neutral-900/90 border border-neutral-800 shadow-2xl rounded-2xl p-8 backdrop-blur-xl relative z-10 transition-all duration-300">
        <div className="flex flex-col items-center text-center mb-6">
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
        ) : status.isPermissionDenied ? (
          /* Firebase RTDB Permission Denied Alert & Solution Box */
          <div className="space-y-4">
            <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl space-y-2 text-xs text-amber-200">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{lang === 'ar' ? 'قاعدة بيانات Firebase مقفلة' : 'Firebase Database is Locked'}</span>
              </div>
              <p className="leading-relaxed text-[11px] text-amber-200/90">
                {lang === 'ar' 
                  ? 'قواعد الأمان (Security Rules) في Firebase ترفض الوصول حالياً (Permission Denied). لحل ذلك بأعلى درجات الأمان:'
                  : 'Firebase Security Rules are currently denying read/write. To unlock securely:'}
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowRulesModal(true)}
                className="w-full py-2.5 px-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700/80 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'ar' ? 'نسخ قواعد Firebase الآمنة (Rules)' : 'Copy Recommended Security Rules'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSecretModal(true)}
                className="w-full py-2.5 px-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700/80 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>{lang === 'ar' ? 'إدخال Database Secret (المفتاح السري)' : 'Enter Database Secret'}</span>
              </button>

              <button
                type="button"
                onClick={checkStatus}
                className="w-full mt-2 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'إعادة فحص الاتصال بـ Firebase' : 'Retry Connection'}</span>
              </button>
            </div>
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
      </div>

      {/* Database Secret Modal */}
      {showSecretModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-amber-400">
              <KeyRound className="w-5 h-5" />
              <h2 className="text-sm font-bold text-white">
                {lang === 'ar' ? 'مفتاح أمان قاعدة البيانات (Database Secret)' : 'Firebase Database Secret'}
              </h2>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {lang === 'ar' 
                ? 'إذا كانت قواعد Firebase مقفلة بالكامل (.read: false)، يمكنك وضع المفتاح السري هنا للاتصال والتشفير الآمن:'
                : 'If Firebase rules are locked (.read: false), provide your secret key from Firebase Console to allow secure access:'}
            </p>
            <form onSubmit={handleSaveSecret} className="space-y-3">
              <input
                type="text"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                placeholder="AIzaSy... or secret key..."
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none font-mono"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSecretModal(false)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg text-xs font-bold cursor-pointer"
                >
                  {lang === 'ar' ? 'حفظ وتفعيل' : 'Save & Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <Code2 className="w-5 h-5" />
                <h2 className="text-sm font-bold text-white">
                  {lang === 'ar' ? 'قواعد الأمان الموصى بها في Firebase' : 'Firebase Security Rules'}
                </h2>
              </div>
              <button
                type="button"
                onClick={copyRulesToClipboard}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRules ? t.copied : t.copy}</span>
              </button>
            </div>
            
            <p className="text-xs text-neutral-400 leading-relaxed">
              {lang === 'ar' 
                ? 'انسخ هذه القواعد وضعها في تبويب Rules في Firebase Realtime Database. هذه القواعد تمنع أي شخص من استبدال أو مسح كلمة المرور إذا كانت موجودة:'
                : 'Copy these rules and paste them into the Rules tab in Firebase Realtime Database:'}
            </p>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs font-mono text-emerald-300 overflow-x-auto select-all">
              <pre>{recommendedRules}</pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

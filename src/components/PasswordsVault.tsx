import React, { useState } from 'react';
import { 
  KeyRound, 
  Plus, 
  Copy, 
  Trash2, 
  Edit3, 
  Check, 
  Eye, 
  EyeOff, 
  X, 
  Save, 
  ExternalLink, 
  User, 
  Search, 
  RefreshCw 
} from 'lucide-react';
import { VaultPassword } from '../types/vault';
import { Language, translations } from '../utils/i18n';
import { generatePassword, calculatePasswordStrength, formatDate } from '../utils/vaultUtils';

interface PasswordsVaultProps {
  passwords: VaultPassword[];
  onSavePassword: (pw: VaultPassword) => Promise<void>;
  onDeletePassword: (id: string) => Promise<void>;
  lang: Language;
}

export const PasswordsVault: React.FC<PasswordsVaultProps> = ({
  passwords,
  onSavePassword,
  onDeletePassword,
  lang,
}) => {
  const [activePassword, setActivePassword] = useState<VaultPassword | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActivePassword, setShowActivePassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form state
  const [serviceName, setServiceName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [genLength] = useState(18);

  const t = translations[lang];

  const filteredPasswords = passwords.filter((p) => {
    return p.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.note && p.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGeneratePassword = () => {
    const newPwd = generatePassword({ length: genLength });
    setPassword(newPwd);
  };

  const openCreateModal = () => {
    setServiceName('');
    setUsername('');
    setPassword(generatePassword({ length: 18 }));
    setUrl('');
    setNote('');
    setCategory('');
    setIsEditing(false);
    setIsCreating(true);
  };

  const openEditModal = (pw: VaultPassword) => {
    setServiceName(pw.serviceName);
    setUsername(pw.username);
    setPassword(pw.password);
    setUrl(pw.url || '');
    setNote(pw.note || '');
    setCategory(pw.category || '');
    setIsEditing(true);
    setIsCreating(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim() || !password.trim()) return;
    setIsSubmitting(true);

    const itemToSave: VaultPassword = {
      id: isEditing && activePassword ? activePassword.id : `pwd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      serviceName: serviceName.trim(),
      username: username.trim(),
      password: password.trim(),
      url: url.trim() || undefined,
      note: note.trim() || undefined,
      category: category.trim() || undefined,
      createdAt: isEditing && activePassword ? activePassword.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSavePassword(itemToSave);
    setIsSubmitting(false);
    setIsCreating(false);
    setIsEditing(false);
    setActivePassword(itemToSave);
  };

  const pwdStrength = calculatePasswordStrength(password);

  return (
    <div className="space-y-6 font-cairo">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <span>{t.passwords}</span>
          </h1>
          <p className="text-xs text-neutral-400">
            {lang === 'ar' ? 'حفظ وتنظيم بيانات الدخول للحسابات مع تشفيرها واختبار قوتها' : 'Secure and organize accounts and login credentials with encrypted storage'}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addPassword}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث في الحسابات والخدمات...' : 'Search accounts & services...'}
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg ps-9 pe-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none"
          />
        </div>
      </div>

      {/* Passwords Grid */}
      {passwords.length === 0 ? (
        <div
          onClick={openCreateModal}
          className="border-2 border-dashed border-neutral-800 hover:border-amber-500/50 bg-neutral-900/30 hover:bg-neutral-900/60 rounded-2xl p-12 text-center transition-all cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-2xl bg-neutral-800 group-hover:bg-amber-950/60 border border-neutral-700 group-hover:border-amber-500/40 flex items-center justify-center mx-auto mb-4 text-neutral-400 group-hover:text-amber-400 transition-all">
            <KeyRound className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-neutral-200 mb-1">
            {lang === 'ar' ? 'لا توجد حسابات مسجلة بعد' : 'No saved credentials yet'}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {lang === 'ar' ? 'اضغط لإضافة أول حساب لك وتأمينه بأمان فائق' : 'Click to add and secure your first login account'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPasswords.map((pw) => {
            const isUserCopied = copiedField === `u_${pw.id}`;
            const isPwdCopied = copiedField === `p_${pw.id}`;
            const strength = calculatePasswordStrength(pw.password);

            return (
              <div
                key={pw.id}
                onClick={() => {
                  setActivePassword(pw);
                  setShowActivePassword(false);
                }}
                className="bg-neutral-900/80 hover:bg-neutral-800/90 border border-neutral-800 hover:border-amber-500/40 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between group cursor-pointer shadow-sm relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0 text-sm">
                        {pw.serviceName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                          {pw.serviceName}
                        </h3>
                        <p className="text-[11px] text-neutral-400 truncate flex items-center gap-1 font-mono">
                          <User className="w-3 h-3 text-neutral-500 shrink-0" />
                          <span>{pw.username}</span>
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 ${strength.color}`}>
                      {strength.label[lang]}
                    </span>
                  </div>

                  {/* Masked Password Field with Quick Copy */}
                  <div className="bg-neutral-950/80 border border-neutral-900 rounded-lg p-2.5 mb-3 flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-neutral-500 tracking-widest text-sm select-none">
                      ••••••••••••••••
                    </span>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleCopy(pw.username, `u_${pw.id}`)}
                        title={lang === 'ar' ? 'نسخ المستخدم' : 'Copy Username'}
                        className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {isUserCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <User className="w-3 h-3 text-neutral-400" />}
                        <span>{lang === 'ar' ? 'المستخدم' : 'User'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(pw.password, `p_${pw.id}`)}
                        title={lang === 'ar' ? 'نسخ كلمة المرور' : 'Copy Password'}
                        className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {isPwdCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                        <span>{lang === 'ar' ? 'الرمز' : 'Pass'}</span>
                      </button>
                    </div>
                  </div>

                  {pw.note && (
                    <div className="text-[11px] text-neutral-400 mb-2 truncate">
                      <span className="text-neutral-500 font-medium">{lang === 'ar' ? 'ملاحظة:' : 'Note:'} </span>
                      {pw.note}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs text-neutral-400">
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {formatDate(pw.updatedAt || pw.createdAt, lang)}
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {pw.url && (
                      <a
                        href={pw.url.startsWith('http') ? pw.url : `https://${pw.url}`}
                        target="_blank"
                        rel="noreferrer"
                        title={pw.url}
                        className="p-1.5 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditModal(pw)}
                      title={t.edit}
                      className="p-1.5 hover:text-amber-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(t.deleteConfirm)) {
                          onDeletePassword(pw.id);
                        }
                      }}
                      title={t.delete}
                      className="p-1.5 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Password Details Modal */}
      {activePassword && !isCreating && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-base">
                  {activePassword.serviceName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {activePassword.serviceName}
                  </h2>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {formatDate(activePassword.updatedAt, lang)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePassword(null)}
                className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Username Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-400">
                  {t.usernameOrEmail}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={activePassword.username}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-mono select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(activePassword.username, 'modal_user')}
                    className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl transition-colors cursor-pointer"
                  >
                    {copiedField === 'modal_user' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-400">
                  {t.passwordField}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type={showActivePassword ? 'text' : 'password'}
                    readOnly
                    value={activePassword.password}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-400 outline-none font-mono select-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowActivePassword(!showActivePassword)}
                    className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl transition-colors cursor-pointer"
                  >
                    {showActivePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(activePassword.password, 'modal_pwd')}
                    className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl transition-colors cursor-pointer"
                  >
                    {copiedField === 'modal_pwd' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Website URL */}
              {activePassword.url && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-neutral-400">
                    {t.websiteUrl}
                  </label>
                  <div className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs">
                    <span className="text-neutral-300 truncate font-mono">{activePassword.url}</span>
                    <a
                      href={activePassword.url.startsWith('http') ? activePassword.url : `https://${activePassword.url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 hover:underline flex items-center gap-1 font-semibold shrink-0 ms-2"
                    >
                      <span>{lang === 'ar' ? 'فتح' : 'Open'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Notes */}
              {activePassword.note && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-neutral-400">
                    {t.notesOptional}
                  </label>
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 leading-relaxed">
                    {activePassword.note}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (confirm(t.deleteConfirm)) {
                    onDeletePassword(activePassword.id);
                    setActivePassword(null);
                  }
                }}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.delete}</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(activePassword)}
                  className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{t.edit}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>{isEditing ? (lang === 'ar' ? 'تعديل الحساب' : 'Edit Credentials') : t.addPassword}</span>
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                }}
                className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300">
                  {t.serviceName}
                </label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: Google, GitHub, AWS, Stripe' : 'e.g., Google, GitHub, AWS, Stripe'}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300">
                  {t.usernameOrEmail}
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none font-mono"
                />
              </div>

              {/* Password with Generator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-neutral-300">
                    {t.passwordField}
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{t.generateStrongPassword}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-amber-400 font-mono outline-none"
                />
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-neutral-500">{t.passwordStrength}:</span>
                  <span className={`font-semibold font-mono ${pwdStrength.color}`}>{pwdStrength.label[lang]}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300">
                  {t.websiteUrl}
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://accounts.google.com"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300">
                  {t.notesOptional}
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={lang === 'ar' ? 'حساب الشركة الرئيسي' : 'e.g., Primary corporate account'}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? t.saving : t.save}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { 
  FileCode, 
  UploadCloud, 
  Plus, 
  Download, 
  Copy, 
  Trash2, 
  Edit3, 
  Check, 
  Eye, 
  EyeOff, 
  X, 
  Save, 
  Key, 
  Search
} from 'lucide-react';
import { VaultEnv } from '../types/vault';
import { Language, translations } from '../utils/i18n';
import { formatDate, downloadFile, parseEnvContent } from '../utils/vaultUtils';

interface EnvVaultProps {
  envs: VaultEnv[];
  onSaveEnv: (env: VaultEnv) => Promise<void>;
  onDeleteEnv: (id: string) => Promise<void>;
  selectedEnvFromParent?: VaultEnv | null;
  onClearSelectedEnv?: () => void;
  lang: Language;
}

export const EnvVault: React.FC<EnvVaultProps> = ({
  envs,
  onSaveEnv,
  onDeleteEnv,
  selectedEnvFromParent,
  onClearSelectedEnv,
  lang,
}) => {
  const [activeEnv, setActiveEnv] = useState<VaultEnv | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'raw'>('grid');
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formEnvironment, setFormEnvironment] = useState<'production' | 'staging' | 'development' | 'local' | 'test'>('production');
  const [formContent, setFormContent] = useState('');
  const [formNote, setFormNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const t = translations[lang];

  React.useEffect(() => {
    if (selectedEnvFromParent) {
      setActiveEnv(selectedEnvFromParent);
      if (onClearSelectedEnv) onClearSelectedEnv();
    }
  }, [selectedEnvFromParent, onClearSelectedEnv]);

  const filteredEnvs = envs.filter((e) => {
    return e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.note && e.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.environment.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    Array.from(uploadedFiles).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string || '';
        const parsed = parseEnvContent(content);
        const newEnv: VaultEnv = {
          id: `env_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: file.name.startsWith('.env') ? file.name : `${file.name} (.env)`,
          environment: 'production',
          content,
          keyCount: parsed.filter(p => p.key).length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await onSaveEnv(newEnv);
      };
      reader.readAsText(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setIsSubmitting(true);

    const parsed = parseEnvContent(formContent);
    const keyCount = parsed.filter(p => p.key).length;

    const envToSave: VaultEnv = {
      id: isEditing && activeEnv ? activeEnv.id : `env_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: formTitle.trim(),
      environment: formEnvironment,
      content: formContent,
      keyCount,
      createdAt: isEditing && activeEnv ? activeEnv.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      note: formNote.trim() || undefined,
    };

    await onSaveEnv(envToSave);
    setIsSubmitting(false);
    setIsCreating(false);
    setIsEditing(false);
    setActiveEnv(envToSave);
  };

  const openEditModal = (env: VaultEnv) => {
    setFormTitle(env.title);
    setFormEnvironment(env.environment);
    setFormContent(env.content);
    setFormNote(env.note || '');
    setIsEditing(true);
    setIsCreating(true);
  };

  const openCreateModal = () => {
    setFormTitle('');
    setFormEnvironment('production');
    setFormContent('');
    setFormNote('');
    setIsEditing(false);
    setIsCreating(true);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const toggleRevealKey = (key: string) => {
    setRevealedKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getEnvBadge = (env: string) => {
    switch (env) {
      case 'production':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'staging':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'development':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'local':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <div className="space-y-6 font-cairo">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <FileCode className="w-5 h-5 text-emerald-400" />
            <span>{t.env}</span>
          </h1>
          <p className="text-xs text-neutral-400">
            {lang === 'ar' ? 'إدارة وتأمين متغيرات .env الخاصة بمشاريعك مع فهرسة المتغيرات وعزلها بأمان' : 'Manage and secure project .env variables with indexed keys and encrypted storage'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-xs font-semibold text-neutral-200 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-emerald-400" />
            <span>{t.uploadEnv}</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>{t.createEnv}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث في ملفات .env...' : 'Search .env profiles...'}
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg ps-9 pe-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none"
          />
        </div>
      </div>

      {/* Grid of ENV cards */}
      {envs.length === 0 ? (
        <div
          onClick={openCreateModal}
          className="border-2 border-dashed border-neutral-800 hover:border-emerald-500/50 bg-neutral-900/30 hover:bg-neutral-900/60 rounded-2xl p-12 text-center transition-all cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-2xl bg-neutral-800 group-hover:bg-emerald-950/60 border border-neutral-700 group-hover:border-emerald-500/40 flex items-center justify-center mx-auto mb-4 text-neutral-400 group-hover:text-emerald-400 transition-all">
            <FileCode className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-neutral-200 mb-1">
            {lang === 'ar' ? 'لا توجد ملفات .env بعد' : 'No .env profiles saved yet'}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {lang === 'ar' ? 'اضغط لإنشاء ملف .env جديد أو ارفع ملفاتك من جهازك مباشرة' : 'Click to create a new .env or upload one directly from your device'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEnvs.map((env) => {
            const parsed = parseEnvContent(env.content);
            const keyNames = parsed.filter(p => p.key).map(p => p.key).slice(0, 4);

            return (
              <div
                key={env.id}
                onClick={() => setActiveEnv(env)}
                className="bg-neutral-900/80 hover:bg-neutral-800/90 border border-neutral-800 hover:border-emerald-500/40 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between group cursor-pointer shadow-sm relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-emerald-400 shrink-0">
                        <FileCode className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                          {env.title}
                        </h3>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {env.keyCount} {lang === 'ar' ? 'متغير' : 'variables'} • {formatDate(env.updatedAt || env.createdAt, lang)}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${getEnvBadge(env.environment)}`}>
                      {env.environment}
                    </span>
                  </div>

                  {/* Masked preview of variable keys */}
                  <div className="bg-neutral-950/80 border border-neutral-900 rounded-lg p-2.5 mb-3 text-[11px] font-mono space-y-1 select-none">
                    {keyNames.length > 0 ? (
                      keyNames.map((k) => (
                        <div key={k} className="flex items-center justify-between text-neutral-400">
                          <span className="text-neutral-300 font-semibold truncate">{k}</span>
                          <span className="text-neutral-600 font-mono">••••••••</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-neutral-600 italic">لا توجد متغيرات</span>
                    )}
                    {parsed.length > 4 && (
                      <div className="text-[10px] text-emerald-500/80 pt-1">
                        + {parsed.length - 4} {lang === 'ar' ? 'متغيرات أخرى...' : 'more keys...'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card footer */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs text-neutral-400">
                  <span className="text-[11px] text-neutral-500 font-medium flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{lang === 'ar' ? 'فحص المتغيرات' : 'Inspect Keys'}</span>
                  </span>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => downloadFile(`${env.title.replace(/\s+/g, '_')}.env`, env.content)}
                      title={t.download}
                      className="p-1.5 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(env)}
                      title={t.edit}
                      className="p-1.5 hover:text-emerald-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(t.deleteConfirm)) {
                          onDeleteEnv(env.id);
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

      {/* ENV Detailed Inspection Modal */}
      {activeEnv && !isCreating && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-emerald-400">
                  <FileCode className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white truncate">
                      {activeEnv.title}
                    </h2>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${getEnvBadge(activeEnv.environment)}`}>
                      {activeEnv.environment}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                    <span>{activeEnv.keyCount} {lang === 'ar' ? 'متغير مفهرس' : 'indexed variables'}</span>
                    <span>•</span>
                    <span>{formatDate(activeEnv.updatedAt, lang)}</span>
                  </div>
                </div>
              </div>

              {/* Top actions */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {t.envGridview}
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      viewMode === 'raw'
                        ? 'bg-neutral-800 text-white font-bold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {t.envRawView}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyAll(activeEnv.content)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAll ? t.copied : (lang === 'ar' ? 'نسخ الكل' : 'Copy All')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadFile(`${activeEnv.title.replace(/\s+/g, '_')}.env`, activeEnv.content)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.download}</span>
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(activeEnv)}
                  className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEnv(null)}
                  className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-5 overflow-y-auto bg-neutral-950/60">
              {viewMode === 'grid' ? (
                /* Interactive Key-Value View */
                <div className="space-y-2">
                  {parseEnvContent(activeEnv.content).map((item, idx) => {
                    if (item.comment) {
                      return (
                        <div key={idx} className="text-xs text-neutral-500 font-mono italic px-3 py-1">
                          # {item.comment}
                        </div>
                      );
                    }
                    const isRevealed = !!revealedKeys[item.key];
                    const isKeyCopied = copiedKey === `k_${item.key}`;
                    const isValCopied = copiedKey === `v_${item.key}`;

                    return (
                      <div
                        key={idx}
                        className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="font-bold text-emerald-400 shrink-0 select-all">
                            {item.key}
                          </span>
                          <span className="text-neutral-600">=</span>
                          <span className="text-neutral-200 truncate select-all">
                            {isRevealed ? item.value : '••••••••••••••••'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleRevealKey(item.key)}
                            title={isRevealed ? t.hidePassword : t.showPassword}
                            className="p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-lg transition-colors cursor-pointer"
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.key, `k_${item.key}`)}
                            title={lang === 'ar' ? 'نسخ المفتاح' : 'Copy Key'}
                            className="px-2 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {isKeyCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Key className="w-3 h-3" />}
                            <span>{lang === 'ar' ? 'المفتاح' : 'Key'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.value, `v_${item.key}`)}
                            title={lang === 'ar' ? 'نسخ القيمة' : 'Copy Value'}
                            className="px-2 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {isValCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{lang === 'ar' ? 'القيمة' : 'Val'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Raw text view */
                <div className="bg-[#090b10] border border-neutral-800 rounded-xl p-4 overflow-x-auto text-xs font-mono leading-relaxed text-emerald-300">
                  <pre className="whitespace-pre-wrap font-mono-code">{activeEnv.content}</pre>
                </div>
              )}
            </div>

            {/* Note if available */}
            {activeEnv.note && (
              <div className="px-5 py-3 bg-neutral-900/90 border-t border-neutral-800 text-xs text-neutral-400">
                <span className="font-semibold text-neutral-300">{lang === 'ar' ? 'ملاحظة:' : 'Note:'} </span>
                {activeEnv.note}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>{isEditing ? (lang === 'ar' ? 'تعديل بيئة .env' : 'Edit .env Profile') : t.createEnv}</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-neutral-300">
                    {t.envTitle}
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: Next.js Production API' : 'e.g., Next.js Production API'}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-neutral-300">
                    {t.envEnvironment}
                  </label>
                  <select
                    value={formEnvironment}
                    onChange={(e) => setFormEnvironment(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="production">{t.envProduction}</option>
                    <option value="staging">{t.envStaging}</option>
                    <option value="development">{t.envDev}</option>
                    <option value="local">{t.envLocal}</option>
                    <option value="test">{t.envTest}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300">
                  {t.envContent}
                </label>
                <textarea
                  rows={12}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={`DATABASE_URL="postgres://user:pass@host:5432/db"\nPORT=3000\nJWT_SECRET="super-secret-key-123"`}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl p-3.5 text-xs text-emerald-400 placeholder-neutral-600 outline-none font-mono resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300">
                  {t.notesOptional}
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder={lang === 'ar' ? 'ملاحظات اختيارية حول البيئة...' : 'Optional notes about this environment...'}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 outline-none"
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
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
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

import React, { useState } from 'react';
import { 
  ShieldAlert, 
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
  Search, 
  Key, 
  Shield 
} from 'lucide-react';
import { VaultApi } from '../types/vault';
import { Language, translations } from '../utils/i18n';
import { formatDate, maskSecret } from '../utils/vaultUtils';

interface ApiKeysVaultProps {
  apis: VaultApi[];
  onSaveApi: (api: VaultApi) => Promise<void>;
  onDeleteApi: (id: string) => Promise<void>;
  lang: Language;
}

export const ApiKeysVault: React.FC<ApiKeysVaultProps> = ({
  apis,
  onSaveApi,
  onDeleteApi,
  lang,
}) => {
  const [activeApi, setActiveApi] = useState<VaultApi | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveKey, setShowActiveKey] = useState(false);
  const [showActiveSecret, setShowActiveSecret] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form states
  const [serviceName, setServiceName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [environment, setEnvironment] = useState<'production' | 'sandbox' | 'development' | 'testing'>('production');
  const [note, setNote] = useState('');
  const [docsUrl, setDocsUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = translations[lang];

  const filteredApis = apis.filter((a) => {
    return a.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.note && a.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.environment && a.environment.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openCreateModal = () => {
    setServiceName('');
    setApiKey('');
    setApiSecret('');
    setEnvironment('production');
    setNote('');
    setDocsUrl('');
    setIsEditing(false);
    setIsCreating(true);
  };

  const openEditModal = (api: VaultApi) => {
    setServiceName(api.serviceName);
    setApiKey(api.apiKey);
    setApiSecret(api.apiSecret || '');
    setEnvironment(api.environment || 'production');
    setNote(api.note || '');
    setDocsUrl(api.docsUrl || '');
    setIsEditing(true);
    setIsCreating(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim() || !apiKey.trim()) return;
    setIsSubmitting(true);

    const itemToSave: VaultApi = {
      id: isEditing && activeApi ? activeApi.id : `api_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      serviceName: serviceName.trim(),
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim() || undefined,
      environment,
      note: note.trim() || undefined,
      docsUrl: docsUrl.trim() || undefined,
      createdAt: isEditing && activeApi ? activeApi.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSaveApi(itemToSave);
    setIsSubmitting(false);
    setIsCreating(false);
    setIsEditing(false);
    setActiveApi(itemToSave);
  };

  return (
    <div className="space-y-6 font-cairo">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-400" />
            <span>{t.apis}</span>
          </h1>
          <p className="text-xs text-neutral-400">
            {lang === 'ar' ? 'تخزين مفاتيح API والرموز السرية ومفاتيح الربط البرمجي السحابية' : 'Secure API keys, client secrets, and third-party tokens in a centralized vault'}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-purple-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addApi}</span>
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
            placeholder={lang === 'ar' ? 'بحث في مفاتيح API...' : 'Search API credentials...'}
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-lg ps-9 pe-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none"
          />
        </div>
      </div>

      {/* API Grid */}
      {apis.length === 0 ? (
        <div
          onClick={openCreateModal}
          className="border-2 border-dashed border-neutral-800 hover:border-purple-500/50 bg-neutral-900/30 hover:bg-neutral-900/60 rounded-2xl p-12 text-center transition-all cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-2xl bg-neutral-800 group-hover:bg-purple-950/60 border border-neutral-700 group-hover:border-purple-500/40 flex items-center justify-center mx-auto mb-4 text-neutral-400 group-hover:text-purple-400 transition-all">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-neutral-200 mb-1">
            {lang === 'ar' ? 'لا توجد مفاتيح API مسجلة بعد' : 'No API keys saved yet'}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {lang === 'ar' ? 'اضغط لإضافة مفتاح API مثل OpenAI أو Stripe أو Google Cloud' : 'Click to add your first API token (e.g. Stripe, OpenAI, AWS)'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApis.map((api) => {
            const isKeyCopied = copiedField === `k_${api.id}`;
            const isSecretCopied = copiedField === `s_${api.id}`;

            return (
              <div
                key={api.id}
                onClick={() => {
                  setActiveApi(api);
                  setShowActiveKey(false);
                  setShowActiveSecret(false);
                }}
                className="bg-neutral-900/80 hover:bg-neutral-800/90 border border-neutral-800 hover:border-purple-500/40 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between group cursor-pointer shadow-sm relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold shrink-0 text-sm">
                        {api.serviceName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                          {api.serviceName}
                        </h3>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {formatDate(api.updatedAt || api.createdAt, lang)}
                        </span>
                      </div>
                    </div>
                    {api.environment && (
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {api.environment}
                      </span>
                    )}
                  </div>

                  {/* Masked API Key Preview */}
                  <div className="bg-neutral-950/80 border border-neutral-900 rounded-lg p-2.5 mb-3 flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-neutral-400 text-[11px] truncate select-none">
                      {maskSecret(api.apiKey, 6)}
                    </span>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleCopy(api.apiKey, `k_${api.id}`)}
                        title={lang === 'ar' ? 'نسخ المفتاح' : 'Copy Key'}
                        className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {isKeyCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Key className="w-3 h-3 text-purple-400" />}
                        <span>{lang === 'ar' ? 'المفتاح' : 'Key'}</span>
                      </button>
                      {api.apiSecret && (
                        <button
                          type="button"
                          onClick={() => handleCopy(api.apiSecret!, `s_${api.id}`)}
                          title={lang === 'ar' ? 'نسخ السري' : 'Copy Secret'}
                          className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {isSecretCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Shield className="w-3 h-3 text-purple-400" />}
                          <span>{lang === 'ar' ? 'السري' : 'Secret'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {api.note && (
                    <div className="text-[11px] text-neutral-400 mb-2 truncate">
                      <span className="text-neutral-500 font-medium">{lang === 'ar' ? 'ملاحظة:' : 'Note:'} </span>
                      {api.note}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs text-neutral-400">
                  <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{lang === 'ar' ? 'التفاصيل' : 'Details'}</span>
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {api.docsUrl && (
                      <a
                        href={api.docsUrl.startsWith('http') ? api.docsUrl : `https://${api.docsUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        title={api.docsUrl}
                        className="p-1.5 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditModal(api)}
                      title={t.edit}
                      className="p-1.5 hover:text-purple-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(t.deleteConfirm)) {
                          onDeleteApi(api.id);
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

      {/* Details Modal */}
      {activeApi && !isCreating && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-base">
                  {activeApi.serviceName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {activeApi.serviceName}
                  </h2>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {formatDate(activeApi.updatedAt, lang)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveApi(null)}
                className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* API Key */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-400">
                  {t.apiKeyField}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type={showActiveKey ? 'text' : 'password'}
                    readOnly
                    value={activeApi.apiKey}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-purple-300 outline-none font-mono select-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowActiveKey(!showActiveKey)}
                    className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl transition-colors cursor-pointer"
                  >
                    {showActiveKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeApi.apiKey, 'modal_api_key')}
                    className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl transition-colors cursor-pointer"
                  >
                    {copiedField === 'modal_api_key' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* API Secret */}
              {activeApi.apiSecret && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-neutral-400">
                    {t.apiSecretField}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showActiveSecret ? 'text' : 'password'}
                      readOnly
                      value={activeApi.apiSecret}
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-purple-300 outline-none font-mono select-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowActiveSecret(!showActiveSecret)}
                      className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl transition-colors cursor-pointer"
                    >
                      {showActiveSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeApi.apiSecret!, 'modal_api_secret')}
                      className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl transition-colors cursor-pointer"
                    >
                      {copiedField === 'modal_api_secret' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Portal / Docs URL */}
              {activeApi.docsUrl && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-neutral-400">
                    {t.apiDocs}
                  </label>
                  <div className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs">
                    <span className="text-neutral-300 truncate font-mono">{activeApi.docsUrl}</span>
                    <a
                      href={activeApi.docsUrl.startsWith('http') ? activeApi.docsUrl : `https://${activeApi.docsUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-400 hover:underline flex items-center gap-1 font-semibold shrink-0 ms-2"
                    >
                      <span>{lang === 'ar' ? 'فتح' : 'Open'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Notes */}
              {activeApi.note && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-neutral-400">
                    {t.notesOptional}
                  </label>
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 leading-relaxed">
                    {activeApi.note}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (confirm(t.deleteConfirm)) {
                    onDeleteApi(activeApi.id);
                    setActiveApi(null);
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
                  onClick={() => openEditModal(activeApi)}
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
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                <span>{isEditing ? (lang === 'ar' ? 'تعديل مفتاح API' : 'Edit API Key') : t.addApi}</span>
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
                  {t.apiServiceName}
                </label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: OpenAI GPT-4, Stripe Payments, Gemini API' : 'e.g., Stripe, OpenAI, AWS S3'}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300">
                  {t.apiKeyField}
                </label>
                <input
                  type="text"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-purple-300 placeholder-neutral-500 outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300">
                  {t.apiSecretField}
                </label>
                <input
                  type="text"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder={lang === 'ar' ? 'المفتاح السري الإضافي إن وجد...' : 'Secret key or signing secret...'}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-purple-300 placeholder-neutral-500 outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300">
                  {t.apiDocs}
                </label>
                <input
                  type="text"
                  value={docsUrl}
                  onChange={(e) => setDocsUrl(e.target.value)}
                  placeholder="https://dashboard.stripe.com/apikeys"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 outline-none font-mono"
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
                  placeholder={lang === 'ar' ? 'ملاحظات حول حدود الاستخدام والصلاحيات...' : 'Notes on rate limits, team scopes, etc.'}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 outline-none"
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
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

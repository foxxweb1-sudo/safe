import React from 'react';
import { 
  FolderLock, 
  FileCode, 
  KeyRound, 
  ShieldAlert, 
  Globe, 
  ShieldCheck, 
  ArrowUpRight, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';
import { VaultStats, VaultFile, VaultEnv, VaultPassword, VaultApi, VaultLink, ActiveTab } from '../types/vault';
import { Language, translations } from '../utils/i18n';
import { formatDate } from '../utils/vaultUtils';

interface DashboardOverviewProps {
  stats: VaultStats;
  files: VaultFile[];
  envs: VaultEnv[];
  passwords: VaultPassword[];
  apis: VaultApi[];
  links: VaultLink[];
  setActiveTab: (tab: ActiveTab) => void;
  onQuickAdd: (type: 'file' | 'env' | 'password' | 'api' | 'link') => void;
  onSelectFile: (file: VaultFile) => void;
  onSelectEnv: (env: VaultEnv) => void;
  lang: Language;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  files,
  envs,
  passwords,
  apis,
  links,
  setActiveTab,
  onQuickAdd,
  onSelectFile,
  onSelectEnv,
  lang,
}) => {
  const t = translations[lang];

  // Compile recent items
  const recentItems = [
    ...files.map(f => ({ ...f, itemType: 'file' as const, title: f.name, time: f.updatedAt || f.createdAt })),
    ...envs.map(e => ({ ...e, itemType: 'env' as const, title: e.title, time: e.updatedAt || e.createdAt })),
    ...passwords.map(p => ({ ...p, itemType: 'password' as const, title: p.serviceName, time: p.updatedAt || p.createdAt })),
    ...apis.map(a => ({ ...a, itemType: 'api' as const, title: a.serviceName, time: a.updatedAt || a.createdAt })),
    ...links.map(l => ({ ...l, itemType: 'link' as const, title: l.title, time: l.updatedAt || l.createdAt })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-cairo">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-emerald-950/30 border border-neutral-800 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'الخزنة مؤمنة عبر Firebase Realtime DB' : 'Vault Secured in Firebase Realtime DB'}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {t.appTitle}
            </h1>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
              {t.appSubtitle}
            </p>
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onQuickAdd('file')}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-xs font-semibold text-neutral-200 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <FolderLock className="w-4 h-4 text-blue-400" />
              <span>{t.createFile}</span>
            </button>
            <button
              onClick={() => onQuickAdd('env')}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-xs font-semibold text-neutral-200 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>{t.createEnv}</span>
            </button>
            <button
              onClick={() => onQuickAdd('password')}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-xs font-semibold text-neutral-200 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>{t.addPassword}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Vault Sections */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Files Box */}
        <button
          onClick={() => setActiveTab('files')}
          className="p-4 rounded-xl bg-neutral-900/70 hover:bg-neutral-800/80 border border-neutral-800 hover:border-blue-500/40 transition-all text-start group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-950/60 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <FolderLock className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-300 transition-colors" />
          </div>
          <div className="text-xl font-bold text-white font-mono tabular-nums mb-0.5">
            {stats.filesCount}
          </div>
          <div className="text-xs text-neutral-400 font-medium">{t.filesStored}</div>
        </button>

        {/* ENV Box */}
        <button
          onClick={() => setActiveTab('env')}
          className="p-4 rounded-xl bg-neutral-900/70 hover:bg-neutral-800/80 border border-neutral-800 hover:border-emerald-500/40 transition-all text-start group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <FileCode className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-300 transition-colors" />
          </div>
          <div className="text-xl font-bold text-white font-mono tabular-nums mb-0.5">
            {stats.envsCount}
          </div>
          <div className="text-xs text-neutral-400 font-medium">{t.envProfiles}</div>
        </button>

        {/* Passwords Box */}
        <button
          onClick={() => setActiveTab('passwords')}
          className="p-4 rounded-xl bg-neutral-900/70 hover:bg-neutral-800/80 border border-neutral-800 hover:border-amber-500/40 transition-all text-start group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-950/60 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <KeyRound className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-300 transition-colors" />
          </div>
          <div className="text-xl font-bold text-white font-mono tabular-nums mb-0.5">
            {stats.passwordsCount}
          </div>
          <div className="text-xs text-neutral-400 font-medium">{t.passwordsCount}</div>
        </button>

        {/* API Keys Box */}
        <button
          onClick={() => setActiveTab('apis')}
          className="p-4 rounded-xl bg-neutral-900/70 hover:bg-neutral-800/80 border border-neutral-800 hover:border-purple-500/40 transition-all text-start group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-purple-950/60 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-300 transition-colors" />
          </div>
          <div className="text-xl font-bold text-white font-mono tabular-nums mb-0.5">
            {stats.apisCount}
          </div>
          <div className="text-xs text-neutral-400 font-medium">{t.apisCount}</div>
        </button>

        {/* Links Box */}
        <button
          onClick={() => setActiveTab('links')}
          className="col-span-2 lg:col-span-1 p-4 rounded-xl bg-neutral-900/70 hover:bg-neutral-800/80 border border-neutral-800 hover:border-cyan-500/40 transition-all text-start group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950/60 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <Globe className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-300 transition-colors" />
          </div>
          <div className="text-xl font-bold text-white font-mono tabular-nums mb-0.5">
            {stats.linksCount}
          </div>
          <div className="text-xs text-neutral-400 font-medium">{t.linksCount}</div>
        </button>
      </div>

      {/* Main Content Split: Recent Activity & Security Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Items Stream (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-400" />
              <span>{lang === 'ar' ? 'العناصر المضافة والمعدلة حديثاً' : 'Recently Saved Items'}</span>
            </h2>
            <span className="text-[11px] text-neutral-500">
              {recentItems.length} {lang === 'ar' ? 'عناصر' : 'items'}
            </span>
          </div>

          <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl divide-y divide-neutral-800/60 overflow-hidden">
            {recentItems.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs">
                {lang === 'ar' ? 'لا توجد عناصر محفوظة حتى الآن!' : 'No items saved yet. Start by creating your first file or credential!'}
              </div>
            ) : (
              recentItems.map((item: any) => {
                const getIcon = () => {
                  switch (item.itemType) {
                    case 'file':
                      return <FolderLock className="w-4 h-4 text-blue-400" />;
                    case 'env':
                      return <FileCode className="w-4 h-4 text-emerald-400" />;
                    case 'password':
                      return <KeyRound className="w-4 h-4 text-amber-400" />;
                    case 'api':
                      return <ShieldAlert className="w-4 h-4 text-purple-400" />;
                    case 'link':
                      return <Globe className="w-4 h-4 text-cyan-400" />;
                  }
                };

                const handleClick = () => {
                  if (item.itemType === 'file') {
                    onSelectFile(item);
                  } else if (item.itemType === 'env') {
                    onSelectEnv(item);
                  } else {
                    setActiveTab(item.itemType === 'password' ? 'passwords' : item.itemType === 'api' ? 'apis' : 'links');
                  }
                };

                return (
                  <div
                    key={`${item.itemType}-${item.id}`}
                    onClick={handleClick}
                    className="p-3.5 flex items-center justify-between hover:bg-neutral-800/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 shrink-0">
                        {getIcon()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-semibold text-neutral-200 group-hover:text-emerald-400 transition-colors truncate">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-neutral-500 truncate">
                          {formatDate(item.time, lang)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800">
                        {item.itemType}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Security Health Box */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t.securityScore}</span>
          </h2>
          <div className="p-5 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-emerald-400">
                  {stats.weakPasswordsCount === 0 ? t.fortified : t.needsAttention}
                </div>
                <div className="text-xs text-neutral-400">
                  {lang === 'ar' ? 'فحص جودة الحسابات والمفاتيح' : 'Credentials health audit'}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold">
                {stats.passwordsCount === 0 ? '100%' : `${Math.round(((stats.passwordsCount - stats.weakPasswordsCount) / Math.max(1, stats.passwordsCount)) * 100)}%`}
              </div>
            </div>

            <div className="space-y-2 text-xs border-t border-neutral-800 pt-3">
              <div className="flex items-center justify-between text-neutral-400">
                <span>{lang === 'ar' ? 'حسابات عالية الأمان' : 'Strong Credentials'}</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {stats.passwordsCount - stats.weakPasswordsCount}
                </span>
              </div>
              {stats.weakPasswordsCount > 0 && (
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'كلمات مرور ضعيفة' : 'Weak Credentials'}</span>
                  </span>
                  <span className="text-amber-400 font-mono font-bold">
                    {stats.weakPasswordsCount}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab('passwords')}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              {lang === 'ar' ? 'مراجعة وتعديل كلمات المرور' : 'Manage & Audit Passwords'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

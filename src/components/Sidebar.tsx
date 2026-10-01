import React from 'react';
import { 
  LayoutDashboard, 
  FolderLock, 
  FileCode, 
  KeyRound, 
  ShieldAlert, 
  Globe, 
  Settings, 
  Lock, 
  ShieldCheck,
  Database
} from 'lucide-react';
import { ActiveTab, VaultStats } from '../types/vault';
import { Language, translations } from '../utils/i18n';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  stats: VaultStats;
  onLock: () => void;
  lang: Language;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  stats,
  onLock,
  lang,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const t = translations[lang];

  const navItems = [
    {
      id: 'overview' as ActiveTab,
      label: t.overview,
      icon: LayoutDashboard,
      count: stats.totalItems,
      color: 'text-neutral-400',
      activeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40',
    },
    {
      id: 'files' as ActiveTab,
      label: t.files,
      icon: FolderLock,
      count: stats.filesCount,
      color: 'text-blue-400',
      activeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/40',
    },
    {
      id: 'env' as ActiveTab,
      label: t.env,
      icon: FileCode,
      count: stats.envsCount,
      color: 'text-emerald-400',
      activeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40',
    },
    {
      id: 'passwords' as ActiveTab,
      label: t.passwords,
      icon: KeyRound,
      count: stats.passwordsCount,
      color: 'text-amber-400',
      activeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/40',
    },
    {
      id: 'apis' as ActiveTab,
      label: t.apis,
      icon: ShieldAlert,
      count: stats.apisCount,
      color: 'text-purple-400',
      activeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/40',
    },
    {
      id: 'links' as ActiveTab,
      label: t.links,
      icon: Globe,
      count: stats.linksCount,
      color: 'text-cyan-400',
      activeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/40',
    },
    {
      id: 'settings' as ActiveTab,
      label: t.settings,
      icon: Settings,
      count: undefined,
      color: 'text-neutral-400',
      activeColor: 'text-neutral-200 bg-neutral-800 border-neutral-700',
    },
  ];

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 start-0 z-50 w-64 bg-neutral-900/95 border-e border-neutral-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile
            ? 'translate-x-0'
            : lang === 'ar'
            ? 'translate-x-full lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div>
          <div className="p-5 border-b border-neutral-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-md">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-white tracking-tight truncate font-cairo">
                {lang === 'ar' ? 'الخزنة الآمنة' : 'Secure Vault'}
              </h1>
              <p className="text-[11px] text-neutral-400 truncate font-mono">
                RTDB Protected
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 border cursor-pointer ${
                    isActive
                      ? item.activeColor
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md font-mono tabular-nums ${
                        isActive
                          ? 'bg-neutral-900 text-white font-bold'
                          : 'bg-neutral-800/80 text-neutral-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer & Quick Lock */}
        <div className="p-3 border-t border-neutral-800/80 space-y-2">
          <div className="px-3 py-2 bg-neutral-950/60 rounded-xl border border-neutral-800/60 flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
            <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Firebase RTDB</span>
          </div>

          <button
            type="button"
            onClick={onLock}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-neutral-800/80 hover:bg-red-950/50 hover:text-red-300 hover:border-red-900/50 border border-neutral-700/60 rounded-xl text-xs font-semibold text-neutral-300 transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{t.lockVault}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

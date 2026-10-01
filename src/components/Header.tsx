import React from 'react';
import { 
  Menu, 
  Search, 
  RefreshCw, 
  Globe2, 
  Plus, 
  FilePlus, 
  Key, 
  Code, 
  ShieldAlert, 
  Link as LinkIcon 
} from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface HeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  onOpenSearch: () => void;
  onRefresh: () => void;
  isSyncing: boolean;
  onToggleMobileMenu: () => void;
  onQuickAdd: (type: 'file' | 'env' | 'password' | 'api' | 'link') => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  onOpenSearch,
  onRefresh,
  isSyncing,
  onToggleMobileMenu,
  onQuickAdd,
}) => {
  const [showAddMenu, setShowAddMenu] = React.useState(false);
  const t = translations[lang];

  return (
    <header className="h-16 bg-neutral-900/60 border-b border-neutral-800/80 px-4 md:px-6 flex items-center justify-between gap-4 backdrop-blur-md sticky top-0 z-30 font-cairo">
      {/* Left: Mobile Menu & Search trigger */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-2 text-neutral-400 hover:text-white bg-neutral-800/50 rounded-lg lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-neutral-950/70 hover:bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-400 hover:text-neutral-300 text-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
            <span className="truncate">{t.searchPlaceholder}</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 rounded">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        {/* Sync status & trigger */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isSyncing}
          title={t.refresh}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/60 rounded-xl text-xs text-neutral-300 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline text-[11px] font-medium">
            {isSyncing ? t.syncing : t.synced}
          </span>
        </button>

        {/* Language switch */}
        <button
          type="button"
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="px-2.5 py-1.5 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/60 rounded-xl text-xs text-neutral-300 transition-colors flex items-center gap-1.5 cursor-pointer font-semibold"
        >
          <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px]">{lang === 'ar' ? 'EN' : 'العربية'}</span>
        </button>

        {/* Quick Add Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t.addNew}</span>
          </button>

          {showAddMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowAddMenu(false)} 
              />
              <div className="absolute end-0 mt-2 w-52 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => {
                    onQuickAdd('file');
                    setShowAddMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  <FilePlus className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t.createFile}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onQuickAdd('env');
                    setShowAddMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.createEnv}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onQuickAdd('password');
                    setShowAddMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.addPassword}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onQuickAdd('api');
                    setShowAddMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                  <span>{t.addApi}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onQuickAdd('link');
                    setShowAddMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t.addLink}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

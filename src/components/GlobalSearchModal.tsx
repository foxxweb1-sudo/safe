import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  FolderLock, 
  FileCode, 
  KeyRound, 
  ShieldAlert, 
  Globe 
} from 'lucide-react';
import { VaultFile, VaultEnv, VaultPassword, VaultApi, VaultLink, ActiveTab } from '../types/vault';
import { Language, translations } from '../utils/i18n';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: VaultFile[];
  envs: VaultEnv[];
  passwords: VaultPassword[];
  apis: VaultApi[];
  links: VaultLink[];
  onNavigate: (tab: ActiveTab) => void;
  onSelectFile: (file: VaultFile) => void;
  onSelectEnv: (env: VaultEnv) => void;
  lang: Language;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  files,
  envs,
  passwords,
  apis,
  links,
  onNavigate,
  onSelectFile,
  onSelectEnv,
  lang,
}) => {
  const [query, setQuery] = useState('');
  const t = translations[lang];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();
  const matchedFiles = q ? files.filter(f => f.name.toLowerCase().includes(q) || (f.note && f.note.toLowerCase().includes(q))) : [];
  const matchedEnvs = q ? envs.filter(e => e.title.toLowerCase().includes(q) || (e.note && e.note.toLowerCase().includes(q))) : [];
  const matchedPasswords = q ? passwords.filter(p => p.serviceName.toLowerCase().includes(q) || p.username.toLowerCase().includes(q) || (p.note && p.note.toLowerCase().includes(q))) : [];
  const matchedApis = q ? apis.filter(a => a.serviceName.toLowerCase().includes(q) || (a.note && a.note.toLowerCase().includes(q))) : [];
  const matchedLinks = q ? links.filter(l => l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q) || (l.note && l.note.toLowerCase().includes(q))) : [];

  const totalMatches = matchedFiles.length + matchedEnvs.length + matchedPasswords.length + matchedApis.length + matchedLinks.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 pt-16 md:pt-24 font-cairo">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 z-10 flex flex-col max-h-[80vh]">
        {/* Search Input */}
        <div className="p-4 border-b border-neutral-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'ابحث في الملفات، متغيرات .env، الحسابات، مفاتيح API والروابط...' : 'Search files, .env, credentials, API keys, or bookmarks...'}
            className="w-full bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-neutral-800 text-neutral-400 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!q ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              {lang === 'ar' ? 'اكتب كلمة للبحث في كافة سجلات الخزنة المشفرة' : 'Type to search across all encrypted vault entries'}
            </div>
          ) : totalMatches === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              {lang === 'ar' ? 'لم يتم العثور على أي نتائج مطابقة' : 'No matching results found'}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Files */}
              {matchedFiles.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider px-2">
                    {t.files} ({matchedFiles.length})
                  </div>
                  {matchedFiles.map(f => (
                    <div
                      key={f.id}
                      onClick={() => {
                        onNavigate('files');
                        onSelectFile(f);
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-between cursor-pointer group text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FolderLock className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-neutral-200 group-hover:text-blue-400 font-mono truncate">{f.name}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 uppercase font-mono">{f.fileType}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ENV */}
              {matchedEnvs.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider px-2">
                    {t.env} ({matchedEnvs.length})
                  </div>
                  {matchedEnvs.map(e => (
                    <div
                      key={e.id}
                      onClick={() => {
                        onNavigate('env');
                        onSelectEnv(e);
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-between cursor-pointer group text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-neutral-200 group-hover:text-emerald-400 font-semibold truncate">{e.title}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono">{e.environment}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Passwords */}
              {matchedPasswords.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider px-2">
                    {t.passwords} ({matchedPasswords.length})
                  </div>
                  {matchedPasswords.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onNavigate('passwords');
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-between cursor-pointer group text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-neutral-200 group-hover:text-amber-400 font-semibold truncate">{p.serviceName}</span>
                        <span className="text-neutral-500 font-mono text-[11px] truncate">({p.username})</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono">••••</span>
                    </div>
                  ))}
                </div>
              )}

              {/* APIs */}
              {matchedApis.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider px-2">
                    {t.apis} ({matchedApis.length})
                  </div>
                  {matchedApis.map(a => (
                    <div
                      key={a.id}
                      onClick={() => {
                        onNavigate('apis');
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-between cursor-pointer group text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="text-neutral-200 group-hover:text-purple-400 font-semibold truncate">{a.serviceName}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono">API Key</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Links */}
              {matchedLinks.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider px-2">
                    {t.links} ({matchedLinks.length})
                  </div>
                  {matchedLinks.map(l => (
                    <div
                      key={l.id}
                      onClick={() => {
                        onNavigate('links');
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-between cursor-pointer group text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-neutral-200 group-hover:text-cyan-400 font-semibold truncate">{l.title}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono truncate max-w-[150px]">{l.url}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-[11px] text-neutral-500">
          <span>{lang === 'ar' ? 'اضغط ESC للإغلاق' : 'Press ESC to close'}</span>
          <span className="font-mono">{totalMatches} {lang === 'ar' ? 'نتائج' : 'matches'}</span>
        </div>
      </div>
    </div>
  );
};

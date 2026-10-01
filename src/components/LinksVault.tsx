import React, { useState } from 'react';
import { 
  Globe, 
  Plus, 
  Copy, 
  Trash2, 
  Edit3, 
  Check, 
  ExternalLink, 
  X, 
  Save, 
  Search, 
  Compass 
} from 'lucide-react';
import { VaultLink } from '../types/vault';
import { Language, translations } from '../utils/i18n';

interface LinksVaultProps {
  links: VaultLink[];
  onSaveLink: (link: VaultLink) => Promise<void>;
  onDeleteLink: (id: string) => Promise<void>;
  lang: Language;
}

export const LinksVault: React.FC<LinksVaultProps> = ({
  links,
  onSaveLink,
  onDeleteLink,
  lang,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = translations[lang];

  // Extract unique categories
  const categories = ['all', ...Array.from(new Set(links.map(l => l.category).filter(Boolean))) as string[]];

  const filteredLinks = links.filter((l) => {
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.note && l.note.toLowerCase().includes(searchQuery.toLowerCase()));
    if (categoryFilter === 'all') return matchesSearch;
    return matchesSearch && l.category === categoryFilter;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openCreateModal = () => {
    setTitle('');
    setUrl('');
    setCategory('');
    setNote('');
    setEditingId(null);
    setIsEditing(false);
    setIsCreating(true);
  };

  const openEditModal = (link: VaultLink) => {
    setTitle(link.title);
    setUrl(link.url);
    setCategory(link.category || '');
    setNote(link.note || '');
    setEditingId(link.id);
    setIsEditing(true);
    setIsCreating(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    setIsSubmitting(true);

    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    const currentLink = links.find(l => l.id === editingId);
    const itemToSave: VaultLink = {
      id: isEditing && currentLink ? currentLink.id : `link_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      url: finalUrl,
      category: category.trim() || undefined,
      note: note.trim() || undefined,
      createdAt: isEditing && currentLink ? currentLink.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSaveLink(itemToSave);
    setIsSubmitting(false);
    setIsCreating(false);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 font-cairo">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <span>{t.links}</span>
          </h1>
          <p className="text-xs text-neutral-400">
            {lang === 'ar' ? 'إشارات مرجعية وروابط وصول سريعة للسيرفرات ولوحات التحكم' : 'Bookmarks and quick access links to servers, consoles, and platforms'}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addLink}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث في الروابط...' : 'Search bookmarks...'}
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-lg ps-9 pe-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none"
          />
        </div>

        {categories.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer capitalize whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-cyan-500 text-neutral-950'
                    : 'bg-neutral-800/60 hover:bg-neutral-800 text-neutral-400'
                }`}
              >
                {cat === 'all' ? (lang === 'ar' ? 'الكل' : 'All') : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid of Links */}
      {links.length === 0 ? (
        <div
          onClick={openCreateModal}
          className="border-2 border-dashed border-neutral-800 hover:border-cyan-500/50 bg-neutral-900/30 hover:bg-neutral-900/60 rounded-2xl p-12 text-center transition-all cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-2xl bg-neutral-800 group-hover:bg-cyan-950/60 border border-neutral-700 group-hover:border-cyan-500/40 flex items-center justify-center mx-auto mb-4 text-neutral-400 group-hover:text-cyan-400 transition-all">
            <Globe className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-neutral-200 mb-1">
            {lang === 'ar' ? 'لا توجد روابط محفوظة بعد' : 'No bookmarks saved yet'}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {lang === 'ar' ? 'اضغط لحفظ روابط الوصول السريع للخدمات والسيرفرات' : 'Click to save your essential URLs and dashboards'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((link) => {
            const isCopied = copiedId === link.id;
            let domain = '';
            try {
              domain = new URL(link.url).hostname;
            } catch {
              domain = link.url;
            }

            return (
              <div
                key={link.id}
                className="bg-neutral-900/80 hover:bg-neutral-800/90 border border-neutral-800 hover:border-cyan-500/40 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between group shadow-sm relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                          {link.title}
                        </h3>
                        <span className="text-[11px] text-neutral-400 font-mono truncate block">
                          {domain}
                        </span>
                      </div>
                    </div>
                    {link.category && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {link.category}
                      </span>
                    )}
                  </div>

                  {link.note && (
                    <div className="bg-neutral-950/80 border border-neutral-900 rounded-lg p-2.5 mb-3 text-[11px] text-neutral-400 line-clamp-2">
                      {link.note}
                    </div>
                  )}
                </div>

                {/* Footer with actions */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs text-neutral-400">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <span>{lang === 'ar' ? 'فتح الرابط' : 'Open Link'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(link.url, link.id)}
                      title={t.copy}
                      className="p-1.5 hover:text-cyan-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(link)}
                      title={t.edit}
                      className="p-1.5 hover:text-cyan-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(t.deleteConfirm)) {
                          onDeleteLink(link.id);
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

      {/* Create / Edit Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>{isEditing ? (lang === 'ar' ? 'تعديل الرابط' : 'Edit Link') : t.addLink}</span>
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
                  {t.linkTitle}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: لوحة Cloudflare أو قاعدة بيانات Supabase' : 'e.g., Cloudflare Dashboard, Supabase Console'}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300">
                  {t.linkUrl}
                </label>
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://dash.cloudflare.com"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300">
                  {t.linkCategory}
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: Dashboards, Tools, Servers' : 'e.g., Dashboards, Tools, Servers'}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 outline-none"
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
                  placeholder={lang === 'ar' ? 'ملاحظات إضافية حول الرابط...' : 'Notes about this bookmark...'}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 outline-none"
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
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
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

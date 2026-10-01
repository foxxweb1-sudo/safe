import React, { useState, useRef } from 'react';
import { 
  FolderLock, 
  UploadCloud, 
  Plus, 
  FileText, 
  Code, 
  FileCode, 
  Download, 
  Copy, 
  Trash2, 
  Edit3, 
  Check, 
  Eye, 
  X, 
  Save, 
  Search
} from 'lucide-react';
import { VaultFile } from '../types/vault';
import { Language, translations } from '../utils/i18n';
import { formatBytes, formatDate, detectFileType, downloadFile, getFileExtension } from '../utils/vaultUtils';

interface FilesVaultProps {
  files: VaultFile[];
  onSaveFile: (file: VaultFile) => Promise<void>;
  onDeleteFile: (id: string) => Promise<void>;
  selectedFileFromParent?: VaultFile | null;
  onClearSelectedFile?: () => void;
  lang: Language;
}

export const FilesVault: React.FC<FilesVaultProps> = ({
  files,
  onSaveFile,
  onDeleteFile,
  selectedFileFromParent,
  onClearSelectedFile,
  lang,
}) => {
  const [activeFile, setActiveFile] = useState<VaultFile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [previewTab, setPreviewTab] = useState<'preview' | 'code'>('preview');

  // New/Edit File Form state
  const [formName, setFormName] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formNote, setFormNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const t = translations[lang];

  // Handle parent-directed select
  React.useEffect(() => {
    if (selectedFileFromParent) {
      setActiveFile(selectedFileFromParent);
      if (onClearSelectedFile) onClearSelectedFile();
    }
  }, [selectedFileFromParent, onClearSelectedFile]);

  // Filter files
  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.note && f.note.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && f.fileType === filterType;
  });

  // Handle File Upload from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    Array.from(uploadedFiles).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string || '';
        const ext = getFileExtension(file.name);
        const fileType = detectFileType(file.name);
        const newFile: VaultFile = {
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          extension: ext,
          fileType,
          content,
          size: file.size,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await onSaveFile(newFile);
      };
      reader.readAsText(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setIsSubmitting(true);

    const ext = getFileExtension(formName);
    const fileType = detectFileType(formName);
    const encoder = new TextEncoder();
    const size = encoder.encode(formContent).length;

    const fileToSave: VaultFile = {
      id: isEditing && activeFile ? activeFile.id : `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: formName.trim(),
      extension: ext || 'txt',
      fileType,
      content: formContent,
      size,
      createdAt: isEditing && activeFile ? activeFile.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      note: formNote.trim() || undefined,
    };

    await onSaveFile(fileToSave);
    setIsSubmitting(false);
    setIsCreating(false);
    setIsEditing(false);
    setActiveFile(fileToSave);
  };

  const openEditModal = (file: VaultFile) => {
    setFormName(file.name);
    setFormContent(file.content);
    setFormNote(file.note || '');
    setIsEditing(true);
    setIsCreating(true);
  };

  const openCreateModal = () => {
    setFormName('');
    setFormContent('');
    setFormNote('');
    setIsEditing(false);
    setIsCreating(true);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileBadgeColor = (type: string) => {
    switch (type) {
      case 'html': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'env': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'json': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'md': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'code': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <div className="space-y-6 font-cairo">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-blue-400" />
            <span>{t.files}</span>
          </h1>
          <p className="text-xs text-neutral-400">
            {lang === 'ar' ? 'تخزين ومعاينة وتشفير الملفات النصية، صفحات HTML والأكواد المصدرية' : 'Save, inspect and render text files, HTML code and confidential documents'}
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
            <UploadCloud className="w-4 h-4 text-blue-400" />
            <span>{t.uploadFile}</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>{t.createFile}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث باسم الملف...' : 'Search by filename...'}
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-blue-500 rounded-lg ps-9 pe-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'txt', 'html', 'env', 'json', 'md', 'code'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer capitalize whitespace-nowrap ${
                filterType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-800/60 hover:bg-neutral-800 text-neutral-400'
              }`}
            >
              {type === 'all' ? (lang === 'ar' ? 'الكل' : 'All') : type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Drag and Drop Zone if empty or general drop area */}
      {files.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-neutral-800 hover:border-blue-500/50 bg-neutral-900/30 hover:bg-neutral-900/60 rounded-2xl p-12 text-center transition-all cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-2xl bg-neutral-800 group-hover:bg-blue-950/60 border border-neutral-700 group-hover:border-blue-500/40 flex items-center justify-center mx-auto mb-4 text-neutral-400 group-hover:text-blue-400 transition-all">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-neutral-200 mb-1">
            {t.dragDropFile}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {t.supportedFiles}
          </p>
        </div>
      ) : (
        /* Files Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => setActiveFile(file)}
              className="bg-neutral-900/80 hover:bg-neutral-800/90 border border-neutral-800 hover:border-blue-500/40 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between group cursor-pointer shadow-sm relative overflow-hidden"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-blue-400 shrink-0">
                      {file.fileType === 'html' ? (
                        <Code className="w-4 h-4 text-orange-400" />
                      ) : file.fileType === 'env' ? (
                        <FileCode className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate font-mono">
                        {file.name}
                      </h3>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {formatBytes(file.size)} • {formatDate(file.updatedAt || file.createdAt, lang)}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${getFileBadgeColor(file.fileType)}`}>
                    {file.extension || file.fileType}
                  </span>
                </div>

                {/* Content excerpt preview */}
                <div className="bg-neutral-950/80 border border-neutral-900 rounded-lg p-2.5 mb-3 text-[11px] font-mono text-neutral-400 line-clamp-3 overflow-hidden select-none">
                  {file.content.slice(0, 180) || (
                    <span className="text-neutral-600 italic">ملف فارغ</span>
                  )}
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs text-neutral-400">
                <span className="text-[11px] text-neutral-500 font-medium flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{lang === 'ar' ? 'معاينة' : 'Inspect'}</span>
                </span>
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => downloadFile(file.name, file.content)}
                    title={t.download}
                    className="p-1.5 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(file)}
                    title={t.edit}
                    className="p-1.5 hover:text-blue-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(t.deleteConfirm)) {
                        onDeleteFile(file.id);
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
          ))}
        </div>
      )}

      {/* File Preview Modal */}
      {activeFile && !isCreating && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-white truncate font-mono">
                    {activeFile.name}
                  </h2>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                    <span>{formatBytes(activeFile.size)}</span>
                    <span>•</span>
                    <span>{formatDate(activeFile.updatedAt, lang)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {activeFile.fileType === 'html' && (
                  <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs">
                    <button
                      onClick={() => setPreviewTab('preview')}
                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                        previewTab === 'preview'
                          ? 'bg-orange-500/20 text-orange-400 font-bold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {t.interactivePreview}
                    </button>
                    <button
                      onClick={() => setPreviewTab('code')}
                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                        previewTab === 'code'
                          ? 'bg-neutral-800 text-white font-bold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {t.rawCode}
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleCopy(activeFile.content)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? t.copied : t.copy}</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadFile(activeFile.name, activeFile.content)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.download}</span>
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(activeFile)}
                  className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFile(null)}
                  className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-5 overflow-y-auto bg-neutral-950/60">
              {activeFile.fileType === 'html' && previewTab === 'preview' ? (
                /* Sandboxed HTML Iframe Preview */
                <div className="w-full h-[500px] bg-white rounded-xl overflow-hidden border border-neutral-700 shadow-inner">
                  <iframe
                    title="HTML Preview Sandbox"
                    srcDoc={activeFile.content}
                    sandbox="allow-scripts allow-modals"
                    className="w-full h-full border-none"
                  />
                </div>
              ) : (
                /* Code / Text Viewer */
                <div className="bg-[#090b10] border border-neutral-800 rounded-xl p-4 overflow-x-auto text-xs font-mono leading-relaxed text-neutral-200">
                  <pre className="whitespace-pre-wrap font-mono-code">{activeFile.content}</pre>
                </div>
              )}
            </div>

            {/* Modal Footer Note */}
            {activeFile.note && (
              <div className="px-5 py-3 bg-neutral-900/90 border-t border-neutral-800 text-xs text-neutral-400">
                <span className="font-semibold text-neutral-300">{lang === 'ar' ? 'ملاحظة:' : 'Note:'} </span>
                {activeFile.note}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span>{isEditing ? (lang === 'ar' ? 'تعديل الملف' : 'Edit File') : t.createFile}</span>
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

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300">
                  {t.fileName}
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: index.html أو config.txt أو secrets.env' : 'e.g., index.html, notes.txt, or api.json'}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300">
                  {t.fileContent}
                </label>
                <textarea
                  rows={12}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={lang === 'ar' ? 'الصق محتوى الملف أو اكتب الكود هنا...' : 'Paste or type file content here...'}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-blue-500 rounded-xl p-3.5 text-xs text-white placeholder-neutral-500 outline-none font-mono resize-none leading-relaxed"
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
                  placeholder={lang === 'ar' ? 'ملاحظة توضيحية حول الملف...' : 'Descriptive note about this file...'}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 outline-none"
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
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

import React, { useState } from 'react';
import { 
  Settings, 
  Download, 
  Upload, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  FileJson, 
  Lock 
} from 'lucide-react';
import { FirebaseVaultService } from '../services/firebaseRtdb';
import { Language, translations } from '../utils/i18n';
import { downloadFile } from '../utils/vaultUtils';

interface SettingsModalProps {
  onClose: () => void;
  onDataImported: () => void;
  lang: Language;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onDataImported,
  lang,
}) => {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmNewPwd, setConfirmNewPwd] = useState('');
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const t = translations[lang];

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    if (!newPwd.trim()) {
      setPwdMsg({ type: 'error', text: t.passwordEmpty });
      return;
    }
    if (newPwd !== confirmNewPwd) {
      setPwdMsg({ type: 'error', text: t.passwordMismatch });
      return;
    }
    if (newPwd.length < 6) {
      setPwdMsg({ type: 'error', text: lang === 'ar' ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف' : 'Password must be at least 6 characters' });
      return;
    }

    setIsUpdatingPwd(true);
    try {
      // Check current password first
      const verify = await FirebaseVaultService.verifyAdminPassword(currentPwd);
      if (!verify.success) {
        setPwdMsg({ type: 'error', text: lang === 'ar' ? 'كلمة المرور الحالية غير صحيحة' : 'Current password is incorrect' });
        setIsUpdatingPwd(false);
        return;
      }

      await FirebaseVaultService.setAdminPassword(newPwd);
      setPwdMsg({ type: 'success', text: lang === 'ar' ? 'تم تحديث وحفظ كلمة المرور في Firebase بنجاح!' : 'Password updated in Firebase successfully!' });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmNewPwd('');
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.message || 'Error updating password' });
    } finally {
      setIsUpdatingPwd(false);
    }
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const data = await FirebaseVaultService.getAllVaultData();
      const filename = `secure_vault_backup_${new Date().toISOString().slice(0, 10)}.json`;
      downloadFile(filename, JSON.stringify(data, null, 2), 'application/json');
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await FirebaseVaultService.importVaultData(json);
        setImportMsg({ type: 'success', text: lang === 'ar' ? 'تم استيراد وحفظ البيانات بنجاح في Firebase!' : 'Vault data imported successfully!' });
        onDataImported();
      } catch (err) {
        setImportMsg({ type: 'error', text: lang === 'ar' ? 'ملف النسخة الاحتياطية غير صالح أو تالف JSON' : 'Invalid backup JSON file' });
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 font-cairo max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-neutral-400" />
          <span>{t.settings}</span>
        </h1>
        <p className="text-xs text-neutral-400">
          {lang === 'ar' ? 'إدارة مفتاح الحماية الرئيسي، تصدير واستيراد البيانات وإعدادات قاعدة البيانات' : 'Manage master security key, data exports, and database settings'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Change Master Password Box */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5 text-amber-400">
            <Lock className="w-5 h-5" />
            <h2 className="text-sm font-bold text-white">
              {t.changeMasterPassword}
            </h2>
          </div>

          {pwdMsg && (
            <div className={`p-3 rounded-xl flex items-center gap-2 text-xs ${
              pwdMsg.type === 'success' 
                ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300' 
                : 'bg-red-950/50 border border-red-800 text-red-300'
            }`}>
              {pwdMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />}
              <span>{pwdMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-400">
                {t.currentPassword}
              </label>
              <input
                type="password"
                required
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-400">
                {t.newPassword}
              </label>
              <input
                type="password"
                required
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-400">
                {t.confirmNewPassword}
              </label>
              <input
                type="password"
                required
                value={confirmNewPwd}
                onChange={(e) => setConfirmNewPwd(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingPwd}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUpdatingPwd ? (
                <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t.updatePasswordBtn}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Backup and Data Export */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-blue-400 mb-2">
              <FileJson className="w-5 h-5" />
              <h2 className="text-sm font-bold text-white">
                {t.backupAndExport}
              </h2>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t.backupDescription}
            </p>

            {importMsg && (
              <div className={`mt-3 p-3 rounded-xl flex items-center gap-2 text-xs ${
                importMsg.type === 'success' 
                  ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300' 
                  : 'bg-red-950/50 border border-red-800 text-red-300'
              }`}>
                {importMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />}
                <span>{importMsg.text}</span>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={handleExportBackup}
              disabled={isExporting}
              className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>{isExporting ? 'جارٍ التصدير...' : t.exportJson}</span>
            </button>

            <label className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>{isImporting ? 'جارٍ الاستيراد...' : t.importJson}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Firebase Database Status Card */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-emerald-400 mb-3">
          <Database className="w-5 h-5" />
          <h2 className="text-sm font-bold text-white">
            {t.firebaseConfigInfo}
          </h2>
        </div>
        <div className="space-y-2 text-xs font-mono text-neutral-400">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl">
            <span className="text-neutral-500">Endpoint:</span>
            <span className="text-emerald-400 select-all">https://studio-7413069484-7dc65-default-rtdb.firebaseio.com/</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl">
            <span className="text-neutral-500">Security Path:</span>
            <span className="text-neutral-300 select-all">/admin/password</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl">
            <span className="text-neutral-500">Vault Collections:</span>
            <span className="text-neutral-300">vault/files, vault/env, vault/passwords, vault/apis, vault/links</span>
          </div>
        </div>
      </div>
    </div>
  );
};

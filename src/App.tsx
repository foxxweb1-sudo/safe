import React, { useState, useEffect, useCallback } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { FilesVault } from './components/FilesVault';
import { EnvVault } from './components/EnvVault';
import { PasswordsVault } from './components/PasswordsVault';
import { ApiKeysVault } from './components/ApiKeysVault';
import { LinksVault } from './components/LinksVault';
import { SettingsModal } from './components/SettingsModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { FirebaseVaultService } from './services/firebaseRtdb';
import { 
  VaultFile, 
  VaultEnv, 
  VaultPassword, 
  VaultApi, 
  VaultLink, 
  VaultStats, 
  ActiveTab 
} from './types/vault';
import { Language } from './utils/i18n';
import { calculatePasswordStrength } from './utils/vaultUtils';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [lang, setLang] = useState<Language>('ar');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Vault collections
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [envs, setEnvs] = useState<VaultEnv[]>([]);
  const [passwords, setPasswords] = useState<VaultPassword[]>([]);
  const [apis, setApis] = useState<VaultApi[]>([]);
  const [links, setLinks] = useState<VaultLink[]>([]);

  // Navigation targets from overview or search
  const [selectedFile, setSelectedFile] = useState<VaultFile | null>(null);
  const [selectedEnv, setSelectedEnv] = useState<VaultEnv | null>(null);

  // Sync RTL / LTR on html document element
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Load all vault data from Firebase Realtime DB
  const loadVaultData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [fetchedFiles, fetchedEnvs, fetchedPasswords, fetchedApis, fetchedLinks] = await Promise.all([
        FirebaseVaultService.getFiles(),
        FirebaseVaultService.getEnvs(),
        FirebaseVaultService.getPasswords(),
        FirebaseVaultService.getApis(),
        FirebaseVaultService.getLinks(),
      ]);

      // If all are empty, seed starter demo items
      if (
        fetchedFiles.length === 0 &&
        fetchedEnvs.length === 0 &&
        fetchedPasswords.length === 0 &&
        fetchedApis.length === 0 &&
        fetchedLinks.length === 0
      ) {
        const seedFiles: VaultFile[] = [
          {
            id: 'file_html_demo',
            name: 'landing_preview.html',
            extension: 'html',
            fileType: 'html',
            content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: system-ui, sans-serif; background: #0b0f19; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #161f30; padding: 2rem; border-radius: 1rem; border: 1px solid #283548; text-align: center; max-width: 400px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    h2 { color: #10b981; margin-top: 0; font-size: 22px; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
    .btn { background: #10b981; color: #000; font-weight: bold; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-top: 10px; }
    .btn:hover { background: #34d399; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Secure Vault Sandbox</h2>
    <p>This is a live rendered HTML sandbox safely previewed inside your Firebase Realtime Vault.</p>
    <button class="btn" onclick="alert('Iframe Sandbox is functioning securely!')">Click for Test</button>
  </div>
</body>
</html>`,
            size: 890,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            note: 'Sample HTML live sandbox component',
          },
          {
            id: 'file_txt_demo',
            name: 'security_guidelines.txt',
            extension: 'txt',
            fileType: 'txt',
            content: `===========================================
SECURE VAULT OPERATIONAL GUIDELINES
===========================================
1. Master password is kept strictly in /admin/password.
2. All variables in .env vault are masked by default.
3. Keep your API Secrets and private keys in the API Keys vault.
4. Perform periodic JSON backups via the Settings menu.`,
            size: 420,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            note: 'Operational security guidelines',
          }
        ];

        const seedEnvs: VaultEnv[] = [
          {
            id: 'env_prod_sample',
            title: 'Cloudflare Production Environment',
            environment: 'production',
            content: `DATABASE_URL="postgres://admin:x92ksLw029m@ep-cool-cloud.us-east-2.aws.neon.tech/main?sslmode=require"\nREDIS_HOST="redis-192.cache.aws.cloud.io:6379"\nJWT_SECRET="e98a3b2c1d0f5e7a8b9c0d1e2f3a4b5c"\nFIREBASE_PROJECT_ID="studio-7413069484-7dc65"\nAPP_DEBUG=false\nPORT=3000`,
            keyCount: 6,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            note: 'Main production environment variables',
          }
        ];

        const seedPasswords: VaultPassword[] = [
          {
            id: 'pwd_google_demo',
            serviceName: 'Google Workspace',
            username: 'support.cybenode@gmail.com',
            password: 'gP#9xK!2vL8$wQ4m',
            url: 'https://admin.google.com',
            note: 'Super Admin corporate account',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'pwd_github_demo',
            serviceName: 'GitHub Enterprise',
            username: 'lead-architect',
            password: 'hT8*mN3@bV9#zP2w',
            url: 'https://github.com',
            note: 'Primary Organization Admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ];

        const seedApis: VaultApi[] = [
          {
            id: 'api_gemini_demo',
            serviceName: 'Google Gemini Pro',
            apiKey: 'AIzaSyD-sample-gemini-key-84920491823901823',
            apiSecret: 'sec_gemini_prod_892839182903',
            environment: 'production',
            docsUrl: 'https://aistudio.google.com',
            note: 'Gemini 2.5 Flash and Pro API access key',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'api_stripe_demo',
            serviceName: 'Stripe Payments',
            apiKey: 'pk_live_51N2xLw9283Kjs9283Ls9283',
            apiSecret: 'sk_live_51N2xLw9283Kjs9283Ls928309123801293',
            environment: 'production',
            docsUrl: 'https://dashboard.stripe.com/apikeys',
            note: 'Billing checkout payment gateway',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ];

        const seedLinks: VaultLink[] = [
          {
            id: 'link_firebase_console',
            title: 'Firebase RTDB Console',
            url: 'https://console.firebase.google.com/project/studio-7413069484-7dc65/database',
            category: 'Dashboards',
            note: 'Direct link to database dashboard',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'link_aistudio',
            title: 'Google AI Studio',
            url: 'https://aistudio.google.com',
            category: 'Tools',
            note: 'Developer build portal',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ];

        // Save seed items
        for (const f of seedFiles) await FirebaseVaultService.saveFile(f);
        for (const e of seedEnvs) await FirebaseVaultService.saveEnv(e);
        for (const p of seedPasswords) await FirebaseVaultService.savePassword(p);
        for (const a of seedApis) await FirebaseVaultService.saveApi(a);
        for (const l of seedLinks) await FirebaseVaultService.saveLink(l);

        setFiles(seedFiles);
        setEnvs(seedEnvs);
        setPasswords(seedPasswords);
        setApis(seedApis);
        setLinks(seedLinks);
      } else {
        setFiles(fetchedFiles);
        setEnvs(fetchedEnvs);
        setPasswords(fetchedPasswords);
        setApis(fetchedApis);
        setLinks(fetchedLinks);
      }
    } catch (err) {
      console.error('Error fetching vault data:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Fetch when unlocked
  useEffect(() => {
    if (isUnlocked) {
      loadVaultData();
    }
  }, [isUnlocked, loadVaultData]);

  // CRUD Handlers for Files
  const handleSaveFile = async (file: VaultFile) => {
    await FirebaseVaultService.saveFile(file);
    setFiles(prev => {
      const idx = prev.findIndex(f => f.id === file.id);
      if (idx >= 0) return prev.map(f => f.id === file.id ? file : f);
      return [file, ...prev];
    });
  };

  const handleDeleteFile = async (id: string) => {
    await FirebaseVaultService.deleteFile(id);
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // CRUD Handlers for ENV
  const handleSaveEnv = async (env: VaultEnv) => {
    await FirebaseVaultService.saveEnv(env);
    setEnvs(prev => {
      const idx = prev.findIndex(e => e.id === env.id);
      if (idx >= 0) return prev.map(e => e.id === env.id ? env : e);
      return [env, ...prev];
    });
  };

  const handleDeleteEnv = async (id: string) => {
    await FirebaseVaultService.deleteEnv(id);
    setEnvs(prev => prev.filter(e => e.id !== id));
  };

  // CRUD Handlers for Passwords
  const handleSavePassword = async (pw: VaultPassword) => {
    await FirebaseVaultService.savePassword(pw);
    setPasswords(prev => {
      const idx = prev.findIndex(p => p.id === pw.id);
      if (idx >= 0) return prev.map(p => p.id === pw.id ? pw : p);
      return [pw, ...prev];
    });
  };

  const handleDeletePassword = async (id: string) => {
    await FirebaseVaultService.deletePassword(id);
    setPasswords(prev => prev.filter(p => p.id !== id));
  };

  // CRUD Handlers for APIs
  const handleSaveApi = async (api: VaultApi) => {
    await FirebaseVaultService.saveApi(api);
    setApis(prev => {
      const idx = prev.findIndex(a => a.id === api.id);
      if (idx >= 0) return prev.map(a => a.id === api.id ? api : a);
      return [api, ...prev];
    });
  };

  const handleDeleteApi = async (id: string) => {
    await FirebaseVaultService.deleteApi(id);
    setApis(prev => prev.filter(a => a.id !== id));
  };

  // CRUD Handlers for Links
  const handleSaveLink = async (link: VaultLink) => {
    await FirebaseVaultService.saveLink(link);
    setLinks(prev => {
      const idx = prev.findIndex(l => l.id === link.id);
      if (idx >= 0) return prev.map(l => l.id === link.id ? link : l);
      return [link, ...prev];
    });
  };

  const handleDeleteLink = async (id: string) => {
    await FirebaseVaultService.deleteLink(id);
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  // Calculate vault stats
  const weakPasswordsCount = passwords.filter(p => calculatePasswordStrength(p.password).score <= 1).length;

  const stats: VaultStats = {
    totalItems: files.length + envs.length + passwords.length + apis.length + links.length,
    filesCount: files.length,
    envsCount: envs.length,
    passwordsCount: passwords.length,
    apisCount: apis.length,
    linksCount: links.length,
    weakPasswordsCount,
    lastUpdated: new Date().toISOString(),
  };

  const handleQuickAdd = (type: 'file' | 'env' | 'password' | 'api' | 'link') => {
    switch (type) {
      case 'file':
        setActiveTab('files');
        break;
      case 'env':
        setActiveTab('env');
        break;
      case 'password':
        setActiveTab('passwords');
        break;
      case 'api':
        setActiveTab('apis');
        break;
      case 'link':
        setActiveTab('links');
        break;
    }
  };

  // If locked, render security gateway
  if (!isUnlocked) {
    return (
      <AuthScreen 
        onUnlock={() => setIsUnlocked(true)} 
        lang={lang} 
        setLang={setLang} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-neutral-100 flex flex-col font-cairo">
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          stats={stats}
          onLock={() => setIsUnlocked(false)}
          lang={lang}
          isOpenMobile={isOpenMobile}
          setIsOpenMobile={setIsOpenMobile}
        />

        {/* Main Work Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Header
            lang={lang}
            setLang={setLang}
            onOpenSearch={() => setIsSearchOpen(true)}
            onRefresh={loadVaultData}
            isSyncing={isSyncing}
            onToggleMobileMenu={() => setIsOpenMobile(!isOpenMobile)}
            onQuickAdd={handleQuickAdd}
          />

          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
            {activeTab === 'overview' && (
              <DashboardOverview
                stats={stats}
                files={files}
                envs={envs}
                passwords={passwords}
                apis={apis}
                links={links}
                setActiveTab={setActiveTab}
                onQuickAdd={handleQuickAdd}
                onSelectFile={(f) => {
                  setSelectedFile(f);
                  setActiveTab('files');
                }}
                onSelectEnv={(e) => {
                  setSelectedEnv(e);
                  setActiveTab('env');
                }}
                lang={lang}
              />
            )}

            {activeTab === 'files' && (
              <FilesVault
                files={files}
                onSaveFile={handleSaveFile}
                onDeleteFile={handleDeleteFile}
                selectedFileFromParent={selectedFile}
                onClearSelectedFile={() => setSelectedFile(null)}
                lang={lang}
              />
            )}

            {activeTab === 'env' && (
              <EnvVault
                envs={envs}
                onSaveEnv={handleSaveEnv}
                onDeleteEnv={handleDeleteEnv}
                selectedEnvFromParent={selectedEnv}
                onClearSelectedEnv={() => setSelectedEnv(null)}
                lang={lang}
              />
            )}

            {activeTab === 'passwords' && (
              <PasswordsVault
                passwords={passwords}
                onSavePassword={handleSavePassword}
                onDeletePassword={handleDeletePassword}
                lang={lang}
              />
            )}

            {activeTab === 'apis' && (
              <ApiKeysVault
                apis={apis}
                onSaveApi={handleSaveApi}
                onDeleteApi={handleDeleteApi}
                lang={lang}
              />
            )}

            {activeTab === 'links' && (
              <LinksVault
                links={links}
                onSaveLink={handleSaveLink}
                onDeleteLink={handleDeleteLink}
                lang={lang}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsModal
                onClose={() => setActiveTab('overview')}
                onDataImported={loadVaultData}
                lang={lang}
              />
            )}
          </main>
        </div>
      </div>

      {/* Global Search Palette Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        files={files}
        envs={envs}
        passwords={passwords}
        apis={apis}
        links={links}
        onNavigate={setActiveTab}
        onSelectFile={(f) => {
          setSelectedFile(f);
          setActiveTab('files');
        }}
        onSelectEnv={(e) => {
          setSelectedEnv(e);
          setActiveTab('env');
        }}
        lang={lang}
      />
    </div>
  );
}

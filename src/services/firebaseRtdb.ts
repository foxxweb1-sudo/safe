import { VaultFile, VaultEnv, VaultPassword, VaultApi, VaultLink, AllVaultData } from '../types/vault';
import { hashPassword } from '../utils/vaultUtils';

const FIREBASE_DB_URL = 'https://studio-7413069484-7dc65-default-rtdb.firebaseio.com';
const STORAGE_PREFIX = 'secure_vault_cache_';

// Helper for local storage caching
const getCached = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setCached = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage error:', err);
  }
};

export interface AdminStatusResult {
  hasPassword: boolean;
  isPermissionDenied: boolean;
  errorMessage?: string;
}

// Generic REST fetch with timeout and optional auth parameter
async function fetchRtdb<T>(path: string, options: RequestInit = {}): Promise<T> {
  const secret = localStorage.getItem('vault_rtdb_secret')?.trim();
  const authQuery = secret ? `?auth=${encodeURIComponent(secret)}` : '';
  const cleanPath = path.replace(/^\//, '');
  const url = `${FIREBASE_DB_URL}/${cleanPath}.json${authQuery}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    clearTimeout(timeoutId);

    if (response.status === 401 || response.status === 403) {
      throw new Error(`Permission denied (HTTP ${response.status})`);
    }

    if (!response.ok) {
      throw new Error(`Firebase RTDB request failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export const FirebaseVaultService = {
  // Database Secret Management for Locked RTDB
  getDbSecret(): string {
    return localStorage.getItem('vault_rtdb_secret') || '';
  },

  setDbSecret(secret: string): void {
    if (secret && secret.trim()) {
      localStorage.setItem('vault_rtdb_secret', secret.trim());
    } else {
      localStorage.removeItem('vault_rtdb_secret');
    }
  },

  // Check admin setup and permission status accurately
  async checkAdminPasswordStatus(): Promise<AdminStatusResult> {
    try {
      const stored = await fetchRtdb<any>('admin');
      if (stored && (stored.password_hash || stored.password)) {
        return { hasPassword: true, isPermissionDenied: false };
      }
      return { hasPassword: false, isPermissionDenied: false };
    } catch (err: any) {
      const msg = String(err?.message || err);
      const isPerm = msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('permission denied');
      return {
        hasPassword: false,
        isPermissionDenied: isPerm,
        errorMessage: isPerm
          ? 'قاعدة بيانات Firebase مقفلة بصلاحيات الأمان (Permission Denied).'
          : 'تعذر الاتصال بقاعدة بيانات Firebase.'
      };
    }
  },

  // Verify input password with SHA-256 hash comparison
  async verifyAdminPassword(inputPassword: string): Promise<{ success: boolean; isPermissionDenied?: boolean; errorMessage?: string }> {
    try {
      const hashedInput = await hashPassword(inputPassword.trim());
      const adminData = await fetchRtdb<any>('admin');

      if (!adminData || (!adminData.password_hash && !adminData.password)) {
        return { success: false, errorMessage: 'لم يتم العثور على كلمة مرور مسجلة في قاعدة البيانات' };
      }

      // Check SHA-256 hash
      if (adminData.password_hash) {
        return { success: adminData.password_hash === hashedInput };
      }

      // Legacy plaintext match + auto upgrade to hash
      if (adminData.password && adminData.password === inputPassword.trim()) {
        try {
          await fetchRtdb('admin', {
            method: 'PATCH',
            body: JSON.stringify({
              password_hash: hashedInput,
              upgraded_at: new Date().toISOString(),
            }),
          });
          await fetchRtdb('admin/password', { method: 'DELETE' });
        } catch {}
        return { success: true };
      }

      return { success: false };
    } catch (err: any) {
      const msg = String(err?.message || err);
      const isPerm = msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('permission denied');
      return {
        success: false,
        isPermissionDenied: isPerm,
        errorMessage: isPerm
          ? 'قاعدة البيانات مقفلة بصلاحيات الأمان (Permission Denied). يرجى إدخال Database Secret أو مراجعة القواعد.'
          : 'تعذر التحقق من كلمة المرور بسبب خطأ في الشبكة.'
      };
    }
  },

  // Set or update admin password with SHA-256 hashing
  async setAdminPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const hashed = await hashPassword(newPassword.trim());
      await fetchRtdb('admin', {
        method: 'PATCH',
        body: JSON.stringify({
          password_hash: hashed,
          configured_at: new Date().toISOString(),
        }),
      });
      return { success: true };
    } catch (err: any) {
      console.error('Failed to set admin password on Firebase:', err);
      const msg = String(err?.message || err);
      const isPerm = msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('permission denied');
      return {
        success: false,
        error: isPerm
          ? 'تعذر الحفظ في Firebase بسبب قواعد الحماية (Permission Denied). يرجى ضبط القواعد في Firebase Console أولاً أو استخدام Database Secret.'
          : 'تعذر الاتصال بـ Firebase.'
      };
    }
  },

  // ---------------- FILES ----------------
  async getFiles(): Promise<VaultFile[]> {
    try {
      const data = await fetchRtdb<Record<string, VaultFile> | null>('vault/files');
      const list: VaultFile[] = data ? Object.values(data).filter(Boolean) : [];
      setCached('files', list);
      return list;
    } catch (err) {
      console.warn('Using cached files due to network/rules:', err);
      return getCached<VaultFile[]>('files') || [];
    }
  },

  async saveFile(file: VaultFile): Promise<VaultFile> {
    try {
      await fetchRtdb(`vault/files/${file.id}`, {
        method: 'PUT',
        body: JSON.stringify(file),
      });
    } catch (err) {
      console.warn('Saved file locally due to network/rules:', err);
    }
    const current = getCached<VaultFile[]>('files') || [];
    const index = current.findIndex(f => f.id === file.id);
    const updated = index >= 0 ? current.map(f => (f.id === file.id ? file : f)) : [file, ...current];
    setCached('files', updated);
    return file;
  },

  async deleteFile(id: string): Promise<void> {
    try {
      await fetchRtdb(`vault/files/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Failed to delete on server:', err);
    }
    const current = getCached<VaultFile[]>('files') || [];
    setCached('files', current.filter(f => f.id !== id));
  },

  // ---------------- ENV ----------------
  async getEnvs(): Promise<VaultEnv[]> {
    try {
      const data = await fetchRtdb<Record<string, VaultEnv> | null>('vault/env');
      const list: VaultEnv[] = data ? Object.values(data).filter(Boolean) : [];
      setCached('env', list);
      return list;
    } catch (err) {
      console.warn('Using cached env due to network/rules:', err);
      return getCached<VaultEnv[]>('env') || [];
    }
  },

  async saveEnv(env: VaultEnv): Promise<VaultEnv> {
    try {
      await fetchRtdb(`vault/env/${env.id}`, {
        method: 'PUT',
        body: JSON.stringify(env),
      });
    } catch (err) {
      console.warn('Saved env locally due to network/rules:', err);
    }
    const current = getCached<VaultEnv[]>('env') || [];
    const index = current.findIndex(e => e.id === env.id);
    const updated = index >= 0 ? current.map(e => (e.id === env.id ? env : e)) : [env, ...current];
    setCached('env', updated);
    return env;
  },

  async deleteEnv(id: string): Promise<void> {
    try {
      await fetchRtdb(`vault/env/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Failed to delete env on server:', err);
    }
    const current = getCached<VaultEnv[]>('env') || [];
    setCached('env', current.filter(e => e.id !== id));
  },

  // ---------------- PASSWORDS ----------------
  async getPasswords(): Promise<VaultPassword[]> {
    try {
      const data = await fetchRtdb<Record<string, VaultPassword> | null>('vault/passwords');
      const list: VaultPassword[] = data ? Object.values(data).filter(Boolean) : [];
      setCached('passwords', list);
      return list;
    } catch (err) {
      console.warn('Using cached passwords due to network/rules:', err);
      return getCached<VaultPassword[]>('passwords') || [];
    }
  },

  async savePassword(pw: VaultPassword): Promise<VaultPassword> {
    try {
      await fetchRtdb(`vault/passwords/${pw.id}`, {
        method: 'PUT',
        body: JSON.stringify(pw),
      });
    } catch (err) {
      console.warn('Saved password locally due to network/rules:', err);
    }
    const current = getCached<VaultPassword[]>('passwords') || [];
    const index = current.findIndex(p => p.id === pw.id);
    const updated = index >= 0 ? current.map(p => (p.id === pw.id ? pw : p)) : [pw, ...current];
    setCached('passwords', updated);
    return pw;
  },

  async deletePassword(id: string): Promise<void> {
    try {
      await fetchRtdb(`vault/passwords/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Failed to delete password on server:', err);
    }
    const current = getCached<VaultPassword[]>('passwords') || [];
    setCached('passwords', current.filter(p => p.id !== id));
  },

  // ---------------- APIS ----------------
  async getApis(): Promise<VaultApi[]> {
    try {
      const data = await fetchRtdb<Record<string, VaultApi> | null>('vault/apis');
      const list: VaultApi[] = data ? Object.values(data).filter(Boolean) : [];
      setCached('apis', list);
      return list;
    } catch (err) {
      console.warn('Using cached apis due to network/rules:', err);
      return getCached<VaultApi[]>('apis') || [];
    }
  },

  async saveApi(api: VaultApi): Promise<VaultApi> {
    try {
      await fetchRtdb(`vault/apis/${api.id}`, {
        method: 'PUT',
        body: JSON.stringify(api),
      });
    } catch (err) {
      console.warn('Saved api locally due to network/rules:', err);
    }
    const current = getCached<VaultApi[]>('apis') || [];
    const index = current.findIndex(a => a.id === api.id);
    const updated = index >= 0 ? current.map(a => (a.id === api.id ? api : a)) : [api, ...current];
    setCached('apis', updated);
    return api;
  },

  async deleteApi(id: string): Promise<void> {
    try {
      await fetchRtdb(`vault/apis/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Failed to delete api on server:', err);
    }
    const current = getCached<VaultApi[]>('apis') || [];
    setCached('apis', current.filter(a => a.id !== id));
  },

  // ---------------- LINKS ----------------
  async getLinks(): Promise<VaultLink[]> {
    try {
      const data = await fetchRtdb<Record<string, VaultLink> | null>('vault/links');
      const list: VaultLink[] = data ? Object.values(data).filter(Boolean) : [];
      setCached('links', list);
      return list;
    } catch (err) {
      console.warn('Using cached links due to network/rules:', err);
      return getCached<VaultLink[]>('links') || [];
    }
  },

  async saveLink(link: VaultLink): Promise<VaultLink> {
    try {
      await fetchRtdb(`vault/links/${link.id}`, {
        method: 'PUT',
        body: JSON.stringify(link),
      });
    } catch (err) {
      console.warn('Saved link locally due to network/rules:', err);
    }
    const current = getCached<VaultLink[]>('links') || [];
    const index = current.findIndex(l => l.id === link.id);
    const updated = index >= 0 ? current.map(l => (l.id === link.id ? link : l)) : [link, ...current];
    setCached('links', updated);
    return link;
  },

  async deleteLink(id: string): Promise<void> {
    try {
      await fetchRtdb(`vault/links/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Failed to delete link on server:', err);
    }
    const current = getCached<VaultLink[]>('links') || [];
    setCached('links', current.filter(l => l.id !== id));
  },

  // ---------------- BACKUP & ALL DATA ----------------
  async getAllVaultData(): Promise<AllVaultData> {
    try {
      const data = await fetchRtdb<any>('vault');
      return {
        files: data?.files || {},
        env: data?.env || {},
        passwords: data?.passwords || {},
        apis: data?.apis || {},
        links: data?.links || {},
      };
    } catch (err) {
      console.warn('Fetching all from cache:', err);
      return {
        files: (getCached<VaultFile[]>('files') || []).reduce((acc, f) => ({ ...acc, [f.id]: f }), {}),
        env: (getCached<VaultEnv[]>('env') || []).reduce((acc, e) => ({ ...acc, [e.id]: e }), {}),
        passwords: (getCached<VaultPassword[]>('passwords') || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {}),
        apis: (getCached<VaultApi[]>('apis') || []).reduce((acc, a) => ({ ...acc, [a.id]: a }), {}),
        links: (getCached<VaultLink[]>('links') || []).reduce((acc, l) => ({ ...acc, [l.id]: l }), {}),
      };
    }
  },

  async importVaultData(data: Partial<AllVaultData>): Promise<void> {
    if (data.files) {
      for (const file of Object.values(data.files)) {
        await this.saveFile(file);
      }
    }
    if (data.env) {
      for (const env of Object.values(data.env)) {
        await this.saveEnv(env);
      }
    }
    if (data.passwords) {
      for (const pw of Object.values(data.passwords)) {
        await this.savePassword(pw);
      }
    }
    if (data.apis) {
      for (const api of Object.values(data.apis)) {
        await this.saveApi(api);
      }
    }
    if (data.links) {
      for (const link of Object.values(data.links)) {
        await this.saveLink(link);
      }
    }
  }
};

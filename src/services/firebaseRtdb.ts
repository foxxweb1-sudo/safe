import { VaultFile, VaultEnv, VaultPassword, VaultApi, VaultLink, AllVaultData } from '../types/vault';

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

// Generic REST fetch with timeout
async function fetchRtdb<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${FIREBASE_DB_URL}/${path.replace(/^\//, '')}.json`;
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
  // Check admin password
  async verifyAdminPassword(inputPassword: string): Promise<{ success: boolean; isFirstTimeSetup?: boolean }> {
    try {
      const storedPassword = await fetchRtdb<string | null>('admin/password');
      
      // If no password set yet in DB, check local cache or allow initialization
      if (storedPassword === null || storedPassword === undefined || storedPassword === '') {
        const cachedMaster = localStorage.getItem('vault_master_pwd');
        if (!cachedMaster) {
          return { success: false, isFirstTimeSetup: true };
        }
        return { success: inputPassword.trim() === cachedMaster.trim() };
      }

      const match = String(storedPassword).trim() === inputPassword.trim();
      if (match) {
        localStorage.setItem('vault_master_pwd', inputPassword.trim());
      }
      return { success: match };
    } catch (err) {
      console.warn('Network error checking Firebase password, falling back to local verification:', err);
      const cachedMaster = localStorage.getItem('vault_master_pwd');
      if (cachedMaster && inputPassword.trim() === cachedMaster.trim()) {
        return { success: true };
      }
      // If completely fresh and network failed
      if (!cachedMaster) {
        return { success: false, isFirstTimeSetup: true };
      }
      return { success: false };
    }
  },

  // Set or update admin password
  async setAdminPassword(newPassword: string): Promise<boolean> {
    try {
      await fetchRtdb('admin/password', {
        method: 'PUT',
        body: JSON.stringify(newPassword.trim()),
      });
      localStorage.setItem('vault_master_pwd', newPassword.trim());
      return true;
    } catch (err) {
      console.error('Failed to set admin password on Firebase, saving locally:', err);
      localStorage.setItem('vault_master_pwd', newPassword.trim());
      return true;
    }
  },

  // Check if admin password exists
  async checkAdminPasswordExists(): Promise<boolean> {
    try {
      const storedPassword = await fetchRtdb<string | null>('admin/password');
      if (storedPassword) return true;
      return !!localStorage.getItem('vault_master_pwd');
    } catch {
      return !!localStorage.getItem('vault_master_pwd');
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
      console.warn('Using cached files due to network:', err);
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
      console.warn('Saved file locally due to network:', err);
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
      console.warn('Using cached env due to network:', err);
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
      console.warn('Saved env locally due to network:', err);
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
      console.warn('Using cached passwords due to network:', err);
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
      console.warn('Saved password locally due to network:', err);
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
      console.warn('Using cached apis due to network:', err);
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
      console.warn('Saved api locally due to network:', err);
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
      console.warn('Using cached links due to network:', err);
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
      console.warn('Saved link locally due to network:', err);
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

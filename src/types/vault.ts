export type VaultItemType = 'file' | 'env' | 'password' | 'api' | 'link';

export interface VaultFile {
  id: string;
  name: string;
  extension: string;
  fileType: 'txt' | 'html' | 'env' | 'json' | 'md' | 'code' | 'other';
  content: string;
  size: number; // in bytes
  createdAt: string;
  updatedAt: string;
  note?: string;
  tags?: string[];
}

export interface VaultEnv {
  id: string;
  title: string;
  environment: 'production' | 'staging' | 'development' | 'local' | 'test';
  content: string; // raw .env text
  keyCount: number;
  createdAt: string;
  updatedAt: string;
  note?: string;
  tags?: string[];
}

export interface VaultPassword {
  id: string;
  serviceName: string;
  username: string;
  password: string;
  url?: string;
  note?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultApi {
  id: string;
  serviceName: string;
  apiKey: string;
  apiSecret?: string;
  environment?: 'production' | 'sandbox' | 'development' | 'testing';
  note?: string;
  docsUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultLink {
  id: string;
  title: string;
  url: string;
  category?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultStats {
  totalItems: number;
  filesCount: number;
  envsCount: number;
  passwordsCount: number;
  apisCount: number;
  linksCount: number;
  weakPasswordsCount: number;
  lastUpdated: string;
}

export interface AllVaultData {
  files: Record<string, VaultFile>;
  env: Record<string, VaultEnv>;
  passwords: Record<string, VaultPassword>;
  apis: Record<string, VaultApi>;
  links: Record<string, VaultLink>;
}

export type ActiveTab = 'overview' | 'files' | 'env' | 'passwords' | 'apis' | 'links' | 'settings';

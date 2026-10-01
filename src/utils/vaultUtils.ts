// Helper utilities for Vault operations

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(isoString: string, lang: 'ar' | 'en' = 'ar'): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = 'cybenode_vault_salt_';
  const data = enc.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generatePassword(options: {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
} = {}): string {
  const {
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options;

  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*()_+~|}{[]:;?><,.-=';

  let charPool = '';
  if (includeUppercase) charPool += upper;
  if (includeLowercase) charPool += lower;
  if (includeNumbers) charPool += numbers;
  if (includeSymbols) charPool += symbols;
  if (!charPool) charPool = lower + numbers;

  let password = '';
  const cryptoObj = window.crypto || (window as any).msCrypto;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const values = new Uint32Array(length);
    cryptoObj.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      password += charPool[values[i] % charPool.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      password += charPool.charAt(Math.floor(Math.random() * charPool.length));
    }
  }
  return password;
}

export function calculatePasswordStrength(password: string): {
  score: number; // 0 to 4
  label: { ar: string; en: string };
  color: string;
} {
  if (!password) return { score: 0, label: { ar: 'فارغ', en: 'Empty' }, color: 'text-neutral-500' };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 14) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 0.5;
  if (/[^A-Za-z0-9]/.test(password)) score += 0.5;

  const rounded = Math.min(4, Math.floor(score));

  switch (rounded) {
    case 0:
    case 1:
      return { score: 1, label: { ar: 'ضعيفة جداً', en: 'Very Weak' }, color: 'text-red-400' };
    case 2:
      return { score: 2, label: { ar: 'متوسطة', en: 'Fair' }, color: 'text-amber-400' };
    case 3:
      return { score: 3, label: { ar: 'قوية', en: 'Strong' }, color: 'text-emerald-400' };
    case 4:
    default:
      return { score: 4, label: { ar: 'حصينة وفولاذية', en: 'Fortified' }, color: 'text-emerald-300' };
  }
}

export function maskSecret(secret: string, visibleChars = 4): string {
  if (!secret) return '';
  if (secret.length <= visibleChars * 2) {
    return '••••••••••••';
  }
  const prefix = secret.slice(0, visibleChars);
  const suffix = secret.slice(-visibleChars);
  return `${prefix}${'•'.repeat(Math.min(12, secret.length - visibleChars * 2))}${suffix}`;
}

export function downloadFile(filename: string, content: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseEnvContent(raw: string): Array<{ key: string; value: string; comment?: string }> {
  const lines = raw.split('\n');
  const result: Array<{ key: string; value: string; comment?: string }> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('#')) {
      result.push({ key: '', value: '', comment: trimmed.substring(1).trim() });
      continue;
    }
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      // Remove wrapping quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      result.push({ key, value });
    }
  }

  return result;
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts.pop()?.toLowerCase() || '';
  }
  return '';
}

export function detectFileType(filename: string): 'txt' | 'html' | 'env' | 'json' | 'md' | 'code' | 'other' {
  const ext = getFileExtension(filename);
  if (ext === 'html' || ext === 'htm') return 'html';
  if (ext === 'env' || filename.startsWith('.env')) return 'env';
  if (ext === 'txt') return 'txt';
  if (ext === 'json') return 'json';
  if (ext === 'md' || ext === 'markdown') return 'md';
  if (['js', 'ts', 'jsx', 'tsx', 'css', 'py', 'sh', 'sql', 'yaml', 'yml', 'xml', 'php', 'c', 'cpp', 'rs', 'go'].includes(ext)) {
    return 'code';
  }
  return 'other';
}

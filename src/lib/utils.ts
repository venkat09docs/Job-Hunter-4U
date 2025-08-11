import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Security utilities
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow https URLs for security
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('Invalid protocol');
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

export function isValidEmbedDomain(url: string): boolean {
  const allowedDomains = [
    'youtube.com',
    'www.youtube.com',
    'youtu.be',
    'vimeo.com',
    'codepen.io',
    'codesandbox.io',
    'replit.com',
    'figma.com',
    'miro.com',
    'airtable.com',
    'notion.so',
    'typeform.com'
  ];
  
  try {
    const parsed = new URL(url);
    return allowedDomains.some(domain => 
      parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  const isValid = errors.length === 0;
  
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (password.length >= 12 && errors.length <= 1) {
    strength = 'medium';
  }
  if (password.length >= 16 && errors.length === 0) {
    strength = 'strong';
  }
  
  return { isValid, errors, strength };
}

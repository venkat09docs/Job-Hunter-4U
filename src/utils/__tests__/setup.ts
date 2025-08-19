// Test setup for Job Hunter system

import { vi } from 'vitest';

// Mock toast function
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockResolvedValue({ error: null })
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null })
    }
  }
}));

// Mock window.localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(() => null),
    removeItem: vi.fn(() => null),
    clear: vi.fn(() => null),
  },
  writable: true,
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve()),
  },
  writable: true,
});

// Mock File constructor for tests
Object.defineProperty(global, 'File', {
  value: class MockFile {
    name: string;
    size: number;
    type: string;
    
    constructor(content: any[], name: string, options: { type: string }) {
      this.name = name;
      this.size = content.join('').length;
      this.type = options.type;
    }
  },
  writable: true,
});
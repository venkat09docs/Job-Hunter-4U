import { validateFile, FileValidationRules } from './fileValidation';

// GitHub-specific file validation rules
export const GITHUB_FILE_VALIDATION_RULES: Record<string, FileValidationRules> = {
  screenshot: {
    allowedTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    minSizeBytes: 1024, // 1KB
  },
  markdown: {
    allowedTypes: ['text/markdown', 'text/plain'],
    maxSizeBytes: 1024 * 1024, // 1MB
    minSizeBytes: 1, // 1 byte
  },
  document: {
    allowedTypes: ['application/pdf', 'text/markdown', 'text/plain'],
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    minSizeBytes: 1, // 1 byte
  },
};

// Validate GitHub URL format
export const validateGitHubUrl = (url: string): { valid: boolean; error?: string } => {
  try {
    const parsedUrl = new URL(url);
    
    if (parsedUrl.hostname !== 'github.com') {
      return { valid: false, error: 'URL must be from github.com' };
    }

    // Basic path validation for common GitHub URLs
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    
    if (pathSegments.length < 2) {
      return { valid: false, error: 'Invalid GitHub URL format' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
};

// Validate repository full name format (owner/repo)
export const validateRepoFullName = (fullName: string): { valid: boolean; error?: string } => {
  const repoRegex = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
  
  if (!repoRegex.test(fullName)) {
    return { 
      valid: false, 
      error: 'Repository name must be in format "owner/repository" with valid characters' 
    };
  }

  const [owner, repo] = fullName.split('/');
  
  if (owner.length === 0 || repo.length === 0) {
    return { valid: false, error: 'Both owner and repository names are required' };
  }

  if (owner.length > 39 || repo.length > 100) {
    return { valid: false, error: 'Owner or repository name is too long' };
  }

  return { valid: true };
};

// Validate evidence based on task requirements
export const validateEvidenceForTask = (
  taskCode: string, 
  evidenceType: 'URL' | 'SCREENSHOT' | 'FILE',
  data: { url?: string; file?: File }
): { valid: boolean; error?: string } => {
  
  // Task-specific validation rules
  const taskRules: Record<string, { requiredTypes: string[]; urlPatterns?: RegExp[] }> = {
    'GHW_COMMIT_3DAYS': { 
      requiredTypes: ['URL', 'SCREENSHOT'],
      urlPatterns: [/github\.com\/.*\/commits?/, /github\.com\/.*\/pulse/]
    },
    'GHW_WEEKLY_CHANGELOG': { 
      requiredTypes: ['URL'],
      urlPatterns: [/github\.com\/.*\/releases/, /github\.com\/.*\/blob\/.*CHANGELOG/i]
    },
    'GHW_MERGE_1PR': { 
      requiredTypes: ['URL', 'SCREENSHOT'],
      urlPatterns: [/github\.com\/.*\/pull\/\d+/, /github\.com\/.*\/pulls/]
    },
    'GHW_CLOSE_2ISSUES': { 
      requiredTypes: ['URL', 'SCREENSHOT'],
      urlPatterns: [/github\.com\/.*\/issues?/, /github\.com\/.*\/issues\/\d+/]
    },
    'GHW_README_TWEAK': { 
      requiredTypes: ['URL', 'SCREENSHOT'],
      urlPatterns: [/github\.com\/.*\/blob\/.*README/i, /github\.com\/.*\/commit/]
    },
    'GHW_CI_GREEN': { 
      requiredTypes: ['URL', 'SCREENSHOT'],
      urlPatterns: [/github\.com\/.*\/actions/, /github\.com\/.*\/runs?/]
    },
    'GHW_PAGES_DEPLOY': { 
      requiredTypes: ['URL'],
      urlPatterns: [/\.github\.io/, /pages\.dev/, /netlify\.app/, /vercel\.app/]
    },
    'GHS_ADD_TOPICS': { 
      requiredTypes: ['URL', 'SCREENSHOT'],
      urlPatterns: [/github\.com\/.*\/.*$/] // Any repo URL
    },
    'GHS_PAGES_SETUP': { 
      requiredTypes: ['URL', 'SCREENSHOT'],
      urlPatterns: [/\.github\.io/, /github\.com\/.*\/settings\/pages/]
    },
  };

  const rule = taskRules[taskCode];
  if (!rule) {
    return { valid: true }; // Allow any evidence for unknown tasks
  }

  // Check if evidence type is allowed for this task
  if (!rule.requiredTypes.includes(evidenceType)) {
    return { 
      valid: false, 
      error: `This task requires evidence of type: ${rule.requiredTypes.join(' or ')}` 
    };
  }

  // Validate URL if provided
  if (evidenceType === 'URL' && data.url) {
    const urlValidation = validateGitHubUrl(data.url);
    if (!urlValidation.valid && rule.urlPatterns) {
      // Check if URL matches expected patterns for this task
      const matchesPattern = rule.urlPatterns.some(pattern => pattern.test(data.url!));
      if (!matchesPattern) {
        return { 
          valid: false, 
          error: `URL doesn't match expected pattern for this task` 
        };
      }
    }
  }

  // Validate file if provided
  if (evidenceType !== 'URL' && data.file) {
    const fileType = evidenceType === 'SCREENSHOT' ? 'screenshot' : 'document';
    const fileValidation = validateFile(data.file, GITHUB_FILE_VALIDATION_RULES[fileType]);
    
    if (!fileValidation.isValid) {
      return { valid: false, error: fileValidation.error || 'Invalid file' };
    }
  }

  return { valid: true };
};

// Time window validation for task completion
export const validateTaskTimeWindow = (
  taskCode: string,
  submissionTime: Date,
  periodStart?: Date,
  periodEnd?: Date
): { valid: boolean; error?: string; hoursRemaining?: number } => {
  
  // Weekly tasks must be submitted within their period
  if (taskCode.startsWith('GHW_') && periodStart && periodEnd) {
    if (submissionTime < periodStart) {
      return { valid: false, error: 'Cannot submit evidence before the task period starts' };
    }
    
    if (submissionTime > periodEnd) {
      return { valid: false, error: 'Task period has ended' };
    }
    
    const hoursRemaining = Math.max(0, (periodEnd.getTime() - submissionTime.getTime()) / (1000 * 60 * 60));
    return { valid: true, hoursRemaining };
  }
  
  // Repository showcase tasks (GHS_*) have no time limit
  if (taskCode.startsWith('GHS_')) {
    return { valid: true };
  }
  
  return { valid: true };
};

// Calculate distinct commit days from GitHub signals
export const calculateCommitDays = (
  signals: any[], 
  periodStart: Date, 
  periodEnd: Date
): { distinctDays: number; commitDates: string[] } => {
  const commitDays = new Set<string>();
  const commitDates: string[] = [];
  
  signals
    .filter(signal => 
      signal.kind === 'COMMIT_PUSHED' &&
      new Date(signal.happened_at) >= periodStart &&
      new Date(signal.happened_at) <= periodEnd
    )
    .forEach(signal => {
      const dateStr = new Date(signal.happened_at).toISOString().split('T')[0];
      commitDays.add(dateStr);
      if (!commitDates.includes(dateStr)) {
        commitDates.push(dateStr);
      }
    });
  
  return {
    distinctDays: commitDays.size,
    commitDates: commitDates.sort()
  };
};

// Verify README update from commit signals
export const verifyReadmeUpdate = (
  signals: any[],
  periodStart: Date,
  periodEnd: Date
): { updated: boolean; updateCount: number; lastUpdate?: string } => {
  const readmeUpdates = signals.filter(signal => 
    signal.kind === 'README_UPDATED' &&
    new Date(signal.happened_at) >= periodStart &&
    new Date(signal.happened_at) <= periodEnd
  );
  
  return {
    updated: readmeUpdates.length > 0,
    updateCount: readmeUpdates.length,
    lastUpdate: readmeUpdates[0]?.happened_at
  };
};
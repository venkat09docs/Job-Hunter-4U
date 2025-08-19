// File validation utilities for Job Hunter system

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: string;
  fileSize?: number;
}

export interface FileValidationRules {
  allowedTypes: readonly string[];
  maxSizeBytes: number;
  minSizeBytes?: number;
}

// Default validation rules for different evidence types
export const FILE_VALIDATION_RULES = {
  resume: {
    allowedTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    minSizeBytes: 1024 // 1KB
  },
  coverLetter: {
    allowedTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    minSizeBytes: 1024 // 1KB
  },
  screenshot: {
    allowedTypes: ['image/png', 'image/jpeg', 'image/jpg'],
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    minSizeBytes: 1024 // 1KB
  },
  document: {
    allowedTypes: [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png', 
      'image/jpeg', 
      'image/jpg'
    ],
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    minSizeBytes: 1024 // 1KB
  }
} as const;

// MIME type to extension mapping
export const MIME_TO_EXTENSION = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg'
} as const;

// Extension to MIME type mapping
export const EXTENSION_TO_MIME = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
} as const;

/**
 * Validates a single file against the provided rules
 */
export function validateFile(file: File, rules: FileValidationRules): FileValidationResult {
  // Check file type
  if (!rules.allowedTypes.includes(file.type)) {
    const allowedExtensions = rules.allowedTypes
      .map(type => MIME_TO_EXTENSION[type as keyof typeof MIME_TO_EXTENSION])
      .filter(Boolean)
      .join(', ');
    
    return {
      isValid: false,
      error: `File type not allowed. Supported formats: ${allowedExtensions}`,
      fileType: file.type,
      fileSize: file.size
    };
  }

  // Check file size - maximum
  if (file.size > rules.maxSizeBytes) {
    const maxSizeMB = Math.round(rules.maxSizeBytes / (1024 * 1024));
    return {
      isValid: false,
      error: `File size too large. Maximum allowed: ${maxSizeMB}MB`,
      fileType: file.type,
      fileSize: file.size
    };
  }

  // Check file size - minimum
  if (rules.minSizeBytes && file.size < rules.minSizeBytes) {
    const minSizeKB = Math.round(rules.minSizeBytes / 1024);
    return {
      isValid: false,
      error: `File size too small. Minimum required: ${minSizeKB}KB`,
      fileType: file.type,
      fileSize: file.size
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File appears to be empty',
      fileType: file.type,
      fileSize: file.size
    };
  }

  return {
    isValid: true,
    fileType: file.type,
    fileSize: file.size
  };
}

/**
 * Validates multiple files against the provided rules
 */
export function validateFiles(files: File[], rules: FileValidationRules): FileValidationResult[] {
  return files.map(file => validateFile(file, rules));
}

/**
 * Gets validation rules for a specific evidence type
 */
export function getValidationRules(evidenceType: string): FileValidationRules {
  switch (evidenceType.toLowerCase()) {
    case 'resume':
    case 'cv':
      return FILE_VALIDATION_RULES.resume;
    case 'cover_letter':
    case 'coverletter':
      return FILE_VALIDATION_RULES.coverLetter;
    case 'screenshot':
    case 'image':
      return FILE_VALIDATION_RULES.screenshot;
    default:
      return FILE_VALIDATION_RULES.document;
  }
}

/**
 * Validates file extension against MIME type
 */
export function validateFileExtension(fileName: string, mimeType: string): boolean {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  const expectedMimeType = EXTENSION_TO_MIME[extension as keyof typeof EXTENSION_TO_MIME];
  
  return expectedMimeType === mimeType;
}

/**
 * Gets human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Validates uploaded files for job hunter evidence
 */
export function validateEvidenceFiles(
  files: File[], 
  evidenceType: string
): { valid: File[], invalid: { file: File, error: string }[] } {
  const rules = getValidationRules(evidenceType);
  const validationResults = validateFiles(files, rules);
  
  const valid: File[] = [];
  const invalid: { file: File, error: string }[] = [];
  
  files.forEach((file, index) => {
    const result = validationResults[index];
    if (result.isValid) {
      valid.push(file);
    } else {
      invalid.push({ file, error: result.error || 'Unknown validation error' });
    }
  });
  
  return { valid, invalid };
}
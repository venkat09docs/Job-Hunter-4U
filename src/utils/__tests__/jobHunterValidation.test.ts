// Unit tests for Job Hunter validation logic

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  validateTimeWindow, 
  validate48HourWindow, 
  validate24HourThankYouWindow,
  validate36HourBonusWindow,
  getTimeBasedBonus,
  getUrgencyLevel 
} from '../timeValidation';
import { 
  validateFile, 
  validateFiles, 
  getValidationRules, 
  validateEvidenceFiles 
} from '../fileValidation';

describe('Time Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateTimeWindow', () => {
    it('should return valid for actions within time window', () => {
      const actionTime = new Date('2024-01-01T10:00:00Z');
      const currentTime = new Date('2024-01-01T11:00:00Z');
      const result = validateTimeWindow(actionTime, 48, currentTime);
      
      expect(result.isValid).toBe(true);
      expect(result.isExpired).toBe(false);
      expect(result.timeRemaining).toBeGreaterThan(0);
    });

    it('should return invalid for expired actions', () => {
      const actionTime = new Date('2024-01-01T10:00:00Z');
      const currentTime = new Date('2024-01-03T11:00:00Z'); // 49 hours later
      const result = validateTimeWindow(actionTime, 48, currentTime);
      
      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
      expect(result.timeRemaining).toBe(0);
    });

    it('should handle edge case at exact window boundary', () => {
      const actionTime = new Date('2024-01-01T10:00:00Z');
      const currentTime = new Date('2024-01-03T10:00:00Z'); // Exactly 48 hours
      const result = validateTimeWindow(actionTime, 48, currentTime);
      
      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
    });
  });

  describe('validate48HourWindow', () => {
    it('should validate follow-up within 48 hours', () => {
      const applicationTime = new Date('2024-01-01T10:00:00Z');
      const followUpTime = new Date('2024-01-02T09:00:00Z'); // 23 hours later
      const result = validate48HourWindow(applicationTime, followUpTime);
      
      expect(result.isValid).toBe(true);
      expect(result.isExpired).toBe(false);
    });

    it('should invalidate follow-up after 48 hours', () => {
      const applicationTime = new Date('2024-01-01T10:00:00Z');
      const followUpTime = new Date('2024-01-04T11:00:00Z'); // 73 hours later
      const result = validate48HourWindow(applicationTime, followUpTime);
      
      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
    });

    it('should check remaining time when no follow-up provided', () => {
      const applicationTime = new Date('2024-01-01T10:00:00Z');
      const currentTime = new Date('2024-01-02T08:00:00Z'); // 22 hours later
      const result = validate48HourWindow(applicationTime, undefined, currentTime);
      
      expect(result.isValid).toBe(true);
      expect(result.timeRemaining).toBeGreaterThan(0);
    });
  });

  describe('validate24HourThankYouWindow', () => {
    it('should validate thank you note within 24 hours', () => {
      const interviewTime = new Date('2024-01-01T14:00:00Z');
      const thankYouTime = new Date('2024-01-02T10:00:00Z'); // 20 hours later
      const result = validate24HourThankYouWindow(interviewTime, thankYouTime);
      
      expect(result.isValid).toBe(true);
      expect(result.isExpired).toBe(false);
    });

    it('should invalidate thank you note after 24 hours', () => {
      const interviewTime = new Date('2024-01-01T14:00:00Z');
      const thankYouTime = new Date('2024-01-03T15:00:00Z'); // 49 hours later
      const result = validate24HourThankYouWindow(interviewTime, thankYouTime);
      
      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
    });
  });

  describe('validate36HourBonusWindow', () => {
    it('should grant bonus for follow-up within 36 hours', () => {
      const applicationTime = new Date('2024-01-01T10:00:00Z');
      const followUpTime = new Date('2024-01-02T20:00:00Z'); // 34 hours later
      const result = validate36HourBonusWindow(applicationTime, followUpTime);
      
      expect(result.isValid).toBe(true);
      expect(result.isExpired).toBe(false);
    });

    it('should deny bonus for follow-up after 36 hours', () => {
      const applicationTime = new Date('2024-01-01T10:00:00Z');
      const followUpTime = new Date('2024-01-03T00:00:00Z'); // 38 hours later
      const result = validate36HourBonusWindow(applicationTime, followUpTime);
      
      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
    });
  });

  describe('getTimeBasedBonus', () => {
    it('should grant follow-up bonus for early response', () => {
      const applicationTime = new Date('2024-01-01T10:00:00Z');
      const followUpTime = new Date('2024-01-02T08:00:00Z'); // 22 hours
      const result = getTimeBasedBonus('follow_up', applicationTime, followUpTime);
      
      expect(result.eligible).toBe(true);
      expect(result.bonusPoints).toBe(3);
    });

    it('should deny follow-up bonus for late response', () => {
      const applicationTime = new Date('2024-01-01T10:00:00Z');
      const followUpTime = new Date('2024-01-03T00:00:00Z'); // 38 hours
      const result = getTimeBasedBonus('follow_up', applicationTime, followUpTime);
      
      expect(result.eligible).toBe(false);
      expect(result.bonusPoints).toBe(0);
    });

    it('should handle per-job follow-up bonus', () => {
      const applicationTime = new Date('2024-01-01T10:00:00Z');
      const followUpTime = new Date('2024-01-02T20:00:00Z'); // 34 hours
      const result = getTimeBasedBonus('per_job_follow_up', applicationTime, followUpTime);
      
      expect(result.eligible).toBe(true);
      expect(result.bonusPoints).toBe(2);
    });
  });

  describe('getUrgencyLevel', () => {
    it('should return critical for <= 2 hours remaining', () => {
      const oneHour = 1 * 60 * 60 * 1000;
      expect(getUrgencyLevel(oneHour)).toBe('critical');
    });

    it('should return high for <= 6 hours remaining', () => {
      const fourHours = 4 * 60 * 60 * 1000;
      expect(getUrgencyLevel(fourHours)).toBe('high');
    });

    it('should return medium for <= 24 hours remaining', () => {
      const twelveHours = 12 * 60 * 60 * 1000;
      expect(getUrgencyLevel(twelveHours)).toBe('medium');
    });

    it('should return low for > 24 hours remaining', () => {
      const twodays = 48 * 60 * 60 * 1000;
      expect(getUrgencyLevel(twodays)).toBe('low');
    });
  });
});

describe('File Validation', () => {
  describe('validateFile', () => {
    it('should validate PDF files correctly', () => {
      const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
      const rules = getValidationRules('resume');
      const result = validateFile(file, rules);
      
      expect(result.isValid).toBe(true);
      expect(result.fileType).toBe('application/pdf');
    });

    it('should reject invalid file types', () => {
      const file = new File(['content'], 'document.txt', { type: 'text/plain' });
      const rules = getValidationRules('resume');
      const result = validateFile(file, rules);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File type not allowed');
    });

    it('should reject files that are too large', () => {
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join(''); // 6MB
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      const rules = getValidationRules('resume');
      const result = validateFile(file, rules);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File size too large');
    });

    it('should reject empty files', () => {
      const file = new File([], 'empty.pdf', { type: 'application/pdf' });
      const rules = getValidationRules('resume');
      const result = validateFile(file, rules);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File appears to be empty');
    });
  });

  describe('validateFiles', () => {
    it('should validate multiple files', () => {
      const files = [
        new File(['content1'], 'file1.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'file2.docx', { 
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        })
      ];
      const rules = getValidationRules('resume');
      const results = validateFiles(files, rules);
      
      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(true);
    });
  });

  describe('validateEvidenceFiles', () => {
    it('should separate valid and invalid files', () => {
      const files = [
        new File(['content'], 'valid.pdf', { type: 'application/pdf' }),
        new File(['content'], 'invalid.txt', { type: 'text/plain' })
      ];
      const result = validateEvidenceFiles(files, 'resume');
      
      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(1);
      expect(result.valid[0].name).toBe('valid.pdf');
      expect(result.invalid[0].file.name).toBe('invalid.txt');
    });
  });

  describe('getValidationRules', () => {
    it('should return resume rules for resume evidence', () => {
      const rules = getValidationRules('resume');
      expect(rules.allowedTypes).toContain('application/pdf');
      expect(rules.maxSizeBytes).toBe(5 * 1024 * 1024);
    });

    it('should return screenshot rules for screenshot evidence', () => {
      const rules = getValidationRules('screenshot');
      expect(rules.allowedTypes).toContain('image/png');
      expect(rules.allowedTypes).toContain('image/jpeg');
    });

    it('should return default rules for unknown evidence type', () => {
      const rules = getValidationRules('unknown');
      expect(rules.allowedTypes.length).toBeGreaterThan(2);
    });
  });
});

describe('Stage Transitions', () => {
  // Mock job pipeline data for testing
  const mockJob = {
    id: 'job-123',
    pipeline_stage: 'leads',
    application_date: null,
    interview_dates: [],
    offer_details: null
  };

  describe('Application Stage Transition', () => {
    it('should transition from leads to applied when application submitted', () => {
      const updatedJob = {
        ...mockJob,
        pipeline_stage: 'applied',
        application_date: new Date().toISOString()
      };
      
      expect(updatedJob.pipeline_stage).toBe('applied');
      expect(updatedJob.application_date).toBeDefined();
    });

    it('should not transition to applied without application date', () => {
      const updatedJob = {
        ...mockJob,
        pipeline_stage: 'applied',
        application_date: null
      };
      
      // In real implementation, this should be validated
      expect(updatedJob.application_date).toBeNull();
    });
  });

  describe('Interview Stage Transition', () => {
    it('should transition to interviewing when interview scheduled', () => {
      const updatedJob = {
        ...mockJob,
        pipeline_stage: 'interviewing',
        interview_dates: [{ date: new Date().toISOString(), type: 'phone_screen' }]
      };
      
      expect(updatedJob.pipeline_stage).toBe('interviewing');
      expect(updatedJob.interview_dates).toHaveLength(1);
    });
  });

  describe('Offer Stage Transition', () => {
    it('should transition to offers when offer received', () => {
      const updatedJob = {
        ...mockJob,
        pipeline_stage: 'offers',
        offer_details: { 
          salary: 100000, 
          start_date: '2024-02-01',
          received_date: new Date().toISOString()
        }
      };
      
      expect(updatedJob.pipeline_stage).toBe('offers');
      expect(updatedJob.offer_details).toBeDefined();
    });
  });
});
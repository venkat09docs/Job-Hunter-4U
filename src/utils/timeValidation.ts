// Time validation utilities for Job Hunter system

export interface TimeWindow {
  startTime: Date;
  endTime: Date;
  windowHours: number;
}

export interface TimeValidationResult {
  isValid: boolean;
  isExpired: boolean;
  timeRemaining?: number; // in milliseconds
  message?: string;
}

/**
 * Validates if an action is within the specified time window
 */
export function validateTimeWindow(
  actionTime: Date | string,
  windowHours: number,
  currentTime: Date = new Date()
): TimeValidationResult {
  const actionDate = new Date(actionTime);
  const windowMs = windowHours * 60 * 60 * 1000; // Convert hours to milliseconds
  const expiryTime = new Date(actionDate.getTime() + windowMs);
  const timeRemaining = expiryTime.getTime() - currentTime.getTime();
  
  if (timeRemaining <= 0) {
    return {
      isValid: false,
      isExpired: true,
      timeRemaining: 0,
      message: `Time window has expired. You had ${windowHours} hours from ${formatDateTime(actionDate)}.`
    };
  }
  
  return {
    isValid: true,
    isExpired: false,
    timeRemaining,
    message: `${formatTimeRemaining(timeRemaining)} remaining (until ${formatDateTime(expiryTime)})`
  };
}

/**
 * Validates 48-hour follow-up window
 */
export function validate48HourWindow(
  applicationTime: Date | string,
  followUpTime?: Date | string,
  currentTime: Date = new Date()
): TimeValidationResult {
  const appDate = new Date(applicationTime);
  
  if (followUpTime) {
    const followUpDate = new Date(followUpTime);
    const timeDiff = followUpDate.getTime() - appDate.getTime();
    const hours = timeDiff / (1000 * 60 * 60);
    
    if (hours <= 48) {
      return {
        isValid: true,
        isExpired: false,
        message: `Follow-up sent ${hours.toFixed(1)} hours after application (within 48h window)`
      };
    } else {
      return {
        isValid: false,
        isExpired: true,
        message: `Follow-up was sent ${hours.toFixed(1)} hours after application (exceeded 48h window)`
      };
    }
  }
  
  // Check if still within window
  return validateTimeWindow(applicationTime, 48, currentTime);
}

/**
 * Validates 24-hour interview thank you window
 */
export function validate24HourThankYouWindow(
  interviewTime: Date | string,
  thankYouTime?: Date | string,
  currentTime: Date = new Date()
): TimeValidationResult {
  const interviewDate = new Date(interviewTime);
  
  if (thankYouTime) {
    const thankYouDate = new Date(thankYouTime);
    const timeDiff = thankYouDate.getTime() - interviewDate.getTime();
    const hours = timeDiff / (1000 * 60 * 60);
    
    if (hours <= 24) {
      return {
        isValid: true,
        isExpired: false,
        message: `Thank you note sent ${hours.toFixed(1)} hours after interview (within 24h window)`
      };
    } else {
      return {
        isValid: false,
        isExpired: true,
        message: `Thank you note was sent ${hours.toFixed(1)} hours after interview (exceeded 24h window)`
      };
    }
  }
  
  // Check if still within window
  return validateTimeWindow(interviewTime, 24, currentTime);
}

/**
 * Validates 36-hour bonus window for follow-ups
 */
export function validate36HourBonusWindow(
  applicationTime: Date | string,
  followUpTime: Date | string
): TimeValidationResult {
  const appDate = new Date(applicationTime);
  const followUpDate = new Date(followUpTime);
  const timeDiff = followUpDate.getTime() - appDate.getTime();
  const hours = timeDiff / (1000 * 60 * 60);
  
  if (hours <= 36) {
    return {
      isValid: true,
      isExpired: false,
      message: `Bonus eligible: Follow-up sent within 36 hours (${hours.toFixed(1)}h)`
    };
  }
  
  return {
    isValid: false,
    isExpired: true,
    message: `Bonus not eligible: Follow-up sent after 36 hours (${hours.toFixed(1)}h)`
  };
}

/**
 * Gets time-based bonus eligibility
 */
export function getTimeBasedBonus(
  actionType: string,
  baseTime: Date | string,
  actionTime: Date | string
): { eligible: boolean; bonusPoints: number; reason: string } {
  const baseDate = new Date(baseTime);
  const actionDate = new Date(actionTime);
  const timeDiff = actionDate.getTime() - baseDate.getTime();
  const hours = timeDiff / (1000 * 60 * 60);
  
  switch (actionType) {
    case 'follow_up':
      if (hours <= 36) {
        return {
          eligible: true,
          bonusPoints: 3,
          reason: `Follow-up sent within 36 hours (+3 bonus points)`
        };
      }
      break;
      
    case 'per_job_follow_up':
      if (hours <= 36) {
        return {
          eligible: true,
          bonusPoints: 2,
          reason: `Job follow-up sent within 36 hours (+2 bonus points)`
        };
      }
      break;
      
    case 'thank_you':
      if (hours <= 12) {
        return {
          eligible: true,
          bonusPoints: 2,
          reason: `Thank you note sent within 12 hours (+2 bonus points)`
        };
      }
      break;
  }
  
  return {
    eligible: false,
    bonusPoints: 0,
    reason: `No time-based bonus (sent after ${hours.toFixed(1)} hours)`
  };
}

/**
 * Formats time remaining in human-readable format
 */
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return '0 minutes';
  
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours}h ${minutes}m`;
}

/**
 * Formats date and time for display
 */
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Calculates deadline from action time and window hours
 */
export function calculateDeadline(
  actionTime: Date | string,
  windowHours: number
): Date {
  const actionDate = new Date(actionTime);
  const windowMs = windowHours * 60 * 60 * 1000;
  return new Date(actionDate.getTime() + windowMs);
}

/**
 * Gets urgency level based on time remaining
 */
export function getUrgencyLevel(timeRemaining: number): 'low' | 'medium' | 'high' | 'critical' {
  const hours = timeRemaining / (1000 * 60 * 60);
  
  if (hours <= 2) return 'critical';
  if (hours <= 6) return 'high';
  if (hours <= 24) return 'medium';
  return 'low';
}

/**
 * Checks if current time is within business hours (for bonus calculations)
 */
export function isBusinessHours(date: Date = new Date()): boolean {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = date.getHours();
  
  // Monday to Friday, 9 AM to 5 PM
  return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
}
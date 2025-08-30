import { isAfter, isSameWeek, startOfWeek, endOfWeek, formatDistanceToNow } from 'date-fns';

/**
 * Checks if a due date has passed
 */
export const isDueDatePassed = (dueDate: string | Date): boolean => {
  const due = new Date(dueDate);
  const now = new Date();
  return isAfter(now, due);
};

/**
 * Checks if a due date is in the same week as the current date (Monday-Sunday)
 */
export const isDueDateInCurrentWeek = (dueDate: string | Date): boolean => {
  const due = new Date(dueDate);
  const now = new Date();
  
  // Get Monday-Sunday week for both dates
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday = 1
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  return due >= weekStart && due <= weekEnd;
};

/**
 * Checks if a due date is within the same assignment week (based on due date's week)
 */
export const isDueDateInAssignmentWeek = (dueDate: string | Date): boolean => {
  const due = new Date(dueDate);
  const now = new Date();
  
  // Get the week boundaries based on the due date's week
  const assignmentWeekStart = startOfWeek(due, { weekStartsOn: 1 }); // Monday = 1
  const assignmentWeekEnd = endOfWeek(due, { weekStartsOn: 1 });
  
  return now >= assignmentWeekStart && now <= assignmentWeekEnd;
};

/**
 * Checks if admin can still extend a task (within the same assignment week)
 */
export const canAdminExtendTask = (dueDate: string | Date): boolean => {
  return isDueDateInAssignmentWeek(dueDate);
};

/**
 * Checks if user can start or submit an assignment based on due date and admin extension
 */
export const canUserInteractWithTask = (
  dueDate: string | Date, 
  adminExtended: boolean = false
): boolean => {
  const duePassed = isDueDatePassed(dueDate);
  
  // If due date hasn't passed, user can always interact
  if (!duePassed) {
    return true;
  }
  
  // If due date passed but admin extended and still in assignment week, user can interact
  if (duePassed && adminExtended && isDueDateInAssignmentWeek(dueDate)) {
    return true;
  }
  
  return false;
};

/**
 * Gets the assignment day from a task period (e.g., "2024-35-Monday" -> "Monday")
 */
export const getAssignmentDay = (period: string | null): string => {
  if (!period) return 'Unknown';
  const parts = period.split('-');
  return parts.length >= 3 ? parts[2] : 'Unknown';
};

/**
 * Checks if a GitHub task is within the acceptable deadline based on assignment day
 * Monday-Friday: 48 hours, Saturday-Sunday: 24 hours
 */
export const isGitHubTaskWithinDeadline = (dueDate: string | Date, assignmentDay: string): boolean => {
  const due = new Date(dueDate);
  const now = new Date();
  
  // Check if current time is before due date
  if (now <= due) {
    return true;
  }
  
  // If past due date, check if we can request extension (must be within assignment week)
  return isDueDateInAssignmentWeek(dueDate);
};

/**
 * Gets GitHub task status based on deadline and assignment day
 */
export const getGitHubTaskStatus = (
  dueDate: string | Date,
  assignmentDay: string,
  adminExtended: boolean = false
): {
  canSubmit: boolean;
  canRequestExtension: boolean;
  status: 'active' | 'expired_can_extend' | 'week_expired';
  message: string;
} => {
  const due = new Date(dueDate);
  const now = new Date();
  const duePassed = now > due;
  const inAssignmentWeek = isDueDateInAssignmentWeek(dueDate);
  
  // If admin has extended and still in assignment week, user can submit
  if (duePassed && adminExtended && inAssignmentWeek) {
    return {
      canSubmit: true,
      canRequestExtension: false,
      status: 'active',
      message: 'Extended by admin - submit before week ends'
    };
  }
  
  // If not past due date, user can submit
  if (!duePassed) {
    return {
      canSubmit: true,
      canRequestExtension: false, 
      status: 'active',
      message: `Submit by ${formatDistanceToNow(due, { addSuffix: true })}`
    };
  }
  
  // If past due but still in assignment week, can request extension
  if (duePassed && inAssignmentWeek && !adminExtended) {
    return {
      canSubmit: false,
      canRequestExtension: true,
      status: 'expired_can_extend',
      message: 'Deadline passed - request extension to continue'
    };
  }
  
  // Assignment week has ended, cannot extend
  return {
    canSubmit: false,
    canRequestExtension: false,
    status: 'week_expired',
    message: 'Week expired - cannot be extended'
  };
};

/**
 * Gets the status text for a task based on due date and extension status (for LinkedIn tasks)
 */
export const getTaskAvailabilityStatus = (
  dueDate: string | Date,
  adminExtended: boolean = false
): {
  canInteract: boolean;
  status: 'active' | 'expired' | 'week_expired';
  message: string;
} => {
  const duePassed = isDueDatePassed(dueDate);
  const inAssignmentWeek = isDueDateInAssignmentWeek(dueDate);
  const canInteract = canUserInteractWithTask(dueDate, adminExtended);
  
  if (canInteract) {
    return {
      canInteract: true,
      status: 'active',
      message: adminExtended ? 'Extended by admin' : 'Active'
    };
  }
  
  if (duePassed && inAssignmentWeek) {
    return {
      canInteract: false,
      status: 'expired',
      message: 'Due date passed - Request extension from admin'
    };
  }
  
  return {
    canInteract: false,
    status: 'week_expired', 
    message: 'Week expired - Cannot be extended'
  };
};
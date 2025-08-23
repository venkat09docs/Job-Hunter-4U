import { isAfter, isSameWeek, startOfWeek, endOfWeek } from 'date-fns';

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
 * Checks if admin can still extend a task (within the same week)
 */
export const canAdminExtendTask = (dueDate: string | Date): boolean => {
  return isDueDateInCurrentWeek(dueDate);
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
  
  // If due date passed but admin extended and still in same week, user can interact
  if (duePassed && adminExtended && isDueDateInCurrentWeek(dueDate)) {
    return true;
  }
  
  return false;
};

/**
 * Gets the status text for a task based on due date and extension status
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
  const inCurrentWeek = isDueDateInCurrentWeek(dueDate);
  const canInteract = canUserInteractWithTask(dueDate, adminExtended);
  
  if (canInteract) {
    return {
      canInteract: true,
      status: 'active',
      message: adminExtended ? 'Extended by admin' : 'Active'
    };
  }
  
  if (duePassed && inCurrentWeek) {
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
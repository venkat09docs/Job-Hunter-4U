import { format, startOfWeek, addDays, isAfter, isBefore, isSameDay } from 'date-fns';

export interface TaskDayAvailability {
  isAvailable: boolean;
  isPastDue: boolean;
  isFutureDay: boolean;
  canRequestExtension: boolean;
  dayOfWeek: number; // 1 = Monday, 7 = Sunday
  message: string;
}

/**
 * Determines if a task should be available based on the day it's assigned to
 * @param taskTitle - The task title (e.g., "Day 1 - Connect with 10 people")
 * @returns TaskDayAvailability object
 */
export const getTaskDayAvailability = (taskTitle: string): TaskDayAvailability => {
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Convert Sunday = 0 to Monday = 1 system (1 = Monday, 7 = Sunday)
  const currentWeekDay = currentDayOfWeek === 0 ? 7 : currentDayOfWeek;
  
  // Extract day number from task title (e.g., "Day 1", "Day 2", etc.)
  const dayMatch = taskTitle.match(/Day (\d+)/i);
  const taskDay = dayMatch ? parseInt(dayMatch[1]) : null;
  
  if (!taskDay || taskDay < 1 || taskDay > 7) {
    // If we can't determine the day, allow access (fallback)
    return {
      isAvailable: true,
      isPastDue: false,
      isFutureDay: false,
      canRequestExtension: false,
      dayOfWeek: currentWeekDay,
      message: 'Task available'
    };
  }
  
  // Get the start of current week (Monday)
  const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
  
  // Calculate the target day for this task (Monday = Day 1, Tuesday = Day 2, etc.)
  const taskTargetDate = addDays(startOfCurrentWeek, taskDay - 1);
  const taskTargetDay = taskDay; // Day 1 = Monday (1), Day 2 = Tuesday (2), etc.
  
  // Check if today is the target day
  const isTargetDay = currentWeekDay === taskTargetDay;
  
  // Check if the target day has passed
  const isAfterTargetDay = currentWeekDay > taskTargetDay;
  
  // Check if the target day is in the future
  const isBeforeTargetDay = currentWeekDay < taskTargetDay;
  
  if (isTargetDay) {
    return {
      isAvailable: true,
      isPastDue: false,
      isFutureDay: false,
      canRequestExtension: false,
      dayOfWeek: currentWeekDay,
      message: `Available today (${getDayName(taskTargetDay)})`
    };
  }
  
  if (isAfterTargetDay) {
    return {
      isAvailable: false,
      isPastDue: true,
      isFutureDay: false,
      canRequestExtension: true,
      dayOfWeek: currentWeekDay,
      message: `Task was due on ${getDayName(taskTargetDay)}. Request extension to complete.`
    };
  }
  
  if (isBeforeTargetDay) {
    return {
      isAvailable: false,
      isPastDue: false,
      isFutureDay: true,
      canRequestExtension: false,
      dayOfWeek: currentWeekDay,
      message: `Will be available on ${getDayName(taskTargetDay)}`
    };
  }
  
  // Fallback
  return {
    isAvailable: false,
    isPastDue: false,
    isFutureDay: false,
    canRequestExtension: false,
    dayOfWeek: currentWeekDay,
    message: 'Task not available'
  };
};

/**
 * Get the name of the day from day number (1 = Monday, 7 = Sunday)
 */
const getDayName = (dayNumber: number): string => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayNumber - 1] || 'Unknown';
};

/**
 * Check if a user can interact with a task based on day restrictions and admin extensions
 */
export const canUserInteractWithDayBasedTask = (
  taskTitle: string, 
  adminExtended: boolean = false
): boolean => {
  // If admin has extended the task, allow interaction regardless of day
  if (adminExtended) {
    return true;
  }
  
  const availability = getTaskDayAvailability(taskTitle);
  return availability.isAvailable;
};

/**
 * Get a user-friendly message about task availability
 */
export const getTaskAvailabilityMessage = (
  taskTitle: string,
  adminExtended: boolean = false
): string => {
  if (adminExtended) {
    return 'Extended by admin - Available now';
  }
  
  const availability = getTaskDayAvailability(taskTitle);
  return availability.message;
};
import { useMemo } from 'react';

// Mock data to demonstrate task statistics while database issue is resolved
export const useMockTaskStats = () => {
  const mockStats = useMemo(() => ({
    RESUME: {
      total: 9,
      completed: 6,
      inProgress: 2,
      pending: 1
    },
    LINKEDIN: {
      total: 11,
      completed: 4,
      inProgress: 3,
      pending: 4
    },
    GITHUB: {
      total: 8,
      completed: 3,
      inProgress: 1,
      pending: 4
    },
    DIGITAL_PROFILE: {
      total: 12,
      completed: 5,
      inProgress: 4,
      pending: 3
    }
  }), []);

  const getTaskStats = (module: 'RESUME' | 'LINKEDIN' | 'GITHUB' | 'DIGITAL_PROFILE') => {
    return mockStats[module] || { total: 0, completed: 0, inProgress: 0, pending: 0 };
  };

  return {
    getTaskStats,
    mockStats
  };
};
// Internationalization setup for Job Hunter system

export type SupportedLanguage = 'en' | 'te';

export interface TranslationKey {
  en: string;
  te: string;
}

// Job Hunter specific translations
export const jobHunterTranslations = {
  // Page titles and headers
  pageTitle: {
    en: 'Job Hunter – Assignments & Tracking',
    te: 'జాబ్ హంటర్ – అసైన్మెంట్స్ & ట్రాకింగ్'
  },
  pageSubtitle: {
    en: 'Weekly tasks, pipeline tracking, and progress verification',
    te: 'వారపు పనులు, పైప్‌లైన్ ట్రాకింగ్, మరియు ప్రోగ్రెస్ వెరిఫికేషన్'
  },

  // Tab labels
  tabs: {
    assignments: {
      en: 'Assignments',
      te: 'అసైన్మెంట్స్'
    },
    history: {
      en: 'History',
      te: 'చరిత్ర'
    },
    settings: {
      en: 'Settings',
      te: 'సెట్టింగ్స్'
    }
  },

  // Progress overview
  progress: {
    weekProgress: {
      en: 'Week Progress',
      te: 'వారపు ప్రోగ్రెస్'
    },
    totalPoints: {
      en: 'Total Points',
      te: 'మొత్తం పాయింట్స్'
    },
    applicationStreak: {
      en: 'Application Streak',
      te: 'అప్లికేషన్ స్ట్రీక్'
    },
    currentWeek: {
      en: 'Current Week',
      te: 'ప్రస్తుత వారం'
    }
  },

  // Weekly quotas
  weeklyQuotas: {
    applications: {
      en: 'Job Applications',
      te: 'జాబ్ అప్లికేషన్స్'
    },
    referrals: {
      en: 'Referral Requests',
      te: 'రిఫరల్ రిక్వెస్ట్స్'
    },
    followUps: {
      en: 'Follow-ups',
      te: 'ఫాలో-అప్స్'
    },
    conversations: {
      en: 'New Conversations',
      te: 'కొత్త సంభాషణలు'
    }
  },

  // Task titles (Weekly)
  weeklyTasks: {
    apply5Roles: {
      en: 'Apply to 5 Job Roles',
      te: '5 జాబ్ రోల్స్‌కు అప్లై చేయండి'
    },
    request3Referrals: {
      en: 'Request 3 Job Referrals',
      te: '3 జాబ్ రిఫరల్స్ అభ్యర్థించండి'
    },
    send5FollowUps: {
      en: 'Send 5 Follow-up Messages',
      te: '5 ఫాలో-అప్ మెసేజ్‌లు పంపండి'
    },
    start3Conversations: {
      en: 'Start 3 New Professional Conversations',
      te: '3 కొత్త వృత్తిపరమైన సంభాషణలు ప్రారంభించండి'
    }
  },

  // Task titles (Per-job)
  perJobTasks: {
    addJob: {
      en: 'Add Job Opportunity',
      te: 'జాబ్ అవకాశం జోడించండి'
    },
    researchCompany: {
      en: 'Research Target Company',
      te: 'టార్గెట్ కంపెనీని పరిశోధించండి'
    },
    tailorResume: {
      en: 'Tailor Resume for Position',
      te: 'పోజిషన్ కోసం రెజ్యూమ్‌ను అనుకూలీకరించండి'
    },
    writeCoverLetter: {
      en: 'Write Tailored Cover Letter',
      te: 'అనుకూలీకృత కవర్ లెటర్ రాయండి'
    },
    submitApplication: {
      en: 'Submit Job Application',
      te: 'జాబ్ అప్లికేషన్ సమర్పించండి'
    },
    requestReferral: {
      en: 'Request Job Referral',
      te: 'జాబ్ రిఫరల్ అభ్యర్థించండి'
    },
    followUpApplication: {
      en: 'Follow Up on Application',
      te: 'అప్లికేషన్‌ను ఫాలో అప్ చేయండి'
    },
    prepareInterview: {
      en: 'Prepare Interview Materials',
      te: 'ఇంటర్వ్యూ మెటీరియల్స్ సిద్ధం చేయండి'
    },
    sendThankYou: {
      en: 'Send Interview Thank You Note',
      te: 'ఇంటర్వ్యూ థాంక్ యూ నోట్ పంపండి'
    },
    logOutcome: {
      en: 'Log Job Outcome & Decision',
      te: 'జాబ్ ఫలితం & నిర్ణయాన్ని లాగ్ చేయండి'
    }
  },

  // Pipeline stages
  pipelineStages: {
    leads: {
      en: 'Leads',
      te: 'లీడ్స్'
    },
    applied: {
      en: 'Applied',
      te: 'అప్లై చేసింది'
    },
    interviewing: {
      en: 'Interviewing',
      te: 'ఇంటర్వ్యూ'
    },
    offers: {
      en: 'Offers',
      te: 'ఆఫర్స్'
    },
    closed: {
      en: 'Closed',
      te: 'మూసివేయబడింది'
    }
  },

  // Status labels
  status: {
    assigned: {
      en: 'Assigned',
      te: 'అప్పగించబడింది'
    },
    inProgress: {
      en: 'In Progress',
      te: 'పురోగతిలో'
    },
    submitted: {
      en: 'Submitted',
      te: 'సమర్పించబడింది'
    },
    verified: {
      en: 'Verified',
      te: 'వెరిఫై చేయబడింది'
    },
    pending: {
      en: 'Pending',
      te: 'పెండింగ్'
    }
  },

  // Actions and buttons
  actions: {
    generateTasks: {
      en: 'Generate Tasks',
      te: 'టాస్క్స్ జనరేట్ చేయండి'
    },
    submitEvidence: {
      en: 'Submit Evidence',
      te: 'సాక్ష్యం సమర్పించండి'
    },
    addJobLead: {
      en: 'Add Job Lead',
      te: 'జాబ్ లీడ్ జోడించండి'
    },
    viewDetails: {
      en: 'View Details',
      te: 'వివరాలను చూడండి'
    },
    copyAddress: {
      en: 'Copy Address',
      te: 'చిరునామా కాపీ చేయండి'
    },
    exportData: {
      en: 'Export All My Data',
      te: 'నా మొత్తం డేటాను ఎగుమతి చేయండి'
    },
    deleteData: {
      en: 'Delete All My Data',
      te: 'నా మొత్తం డేటాను తొలగించండి'
    }
  },

  // Evidence types
  evidence: {
    url: {
      en: 'Job URL',
      te: 'జాబ్ URL'
    },
    screenshot: {
      en: 'Screenshot',
      te: 'స్క్రీన్‌షాట్'
    },
    file: {
      en: 'File Upload',
      te: 'ఫైల్ అప్‌లోడ్'
    },
    emailSignal: {
      en: 'Email Verification',
      te: 'ఇమెయిల్ వెరిఫికేషన్'
    }
  },

  // Messages and notifications
  messages: {
    tasksGenerated: {
      en: 'Weekly tasks generated successfully!',
      te: 'వారపు పనులు విజయవంతంగా జనరేట్ అయ్యాయి!'
    },
    evidenceSubmitted: {
      en: 'Evidence submitted successfully',
      te: 'సాక్ష్యం విజయవంతంగా సమర్పించబడింది'
    },
    jobAdded: {
      en: 'Job added to pipeline!',
      te: 'జాబ్ పైప్‌లైన్‌కు జోడించబడింది!'
    },
    updateFailed: {
      en: 'Update Failed',
      te: 'అప్‌డేట్ విఫలమైంది'
    },
    changesReverted: {
      en: 'Changes have been reverted. Please try again.',
      te: 'మార్పులు తిరిగి మార్చబడ్డాయి. దయచేసి మళ్లీ ప్రయత్నించండి.'
    },
    addressCopied: {
      en: 'Forwarding address copied to clipboard!',
      te: 'ఫార్వార్డింగ్ చిరునామా క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది!'
    }
  },

  // File validation messages
  fileValidation: {
    typeNotAllowed: {
      en: 'File type not allowed. Supported formats:',
      te: 'ఫైల్ రకం అనుమతించబడలేదు. మద్దతిచ్చే ఫార్మాట్లు:'
    },
    sizeTooLarge: {
      en: 'File size too large. Maximum allowed:',
      te: 'ఫైల్ సైజ్ చాలా పెద్దది. గరిష్టంగా అనుమతించబడింది:'
    },
    sizeTooSmall: {
      en: 'File size too small. Minimum required:',
      te: 'ఫైల్ సైజ్ చాలా చిన్నది. కనిష్టంగా అవసరం:'
    },
    fileEmpty: {
      en: 'File appears to be empty',
      te: 'ఫైల్ ఖాళీగా ఉన్నట్లు కనిపిస్తోంది'
    }
  },

  // Time-related messages
  timeValidation: {
    timeRemaining: {
      en: 'remaining',
      te: 'మిగిలి ఉంది'
    },
    windowExpired: {
      en: 'Time window has expired. You had',
      te: 'టైమ్ విండో ముగిసింది. మీకు ఉంది'
    },
    hours: {
      en: 'hours',
      te: 'గంటలు'
    },
    minutes: {
      en: 'minutes',
      te: 'నిమిషాలు'
    },
    bonusEligible: {
      en: 'Bonus eligible',
      te: 'బోనస్ అర్హత'
    },
    bonusNotEligible: {
      en: 'Bonus not eligible',
      te: 'బోనస్ అర్హత లేదు'
    }
  }
} as const;

// Current language state
let currentLanguage: SupportedLanguage = 'en';

/**
 * Set the current language for the application
 */
export function setLanguage(language: SupportedLanguage): void {
  currentLanguage = language;
  
  // Save to localStorage for persistence
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('jobhunter_language', language);
  }
}

/**
 * Get the current language
 */
export function getCurrentLanguage(): SupportedLanguage {
  return currentLanguage;
}

/**
 * Initialize language from localStorage or browser preference
 */
export function initializeLanguage(): SupportedLanguage {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('jobhunter_language') as SupportedLanguage;
    if (stored && ['en', 'te'].includes(stored)) {
      currentLanguage = stored;
      return stored;
    }
  }
  
  // Fallback to English
  currentLanguage = 'en';
  return 'en';
}

/**
 * Get translation for a nested key path
 */
export function t(keyPath: string): string {
  const keys = keyPath.split('.');
  let current: any = jobHunterTranslations;
  
  for (const key of keys) {
    current = current?.[key];
    if (!current) {
      console.warn(`Translation key not found: ${keyPath}`);
      return keyPath;
    }
  }
  
  if (typeof current === 'object' && current[currentLanguage]) {
    return current[currentLanguage];
  }
  
  console.warn(`Translation not found for language ${currentLanguage}: ${keyPath}`);
  return keyPath;
}

/**
 * Translation hook for React components
 */
export function useTranslation() {
  return {
    t,
    language: currentLanguage,
    setLanguage,
    isTeluguEnabled: currentLanguage === 'te',
    formatNumber
  };
}

/**
 * Format number based on current language
 */
export function formatNumber(num: number): string {
  if (currentLanguage === 'te') {
    // Telugu number formatting (using Indian numbering system)
    return new Intl.NumberFormat('te-IN').format(num);
  }
  
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format date based on current language
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  
  if (currentLanguage === 'te') {
    return d.toLocaleDateString('te-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Initialize language on module load
initializeLanguage();
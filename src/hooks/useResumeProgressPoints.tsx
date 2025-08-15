import { useEffect } from 'react';
import { useProfileBuildingPoints } from './useProfileBuildingPoints';

interface ResumeData {
  personal_details?: any;
  experience?: any[];
  education?: any[];
  skills_interests?: any;
  professional_summary?: string;
}

export const useResumeProgressPoints = (resumeData: ResumeData | null) => {
  const { awardResumeCompletion80Points } = useProfileBuildingPoints();

  // Calculate resume completion percentage
  const calculateResumeProgress = (data: ResumeData | null): number => {
    if (!data) return 0;

    let completedSections = 0;
    const totalSections = 5;

    // Check personal details
    if (data.personal_details && Object.keys(data.personal_details).length > 0) {
      completedSections++;
    }

    // Check experience
    if (data.experience && data.experience.length > 0) {
      completedSections++;
    }

    // Check education
    if (data.education && data.education.length > 0) {
      completedSections++;
    }

    // Check skills
    if (data.skills_interests && Object.keys(data.skills_interests).length > 0) {
      completedSections++;
    }

    // Check professional summary
    if (data.professional_summary && data.professional_summary.trim().length > 0) {
      completedSections++;
    }

    return Math.round((completedSections / totalSections) * 100);
  };

  useEffect(() => {
    const progress = calculateResumeProgress(resumeData);
    
    // Award points if resume reaches 80% completion
    if (progress >= 80) {
      awardResumeCompletion80Points();
    }
  }, [resumeData, awardResumeCompletion80Points]);

  return {
    resumeProgress: calculateResumeProgress(resumeData),
    calculateResumeProgress
  };
};
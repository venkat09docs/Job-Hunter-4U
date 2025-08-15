/**
 * Profile Building Points Integration Guide
 * 
 * This file provides examples of how to integrate the profile building points hooks
 * into your existing components to automatically award points when users complete activities.
 */

// Example 1: Resume Builder Component Integration
/*
import { useResumeProgressPoints } from '@/hooks/useResumeProgressPoints';
import { useResumeData } from '@/hooks/useResumeData'; // Your existing resume hook

function ResumeBuilder() {
  const { resumeData, updateResumeData } = useResumeData();
  const { resumeProgress } = useResumeProgressPoints(resumeData);

  // The hook automatically awards points when resume reaches 80% completion
  
  return (
    <div>
      <div>Resume Progress: {resumeProgress}%</div>
      // Your resume builder UI
    </div>
  );
}
*/

// Example 2: Profile Settings Component Integration
/*
import { useLinkedInProgressPoints } from '@/hooks/useLinkedInProgressPoints';
import { useGitHubProgressPoints } from '@/hooks/useGitHubProgressPoints';
import { useProfile } from '@/hooks/useProfile'; // Your existing profile hook

function ProfileSettings() {
  const { profile, updateProfile } = useProfile();
  const { linkedInProgress } = useLinkedInProgressPoints(profile);
  const { gitHubProgress } = useGitHubProgressPoints({
    github_url: profile?.github_url,
    full_name: profile?.full_name,
    bio: profile?.bio,
    profile_image_url: profile?.profile_image_url,
    hasRepositories: true // You can determine this from GitHub API or user input
  });

  // Both hooks automatically award points when profiles reach 80% completion

  return (
    <div>
      <div>LinkedIn Progress: {linkedInProgress}%</div>
      <div>GitHub Progress: {gitHubProgress}%</div>
      // Your profile settings UI
    </div>
  );
}
*/

// Example 3: Resources Library Component Integration
/*
import { useResourceSavePoints } from '@/hooks/useResourceSavePoints';

function ResourcesLibrary() {
  const { onCoverLetterSaved, onResumeSaved, onReadmeSaved, isAwarding } = useResourceSavePoints();

  const handleSaveCoverLetter = async (coverLetterData: any) => {
    // Save cover letter logic
    const saved = await saveCoverLetterToLibrary(coverLetterData);
    
    if (saved) {
      // Award points for saving cover letter
      await onCoverLetterSaved();
    }
  };

  const handleSaveResume = async (resumeData: any) => {
    // Save resume logic
    const saved = await saveResumeToLibrary(resumeData);
    
    if (saved) {
      // Award points for saving resume
      await onResumeSaved();
    }
  };

  const handleSaveReadme = async (readmeData: any) => {
    // Save README logic
    const saved = await saveReadmeToLibrary(readmeData);
    
    if (saved) {
      // Award points for saving README
      await onReadmeSaved();
    }
  };

  return (
    <div>
      <button 
        onClick={() => handleSaveCoverLetter(coverLetterData)}
        disabled={isAwarding}
      >
        Save Cover Letter
      </button>
      <button 
        onClick={() => handleSaveResume(resumeData)}
        disabled={isAwarding}
      >
        Save Resume
      </button>
      <button 
        onClick={() => handleSaveReadme(readmeData)}
        disabled={isAwarding}
      >
        Save README
      </button>
    </div>
  );
}
*/

// Example 4: Manual Points Award for Custom Logic
/*
import { useProfileBuildingPoints } from '@/hooks/useProfileBuildingPoints';

function CustomComponent() {
  const { awardPoints, isAwarding } = useProfileBuildingPoints();

  const handleCustomActivity = async () => {
    // Custom logic here
    const activityCompleted = await performCustomActivity();
    
    if (activityCompleted) {
      // Award points manually using the generic method
      await awardPoints('resume_completion_80', 'completion_milestone');
    }
  };

  return (
    <button 
      onClick={handleCustomActivity}
      disabled={isAwarding}
    >
      Complete Custom Activity
    </button>
  );
}
*/

export const INTEGRATION_STEPS = {
  RESUME_COMPLETION: {
    hook: 'useResumeProgressPoints',
    description: 'Import and pass your resume data to this hook. Points are automatically awarded at 80% completion.',
    points: 10
  },
  LINKEDIN_COMPLETION: {
    hook: 'useLinkedInProgressPoints', 
    description: 'Import and pass your profile data to this hook. Points are automatically awarded at 80% completion.',
    points: 10
  },
  GITHUB_COMPLETION: {
    hook: 'useGitHubProgressPoints',
    description: 'Import and pass your profile data to this hook. Points are automatically awarded at 80% completion.',
    points: 10
  },
  COVER_LETTER_SAVE: {
    hook: 'useResourceSavePoints',
    description: 'Call onCoverLetterSaved() after successfully saving a cover letter to resources.',
    points: 5
  },
  RESUME_SAVE: {
    hook: 'useResourceSavePoints',
    description: 'Call onResumeSaved() after successfully saving a resume to resources.',
    points: 5
  },
  README_SAVE: {
    hook: 'useResourceSavePoints',
    description: 'Call onReadmeSaved() after successfully saving a README file to resources.',
    points: 3
  }
};
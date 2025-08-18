import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  skills: string[];
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    duration: string;
  }>;
  professionalSummary: string;
  personalDetails: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    github?: string;
  };
}

interface JobMatchResult {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  strengths: string[];
}

export const useJobMatching = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // First try to get the default saved resume from Resources Library
        const { data: savedResumeData, error: savedResumeError } = await supabase
          .from('saved_resumes')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .maybeSingle();

        let resumeData = null;

        // If no default resume found, try to get the first saved resume
        if (!savedResumeData && (!savedResumeError || savedResumeError.code === 'PGRST116')) {
          const { data: firstResumeData, error: firstResumeError } = await supabase
            .from('saved_resumes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (firstResumeData && !firstResumeError) {
            resumeData = firstResumeData.resume_data;
          }
        } else if (savedResumeData && !savedResumeError) {
          resumeData = savedResumeData.resume_data;
        }

        // If no saved resume found, fallback to the old resume_data table
        if (!resumeData) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('resume_data')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (fallbackData && (!fallbackError || fallbackError.code === 'PGRST116')) {
            resumeData = fallbackData;
          }
        }

        if (resumeData) {
          const personalDetails = resumeData.personal_details as any || {};
          const experience = Array.isArray(resumeData.experience) ? (resumeData.experience as unknown as UserProfile['experience']) : [];
          const education = Array.isArray(resumeData.education) ? (resumeData.education as unknown as UserProfile['education']) : [];
          const skillsInterests = resumeData.skills_interests as any || {};

          setUserProfile({
            personalDetails: {
              fullName: personalDetails.fullName || '',
              email: personalDetails.email || '',
              phone: personalDetails.phone || '',
              location: personalDetails.location || '',
              linkedIn: personalDetails.linkedIn || '',
              github: personalDetails.github || ''
            },
            experience: experience,
            education: education,
            skills: Array.isArray(skillsInterests.skills) ? (skillsInterests.skills as string[]) : [],
            professionalSummary: resumeData.professional_summary || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user profile from saved resumes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const calculateJobMatch = (jobTitle: string, jobDescription: string, companyName: string): JobMatchResult => {
    if (!userProfile) {
      return {
        matchPercentage: 0,
        matchedSkills: [],
        missingSkills: [],
        suggestions: ['Save a default resume in Resources Library → Saved Resumes tab to see job matching analysis'],
        strengths: []
      };
    }

    // Extract potential skills from job description
    const commonTechSkills = [
      'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'mongodb', 'aws', 'docker', 'kubernetes',
      'git', 'html', 'css', 'typescript', 'angular', 'vue', 'php', 'c#', 'c++', 'ruby', 'golang',
      'machine learning', 'data science', 'artificial intelligence', 'cloud computing', 'devops',
      'agile', 'scrum', 'project management', 'leadership', 'communication', 'teamwork', 'problem solving',
      'azure', 'gcp', 'jenkins', 'terraform', 'redis', 'postgresql', 'mysql', 'restful apis', 'graphql',
      'microservices', 'linux', 'bash', 'powershell', 'ci/cd', 'testing', 'junit', 'jest', 'cypress'
    ];

    const jobText = (jobTitle + ' ' + jobDescription).toLowerCase();
    const requiredSkills = commonTechSkills.filter(skill => 
      jobText.includes(skill.toLowerCase())
    );

    const userSkills = userProfile.skills
      .filter(skill => skill && typeof skill === 'string')
      .map(skill => skill.toLowerCase());
    const matchedSkills = requiredSkills.filter(skill => 
      skill && userSkills.some(userSkill => 
        userSkill && (userSkill.includes(skill.toLowerCase()) || skill.toLowerCase().includes(userSkill))
      )
    );

    const missingSkills = requiredSkills.filter(skill => 
      skill && !userSkills.some(userSkill => 
        userSkill && (userSkill.includes(skill.toLowerCase()) || skill.toLowerCase().includes(userSkill))
      )
    );

    // Calculate base match percentage
    let matchPercentage = requiredSkills.length > 0 ? 
      Math.round((matchedSkills.length / requiredSkills.length) * 100) : 60;

    // Bonus points for experience relevance
    const experienceBonus = userProfile.experience.some(exp => 
      exp.role && jobTitle && (
        exp.role.toLowerCase().includes(jobTitle.toLowerCase().split(' ')[0]) ||
        jobTitle.toLowerCase().includes(exp.role.toLowerCase().split(' ')[0])
      )
    ) ? 15 : 0;

    // Bonus for having professional summary
    const summaryBonus = userProfile.professionalSummary && userProfile.professionalSummary.trim() !== '' ? 10 : 0;

    // Bonus for education relevance
    const educationBonus = userProfile.education.some(edu => 
      edu.degree && (
        edu.degree.toLowerCase().includes('computer') ||
        edu.degree.toLowerCase().includes('engineering') ||
        edu.degree.toLowerCase().includes('science')
      )
    ) ? 5 : 0;

    matchPercentage = Math.min(matchPercentage + experienceBonus + summaryBonus + educationBonus, 100);

    // Generate suggestions
    const suggestions = [];
    if (missingSkills.length > 0) {
      suggestions.push(`Learn key skills: ${missingSkills.slice(0, 3).join(', ')}`);
    }
    if (!userProfile.professionalSummary || userProfile.professionalSummary.trim() === '') {
      suggestions.push('Create a resume in Resources Library with a compelling professional summary');
    }
    if (userProfile.experience.length === 0) {
      suggestions.push('Update your saved resume in Resources Library with relevant work experience');
    }
    if (userProfile.skills.length < 5) {
      suggestions.push('Add more technical skills to your resume in Resources Library');
    }
    if (matchPercentage < 80) {
      suggestions.push('Consider gaining experience in the missing skill areas');
      suggestions.push('Update your Resources Library resume to highlight transferable skills');
    }
    if (!userProfile) {
      suggestions.push('Save a default resume in Resources Library → Saved Resumes tab for job matching analysis');
    }

    // Generate strengths
    const strengths = [];
    if (matchedSkills.length > 0) {
      strengths.push(`Strong match in: ${matchedSkills.slice(0, 3).join(', ')}`);
    }
    if (experienceBonus > 0) {
      strengths.push('Relevant work experience');
    }
    if (userProfile.professionalSummary && userProfile.professionalSummary.trim() !== '') {
      strengths.push('Complete professional summary');
    }
    if (userProfile.education.length > 0) {
      strengths.push('Educational background');
    }

    return {
      matchPercentage,
      matchedSkills,
      missingSkills,
      suggestions: suggestions.length > 0 ? suggestions : ['Great profile! You\'re well-matched for this role.'],
      strengths: strengths.length > 0 ? strengths : ['Complete your profile to see your strengths']
    };
  };

  return {
    userProfile,
    loading,
    calculateJobMatch
  };
};
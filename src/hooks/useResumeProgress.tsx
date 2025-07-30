import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { calculateResumeProgress } from '@/components/ResumeProgressBar';

interface ResumeData {
  personalDetails: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    github?: string;
  };
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
    gpa?: string;
  }>;
  skills: string[];
  interests: string[];
  certifications: string[];
  awards: string[];
  professionalSummary: string;
}

export const useResumeProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResumeProgress = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('resume_data')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          const personalDetails = data.personal_details as any || {};
          const experience = Array.isArray(data.experience) ? (data.experience as unknown as ResumeData['experience']) : [{ company: '', role: '', duration: '', description: '' }];
          const education = Array.isArray(data.education) ? (data.education as unknown as ResumeData['education']) : [{ institution: '', degree: '', duration: '', gpa: '' }];
          const skillsInterests = data.skills_interests as any || {};
          const certAwards = Array.isArray(data.certifications_awards) ? (data.certifications_awards as unknown as string[]) : [''];

          const resumeData: ResumeData = {
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
            skills: Array.isArray(skillsInterests.skills) ? (skillsInterests.skills as string[]) : [''],
            interests: Array.isArray(skillsInterests.interests) ? (skillsInterests.interests as string[]) : [''],
            certifications: certAwards,
            awards: [''],
            professionalSummary: data.professional_summary || ''
          };

          const calculatedProgress = calculateResumeProgress(resumeData);
          setProgress(calculatedProgress);
        } else {
          setProgress(0);
        }
      } catch (error) {
        console.error('Error loading resume progress:', error);
        setProgress(0);
      }
      
      setLoading(false);
    };

    loadResumeProgress();
  }, [user]);

  return { progress, loading };
};